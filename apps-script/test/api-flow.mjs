// In-process tests of the website side (app/api/contact/route.ts + lib/leads-sheet.ts) running against
// the REAL apps-script/leads.gs logic inside the mocked-Google vm (gas-mock.mjs).
// Nothing here touches the network, the real Web App, the real sheet or any mailbox: global fetch is
// replaced by a fake "Google" that executes leads.gs locally and can lose requests/answers on demand,
// and the mail module is replaced by a counter. Timeouts are shortened through lib/leads-sheet.ts `tuning`.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createRequire } from "module";
import { makeEnv, SECRET } from "./gas-mock.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "node_modules/.cache/leads-api-test");
fs.mkdirSync(OUT, { recursive: true });

const compile = (rel, rewrites = {}) => {
  let src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  for (const [from, to] of Object.entries(rewrites)) src = src.split(from).join(to);
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  fs.writeFileSync(path.join(OUT, path.basename(rel).replace(/\.ts$/, ".mjs")), js);
};
fs.writeFileSync(path.join(OUT, "lead-mail-stub.mjs"), `
export const mail = { sends: [], alerts: 0, failAdmin: false, failThanks: false };
export async function sendAdminNotification() { mail.sends.push("admin"); if (mail.failAdmin) throw new Error("smtp down"); }
export async function sendThankYou() { mail.sends.push("thanks"); if (mail.failThanks) throw new Error("smtp down"); }
export async function sendSaveFailureAlert() { mail.alerts++; }
`);
compile("lib/leads-sheet.ts");
compile("app/api/contact/route.ts", { "@/lib/leads-sheet": "./leads-sheet.mjs", "@/lib/lead-mail": "./lead-mail-stub.mjs" });
const sheetLib = await import(path.join(OUT, "leads-sheet.mjs"));
const route = await import(path.join(OUT, "route.mjs"));
const { mail } = await import(path.join(OUT, "lead-mail-stub.mjs"));
const { tuning } = sheetLib;

const WEBAPP = "https://script.google.com/macros/s/MOCK/exec";
process.env.LEADS_WEBAPP_URL = WEBAPP;
process.env.LEADS_WEBAPP_SECRET = SECRET;

// ---- capture website logs ----
const out = (s) => process.stdout.write(s + "\n");
const vlogs = [];
const realLog = console.log, realErr = console.error;
console.log = (...a) => vlogs.push(a.join(" "));
console.error = (...a) => vlogs.push("ERR " + a.join(" "));

const hang = (signal) => new Promise((_, rej) => signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));

/** Fake Google. plan(call) -> { drop, hangPost, hangGet, busy, mutate } decides what goes wrong for that HTTP call. */
function install(env, plan = () => ({})) {
  const st = { n: 0, calls: [], gets: new Map() };
  globalThis.fetch = async (url, init = {}) => {
    if (url === WEBAPP && init.method === "POST") {
      const body = JSON.parse(init.body);
      const call = { n: ++st.n, action: body.action, kind: body.kind, reqId: body.reqId, attemptId: body.attemptId, leadId: body.leadId, executed: false };
      st.calls.push(call);
      const p = plan(call) || {};
      if (p.drop) return hang(init.signal); // never reaches Google
      if (p.busy) env.hooks.lockBusy = true;
      let res = env.post(init.body);
      env.hooks.lockBusy = false;
      call.executed = !p.busy;
      if (p.mutate) res = p.mutate(res);
      if (p.hangPost) return hang(init.signal); // executed, answer lost on the way back
      const loc = `https://script.googleusercontent.com/macros/echo?k=${call.n}`;
      st.gets.set(loc, { text: JSON.stringify(res), hang: !!p.hangGet });
      return new Response(null, { status: 302, headers: { location: loc } });
    }
    const g = st.gets.get(url);
    if (g) return g.hang ? hang(init.signal) : new Response(g.text, { status: 200 });
    throw new Error("unexpected fetch " + url);
  };
  return st;
}

const DEFAULTS = { ...tuning };
const results = [];
const T = (name, expect, got, pass) => results.push([name, expect, typeof got === "string" ? got : JSON.stringify(got), pass ? "PASS" : "FAIL"]);
const uid = () => crypto.randomUUID();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fresh(plan) {
  Object.assign(tuning, DEFAULTS, { postTimeoutMs: 300, getTimeoutMs: 200, busyRetryDelayMs: 20, errorRetryDelayMs: 10, requestBudgetMs: 5000, emailStartBudgetMs: 3000 });
  mail.sends.length = 0; mail.alerts = 0; mail.failAdmin = false; mail.failThanks = false;
  vlogs.length = 0;
  const env = makeEnv();
  const st = install(env, plan);
  return { env, st };
}
const submit = async (id, x = {}) => {
  const res = await route.POST(new Request("http://x/api/contact", { method: "POST", body: JSON.stringify({ fullName: "בדיקה", phone: "0501234567", email: "form-address@example.com", business: "t", marketingConsent: true, leadId: id, ...x }) }));
  return { status: res.status, body: await res.json() };
};
const rowsOf = (env, id) => env.grid.filter((g) => g[0] === id);
const rowOf = (env, id) => rowsOf(env, id)[0];
const A_ST = 14, T_ST = 16, A_AT = 18, T_AT = 19;
const sends = (k) => mail.sends.filter((s) => s === k).length;
const claimsOf = (st, kind) => st.calls.filter((c) => c.action === "claim" && c.kind === kind);
const callLines = () => vlogs.filter((l) => l.startsWith("LEADS_CALL"));
const field = (line, k) => (new RegExp(`${k}=(\\S+)`).exec(line) || [])[1];

// S1: happy path, tracing, no leaks
{
  const { env, st } = fresh(); const id = uid();
  const r = await submit(id);
  const row = rowOf(env, id);
  T("S1 happy path", "200 success, 1 row, Sent/Sent, 1 admin mail, 1 thanks mail", { s: r.status, ok: r.body.success, rows: rowsOf(env, id).length, a: row[A_ST], t: row[T_ST], sends: mail.sends }, r.status === 200 && r.body.success && rowsOf(env, id).length === 1 && row[A_ST] === "Sent" && row[T_ST] === "Sent" && sends("admin") === 1 && sends("thanks") === 1);
  T("S1 call sequence", "save, claim, mark, claim, mark", st.calls.map((c) => c.action).join(","), st.calls.map((c) => c.action).join(",") === "save,claim,mark,claim,mark");
  const ids = st.calls.map((c) => c.reqId);
  T("S1 reqId unique per call, valid for the script, shared rid prefix", "5 unique ids /^[A-Za-z0-9-]{4,40}$/", ids, new Set(ids).size === 5 && ids.every((x) => /^[A-Za-z0-9-]{4,40}$/.test(x)) && new Set(ids.map((x) => x.split("-")[0])).size === 1);
  T("S1 every reqId appears in the Apps Script LEADS_TRACE lines", "5/5 matched", ids.map((x) => env.logs.some((l) => l.startsWith("LEADS_TRACE") && l.includes(`rid=${x} `) || l.includes(`rid=${x}`))), ids.every((x) => env.logs.some((l) => l.includes(`rid=${x}`))));
  const cl = callLines();
  T("S1 per-step timing line for every call", "5 LEADS_CALL lines with r302/get_sent/get_done/json/total_ms/result=ok", cl.length, cl.length === 5 && cl.every((l) => ["r302", "get_sent", "get_done", "json", "total_ms"].every((k) => /^\d+$/.test(field(l, k) || "")) && field(l, "result") === "ok" && /start=\d{4}-/.test(l) && field(l, "status") === "302"));
  const cA = claimsOf(st, "admin")[0], cT = claimsOf(st, "thanks")[0];
  T("S1 attemptIds are UUIDs, different per email kind", "uuid, uuid, different", [cA.attemptId, cT.attemptId], UUID.test(cA.attemptId) && UUID.test(cT.attemptId) && cA.attemptId !== cT.attemptId);
  T("S1 mark carries the claimed attemptId", "same", [st.calls[2].attemptId === cA.attemptId, st.calls[4].attemptId === cT.attemptId], st.calls[2].attemptId === cA.attemptId && st.calls[4].attemptId === cT.attemptId);
  const all = vlogs.join("\n");
  T("S1 website logs never contain secret, full lead id, attemptId, redirect URL or personal data", "absent", { secret: all.includes(SECRET), id: all.includes(id), att: all.includes(cA.attemptId), url: all.includes("echo?k"), name: all.includes("בדיקה"), email: all.includes("form-address") }, !all.includes(SECRET) && !all.includes(id) && !all.includes(cA.attemptId) && !all.includes("echo?k") && !all.includes("בדיקה") && !all.includes("form-address"));
  T("S1 API_START / SAVED / API_END logged with the same rid", "present", vlogs.filter((l) => l.startsWith("LEADS_API")).map((l) => field(l, "step")), ["API_START", "SAVED", "API_END"].every((s) => vlogs.some((l) => l.startsWith("LEADS_API") && l.includes(`step=${s}`))));
}
// S19: consent stays separate from the thank-you mail
{
  const { env } = fresh(); const id = uid();
  const r = await submit(id, { marketingConsent: false });
  const row = rowOf(env, id);
  T("S19 no marketing consent: lead saved with consent=false, thank-you still sent (it answers the inquiry)", "consent false, no date/version, thanks sent", { c: row[7], d: row[8], v: row[9], sends: mail.sends }, r.body.success && row[7] === "false" && row[8] === "" && row[9] === "" && sends("thanks") === 1);
}
// S2: claim executed, answer lost on POST
{
  const first = { done: false };
  const { env, st } = fresh((c) => (c.action === "claim" && c.kind === "admin" && !first.done ? ((first.done = true), { hangPost: true }) : {})); const id = uid();
  const r = await submit(id); const row = rowOf(env, id); const cl = claimsOf(st, "admin");
  T("S2 claim executed but answer lost (POST phase) -> retry with SAME attemptId", "2 claim calls, same attemptId, different reqId, 1 admin mail, Sent", { n: cl.length, same: cl[0]?.attemptId === cl[1]?.attemptId, req: cl[0]?.reqId !== cl[1]?.reqId, mails: sends("admin"), st: row[A_ST] }, cl.length === 2 && cl[0].attemptId === cl[1].attemptId && cl[0].reqId !== cl[1].reqId && sends("admin") === 1 && row[A_ST] === "Sent" && r.body.success);
  T("S2 second claim was a replay (no second claim written)", "CLAIMED replay=true; script: r=claimed then r=replay", { site: vlogs.some((l) => l.includes("step=CLAIMED replay=true")), gas: env.logs.filter((l) => l.includes("step=CLAIM_RESULT")).map((l) => /r=(\S+)/.exec(l)[1]).slice(0, 2) }, vlogs.some((l) => l.includes("step=CLAIMED replay=true")) && env.logs.filter((l) => l.includes("step=CLAIM_RESULT")).map((l) => /r=(\S+)/.exec(l)[1]).slice(0, 2).join() === "claimed,replay");
  const to = callLines().find((l) => field(l, "result") === "timeout_post");
  T("S2 timeout classified as POST phase, cut near the POST limit (not the GET limit)", "timeout_post, total ~300ms", to && field(to, "total_ms"), !!to && +field(to, "total_ms") >= 280 && +field(to, "total_ms") < 450 && field(to, "r302") === "-");
}
// S3: claim executed, 302 received, GET hangs
{
  const first = { done: false };
  const { env, st } = fresh((c) => (c.action === "claim" && c.kind === "admin" && !first.done ? ((first.done = true), { hangGet: true }) : {})); const id = uid();
  const r = await submit(id); const row = rowOf(env, id); const cl = claimsOf(st, "admin");
  T("S3 claim executed, 302 received, GET lost -> retry with SAME attemptId", "2 claims, same attemptId, 1 admin mail, Sent", { n: cl.length, same: cl[0]?.attemptId === cl[1]?.attemptId, mails: sends("admin"), st: row[A_ST] }, cl.length === 2 && cl[0].attemptId === cl[1].attemptId && sends("admin") === 1 && row[A_ST] === "Sent" && r.body.success);
  const to = callLines().find((l) => field(l, "result") === "timeout_get");
  T("S3 timeout classified as GET phase, cut near the GET limit", "timeout_get, status=302, total < POST limit + GET limit", to && [field(to, "total_ms"), field(to, "status")], !!to && field(to, "status") === "302" && +field(to, "total_ms") >= 180 && +field(to, "total_ms") < 400);
}
// S4: claim never reached Google
{
  const first = { done: false };
  const { env, st } = fresh((c) => (c.action === "claim" && c.kind === "admin" && !first.done ? ((first.done = true), { drop: true }) : {})); const id = uid();
  const r = await submit(id); const row = rowOf(env, id); const cl = claimsOf(st, "admin");
  T("S4 first claim never reached Google -> retry is a fresh claim", "2 claim calls, 1 admin mail, Sent, replay=false", { n: cl.length, exec: cl.map((c) => c.executed), mails: sends("admin"), st: row[A_ST], replay: vlogs.some((l) => l.includes("replay=true")) }, cl.length === 2 && cl[0].executed === false && cl[1].executed === true && sends("admin") === 1 && row[A_ST] === "Sent" && !vlogs.some((l) => l.includes("step=CLAIMED replay=true")) && r.body.success);
}
// S5: claim lost both times
{
  const { env, st } = fresh((c) => (c.action === "claim" && c.kind === "admin" ? { drop: true } : {})); const id = uid();
  const t0 = Date.now(); const r = await submit(id); const row = rowOf(env, id);
  T("S5 admin claim lost twice -> no mail, status stays Pending, lead kept, user sees success", "success, 0 admin mail, admin Pending, thanks independent (Sent)", { ok: r.body.success, a: row[A_ST], t: row[T_ST], mails: mail.sends }, r.body.success && sends("admin") === 0 && row[A_ST] === "Pending" && row[T_ST] === "Sent" && sends("thanks") === 1);
  T("S5 bounded time (2 x POST limit + small delays)", "< 1500ms with test limits", Date.now() - t0, Date.now() - t0 < 1500);
  T("S5 failure is logged", "EMAIL_CLAIM_ERROR admin + CLAIM_FAILED", vlogs.filter((l) => l.includes("EMAIL_CLAIM_ERROR") || l.includes("CLAIM_FAILED")).length, vlogs.some((l) => l.includes("EMAIL_CLAIM_ERROR admin")) && vlogs.some((l) => l.includes("step=CLAIM_FAILED")));
}
// S6: mail sent, first mark lost after it executed
{
  const first = { done: false };
  const { env, st } = fresh((c) => (c.action === "mark" && c.kind === "admin" && !first.done ? ((first.done = true), { hangPost: true }) : {})); const id = uid();
  const r = await submit(id); const row = rowOf(env, id);
  T("S6 mark executed but answer lost -> retried, harmless (applies once)", "admin Sent, 1 mail, retry applied=false", { st: row[A_ST], mails: sends("admin"), marked: vlogs.filter((l) => l.includes("step=MARKED") && l.includes("kind=admin")).map((l) => field(l, "applied")) }, row[A_ST] === "Sent" && sends("admin") === 1 && vlogs.some((l) => l.includes("kind=admin") && l.includes("step=MARKED") && l.includes("applied=false")) && r.body.success);
}
// S7: mail sent, mark lost twice, then the visitor submits again with the same lead id
{
  const { env, st } = fresh((c) => (c.action === "mark" && c.kind === "admin" ? { drop: true } : {})); const id = uid();
  const r1 = await submit(id); let row = rowOf(env, id);
  T("S7a mail sent but the Sent update never arrived", "admin stays Sending (becomes Unknown after 10 min), 1 mail, success", { st: row[A_ST], mails: sends("admin"), ok: r1.body.success }, row[A_ST] === "Sending" && sends("admin") === 1 && r1.body.success);
  const att1 = claimsOf(st, "admin")[0].attemptId;
  const r2 = await submit(id); row = rowOf(env, id);
  const cl = claimsOf(st, "admin");
  T("S7b visitor retries with the same lead id", "still 1 row, still exactly 1 admin mail and 1 thanks mail, new attemptId refused", { rows: rowsOf(env, id).length, a: sends("admin"), t: sends("thanks"), diff: cl[cl.length - 1].attemptId !== att1, ok: r2.body.success }, rowsOf(env, id).length === 1 && sends("admin") === 1 && sends("thanks") === 1 && cl[cl.length - 1].attemptId !== att1 && vlogs.some((l) => l.includes("step=NOT_CLAIMED status=Sending")) && r2.body.success);
  env.grid[1][15] = new Date(Date.now() - 11 * 60 * 1000).toISOString().replace(/\.\d+Z$/, "Z");
  await submit(id);
  T("S7c after 10 min the status is Unknown and nothing is sent automatically", "admin mails still 1", { a: sends("admin"), st: rowOf(env, id)[A_ST] }, sends("admin") === 1 && rowOf(env, id)[A_ST] === "Unknown");
}
// S8: the visitor submits again while the first request is still waiting on a lost claim answer
{
  const first = { done: false };
  const { env, st } = fresh((c) => (c.action === "claim" && c.kind === "admin" && !first.done ? ((first.done = true), { hangPost: true }) : {})); const id = uid();
  tuning.postTimeoutMs = 400;
  const pA = submit(id); await sleep(120); const rB = await submit(id); const rA = await pA;
  const row = rowOf(env, id); const att = [...new Set(claimsOf(st, "admin").map((c) => c.attemptId))];
  T("S8 retry arrives while the first request is still in flight", "1 row, exactly 1 admin mail, exactly 1 thanks mail, both Sent, no duplicate", { rows: rowsOf(env, id).length, a: sends("admin"), t: sends("thanks"), st: [row[A_ST], row[T_ST]], okA: rA.body.success, okB: rB.body.success }, rowsOf(env, id).length === 1 && sends("admin") === 1 && sends("thanks") === 1 && row[A_ST] === "Sent" && row[T_ST] === "Sent" && rA.body.success && rB.body.success);
  T("S8 the two requests used different attemptIds", "2 distinct", att.length, att.length === 2);
}
// S9: two parallel requests, same lead id, no faults
{
  const { env } = fresh(); const id = uid();
  const [a, b] = await Promise.all([submit(id), submit(id)]); const row = rowOf(env, id);
  T("S9 two parallel requests with the same lead id", "1 row, 1 admin mail, 1 thanks mail, Sent/Sent", { rows: rowsOf(env, id).length, a: sends("admin"), t: sends("thanks"), st: [row[A_ST], row[T_ST]] }, rowsOf(env, id).length === 1 && sends("admin") === 1 && sends("thanks") === 1 && row[A_ST] === "Sent" && row[T_ST] === "Sent" && a.body.success && b.body.success);
}
// S10: a Failed email is never re-sent automatically
{
  const { env } = fresh(); const id = uid(); mail.failAdmin = true;
  await submit(id); mail.failAdmin = false; let row = rowOf(env, id);
  T("S10a mail error -> Failed", "admin Failed, 1 attempt", { st: row[A_ST], a: sends("admin") }, row[A_ST] === "Failed" && sends("admin") === 1);
  await submit(id); row = rowOf(env, id);
  T("S10b resubmit does not resend a Failed mail", "still 1 attempt, Failed", { st: row[A_ST], a: sends("admin") }, row[A_ST] === "Failed" && sends("admin") === 1);
}
// S11: save behaviour
{
  const { env, st } = fresh((c) => (c.action === "save" ? { drop: true } : {})); const id = uid();
  const r = await submit(id);
  T("S11a save lost: no success shown, no row, alert sent, no email claims, save NOT retried on timeout", "500, 0 rows, 1 alert, 0 mails, 1 save call", { s: r.status, rows: rowsOf(env, id).length, alerts: mail.alerts, sends: mail.sends.length, saves: st.calls.filter((c) => c.action === "save").length }, r.status === 500 && r.body.success === false && rowsOf(env, id).length === 0 && mail.alerts === 1 && mail.sends.length === 0 && st.calls.filter((c) => c.action === "save").length === 1);
}
{
  const first = { done: false };
  const { env, st } = fresh((c) => (c.action === "save" && !first.done ? ((first.done = true), { busy: true }) : {})); const id = uid();
  const r = await submit(id);
  T("S11b save busy once -> one retry with the same lead id", "success, 1 row, 2 save calls", { ok: r.body.success, rows: rowsOf(env, id).length, saves: st.calls.filter((c) => c.action === "save").length }, r.body.success && rowsOf(env, id).length === 1 && st.calls.filter((c) => c.action === "save").length === 2 && st.calls[0].leadId === st.calls[1].leadId);
}
// S12/S13: budgets
{
  const { env } = fresh(); const id = uid(); tuning.emailStartBudgetMs = -1;
  const r = await submit(id); const row = rowOf(env, id);
  T("S12 out of email budget: lead saved, no claim started, mails stay Pending", "success, Pending/Pending, 0 mails", { ok: r.body.success, st: [row[A_ST], row[T_ST]], mails: mail.sends.length }, r.body.success && row[A_ST] === "Pending" && row[T_ST] === "Pending" && mail.sends.length === 0 && vlogs.some((l) => l.includes("step=EMAIL_SKIPPED_BUDGET")));
}
{
  const { env, st } = fresh(); tuning.requestBudgetMs = 0; const id = uid();
  const r = await submit(id);
  T("S13a request budget exhausted before save: no call, no row, error shown", "500, 0 fetch calls, 0 rows", { s: r.status, calls: st.calls.length, rows: rowsOf(env, id).length }, r.status === 500 && st.calls.length === 0 && rowsOf(env, id).length === 0);
}
{
  const { env } = fresh((c) => (c.action === "claim" && c.kind === "admin" ? { drop: true } : {})); tuning.requestBudgetMs = 500; const id = uid();
  const t0 = Date.now(); const r = await submit(id);
  T("S13b deadline clips the retry (no call outlives the request budget)", "finished well under 2 x POST limit + thanks flow", Date.now() - t0, r.body.success && Date.now() - t0 < 900);
}
// S15: a script that does not bind the claim to our attemptId (older version) must never lead to a send
{
  const { env } = fresh((c) => (c.action === "claim" && c.kind === "admin" ? { mutate: (r) => ({ ...r, attemptId: uid() }) } : {})); const id = uid();
  const r = await submit(id);
  T("S15 claim answer with a different attemptId is not trusted", "no admin mail", { a: sends("admin"), ok: r.body.success }, sends("admin") === 0 && vlogs.some((l) => l.includes("LEADS_CLAIM_ATTEMPT_MISMATCH")) && r.body.success);
}
// S16: busy claim (lock held elsewhere) -> retried with the same attemptId
{
  const first = { done: false };
  const { env, st } = fresh((c) => (c.action === "claim" && c.kind === "admin" && !first.done ? ((first.done = true), { busy: true }) : {})); const id = uid();
  const r = await submit(id); const cl = claimsOf(st, "admin");
  T("S16 claim answered busy -> same attemptId retried, 1 mail", "2 claim calls, same attemptId, 1 admin mail", { n: cl.length, same: cl[0].attemptId === cl[1].attemptId, a: sends("admin") }, cl.length === 2 && cl[0].attemptId === cl[1].attemptId && sends("admin") === 1 && r.body.success);
}

console.log = realLog; console.error = realErr;
for (const r of results) out(r.join(" | "));
const failed = results.filter((r) => r[3] === "FAIL").length;
out(failed ? `FAILED: ${failed}` : `ALL ${results.length} PASS`);
process.exit(failed ? 1 : 0);

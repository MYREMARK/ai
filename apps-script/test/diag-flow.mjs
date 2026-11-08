// Tests of the temporary Preview-only diagnostic route (app/api/diag/leads-claim) against the real leads.gs
// logic in the mocked-Google vm. No network, no real Web App, no real sheet, no mailbox.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createRequire } from "module";
import { makeEnv, SECRET } from "./gas-mock.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "node_modules/.cache/leads-diag-test");
fs.mkdirSync(OUT, { recursive: true });
const compile = (rel, outName, rewrites = {}) => {
  let src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  for (const [a, b] of Object.entries(rewrites)) src = src.split(a).join(b);
  fs.writeFileSync(path.join(OUT, outName), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
};
compile("lib/leads-sheet.ts", "leads-sheet.mjs");
compile("app/api/diag/leads-claim/route.ts", "diag-route.mjs", { "@/lib/leads-sheet": "./leads-sheet.mjs" });
const lib = await import(path.join(OUT, "leads-sheet.mjs"));
const diag = await import(path.join(OUT, "diag-route.mjs"));
const { tuning } = lib;

const WEBAPP = "https://script.google.com/macros/s/MOCK/exec";
process.env.LEADS_WEBAPP_URL = WEBAPP;
process.env.LEADS_WEBAPP_SECRET = SECRET;
const TOKEN = crypto.createHmac("sha256", SECRET).update("leads-diag-v1").digest("hex");

const out = (s) => process.stdout.write(s + "\n");
const vlogs = []; const realLog = console.log; console.log = (...a) => vlogs.push(a.join(" "));
const hang = (signal) => new Promise((_, rej) => signal.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError"))));
const DEFAULTS = { ...tuning };
const results = [];
const T = (name, expect, got, pass) => results.push([name, expect, typeof got === "string" ? got : JSON.stringify(got), pass ? "PASS" : "FAIL"]);

function install(env, plan = () => ({})) {
  const st = { n: 0, inflight: 0, maxInflight: 0, calls: [], gets: new Map() };
  globalThis.fetch = async (url, init = {}) => {
    if (url === WEBAPP && init.method === "POST") {
      const body = JSON.parse(init.body);
      const call = { n: ++st.n, action: body.action, reqId: body.reqId, leadId: body.leadId };
      st.calls.push(call);
      st.inflight++; st.maxInflight = Math.max(st.maxInflight, st.inflight);
      try {
        const p = plan(call) || {};
        if (p.drop) return await hang(init.signal);
        await new Promise((r) => setTimeout(r, 5)); // small latency so overlapping requests would be visible
        const res = env.post(init.body);
        const loc = `https://script.googleusercontent.com/macros/echo?k=${call.n}`;
        st.gets.set(loc, JSON.stringify(res));
        return new Response(null, { status: 302, headers: { location: loc } });
      } finally { st.inflight--; }
    }
    const g = st.gets.get(url);
    if (g) return new Response(g, { status: 200 });
    throw new Error("unexpected fetch " + url);
  };
  return st;
}
function fresh(plan) {
  Object.assign(tuning, DEFAULTS, { postTimeoutMs: 300, getTimeoutMs: 200, busyRetryDelayMs: 20, errorRetryDelayMs: 10, requestBudgetMs: 5000, emailStartBudgetMs: 3000 });
  vlogs.length = 0;
  const env = makeEnv();
  return { env, st: install(env, plan) };
}
const call = (q = "", headers = { "x-diag-token": TOKEN }, method = "POST") => diag.POST(new Request("http://x/api/diag/leads-claim" + q, { method, headers }));
const setEnv = (v) => { if (v === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = v; };

// protection
{
  const { env, st } = fresh();
  setEnv("production"); let r = await call(); T("D1 Production deployment -> 404 even with a valid token", "404, no request sent", { s: r.status, calls: st.calls.length }, r.status === 404 && st.calls.length === 0);
  setEnv(undefined); r = await call(); T("D2 no VERCEL_ENV (local) -> 404", "404", r.status, r.status === 404);
  setEnv("preview"); r = await call("", {}); T("D3 preview, no token -> 401", "401, no request sent", { s: r.status, calls: st.calls.length }, r.status === 401 && st.calls.length === 0);
  r = await call("", { "x-diag-token": "0".repeat(64) }); T("D4 preview, wrong token -> 401", "401", r.status, r.status === 401);
  r = await call("", { "x-diag-token": SECRET }); T("D5 preview, the raw secret is NOT accepted as token", "401", r.status, r.status === 401);
  r = await call("", { "x-diag-token": TOKEN.slice(0, 10) }); T("D6 preview, truncated token -> 401 (no throw)", "401", r.status, r.status === 401);
  T("D7 nothing reached Apps Script before auth passed", "0 calls, 0 rows", { calls: st.calls.length, rows: env.grid.length }, st.calls.length === 0 && env.grid.length === 1);
  r = await diag.POST(new Request("http://x/api/diag/leads-claim", { method: "POST", headers: { "x-diag-token": TOKEN } })); // sanity: valid token passes (10 calls, used below)
}
// the real run
{
  const { env, st } = fresh(); setEnv("preview");
  const gridBefore = JSON.stringify(env.grid); const w0 = env.stats.writes, f0 = env.stats.flushes;
  const r = await call(); const j = await r.json();
  T("D8 valid token, preview: 10 sequential requests answered", "200, 10 rows, all answered_not_found", { s: r.status, n: j.rows.length, o: [...new Set(j.rows.map((x) => x.outcome))] }, r.status === 200 && j.rows.length === 10 && j.rows.every((x) => x.outcome === "answered_not_found"));
  T("D9 strictly sequential (never two requests in flight)", "maxInflight=1", st.maxInflight, st.maxInflight === 1);
  T("D10 reqId unique per request and valid for the script", "10 unique /^[A-Za-z0-9-]{4,40}$/", j.rows.map((x) => x.reqId), new Set(j.rows.map((x) => x.reqId)).size === 10 && j.rows.every((x) => /^[A-Za-z0-9-]{4,40}$/.test(x.reqId)));
  T("D11 every reqId appears in the Apps Script LEADS_TRACE lines", "10/10", j.rows.filter((x) => env.logs.some((l) => l.includes(`rid=${x.reqId}`))).length, j.rows.every((x) => env.logs.some((l) => l.includes(`rid=${x.reqId}`))));
  T("D12 per-request timings recorded", "post_sent, r302, status 302, get_sent, get_done, json, total_ms, startIso", j.rows[0], j.rows.every((x) => x.postSent === 0 && x.status === 302 && [x.r302, x.getSent, x.getDone, x.json, x.totalMs].every((v) => Number.isFinite(v)) && x.r302 <= x.getSent && x.getSent <= x.getDone && x.getDone <= x.json && /^\d{4}-/.test(x.startIso)));
  T("D13 lead ids used do not exist and are distinct", "10 distinct UUIDs, none in the sheet", st.calls.map((c) => c.leadId).length, new Set(st.calls.map((c) => c.leadId)).size === 10 && st.calls.every((c) => !env.grid.some((g) => g[0] === c.leadId)) && st.calls.every((c) => c.action === "claim"));
  T("D14 no business data touched: sheet identical, 0 writes, 0 flushes", "unchanged", { same: JSON.stringify(env.grid) === gridBefore, w: env.stats.writes - w0, f: env.stats.flushes - f0 }, JSON.stringify(env.grid) === gridBefore && env.stats.writes === w0 && env.stats.flushes === f0);
  T("D15 every request acquired and released the lock", "acquired == released", { a: env.stats.acquired, r: env.stats.released }, env.stats.acquired === env.stats.released);
  const txt = JSON.stringify(j) + vlogs.join("\n");
  T("D16 response and logs never contain secret, token or redirect URL", "absent", { s: txt.includes(SECRET), t: txt.includes(TOKEN), u: txt.includes("echo?k") }, !txt.includes(SECRET) && !txt.includes(TOKEN) && !txt.includes("echo?k"));
  T("D17 the same LEADS_CALL log lines as the real flow are produced", "10 lines, act=claim", vlogs.filter((l) => l.startsWith("LEADS_CALL") && l.includes("act=claim")).length, vlogs.filter((l) => l.startsWith("LEADS_CALL") && l.includes("act=claim")).length === 10);
}
// faults
{
  const first = { done: false };
  const { env, st } = fresh((c) => (!first.done ? ((first.done = true), { drop: true }) : {})); setEnv("preview");
  const t0 = Date.now(); const j = await (await call()).json();
  T("D18 a request that never gets a 302 is recorded as timeout_post, NOT retried, and the run continues", "row1 timeout_post attempts=1, rows 2-10 answered, 10 calls total", { r1: j.rows[0].outcome, a: j.rows[0].attempts, res: j.rows[0].result, rest: j.rows.slice(1).every((x) => x.outcome === "answered_not_found"), calls: st.calls.length }, j.rows[0].outcome === "LEADS_TIMEOUT_POST" && j.rows[0].attempts === 1 && j.rows[0].result === "timeout_post" && j.rows[0].r302 === undefined && j.rows.slice(1).every((x) => x.outcome === "answered_not_found") && st.calls.length === 10);
  T("D19 timeout recorded near the POST limit", "~300ms", j.rows[0].totalMs, j.rows[0].totalMs >= 280 && j.rows[0].totalMs < 450);
}
{
  const { st } = fresh(() => ({ drop: true })); setEnv("preview"); tuning.requestBudgetMs = 1000;
  const t0 = Date.now(); const j = await (await call()).json();
  T("D20 request budget bounds the whole run", "run ends within budget + one timeout, later requests report DEADLINE", { ms: Date.now() - t0, tail: j.rows[j.rows.length - 1].outcome }, Date.now() - t0 < 1700 && /DEADLINE|TIMEOUT/.test(j.rows[j.rows.length - 1].outcome));
}
{
  const { st } = fresh(); setEnv("preview");
  const j = await (await call("?n=3")).json(); const j2 = await (await call("?n=500")).json(); const j3 = await (await call("?n=abc")).json();
  T("D21 n is capped at 10 and defaults to 10", "3, 10, 10", [j.rows.length, j2.rows.length, j3.rows.length], j.rows.length === 3 && j2.rows.length === 10 && j3.rows.length === 10);
  const g = await diag.POST(new Request("http://x/api/diag/leads-claim?n=1", { method: "POST", headers: { "x-diag-token": TOKEN } }));
  T("D22 only POST is exported", "no GET handler", typeof diag.GET, typeof diag.GET === "undefined");
}
setEnv(undefined);
console.log = realLog;
for (const r of results) out(r.join(" | "));
const failed = results.filter((r) => r[3] === "FAIL").length;
out(failed ? `FAILED: ${failed}` : `ALL ${results.length} PASS`);
process.exit(failed ? 1 : 0);

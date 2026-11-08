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
const RETRY_MS = 3000; // fixed in the route
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
  const st = { n: 0, inflight: 0, maxInflight: 0, calls: [], gets: new Map(), getLog: [] };
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
        st.gets.set(loc, { text: JSON.stringify(res), hangFirst: p.hangGets || 0, seen: 0, callN: call.n });
        return new Response(null, { status: 302, headers: { location: loc } });
      } finally { st.inflight--; }
    }
    const g = st.gets.get(url);
    if (g) {
      g.seen++; st.getLog.push({ url, method: init.method, body: init.body, callN: g.callN, seq: g.seen });
      if (g.seen <= g.hangFirst) return hang(init.signal);
      return new Response(g.text, { status: 200 });
    }
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
  T("D12 per-request timings recorded", "post_sent, r302, status 302, get1Sent, get1Result ok, get1Ms, get2 not_needed, json, totalMs, startIso", j.rows[0], j.rows.every((x) => x.postSent === 0 && x.status === 302 && [x.r302, x.get1Sent, x.get1Ms, x.json, x.totalMs].every((v) => Number.isFinite(v)) && x.r302 <= x.get1Sent && x.get1Sent <= x.json && x.get1Result === "ok" && x.get2Result === "not_needed" && /^\d{4}-/.test(x.startIso)));
  T("D13 lead ids used do not exist and are distinct", "10 distinct UUIDs, none in the sheet", st.calls.map((c) => c.leadId).length, new Set(st.calls.map((c) => c.leadId)).size === 10 && st.calls.every((c) => !env.grid.some((g) => g[0] === c.leadId)) && st.calls.every((c) => c.action === "claim"));
  T("D14 no business data touched: sheet identical, 0 writes, 0 flushes", "unchanged", { same: JSON.stringify(env.grid) === gridBefore, w: env.stats.writes - w0, f: env.stats.flushes - f0 }, JSON.stringify(env.grid) === gridBefore && env.stats.writes === w0 && env.stats.flushes === f0);
  T("D15 every request acquired and released the lock", "acquired == released", { a: env.stats.acquired, r: env.stats.released }, env.stats.acquired === env.stats.released);
  const txt = JSON.stringify(j) + vlogs.join("\n");
  T("D16 response and logs never contain secret, token or redirect URL", "absent", { s: txt.includes(SECRET), t: txt.includes(TOKEN), u: txt.includes("echo?k") }, !txt.includes(SECRET) && !txt.includes(TOKEN) && !txt.includes("echo?k"));
  T("D17 one LEADS_DIAG log line per request", "10 lines", vlogs.filter((l) => l.startsWith("LEADS_DIAG")).length, vlogs.filter((l) => l.startsWith("LEADS_DIAG")).length === 10);
  T("D17b no GET retry happened when every first GET succeeded", "10 GETs, 10 POSTs", { gets: st.getLog.length, posts: st.calls.length }, st.getLog.length === 10 && st.calls.length === 10);
}
// faults
{
  const first = { done: false };
  const { env, st } = fresh((c) => (!first.done ? ((first.done = true), { drop: true }) : {})); setEnv("preview");
  const t0 = Date.now(); const j = await (await call()).json();
  T("D18 a request that never gets a 302 is recorded as timeout_post, NOT retried, and the run continues", "row1 timeout_post (POST never retried), rows 2-10 answered, 10 POSTs total", { r1: j.rows[0].outcome, rest: j.rows.slice(1).every((x) => x.outcome === "answered_not_found"), calls: st.calls.length }, j.rows[0].outcome === "timeout_post" && j.rows[0].r302 === undefined && j.rows[0].get1Result === undefined && j.rows.slice(1).every((x) => x.outcome === "answered_not_found") && st.calls.length === 10);
  T("D19 timeout recorded near the POST limit", "~300ms", j.rows[0].totalMs, j.rows[0].totalMs >= 280 && j.rows[0].totalMs < 450);
}
{
  const { st } = fresh(() => ({ drop: true })); setEnv("preview"); tuning.requestBudgetMs = 1000;
  const t0 = Date.now(); const j = await (await call()).json();
  T("D20 request budget bounds the whole run", "run ends within budget + one timeout, later requests report DEADLINE", { ms: Date.now() - t0, tail: j.rows[j.rows.length - 1].outcome }, Date.now() - t0 < 1700 && /deadline_post|timeout_post/.test(j.rows[j.rows.length - 1].outcome));
}
{
  const { st } = fresh(); setEnv("preview");
  const j = await (await call("?n=3")).json(); const j2 = await (await call("?n=500")).json(); const j3 = await (await call("?n=abc")).json();
  T("D21 n is capped at 10 and defaults to 10", "3, 10, 10", [j.rows.length, j2.rows.length, j3.rows.length], j.rows.length === 3 && j2.rows.length === 10 && j3.rows.length === 10);
  const g = await diag.POST(new Request("http://x/api/diag/leads-claim?n=1", { method: "POST", headers: { "x-diag-token": TOKEN } }));
  T("D22 only POST is exported", "no GET handler", typeof diag.GET, typeof diag.GET === "undefined");
}
// GET retry experiment
{
  const { st } = fresh(); setEnv("preview");
  // 2nd request: the first GET hangs, the retry works; 5th: both GETs hang; others fine
  st.calls.length = 0;
  const env2 = makeEnv(); const st2 = install(env2, (c) => (c.n === 2 ? { hangGets: 1 } : c.n === 5 ? { hangGets: 2 } : {}));
  const t0 = Date.now(); const j = await (await call()).json(); const dur = Date.now() - t0;
  const r2 = j.rows[1], r5 = j.rows[4];
  T("G1 first GET times out -> exactly one more GET to the SAME Location, which succeeds", "get1 timeout, get2 ok, outcome answered_not_found, 2 GETs same url", { g1: r2.get1Result, g2: r2.get2Result, o: r2.outcome, gets: st2.getLog.filter((g) => g.callN === 2).map((g) => g.seq) }, r2.get1Result === "timeout" && r2.get2Result === "ok" && r2.outcome === "answered_not_found" && st2.getLog.filter((g) => g.callN === 2).length === 2 && new Set(st2.getLog.filter((g) => g.callN === 2).map((g) => g.url)).size === 1);
  T("G2 first GET cut at the normal GET limit (200ms in this test), retry returns fast", "get1Ms ~200, get2Ms small", { g1: r2.get1Ms, g2: r2.get2Ms }, r2.get1Ms >= 180 && r2.get1Ms < 400 && r2.get2Ms < 200);
  T("G3 both GETs time out -> one retry only, cut at 3 s, recorded as timeout_get2, run continues", "get1 timeout, get2 timeout ~3000ms, 2 GETs, 10 rows", { g1: r5.get1Result, g2: r5.get2Result, ms: r5.get2Ms, o: r5.outcome, gets: st2.getLog.filter((g) => g.callN === 5).length, rows: j.rows.length }, r5.get1Result === "timeout" && r5.get2Result === "timeout" && r5.get2Ms >= RETRY_MS - 30 && r5.get2Ms < RETRY_MS + 300 && r5.outcome === "timeout_get2" && st2.getLog.filter((g) => g.callN === 5).length === 2 && j.rows.length === 10);
  T("G4 requests that succeeded the first time never got a second GET", "1 GET each for the other 8", st2.getLog.filter((g) => ![2, 5].includes(g.callN)).length, st2.getLog.filter((g) => ![2, 5].includes(g.callN)).length === 8 && j.rows.filter((x, i) => ![1, 4].includes(i)).every((x) => x.get2Result === "not_needed"));
  T("G5 the POST is never repeated: 10 POSTs for 10 requests", "10", st2.calls.length, st2.calls.length === 10);
  T("G6 retry GET is a plain GET with no body", "method GET, no body", st2.getLog.filter((g) => g.callN === 2).map((g) => [g.method, g.body ?? null]), st2.getLog.filter((g) => g.callN === 2).every((g) => g.method === "GET" && !g.body));
  T("G7 GET-retry run touched no business data", "0 writes, grid unchanged", { w: env2.stats.writes, rows: env2.grid.length }, env2.stats.writes === 0 && env2.grid.length === 1);
  T("G8 LEADS_DIAG log shows both GET results separately", "get1=timeout@ and get2=ok@ on request 2", vlogs.find((l) => l.includes("get1=timeout") && l.includes("get2=ok")) ? "found" : "missing", !!vlogs.find((l) => l.includes("get1=timeout") && l.includes("get2=ok")));
  T("G9 total run time sane", "< 12s", dur, dur < 12000);
}
setEnv(undefined);
console.log = realLog;
for (const r of results) out(r.join(" | "));
const failed = results.filter((r) => r[3] === "FAIL").length;
out(failed ? `FAILED: ${failed}` : `ALL ${results.length} PASS`);
process.exit(failed ? 1 : 0);

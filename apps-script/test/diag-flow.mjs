// Tests of the temporary Preview-only GET-retry diagnostic route (app/api/diag/leads-claim) against the real
// leads.gs logic in the mocked-Google vm. No network, no real Web App, no real sheet, no mailbox.
// The route uses method B only (node:https, a new Agent({ keepAlive:false }) per hop); the "https" module is
// replaced by a stub that records every Agent and request it is given.
// keepAlive:false Agent per hop) is faked by a stub of the "https" module that records every Agent it is given.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createRequire } from "module";
import { EventEmitter } from "events";
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
fs.writeFileSync(path.join(OUT, "https-stub.mjs"), `
import { EventEmitter } from "events";
class Agent { constructor(o) { this.options = o; this.destroyed = false; (globalThis.__agents ||= []).push(this); } destroy() { this.destroyed = true; } }
function request(opts, cb) {
  const req = new EventEmitter(); let body = ""; let destroyed = false;
  req.write = (c) => { body += c; return true; };
  req.destroy = () => { destroyed = true; setImmediate(() => req.emit("error", Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }))); };
  req.end = () => globalThis.__httpsFake({ opts, body }, cb, () => destroyed, req);
  setImmediate(() => { const s = new EventEmitter(); req.emit("socket", s); setTimeout(() => s.emit("lookup"), 1); setTimeout(() => s.emit("connect"), 2); setTimeout(() => s.emit("secureConnect"), 3); });
  return req;
}
export default { Agent, request };
`);
compile("lib/leads-sheet.ts", "leads-sheet.mjs");
compile("app/api/diag/leads-claim/route.ts", "diag-route.mjs", { "@/lib/leads-sheet": "./leads-sheet.mjs", 'from "https"': 'from "./https-stub.mjs"' });
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
const results = [];
const T = (name, expect, got, pass) => results.push([name, expect, typeof got === "string" ? got : JSON.stringify(got), pass ? "PASS" : "FAIL"]);

/** plan({n, transport, method}) -> { drop, newConn, getDrop } */
function install(env, plan = () => ({})) {
  const st = { n: 0, inflight: 0, maxInflight: 0, calls: [], gets: new Map(), getLog: [], tlsLog: [] };
  globalThis.__agents = [];
  const exec = (bodyStr, transport, plan1) => {
    const call = { n: ++st.n, transport, ...JSON.parse(bodyStr) };
    st.calls.push(call);
    return { call, p: plan(call) || {}, res: null };
  };
  globalThis.fetch = async () => { throw new Error("fetch must not be used by the diagnostic route"); };
  globalThis.__httpsFake = ({ opts, body }, cb, isDestroyed, req) => {
    const urlOf = `https://${opts.hostname}${opts.path}`;
    st.tlsLog.push({ method: opts.method, agent: opts.agent, headers: opts.headers, url: urlOf });
    const respond = (status, headers, text) => {
      const res = new EventEmitter(); res.statusCode = status; res.headers = headers;
      cb(res); setImmediate(() => { res.emit("data", Buffer.from(text)); res.emit("end"); });
    };
    if (opts.method === "POST") {
      const { call, p } = exec(body, "https");
      st.inflight++; st.maxInflight = Math.max(st.maxInflight, st.inflight);
      const done = () => st.inflight--;
      if (p.drop) { const iv = setInterval(() => { if (isDestroyed()) { clearInterval(iv); done(); } }, 5); return; }
      setTimeout(() => {
        const res = env.post(body);
        const loc = `https://script.googleusercontent.com/macros/echo?k=${call.n}`;
        st.gets.set(loc, { text: JSON.stringify(res), drops: p.getDrops || 0, err: !!p.getErr });
        respond(302, { location: loc }, ""); done();
      }, 15); // the answer always comes after the connection events, as in reality
    } else {
      const g = st.gets.get(urlOf);
      st.getLog.push({ url: urlOf, method: opts.method, agent: opts.agent });
      if (!g) throw new Error("unexpected https GET " + urlOf);
      if (g.err) { setImmediate(() => req.emit("error", Object.assign(new Error("reset"), { code: "ECONNRESET" }))); g.err = false; return; }
      if (g.drops > 0) { g.drops--; return; } // never answers: the route's timer destroys the request
      setTimeout(() => respond(200, {}, g.text), 8); // after the connection events, as in reality
    }
  };
  return st;
}
function fresh(plan) {
  Object.assign(tuning, { postTimeoutMs: 300, getTimeoutMs: 200, busyRetryDelayMs: 20, errorRetryDelayMs: 10, requestBudgetMs: 60000, emailStartBudgetMs: 3000 });
  vlogs.length = 0;
  const env = makeEnv();
  return { env, st: install(env, plan) };
}
const call = (headers = { "x-diag-token": TOKEN }, method = "POST") => diag.POST(new Request("http://x/api/diag/leads-claim", { method, headers }));
const setEnv = (v) => { if (v === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = v; };

// ---- protection ----
{
  const { env, st } = fresh();
  setEnv("production"); let r = await call(); T("D1 Production deployment -> 404 even with a valid token", "404, no request sent", { s: r.status, calls: st.calls.length }, r.status === 404 && st.calls.length === 0);
  setEnv(undefined); r = await call(); T("D2 no VERCEL_ENV (local) -> 404", "404", r.status, r.status === 404);
  setEnv("preview"); r = await call({}); T("D3 preview, no token -> 401, no request sent", "401", { s: r.status, calls: st.calls.length }, r.status === 401 && st.calls.length === 0);
  r = await call({ "x-diag-token": "0".repeat(64) }); T("D4 wrong token -> 401", "401", r.status, r.status === 401);
  r = await call({ "x-diag-token": SECRET }); T("D5 the raw secret is NOT accepted as token", "401", r.status, r.status === 401);
  r = await call({ "x-diag-token": TOKEN.slice(0, 10) }); T("D6 truncated token -> 401 (no throw)", "401", r.status, r.status === 401);
  T("D7 nothing reached Apps Script before auth passed", "0 calls, 0 rows, 0 agents", { calls: st.calls.length, rows: env.grid.length, agents: globalThis.__agents.length }, st.calls.length === 0 && env.grid.length === 1 && globalThis.__agents.length === 0);
}
// ---- the run, no faults ----
{
  const { env, st } = fresh();
  const gridBefore = JSON.stringify(env.grid); const w0 = env.stats.writes, f0 = env.stats.flushes;
  const r = await call(); const j = await r.json();
  T("E1 three sequential requests, all B, all answered_not_found, no GET retry needed", "3 rows, answered_not_found, viaGetRetry false, get2 absent", { n: j.rows.length, o: [...new Set(j.rows.map((x) => x.outcome))], s: r.status }, r.status === 200 && j.rows.length === 3 && j.rows.every((x) => x.method === "B" && x.outcome === "answered_not_found" && x.viaGetRetry === false && x.get2 === undefined && x.get1.result === "ok"));
  T("E2 strictly sequential (never two requests in flight)", "maxInflight=1", st.maxInflight, st.maxInflight === 1);
  T("E3 only 3 POSTs, all through https (fetch is never used)", "3 https POSTs", st.calls.map((c) => c.transport).join(), st.calls.length === 3 && st.calls.every((c) => c.transport === "https"));
  const agents = globalThis.__agents;
  T("B1 every https hop (3 POST + 3 GET) got its OWN new Agent, keepAlive:false, destroyed afterwards", "6 hops = 6 distinct Agents", { hops: st.tlsLog.length, agents: agents.length, distinct: new Set(st.tlsLog.map((x) => x.agent)).size, ka: agents.map((a) => a.options.keepAlive), d: agents.map((a) => a.destroyed) }, st.tlsLog.length === 6 && agents.length === 6 && new Set(st.tlsLog.map((x) => x.agent)).size === 6 && agents.every((a) => a.options.keepAlive === false && a.destroyed === true));
  const posts = st.tlsLog.filter((x) => x.method === "POST");
  T("B2 https POST carries Content-Length and JSON header", "present", posts.map((p) => [p.headers["Content-Type"], !!p.headers["Content-Length"]]), posts.every((p) => p.headers["Content-Type"] === "application/json" && Number(p.headers["Content-Length"]) > 0));
  T("C1 connection timings for POST and GET #1 (dns <= tcp <= tls)", "new, dns/tcp/tls numbers", j.rows[0].conn, j.rows.every((x) => [x.conn, x.get1.conn].every((c) => c.kind === "new" && [c.dnsMs, c.tcpMs, c.tlsMs].every(Number.isFinite) && c.dnsMs <= c.tcpMs && c.tcpMs <= c.tlsMs)));
  T("C2 request timings recorded", "postSent, r302, status 302, get1.sentAt/ms, json, totalMs, startIso", j.rows[1], j.rows.every((x) => x.postSent > 0 && x.status === 302 && [x.r302, x.get1.sentAt, x.get1.ms, x.json, x.totalMs].every(Number.isFinite) && x.r302 <= x.get1.sentAt && x.get1.sentAt <= x.json && /^\d{4}-/.test(x.startIso)));
  T("C4 reqId unique, valid for the script, -b1..-b3", "3 unique", j.rows.map((x) => x.reqId), new Set(j.rows.map((x) => x.reqId)).size === 3 && j.rows.every((x, i) => /^[A-Za-z0-9-]{4,40}$/.test(x.reqId) && x.reqId.endsWith(`-b${i + 1}`)));
  T("C5 every reqId appears in the Apps Script LEADS_TRACE lines", "3/3", j.rows.filter((x) => env.logs.some((l) => l.includes(`rid=${x.reqId}`))).length, j.rows.every((x) => env.logs.some((l) => l.includes(`rid=${x.reqId}`))));
  T("C6 the lead ids used do not exist, are distinct, action claim", "3 distinct, none in sheet", new Set(st.calls.map((c) => c.leadId)).size, new Set(st.calls.map((c) => c.leadId)).size === 3 && st.calls.every((c) => !env.grid.some((g) => g[0] === c.leadId) && c.action === "claim" && c.kind === "admin"));
  T("C7 no business data touched: sheet identical, 0 writes, 0 flushes, locks balanced", "unchanged", { same: JSON.stringify(env.grid) === gridBefore, w: env.stats.writes - w0, f: env.stats.flushes - f0, a: env.stats.acquired, r: env.stats.released }, JSON.stringify(env.grid) === gridBefore && env.stats.writes === w0 && env.stats.flushes === f0 && env.stats.acquired === env.stats.released);
  const txt = JSON.stringify(j) + vlogs.join("\n");
  T("C8 response and logs never contain secret, token or redirect URL", "absent", { s: txt.includes(SECRET), t: txt.includes(TOKEN), u: txt.includes("echo?k") }, !txt.includes(SECRET) && !txt.includes(TOKEN) && !txt.includes("echo?k"));
  T("C9 one LEADS_DIAG_GET2 log line per request", "3 lines", vlogs.filter((l) => l.startsWith("LEADS_DIAG_GET2")).length, vlogs.filter((l) => l.startsWith("LEADS_DIAG_GET2")).length === 3);
}
// ---- GET retry ----
{
  // request 2: GET #1 never answers (timeout), GET #2 answers.
  const { env, st } = fresh((c) => (c.n === 2 ? { getDrops: 1 } : {}));
  const gridBefore = JSON.stringify(env.grid);
  const j = await (await call()).json(); const r = j.rows[1];
  const gets2 = st.getLog.filter((g) => g.url.endsWith("k=2"));
  T("G1 GET #1 timeout -> exactly ONE more GET, recorded separately, request recovers", "get1 timeout, get2 ok, viaGetRetry, answered_not_found", { g1: r.get1.result, g2: r.get2?.result, v: r.viaGetRetry, o: r.outcome }, r.get1.result === "timeout" && r.get2.result === "ok" && r.viaGetRetry === true && r.outcome === "answered_not_found" && r.get1.ms >= 180 && r.get2.sentAt >= r.get1.sentAt + r.get1.ms - 5);
  T("G2 the retry targets the SAME redirect URL, with a NEW Agent (new connection)", "2 GETs same url, 2 distinct agents, both destroyed", { n: gets2.length, same: gets2[0]?.url === gets2[1]?.url, agents: new Set(gets2.map((g) => g.agent)).size }, gets2.length === 2 && gets2[0].url === gets2[1].url && gets2[0].agent !== gets2[1].agent && gets2.every((g) => g.agent.destroyed && g.agent.options.keepAlive === false));
  T("G3 the retried GET has its own connection timings", "new + tls number", r.get2.conn, r.get2.conn.kind === "new" && Number.isFinite(r.get2.conn.tlsMs));
  T("G4 POST is never retried: exactly 3 POSTs; other requests have no get2", "3 POSTs, rows 1 and 3 without get2", { posts: st.calls.length, g: j.rows.map((x) => !!x.get2) }, st.calls.length === 3 && !j.rows[0].get2 && !j.rows[2].get2 && j.rows.length === 3);
  T("G5 retry run still touched no business data", "sheet identical", JSON.stringify(env.grid) === gridBefore, JSON.stringify(env.grid) === gridBefore);
}
{
  // request 1: both GETs time out. GET #2 limit is 3 s (real constant).
  const { st } = fresh((c) => (c.n === 1 ? { getDrops: 2 } : {}));
  const j = await (await call()).json(); const r = j.rows[0];
  const gets1 = st.getLog.filter((g) => g.url.endsWith("k=1"));
  T("G6 GET #1 and GET #2 both time out -> timeout_get_after_retry, no third GET, run continues", "2 GETs for request 1, outcome timeout_get_after_retry, rows 2-3 answered", { gets: gets1.length, o: j.rows.map((x) => x.outcome) }, gets1.length === 2 && r.outcome === "timeout_get_after_retry" && r.get1.result === "timeout" && r.get2.result === "timeout" && r.viaGetRetry === false && j.rows.slice(1).every((x) => x.outcome === "answered_not_found") && st.calls.length === 3);
  T("G7 GET #2 uses a 3 s limit (GET #1 used the 200 ms test limit)", "get2.ms in [2950, 3400), get1.ms < 400", [r.get1.ms, r.get2.ms], r.get2.ms >= 2950 && r.get2.ms < 3400 && r.get1.ms < 400);
}
{
  // GET #1 fails with a network error (not a timeout): NOT retried.
  const { st } = fresh((c) => (c.n === 1 ? { getErr: true } : {}));
  const j = await (await call()).json(); const r = j.rows[0];
  T("G8 a GET network error (not a timeout) is not retried", "1 GET for request 1, outcome network_get, no get2", { gets: st.getLog.filter((g) => g.url.endsWith("k=1")).length, o: r.outcome, g2: r.get2 }, st.getLog.filter((g) => g.url.endsWith("k=1")).length === 1 && r.outcome === "network_get" && r.get1.result === "network" && r.get2 === undefined);
}
// ---- POST faults ----
{
  const { st } = fresh((c) => (c.n === 1 ? { drop: true } : {}));
  const j = await (await call()).json(); const r = j.rows[0];
  T("F1 POST that never answers: timeout_post at ~7 s, never retried, no GET, run continues", "row 1 timeout_post (~7000ms), 3 POSTs total, rows 2-3 answered", { o: j.rows.map((x) => x.outcome), t: r.totalMs, posts: st.calls.length, gets: st.getLog.length }, r.outcome === "timeout_post" && r.totalMs >= 6950 && r.totalMs < 7400 && r.r302 === undefined && r.get1 === undefined && j.rows.slice(1).every((x) => x.outcome === "answered_not_found") && st.calls.length === 3 && st.getLog.length === 2);
  T("F2 a timed-out https request still destroyed its Agent", "all agents destroyed", globalThis.__agents.every((a) => a.destroyed), globalThis.__agents.every((a) => a.destroyed));
}
{
  const { st } = fresh(() => ({ drop: true })); tuning.requestBudgetMs = 9000;
  const t0 = Date.now(); const j = await (await call()).json(); const dur = Date.now() - t0;
  T("F6 request budget bounds the run", "ends ~9s, later rows deadline_post", { ms: dur, o: j.rows.map((x) => x.outcome) }, dur < 9400 && j.rows.length === 3 && j.rows.some((x) => x.outcome === "deadline_post") && st.calls.length <= 2);
}
setEnv(undefined);
console.log = realLog;
for (const r of results) out(r.join(" | "));
const failed = results.filter((r) => r[3] === "FAIL").length;
out(failed ? `FAILED: ${failed}` : `ALL ${results.length} PASS`);
process.exit(failed ? 1 : 0);

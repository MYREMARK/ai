// Tests of the temporary Preview-only A/B diagnostic route (app/api/diag/leads-claim) against the real leads.gs
// logic in the mocked-Google vm. No network, no real Web App, no real sheet, no mailbox.
// Method A (global fetch) is faked by replacing globalThis.fetch; method B (node:https with a new
// keepAlive:false Agent per hop) is faked by a stub of the "https" module that records every Agent it is given.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dc from "diagnostics_channel";
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
  req.end = () => globalThis.__httpsFake({ opts, body }, cb, () => destroyed);
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
const connected = dc.channel("undici:client:connected");

/** plan({n, transport, method}) -> { drop, newConn, getDrop } */
function install(env, plan = () => ({})) {
  const st = { n: 0, inflight: 0, maxInflight: 0, calls: [], gets: new Map(), getLog: [], tlsLog: [] };
  globalThis.__agents = [];
  const exec = (bodyStr, transport, plan1) => {
    const call = { n: ++st.n, transport, ...JSON.parse(bodyStr) };
    st.calls.push(call);
    return { call, p: plan(call) || {}, res: null };
  };
  // ---- A: fetch ----
  globalThis.fetch = async (url, init = {}) => {
    if (url === WEBAPP && init.method === "POST") {
      const { call, p } = exec(init.body, "fetch");
      st.inflight++; st.maxInflight = Math.max(st.maxInflight, st.inflight);
      try {
        if (p.newConn) connected.publish({});
        if (p.drop) return await hang(init.signal);
        await new Promise((r) => setTimeout(r, 4));
        const res = env.post(init.body);
        const loc = `https://script.googleusercontent.com/macros/echo?k=${call.n}`;
        st.gets.set(loc, { text: JSON.stringify(res), drop: !!p.getDrop });
        return new Response(null, { status: 302, headers: { location: loc } });
      } finally { st.inflight--; }
    }
    const g = st.gets.get(url);
    if (g) { st.getLog.push({ transport: "fetch", url, method: init.method }); return g.drop ? hang(init.signal) : new Response(g.text, { status: 200 }); }
    throw new Error("unexpected fetch " + url);
  };
  // ---- B: https stub ----
  globalThis.__httpsFake = ({ opts, body }, cb, isDestroyed) => {
    const urlOf = `https://${opts.hostname}${opts.path}`;
    st.tlsLog.push({ method: opts.method, agent: opts.agent, headers: opts.headers });
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
        st.gets.set(loc, { text: JSON.stringify(res), drop: !!p.getDrop });
        respond(302, { location: loc }, ""); done();
      }, 15); // the answer always comes after the connection events, as in reality
    } else {
      const g = st.gets.get(urlOf);
      st.getLog.push({ transport: "https", url: urlOf, method: opts.method });
      if (!g) throw new Error("unexpected https GET " + urlOf);
      if (g.drop) { return; }
      respond(200, {}, g.text);
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
// ---- the A/B run, no faults ----
{
  const { env, st } = fresh((c) => (c.transport === "fetch" && !globalThis.__firstFetchSeen ? ((globalThis.__firstFetchSeen = true), { newConn: true }) : {}));
  globalThis.__firstFetchSeen = false;
  const gridBefore = JSON.stringify(env.grid); const w0 = env.stats.writes, f0 = env.stats.flushes;
  const r = await call(); const j = await r.json();
  T("A1 six requests, order A B A B A B", "ABABAB, all answered_not_found", { order: j.rows.map((x) => x.method).join(""), o: [...new Set(j.rows.map((x) => x.outcome))], s: r.status }, r.status === 200 && j.rows.map((x) => x.method).join("") === "ABABAB" && j.rows.length === 6 && j.rows.every((x) => x.outcome === "answered_not_found"));
  T("A2 strictly sequential (never two requests in flight)", "maxInflight=1", st.maxInflight, st.maxInflight === 1);
  T("A3 transports really differ: A uses fetch, B uses https", "fetch,https,fetch,https,fetch,https (POSTs)", st.calls.map((c) => c.transport).join(), st.calls.map((c) => c.transport).join() === "fetch,https,fetch,https,fetch,https");
  const posts = st.tlsLog.filter((x) => x.method === "POST"), gets = st.tlsLog.filter((x) => x.method === "GET");
  const agents = globalThis.__agents;
  T("B1 every https hop (POST and GET) got its OWN new Agent", "6 hops (3 POST + 3 GET) = 6 distinct Agent objects", { hops: st.tlsLog.length, agents: agents.length, distinct: new Set(st.tlsLog.map((x) => x.agent)).size }, st.tlsLog.length === 6 && agents.length === 6 && new Set(st.tlsLog.map((x) => x.agent)).size === 6);
  T("B2 each Agent has keepAlive:false and was destroyed afterwards", "all", agents.map((a) => [a.options.keepAlive, a.destroyed]), agents.every((a) => a.options.keepAlive === false && a.destroyed === true));
  T("B3 method A never touched the https module, method B never used fetch for its POST", "fetch POSTs 3, https POSTs 3", { f: st.calls.filter((c) => c.transport === "fetch").length, h: st.calls.filter((c) => c.transport === "https").length }, st.calls.filter((c) => c.transport === "fetch").length === 3 && st.calls.filter((c) => c.transport === "https").length === 3);
  T("B4 redirect GET uses the SAME method as its POST", "A: fetch GETs, B: https GETs", st.getLog.map((g) => g.transport).join(), st.getLog.map((g) => g.transport).join() === "fetch,https,fetch,https,fetch,https");
  T("B5 https POST carries Content-Length and JSON header", "present", posts.map((p) => [p.headers["Content-Type"], !!p.headers["Content-Length"]]), posts.every((p) => p.headers["Content-Type"] === "application/json" && Number(p.headers["Content-Length"]) > 0));
  const A = j.rows.filter((x) => x.method === "A"), B = j.rows.filter((x) => x.method === "B");
  T("C1 connection evidence: A#1 new, A#2/A#3 reused (undici events), every B new with dns/tcp/tls timings", "A: new,reused,reused  B: new x3 with tls", { A: A.map((x) => x.conn.kind), B: B.map((x) => [x.conn.kind, Number.isFinite(x.conn.dnsMs), Number.isFinite(x.conn.tcpMs), Number.isFinite(x.conn.tlsMs)]) }, A.map((x) => x.conn.kind).join() === "new,reused,reused" && B.every((x) => x.conn.kind === "new" && [x.conn.dnsMs, x.conn.tcpMs, x.conn.tlsMs].every(Number.isFinite) && x.conn.dnsMs <= x.conn.tcpMs && x.conn.tcpMs <= x.conn.tlsMs));
  T("C2 timings recorded for every request", "postSent, r302, status 302, getSent, getResult ok, getMs, json, totalMs, startIso, reqId", j.rows[1], j.rows.every((x) => Number.isFinite(x.postSent) && x.status === 302 && [x.r302, x.getSent, x.getMs, x.json, x.totalMs].every(Number.isFinite) && x.getResult === "ok" && x.r302 <= x.getSent && x.getSent <= x.json && /^\d{4}-/.test(x.startIso)));
  T("C3 for B the POST is handed over only after the connection is ready", "postSent == tls time > 0", B.map((x) => [x.postSent, x.conn.tlsMs]), B.every((x) => x.postSent === x.conn.tlsMs && x.postSent > 0) && A.every((x) => x.postSent === 0));
  T("C4 reqId unique, valid for the script, carries the method", "6 unique, /^[A-Za-z0-9-]{4,40}$/", j.rows.map((x) => x.reqId), new Set(j.rows.map((x) => x.reqId)).size === 6 && j.rows.every((x) => /^[A-Za-z0-9-]{4,40}$/.test(x.reqId)) && j.rows.every((x, i) => x.reqId.endsWith(`-${x.method.toLowerCase()}${i + 1}`)));
  T("C5 every reqId appears in the Apps Script LEADS_TRACE lines", "6/6", j.rows.filter((x) => env.logs.some((l) => l.includes(`rid=${x.reqId}`))).length, j.rows.every((x) => env.logs.some((l) => l.includes(`rid=${x.reqId}`))));
  T("C6 the lead ids used do not exist, distinct, action claim", "6 distinct, none in sheet", st.calls.map((c) => c.leadId).length, new Set(st.calls.map((c) => c.leadId)).size === 6 && st.calls.every((c) => !env.grid.some((g) => g[0] === c.leadId) && c.action === "claim"));
  T("C7 no business data touched: sheet identical, 0 writes, 0 flushes, locks balanced", "unchanged", { same: JSON.stringify(env.grid) === gridBefore, w: env.stats.writes - w0, f: env.stats.flushes - f0, a: env.stats.acquired, r: env.stats.released }, JSON.stringify(env.grid) === gridBefore && env.stats.writes === w0 && env.stats.flushes === f0 && env.stats.acquired === env.stats.released);
  const txt = JSON.stringify(j) + vlogs.join("\n");
  T("C8 response and logs never contain secret, token or redirect URL", "absent", { s: txt.includes(SECRET), t: txt.includes(TOKEN), u: txt.includes("echo?k") }, !txt.includes(SECRET) && !txt.includes(TOKEN) && !txt.includes("echo?k"));
  T("C9 one LEADS_DIAG_AB log line per request, with method", "6 lines", vlogs.filter((l) => l.startsWith("LEADS_DIAG_AB")).map((l) => /method=(\w)/.exec(l)[1]).join(""), vlogs.filter((l) => l.startsWith("LEADS_DIAG_AB")).map((l) => /method=(\w)/.exec(l)[1]).join("") === "ABABAB");
  T("C10 runtime info reported", "node version, order", { node: j.runtime.node, order: j.order }, typeof j.runtime.node === "string" && j.order === "ABABAB");
}
// ---- faults: 7 s POST timeout (test shortens nothing: uses the real constant via fake clock-free waits) ----
{
  // Method A POST that never answers, then B POST that never answers: both recorded, no retries, run continues.
  const { st } = fresh((c) => (c.n === 1 || c.n === 2 ? { drop: true } : {}));
  globalThis.__firstFetchSeen = true;
  const t0 = Date.now(); const j = await (await call()).json(); const dur = Date.now() - t0;
  T("F1 POST that never answers: recorded as timeout_post at ~7 s for BOTH methods, never retried, run continues", "rows 1,2 timeout_post (~7000ms), rows 3-6 answered, 6 POSTs total", { o: j.rows.map((x) => x.outcome), t: [j.rows[0].totalMs, j.rows[1].totalMs], posts: st.calls.length }, j.rows[0].outcome === "timeout_post" && j.rows[1].outcome === "timeout_post" && j.rows[0].totalMs >= 6950 && j.rows[0].totalMs < 7400 && j.rows[1].totalMs >= 6950 && j.rows[1].totalMs < 7400 && j.rows.slice(2).every((x) => x.outcome === "answered_not_found") && st.calls.length === 6);
  T("F2 a timed-out https request still destroyed its Agent", "all agents destroyed", globalThis.__agents.every((a) => a.destroyed), globalThis.__agents.every((a) => a.destroyed));
  T("F3 timed-out rows carry no 302/GET data", "r302 and getResult undefined", [j.rows[0].r302, j.rows[0].getResult, j.rows[1].r302, j.rows[1].getResult], j.rows[0].r302 === undefined && j.rows[0].getResult === undefined && j.rows[1].r302 === undefined && j.rows[1].getResult === undefined);
}
{
  // GET that hangs after a 302 (A then B): recorded separately, POST result still visible.
  const { st } = fresh((c) => (c.n === 3 ? { getDrop: true } : c.n === 4 ? { getDrop: true } : {}));
  globalThis.__firstFetchSeen = true;
  const j = await (await call()).json();
  const r3 = j.rows[2], r4 = j.rows[3];
  T("F4 GET timeout after 302 is recorded separately for A and B (get timeout 200ms in this test)", "r302 present, getResult timeout, outcome timeout_get", [r3.r302 !== undefined, r3.getResult, r3.outcome, r4.r302 !== undefined, r4.getResult, r4.outcome], r3.r302 !== undefined && r3.getResult === "timeout" && r3.outcome === "timeout_get" && r4.r302 !== undefined && r4.getResult === "timeout" && r4.outcome === "timeout_get" && r3.getMs >= 180 && r4.getMs >= 180);
  T("F5 a GET timeout is never retried (one GET per redirect)", "6 GET attempts for 6 POSTs", st.getLog.length, st.getLog.length === 6);
}
{
  // Request budget: the run never outlives it, remaining requests report deadline.
  const { st } = fresh(() => ({ drop: true })); tuning.requestBudgetMs = 9000;
  globalThis.__firstFetchSeen = true;
  const t0 = Date.now(); const j = await (await call()).json(); const dur = Date.now() - t0;
  T("F6 request budget bounds the run", "ends ~9s, later rows deadline_post", { ms: dur, last: j.rows[j.rows.length - 1].outcome, n: j.rows.length }, dur < 9400 && j.rows.length === 6 && /deadline_post|timeout_post/.test(j.rows[5].outcome) && j.rows.some((x) => x.outcome === "deadline_post"));
}
setEnv(undefined);
console.log = realLog;
for (const r of results) out(r.join(" | "));
const failed = results.filter((r) => r[3] === "FAIL").length;
out(failed ? `FAILED: ${failed}` : `ALL ${results.length} PASS`);
process.exit(failed ? 1 : 0);

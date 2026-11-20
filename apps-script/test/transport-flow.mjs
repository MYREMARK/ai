// Tests of the node:https transport in lib/leads-sheet.ts (new Agent({ keepAlive:false }) per hop, timeouts,
// GET retry on a new connection, POST retry with the same ids). "https" is replaced by a stub; the Web App is the
// real leads.gs logic in the mocked-Google vm. No network, no real sheet, no mailbox.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createRequire } from "module";
import { EventEmitter } from "events";
import { makeEnv, SECRET } from "./gas-mock.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "node_modules/.cache/leads-transport-test");
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "https-stub.mjs"), `
import { EventEmitter } from "events";
class Agent { constructor(o) { this.options = o; this.destroyed = false; (globalThis.__agents ||= []).push(this); } destroy() { this.destroyed = true; } }
function request(opts, cb) {
  const req = new EventEmitter(); let body = ""; let destroyed = false;
  req.write = (c) => { body += c; return true; };
  req.destroy = () => { destroyed = true; setImmediate(() => req.emit("error", Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }))); };
  req.end = () => globalThis.__httpsFake({ opts, body }, cb, () => destroyed, req);
  return req;
}
export default { Agent, request };
`);
let src = fs.readFileSync(path.join(ROOT, "lib/leads-sheet.ts"), "utf8").split('from "https"').join('from "./https-stub.mjs"');
fs.writeFileSync(path.join(OUT, "leads-sheet.mjs"), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
const lib = await import(path.join(OUT, "leads-sheet.mjs"));
const { tuning } = lib;

const WEBAPP = "https://script.google.com/macros/s/MOCK/exec";
process.env.LEADS_WEBAPP_URL = WEBAPP;
process.env.LEADS_WEBAPP_SECRET = SECRET;
const out = (s) => process.stdout.write(s + "\n");
const vlogs = []; const realLog = console.log; console.log = (...a) => vlogs.push(a.join(" "));
const results = [];
const T = (name, expect, got, pass) => results.push([name, expect, typeof got === "string" ? got : JSON.stringify(got), pass ? "PASS" : "FAIL"]);
const uid = () => crypto.randomUUID();

/** plan(call) -> { dropPost, lostAnswer, getDrops, netErrGet } */
function install(env, plan = () => ({})) {
  const st = { n: 0, posts: [], gets: [], hops: [], gmap: new Map() };
  globalThis.__agents = [];
  globalThis.fetch = async () => { throw new Error("fetch must not be used"); };
  globalThis.__httpsFake = ({ opts, body }, cb, isDestroyed, req) => {
    const url = `https://${opts.hostname}${opts.path}`;
    st.hops.push({ method: opts.method, url, agent: opts.agent, headers: opts.headers });
    const respond = (status, headers, text) => { const res = new EventEmitter(); res.statusCode = status; res.headers = headers; cb(res); setImmediate(() => { res.emit("data", Buffer.from(text)); res.emit("end"); }); };
    if (opts.method === "POST") {
      const b = JSON.parse(body); const call = { n: ++st.n, ...b }; st.posts.push(call); const p = plan(call) || {};
      if (p.dropPost) return; // never leaves the server: only the timer ends it
      const res = env.post(body);
      if (p.lostAnswer) return; // executed on Google, answer lost
      const loc = `https://script.googleusercontent.com/macros/echo?k=${call.n}`;
      st.gmap.set(loc, { text: JSON.stringify(res), drops: p.getDrops || 0 });
      setTimeout(() => respond(302, { location: loc }, ""), 3);
    } else {
      st.gets.push({ url, agent: opts.agent });
      const g = st.gmap.get(url);
      if (g.drops > 0) { g.drops--; return; }
      setTimeout(() => respond(200, {}, g.text), 3);
    }
  };
  return st;
}
function fresh(plan) {
  Object.assign(tuning, { postTimeoutMs: 120, getTimeoutMs: 100, getRetryTimeoutMs: 60, busyRetryDelayMs: 10, errorRetryDelayMs: 5, requestBudgetMs: 5000, emailStartBudgetMs: 3000 });
  vlogs.length = 0; const env = makeEnv(); return { env, st: install(env, plan) };
}
const lead = (id) => ({ leadId: id, fullName: "בדיקה", email: "a@b.co", phone: "0501234567", business: "t", date: "2026-11-08", time: "10:00:00", marketingConsent: true, consentDate: "2026-11-08 10:00:00", consentVersion: "v1" });
const ctx = () => lib.newCallCtx();
const rows = (env, id) => env.grid.filter((g) => g[0] === id).length;

{ // T1 normal save: new Agent per hop
  const { env, st } = fresh(); const id = uid();
  const r = await lib.saveLead(lead(id), ctx());
  T("T1 save over https: POST + GET, each with its OWN new Agent, keepAlive:false, destroyed afterwards", "2 hops, 2 distinct agents", { hops: st.hops.length, d: new Set(st.hops.map((h) => h.agent)).size, ka: globalThis.__agents.map((a) => a.options.keepAlive), dst: globalThis.__agents.map((a) => a.destroyed) }, st.hops.length === 2 && new Set(st.hops.map((h) => h.agent)).size === 2 && globalThis.__agents.every((a) => a.options.keepAlive === false && a.destroyed) && r.duplicate === false && rows(env, id) === 1);
  T("T1b POST has JSON header and Content-Length; fetch never used", "present", st.hops[0].headers, st.hops[0].headers["Content-Type"] === "application/json" && Number(st.hops[0].headers["Content-Length"]) > 0);
}
{ // T2 POST never leaves -> timeout -> one retry, same lead id, new reqId
  const { env, st } = fresh((c) => (c.n === 1 ? { dropPost: true } : {})); const id = uid();
  const r = await lib.saveLead(lead(id), ctx());
  T("T2 POST timeout -> exactly ONE retry, same lead id, different reqId, 1 row", "2 POSTs", { n: st.posts.length, same: st.posts[0].leadId === st.posts[1].leadId, rid: st.posts[0].reqId !== st.posts[1].reqId, rows: rows(env, id) }, st.posts.length === 2 && st.posts[0].leadId === st.posts[1].leadId && st.posts[0].reqId !== st.posts[1].reqId && rows(env, id) === 1 && r.duplicate === false);
  T("T2b the timed-out request's Agent was destroyed", "all destroyed", globalThis.__agents.map((a) => a.destroyed), globalThis.__agents.every((a) => a.destroyed));
}
{ // T3 POST executed, answer lost -> retry gives duplicate, no second row
  const { env, st } = fresh((c) => (c.n === 1 ? { lostAnswer: true } : {})); const id = uid();
  const r = await lib.saveLead(lead(id), ctx());
  T("T3 save executed but answer lost -> retry answered duplicate, still ONE row", "duplicate true, 1 row, 2 POSTs", { dup: r.duplicate, rows: rows(env, id), n: st.posts.length }, r.duplicate === true && rows(env, id) === 1 && st.posts.length === 2);
}
{ // T4 two POST timeouts -> error after one retry only
  const { env, st } = fresh(() => ({ dropPost: true })); const id = uid();
  let err; try { await lib.saveLead(lead(id), ctx()); } catch (e) { err = e; }
  T("T4 two POST timeouts -> error (no success), no third POST, no row", "LEADS_TIMEOUT_POST, 2 POSTs", { e: err?.message, n: st.posts.length, rows: rows(env, id) }, err?.message === "LEADS_TIMEOUT_POST" && st.posts.length === 2 && rows(env, id) === 0);
}
{ // T5 GET #1 times out, GET #2 on a NEW Agent to the SAME url works; no POST retry
  const { env, st } = fresh((c) => ({ getDrops: 1 })); const id = uid();
  const r = await lib.saveLead(lead(id), ctx());
  T("T5 GET #1 timeout -> GET #2 to the SAME address on a NEW Agent, 1 POST only", "2 GETs same url, distinct agents, 1 POST, get_retry=1", { gets: st.gets.length, same: st.gets[0]?.url === st.gets[1]?.url, d: st.gets[0]?.agent !== st.gets[1]?.agent, posts: st.posts.length, log: /get_retry=1/.test(vlogs.join("\n")) }, st.gets.length === 2 && st.gets[0].url === st.gets[1].url && st.gets[0].agent !== st.gets[1].agent && st.posts.length === 1 && /get_retry=1/.test(vlogs.join("\n")) && r.duplicate === false && rows(env, id) === 1);
}
{ // T6 both GETs time out -> POST retried with same lead id; second round works
  const { env, st } = fresh((c) => (c.n === 1 ? { getDrops: 2 } : {})); const id = uid();
  const r = await lib.saveLead(lead(id), ctx());
  T("T6 GET and GET retry both time out -> POST retried (same lead) -> duplicate, ONE row", "3 GETs total, 2 POSTs, duplicate", { gets: st.gets.length, posts: st.posts.length, dup: r.duplicate, rows: rows(env, id) }, st.gets.length === 3 && st.posts.length === 2 && r.duplicate === true && rows(env, id) === 1);
}
{ // T7 claim replay: answer lost -> retry with the same attemptId is recognised, only one claim holder
  const { env, st } = fresh((c) => (c.action === "claim" && c.n === 2 ? { lostAnswer: true } : {})); const id = uid(); const att = uid();
  await lib.saveLead(lead(id), ctx());
  const c = await lib.claimEmail(id, "admin", att, ctx());
  const other = await lib.claimEmail(id, "admin", uid(), ctx());
  T("T7 claim answer lost -> retry with the same attemptId gets the claim (replay); a different attemptId is refused", "claimed replay ; other not claimed", { c, other }, c.claimed === true && c.replay === true && other.claimed === false && st.posts.filter((p) => p.action === "claim" && p.attemptId === att).length === 2);
  const m1 = await lib.markEmail(id, "admin", "sent", att, ctx()); const m2 = await lib.markEmail(id, "admin", "sent", att, ctx());
  T("T7b mark applies once", "true then false", [m1, m2], m1 === true && m2 === false);
}
{ // T8 business rejection is not retried
  const { st } = fresh(); const keep = process.env.LEADS_WEBAPP_SECRET; process.env.LEADS_WEBAPP_SECRET = "bad";
  let err; try { await lib.saveLead(lead(uid()), ctx()); } catch (e) { err = e; } process.env.LEADS_WEBAPP_SECRET = keep;
  T("T8 unauthorized answer -> rejected, not retried", "LEADS_SAVE_REJECTED_..., 1 POST", { e: err?.message, n: st.posts.length }, /^LEADS_SAVE_REJECTED_/.test(err?.message) && st.posts.length === 1);
}
{ // T9 redirect to a foreign host is refused, not followed
  const { st } = fresh(); const env2 = makeEnv(); install(env2); const orig = globalThis.__httpsFake;
  globalThis.__httpsFake = (a, cb, d, req) => { if (a.opts.method === "POST") { const res = new EventEmitter(); res.statusCode = 302; res.headers = { location: "https://evil.example.com/x" }; cb(res); setImmediate(() => res.emit("end")); st.n++; return; } throw new Error("must not follow"); };
  let err; try { await lib.saveLead(lead(uid()), ctx()); } catch (e) { err = e; } globalThis.__httpsFake = orig;
  T("T9 redirect to a non-Google host is refused (not followed, not retried)", "LEADS_BAD_REDIRECT_REDIRECT", err?.message, err?.message === "LEADS_BAD_REDIRECT_REDIRECT");
}
{ // T10 budget: no hop starts after the budget is spent
  const { st } = fresh(() => ({ dropPost: true })); tuning.requestBudgetMs = 150;
  const t0 = Date.now(); let err; try { await lib.saveLead(lead(uid()), ctx()); } catch (e) { err = e; }
  T("T10 request budget bounds the total time", "ends within budget + small margin, DEADLINE or TIMEOUT", { ms: Date.now() - t0, e: err?.message }, Date.now() - t0 < 400 && /DEADLINE|TIMEOUT/.test(err?.message));
}
{ // T11 logs never contain secret, redirect URL, full lead id
  const { st } = fresh(); const id = uid(); await lib.saveLead(lead(id), ctx());
  const all = vlogs.join("\n");
  T("T11 LEADS_CALL logs never contain secret, redirect URL, lead id or personal data", "absent", { s: all.includes(SECRET), u: all.includes("echo?k"), id: all.includes(id), n: all.includes("בדיקה") }, !all.includes(SECRET) && !all.includes("echo?k") && !all.includes(id) && !all.includes("בדיקה") && all.includes("LEADS_CALL"));
}
console.log = realLog;
for (const r of results) out(r.join(" | "));
const failed = results.filter((r) => r[3] === "FAIL").length;
out(failed ? `FAILED: ${failed}` : `ALL ${results.length} PASS`);
process.exit(failed ? 1 : 0);

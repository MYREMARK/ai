// Diagnostic runner for Apps Script v2.1 (needs LEADS_WEBAPP_URL / LEADS_WEBAPP_SECRET in .env.local).
// Sends ONLY `claim` for a lead that does not exist => NEVER writes to the sheet, never sends email.
// Each request carries a unique reqId, so its LEADS_TRACE lines in Apps Script > Executions can be matched.
// Usage: node apps-script/test/diag.mjs seq10 | idle <minutes> | ramp <n>
import fs from "fs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }));
const HOP_TIMEOUT = 20000;
const clock = d => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d) + "." + String(d.getMilliseconds()).padStart(3, "0");
const short = s => String(s).replace(/\s+/g, " ").slice(0, 70);

async function hop(url, init) {
  const c = new AbortController(); const tm = setTimeout(() => c.abort(), HOP_TIMEOUT); const t = Date.now();
  try { const r = await fetch(url, { ...init, signal: c.signal, redirect: "manual" }); return { r, ms: Date.now() - t }; }
  catch (e) { return { err: e.name === "AbortError" ? "TIMEOUT@" + HOP_TIMEOUT + "ms" : e.name, ms: Date.now() - t }; }
  finally { clearTimeout(tm); }
}

export async function one(reqId) {
  const sent = new Date(); const t0 = Date.now();
  const body = JSON.stringify({ action: "claim", leadId: crypto.randomUUID(), kind: "admin", reqId, secret: env.LEADS_WEBAPP_SECRET });
  const row = { reqId, sent: clock(sent), hop1: "-", hop1ms: 0, hop2: "-", hop2ms: 0, totalMs: 0, answered: false, result: "", stoppedAt: "" };
  const a = await hop(env.LEADS_WEBAPP_URL, { method: "POST", headers: { "content-type": "application/json" }, body });
  row.hop1ms = a.ms;
  if (a.err) { row.hop1 = a.err; row.stoppedAt = "hop1 (POST to /exec, before any redirect)"; row.totalMs = Date.now() - t0; return row; }
  row.hop1 = String(a.r.status);
  let r = a.r;
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location") || "";
    const b = await hop(loc, { method: "GET" }); row.hop2ms = b.ms;
    if (b.err) { row.hop2 = b.err; row.stoppedAt = "hop2 (GET of redirect target)"; row.totalMs = Date.now() - t0; return row; }
    row.hop2 = String(b.r.status); r = b.r;
  }
  const text = await r.text(); row.totalMs = Date.now() - t0; row.answered = true;
  try { const j = JSON.parse(text); row.result = j.error || (j.ok ? "ok" : "?"); } catch { row.result = "NON-JSON: " + short(text); row.stoppedAt = "non-JSON answer"; }
  return row;
}

function table(rows) {
  console.log("reqId | sent (IL) | hop1 | hop1 ms | hop2 | hop2 ms | total ms | answered | result | stopped at");
  for (const r of rows) console.log([r.reqId, r.sent, r.hop1, r.hop1ms, r.hop2, r.hop2ms, r.totalMs, r.answered ? "yes" : "NO", r.result, r.stoppedAt || "-"].join(" | "));
  const ok = rows.filter(r => r.answered).length;
  const t = rows.filter(r => r.answered).map(r => r.totalMs).sort((a, b) => a - b);
  console.log(`\nsent=${rows.length} answered=${ok} unanswered=${rows.length - ok}` + (t.length ? ` min=${t[0]}ms median=${t[Math.floor(t.length / 2)]}ms max=${t[t.length - 1]}ms` : ""));
}

const mode = process.argv[2]; const stamp = Date.now().toString(36);
if (mode === "seq10") {
  const rows = [];
  for (let i = 1; i <= 10; i++) {
    const row = await one(`dg-${stamp}-s${String(i).padStart(2, "0")}`); rows.push(row);
    if (i === 1 && row.result === "invalid") { console.log("STOP: reqId was rejected as invalid => v2.1 is NOT the installed version."); break; }
    await new Promise(r => setTimeout(r, 3000));
  }
  table(rows);
}
if (mode === "idle") {
  const min = Number(process.argv[3] || 10); console.log(`idle ${min} min starting at ${clock(new Date())} (IL)...`);
  await new Promise(r => setTimeout(r, min * 60000));
  table([await one(`dg-${stamp}-idle`)]);
}
if (mode === "ramp") {
  const n = Number(process.argv[3] || 5); const t0 = Date.now();
  const rows = await Promise.all(Array.from({ length: n }, (_, i) => one(`dg-${stamp}-r${n}-${String(i + 1).padStart(2, "0")}`)));
  table(rows); console.log("wall ms:", Date.now() - t0);
}

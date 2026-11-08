// REAL tests against the deployed TEST Web App (needs LEADS_WEBAPP_URL / LEADS_WEBAPP_SECRET in .env.local).
// Writes TEST rows only. Never sends email. Prints no secret.
// Usage: node apps-script/test/real-test.mjs core | parallel | busy-watch
import fs from "fs";
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n").filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }));
const il = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "medium" }).format(new Date()).split(" ");
const uid = () => crypto.randomUUID();
async function call(o, timeoutMs = 40000) {
  const t = Date.now(); const c = new AbortController(); const tm = setTimeout(() => c.abort(), timeoutMs);
  try {
    let r = await fetch(env.LEADS_WEBAPP_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...o, secret: env.LEADS_WEBAPP_SECRET }), signal: c.signal, redirect: "manual" });
    for (let i = 0; i < 3 && r.status >= 300 && r.status < 400; i++) r = await fetch(r.headers.get("location"), { signal: c.signal, redirect: "manual" });
    const j = JSON.parse(await r.text()); return { ...j, _ms: Date.now() - t };
  } catch (e) { return { ok: false, error: "client:" + e.name, _ms: Date.now() - t }; } finally { clearTimeout(tm); }
}
const lead = (id, x = {}) => { const [date, time] = il(); return { action: "save", leadId: id, fullName: "TEST LEAD V2", email: "icxmark@gmail.com", phone: "0501234567", business: "V2 TEST", date, time, marketingConsent: false, ...x }; };
const rows = []; const T = (n, e, g, ok) => rows.push([n, e, JSON.stringify(g), ok ? "PASS" : "FAIL"]);
const mode = process.argv[2];

if (mode === "core") {
  const id = uid(), ids = [id];
  let r = await call(lead(id)); T("save new", "ok duplicate:false", r, r.ok && r.duplicate === false);
  r = await call(lead(id)); T("save duplicate", "duplicate:true", r, r.ok && r.duplicate === true);
  r = await call({ action: "claim", leadId: id, kind: "admin" }); const a1 = r.attemptId; T("claim admin #1", "claimed", { claimed: r.claimed, ms: r._ms }, r.claimed === true && !!a1);
  r = await call({ action: "claim", leadId: id, kind: "admin" }); T("claim admin #2", "claimed:false Sending", r, r.claimed === false && r.status === "Sending");
  r = await call({ action: "mark", leadId: id, kind: "admin", result: "sent", attemptId: uid() }); T("mark wrong attempt", "applied:false", r, r.applied === false);
  r = await call({ action: "mark", leadId: id, kind: "admin", result: "sent", attemptId: a1 }); T("mark right attempt", "applied:true", r, r.applied === true);
  r = await call({ action: "mark", leadId: id, kind: "admin", result: "failed", attemptId: a1 }); T("mark repeat", "applied:false Sent", r, r.applied === false && r.status === "Sent");
  r = await call({ action: "claim", leadId: id, kind: "thanks" }); const a2 = r.attemptId; T("claim thanks", "claimed", { claimed: r.claimed }, r.claimed === true);
  r = await call({ action: "mark", leadId: id, kind: "thanks", result: "failed", attemptId: a2 }); T("mark thanks failed", "applied:true", r, r.applied === true);
  r = await call(lead(id)); T("final statuses", "admin Sent, thanks Failed", r, r.admin === "Sent" && r.thanks === "Failed");
  r = await call({ action: "claim", leadId: id, kind: "thanks" }); T("claim after Failed", "claimed:false", r, r.claimed === false && r.status === "Failed");
  r = await call(lead(uid(), { marketingConsent: true, consentDate: il().join(" "), consentVersion: "v1" })); T("save with consent", "ok", r, r.ok === true);
  r = await call({ ...lead(uid()), website: "x" }); T("unknown field rejected", "invalid", r, r.error === "invalid");
  r = await call({ action: "claim", leadId: uid(), kind: "admin" }); T("claim unknown lead", "not_found", r, r.error === "not_found");
  console.log("CORE_LEAD_ID", id);
}

if (mode === "parallel") {
  // 10 concurrent saves of DIFFERENT leads + 5 concurrent saves of the SAME lead + 5 concurrent claims on one lead.
  // Any "busy" answer is retried ONCE with the SAME payload (what the website API does).
  const sameId = uid(), claimId = uid(), created = [];
  await call(lead(claimId, { fullName: "TEST LEAD PARALLEL-CLAIM" })); created.push(claimId);
  const specs = [];
  for (let i = 0; i < 10; i++) { const id = uid(); created.push(id); specs.push({ kind: "save", payload: lead(id, { fullName: "TEST LEAD PARALLEL" }) }); }
  created.push(sameId);
  for (let i = 0; i < 5; i++) specs.push({ kind: "same", payload: lead(sameId, { fullName: "TEST LEAD SAME-ID" }) });
  for (let i = 0; i < 5; i++) specs.push({ kind: "claim", payload: { action: "claim", leadId: claimId, kind: "admin" } });
  const run = async sp => {
    const first = await call(sp.payload); if (first.error !== "busy") return { ...sp, first, final: first, retried: false };
    await new Promise(x => setTimeout(x, 1200 + Math.random() * 400));
    const second = await call(sp.payload); return { ...sp, first, final: second, retried: true };
  };
  const t0 = Date.now(); const res = await Promise.all(specs.map(run)); const wall = Date.now() - t0;
  const busyFirst = res.filter(r => r.first.error === "busy").length;
  const stillBusy = res.filter(r => r.final.error === "busy").length;
  const hard = res.filter(r => !r.final.ok && r.final.error !== "busy").map(r => r.final.error);
  const saves = res.filter(r => r.kind === "save"), same = res.filter(r => r.kind === "same"), claims = res.filter(r => r.kind === "claim");
  console.log(JSON.stringify({ wallMs: wall, busyOnFirstTry: busyFirst, stillBusyAfterRetry: stillBusy, perRequestMs: res.map(r => [r.kind, r.first.error || "ok", r.first._ms, r.retried ? r.final.error || "ok" : "-", r.retried ? r.final._ms : 0]) }));
  T("no hard errors", "none", hard, hard.length === 0);
  T("10 different leads all created", "10 x duplicate:false", saves.map(r => r.final.error || (r.final.duplicate ? "dup" : "new")), saves.every(r => r.final.ok && r.final.duplicate === false));
  T("5 concurrent saves of SAME id => exactly 1 created", "1 new, 4 dup (after retry)", same.map(r => r.final.error || (r.final.duplicate ? "dup" : "new")), same.filter(r => r.final.ok && r.final.duplicate === false).length === 1 && same.filter(r => r.final.ok && r.final.duplicate === true).length === 4);
  T("5 concurrent claims => exactly 1 claimed", "1 claimed, 4 not claimed", claims.map(r => r.final.error || (r.final.claimed ? "claimed" : "no:" + r.final.status)), claims.filter(r => r.final.claimed === true).length === 1 && claims.filter(r => r.final.ok && r.final.claimed === false).length === 4);
  T("nothing left busy after the single retry", "0", { stillBusy }, stillBusy === 0);
  const maxMs = Math.max(...res.map(r => r.first._ms + (r.retried ? 1500 + r.final._ms : 0)));
  T("worst total time per request (incl. retry)", "< 15000 ms", { maxMs, wallMs: wall }, maxMs < 15000);
  const chk = await call(lead(sameId, { fullName: "TEST LEAD SAME-ID" })); T("same-id lead afterwards", "duplicate:true", chk, chk.ok && chk.duplicate === true);
  console.log("PARALLEL_CREATED_IDS", JSON.stringify(created));
}

if (mode === "busy-watch") {
  console.log("WATCHING: run holdLockForTest() in the Apps Script editor now (waiting up to 4 minutes)...");
  const L = uid(); let tBusyStart = 0; const deadline = Date.now() + 240000; let busySeen = null;
  while (Date.now() < deadline) {
    const t = Date.now(); const r = await call({ action: "claim", leadId: uid(), kind: "admin" }, 30000);
    if (r.error === "busy") { busySeen = { ms: r._ms }; break; }
    await new Promise(x => setTimeout(x, 1000));
  }
  T("probe sees busy while lock is held", "busy returned within ~5-8s", busySeen, !!busySeen && busySeen.ms < 9000);
  if (busySeen) {
    const s1 = await call(lead(L, { fullName: "TEST LEAD BUSY" })); T("save while lock held", "busy in ~5s, nothing written", { error: s1.error, ms: s1._ms }, (s1.error === "busy" && s1._ms < 9000) || s1.ok);
    const wrote = s1.ok === true;
    let tries = 0, final = null; const stop = Date.now() + 120000;
    while (Date.now() < stop) { tries++; const r = await call(lead(L, { fullName: "TEST LEAD BUSY" })); if (r.ok) { final = r; break; } await new Promise(x => setTimeout(x, 2000)); }
    T("retry with SAME leadId succeeds after release", "ok", { tries, final: final && { duplicate: final.duplicate } }, !!final);
    const again = await call(lead(L, { fullName: "TEST LEAD BUSY" })); T("one row only (3rd call is duplicate)", "duplicate:true", again, again.ok && again.duplicate === true);
    console.log("BUSY_LEAD_ID", L, "(wrote during hold:", wrote, ")");
  }
}
for (const r of rows) console.log(r.join(" | "));
console.log(rows.some(r => r[3] === "FAIL") ? "FAILED" : "DONE");

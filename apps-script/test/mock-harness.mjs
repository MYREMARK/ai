// Local logic tests for apps-script/leads.gs with MOCKED Google services.
// This verifies the script's logic and lock/IO behaviour. It is NOT a substitute for tests on the real Apps Script.
import fs from "fs";
import vm from "vm";
import crypto from "crypto";

const SRC = fs.readFileSync(new URL("../leads.gs", import.meta.url), "utf8");
const SECRET = "mock-secret";
const COLS = 20;

function makeEnv({ rows = 1000 } = {}) {
  const grid = [Array(COLS).fill("")]; // header row
  const stats = { calls: 0, writes: 0, flushes: 0, acquired: 0, released: 0, tryLocks: 0 };
  const hooks = { onRead: null, failRead: false, lockBusy: false, maxRows: rows };
  let held = false;
  const logs = [];
  const sheet = {
    getLastRow: () => { stats.calls++; if (hooks.onRead) hooks.onRead(); return grid.length; },
    getMaxRows: () => hooks.maxRows,
    insertRowsAfter: (_a, n) => { stats.calls++; hooks.maxRows += n; },
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => {
        stats.calls++;
        if (hooks.failRead) throw new Error("Service Spreadsheets timed out");
        if (hooks.onRead) hooks.onRead();
        const out = [];
        for (let i = 0; i < nr; i++) { const row = grid[r - 1 + i] || Array(COLS).fill(""); out.push(row.slice(c - 1, c - 1 + nc)); }
        return out;
      },
      setNumberFormat() { stats.calls++; return this; },
      setValues(v) {
        stats.calls++; stats.writes++;
        for (let i = 0; i < nr; i++) { while (grid.length < r + i) grid.push(Array(COLS).fill("")); const row = grid[r - 1 + i]; for (let j = 0; j < nc; j++) row[c - 1 + j] = v[i][j]; }
        return this;
      },
    }),
  };
  const props = { LEADS_SECRET: SECRET, SPREADSHEET_ID: "mock-id" };
  const ctx = {
    console: { log: m => logs.push(String(m)), error: m => logs.push("ERR " + String(m)) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush: () => { stats.flushes++; } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null }) },
    LockService: { getScriptLock: () => ({
      tryLock: () => { stats.tryLocks++; if (hooks.lockBusy || held) return false; held = true; stats.acquired++; return true; },
      releaseLock: () => { held = false; stats.released++; },
    }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: s => ({ s, setMimeType() { return this; } }) },
    Utilities: {
      formatDate: () => new Date().toISOString().replace(/\.\d+Z$/, "Z"),
      newBlob: s => ({ getBytes: () => Buffer.from(s, "utf8") }),
      getUuid: () => crypto.randomUUID(),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  const post = o => { const r = ctx.doPost({ postData: { contents: typeof o === "string" ? o : JSON.stringify({ secret: SECRET, ...o }) } }); return JSON.parse(r.s); };
  return { ctx, post, grid, stats, hooks, logs };
}

const results = [];
const T = (name, expect, got, pass) => results.push([name, expect, typeof got === "string" ? got : JSON.stringify(got), pass ? "PASS" : "FAIL"]);
const now = new Date(); const date = now.toISOString().slice(0, 10), time = "10:00:00";
const lead = (id, x = {}) => ({ action: "save", leadId: id, fullName: "TEST LEAD", email: "icxmark@gmail.com", phone: "0501234567", business: "T", date, time, marketingConsent: false, ...x });
const uid = () => crypto.randomUUID();

{ // basic cycle
  const e = makeEnv(); const id = uid();
  let r = e.post(lead(id)); T("save new", "ok, duplicate:false", r, r.ok && r.duplicate === false);
  T("rows after save", "2 (header + 1)", e.grid.length, e.grid.length === 2);
  T("phone kept as text with leading 0", "0501234567", e.grid[1][5], e.grid[1][5] === "0501234567");
  const w = e.stats.writes; const fl = e.stats.flushes;
  r = e.post(lead(id)); T("duplicate save", "duplicate:true, no write, no flush, 2 rows", { r, w: e.stats.writes - w, f: e.stats.flushes - fl, rows: e.grid.length }, r.duplicate === true && e.stats.writes === w && e.stats.flushes === fl && e.grid.length === 2);
  r = e.post({ action: "claim", leadId: id, kind: "admin" }); const a1 = r.attemptId; T("claim admin #1", "claimed + attemptId", { claimed: r.claimed, has: !!a1 }, r.claimed && !!a1);
  r = e.post({ action: "claim", leadId: id, kind: "admin" }); T("claim admin #2", "claimed:false Sending", r, r.claimed === false && r.status === "Sending");
  r = e.post({ action: "mark", leadId: id, kind: "admin", result: "sent", attemptId: uid() }); T("mark wrong attempt", "applied:false", r, r.applied === false);
  r = e.post({ action: "mark", leadId: id, kind: "admin", result: "sent", attemptId: a1 }); T("mark right attempt", "applied:true", r, r.applied === true);
  r = e.post({ action: "mark", leadId: id, kind: "admin", result: "failed", attemptId: a1 }); T("mark repeat", "applied:false, Sent", r, r.applied === false && r.status === "Sent");
  // two email ops in sequence (thanks path independent)
  r = e.post({ action: "claim", leadId: id, kind: "thanks" }); const a2 = r.attemptId; T("claim thanks (after admin)", "claimed", r, r.claimed === true);
  r = e.post({ action: "mark", leadId: id, kind: "thanks", result: "failed", attemptId: a2 }); T("mark thanks failed", "applied:true", r, r.applied === true);
  r = e.post(lead(id)); T("final statuses", "admin Sent, thanks Failed", r, r.admin === "Sent" && r.thanks === "Failed");
  r = e.post({ action: "claim", leadId: id, kind: "thanks" }); T("claim after Failed", "claimed:false", r, r.claimed === false && r.status === "Failed");
  r = e.post({ action: "claim", leadId: uid(), kind: "admin" }); T("claim unknown lead", "not_found", r, r.error === "not_found");
}
{ // stale Sending -> Unknown, never re-claimable
  const e = makeEnv(); const id = uid(); e.post(lead(id));
  const c = e.post({ action: "claim", leadId: id, kind: "admin" });
  e.grid[1][15] = new Date(Date.now() - 11 * 60 * 1000).toISOString().replace(/\.\d+Z$/, "Z"); // admin updatedAt 11 min ago
  let r = e.post(lead(id)); T("stale Sending reported as Unknown (read-only)", "admin Unknown", r, r.admin === "Unknown");
  T("duplicate read did not write", "status cell still Sending", e.grid[1][14], e.grid[1][14] === "Sending");
  r = e.post({ action: "mark", leadId: id, kind: "admin", result: "sent", attemptId: c.attemptId }); T("late mark after stale", "applied:false Unknown", r, r.applied === false && r.status === "Unknown");
  r = e.post({ action: "claim", leadId: id, kind: "admin" }); T("claim after Unknown", "claimed:false", r, r.claimed === false && r.status === "Unknown");
}
{ // lock accounting + call counts per action
  const e = makeEnv(); const id = uid();
  const measure = (name, fn) => { const c0 = e.stats.calls; const r = fn(); T(`Sheets calls inside request: ${name}`, "small & fixed", { calls: e.stats.calls - c0, flushes: e.stats.flushes }, e.stats.calls - c0 <= 6); return r; };
  measure("save new", () => e.post(lead(id)));
  measure("save duplicate", () => e.post(lead(id)));
  const c = measure("claim", () => e.post({ action: "claim", leadId: id, kind: "admin" }));
  measure("mark", () => e.post({ action: "mark", leadId: id, kind: "admin", result: "sent", attemptId: c.attemptId }));
  T("every acquired lock was released", "acquired == released", { a: e.stats.acquired, r: e.stats.released }, e.stats.acquired === e.stats.released);
}
{ // early validation never touches lock or sheet
  const e = makeEnv();
  const bad = [
    ["wrong secret", { ...lead(uid()), secret: "x" }, "unauthorized"],
    ["unknown field (save)", lead(uid(), { website: "x" }), "invalid"],
    ["extra field (claim)", { action: "claim", leadId: uid(), kind: "admin", extra: 1 }, "invalid"],
    ["consent true w/o date", lead(uid(), { marketingConsent: true }), "invalid"],
    ["consent false with date", lead(uid(), { consentDate: "2026-11-05 10:00:00", consentVersion: "v1" }), "invalid"],
    ["Feb 31", lead(uid(), { date: "2026-02-31" }), "invalid"],
    ["time 25:00:00", lead(uid(), { time: "25:00:00" }), "invalid"],
    ["unknown action", { action: "delete", leadId: uid() }, "invalid"],
    ["oversize (3000 Hebrew chars = 6000 bytes)", lead(uid(), { business: "א".repeat(3000) }), "too_large"],
    ["bad JSON", "{not json", "invalid"],
  ];
  for (const [n, body, exp] of bad) { const r = e.post(body); T(`validation: ${n}`, exp, r, r.ok === false && r.error === exp); }
  T("none of those touched lock or sheet", "tryLock=0, calls=0", { t: e.stats.tryLocks, c: e.stats.calls }, e.stats.tryLocks === 0 && e.stats.calls === 0);
}
{ // formula injection
  const e = makeEnv(); const id = uid();
  e.post(lead(id, { fullName: "=1+1", business: '=HYPERLINK("http://x","x")', phone: "+972 50-123-4567" }));
  T("formula guard (name, business)", "leading apostrophe", [e.grid[1][3], e.grid[1][6]], e.grid[1][3] === "'=1+1" && e.grid[1][6].startsWith("'="));
  T("international phone kept", "+972 50-123-4567", e.grid[1][5], e.grid[1][5] === "+972 50-123-4567");
}
{ // consent true stored
  const e = makeEnv(); const id = uid();
  const r = e.post(lead(id, { marketingConsent: true, consentDate: "2026-11-05 10:00:00", consentVersion: "v1" }));
  T("consent true stored", "true / date / v1", [e.grid[1][7], e.grid[1][8], e.grid[1][9]], r.ok && e.grid[1][7] === "true" && e.grid[1][9] === "v1");
}
{ // BUSY: lock held by another request
  const e = makeEnv(); const id = uid(); e.hooks.lockBusy = true;
  const t0 = Date.now(); const r = e.post(lead(id));
  T("busy lock => busy, nothing written", "error busy, rows=1, release not called", { r, rows: e.grid.length, rel: e.stats.released }, r.ok === false && r.error === "busy" && e.grid.length === 1 && e.stats.released === 0);
  e.hooks.lockBusy = false; const r2 = e.post(lead(id)); T("retry after busy with SAME id", "saved once", { r2, rows: e.grid.length }, r2.ok && r2.duplicate === false && e.grid.length === 2);
}
{ // CONCURRENT: a second request arrives while the first is inside the lock
  const e = makeEnv(); const id = uid(); let inner;
  e.hooks.onRead = () => { e.hooks.onRead = null; inner = e.post(lead(id)); }; // fires during the first request's sheet read
  const first = e.post(lead(id));
  T("concurrent request while lock held", "inner busy, outer ok", { inner: inner?.error, outer: first.ok }, inner?.error === "busy" && first.ok === true);
  const retry = e.post(lead(id)); T("inner retry with same id", "duplicate:true, still 1 data row", { retry: retry.duplicate, rows: e.grid.length }, retry.duplicate === true && e.grid.length === 2);
}
{ // Google Sheets error inside the lock
  const e = makeEnv(); const id = uid(); e.post(lead(id)); e.hooks.failRead = true;
  const r = e.post({ action: "claim", leadId: id, kind: "admin" });
  T("Sheets error => server error, lock released", "error server, acquired==released", { r, a: e.stats.acquired, rel: e.stats.released }, r.ok === false && r.error === "server" && e.stats.acquired === e.stats.released);
  e.hooks.failRead = false; const ok = e.post({ action: "claim", leadId: id, kind: "admin" }); T("recovers after Sheets error", "claimed", ok, ok.claimed === true);
}
{ // sheet full grows
  const e = makeEnv({ rows: 2 }); e.post(lead(uid())); const before = e.hooks.maxRows; const r = e.post(lead(uid()));
  T("full sheet is extended", "maxRows grows, save ok", { r: r.ok, before, after: e.hooks.maxRows }, r.ok && e.hooks.maxRows > before);
}

{ // v2.1 trace logging
  const e = makeEnv(); const id = uid();
  e.post(lead(id, { fullName: "SECRETNAME Person", email: "private.person@example.com", phone: "0509998877", reqId: "rq-test-0001" }));
  const L = e.logs.filter(l => l.startsWith("LEADS_TRACE"));
  const steps = L.map(l => /step=(\S+)/.exec(l)[1]);
  const want = ["LEADS_START","REQUEST_READ","SECRET_OK","VALIDATION_OK","SHEET_OPENED","LOCK_TRY","LOCK_ACQUIRED","SHEET_READ_IDS","SHEET_WRITE","FLUSH_DONE","LOCK_RELEASING","LOCK_RELEASED","REQUEST_END"];
  T("trace: save steps in order", want.join(">"), steps.join(">"), steps.join(">") === want.join(">"));
  T("trace: first log line is LEADS_START", "LEADS_START", steps[0], steps[0] === "LEADS_START");
  const all = e.logs.join("\n");
  T("trace: no PII / secret / full lead id in logs", "none present", { name: all.includes("SECRETNAME"), email: all.includes("private.person"), phone: all.includes("0509998877"), secret: all.includes(SECRET), fullId: all.includes(id) }, !all.includes("SECRETNAME") && !all.includes("private.person") && !all.includes("0509998877") && !all.includes(SECRET) && !all.includes(id));
  T("trace: reqId + server id on every line", "rid=rq-test-0001 and sid=", L.every(l => l.includes("rid=rq-test-0001") && /sid=\w{8}/.test(l)) || L.slice(0,2).every(l=>l.includes("rid=-")), L.length, L.slice(2).every(l => l.includes("rid=rq-test-0001")) && L.every(l => /sid=\w{8}/.test(l)));
  T("trace: every line has t= elapsed ms", "t=<number>", L.length, L.every(l => /t=\d+/.test(l)));
}
{ const e = makeEnv(); e.hooks.lockBusy = true; e.post(lead(uid()));
  const steps = e.logs.filter(l => l.startsWith("LEADS_TRACE")).map(l => /step=(\S+)/.exec(l)[1]).join(">");
  T("trace: busy path", "..LOCK_TRY>LOCK_BUSY>REQUEST_END (no LOCK_ACQUIRED/RELEASING)", steps, /LOCK_TRY>LOCK_BUSY>REQUEST_END$/.test(steps) && !steps.includes("LOCK_ACQUIRED")); }
{ const e = makeEnv(); const id = uid(); e.post(lead(id)); e.logs.length = 0; e.hooks.failRead = true;
  const r = e.post({ action: "claim", leadId: id, kind: "admin", reqId: "rq-err-0002" });
  const errLine = e.logs.find(l => l.startsWith("ERR LEADS_SCRIPT_ERROR")) || "";
  const steps = e.logs.filter(l => l.startsWith("LEADS_TRACE")).map(l => /step=(\S+)/.exec(l)[1]).join(">");
  T("trace: error inside lock records the step and still releases", "ERR line with step=LOCK_ACQUIRED, LOCK_RELEASED before REQUEST_END", { errLine: errLine.replace(/sid=\w+/, "sid=*"), steps }, r.error === "server" && errLine.includes("step=LOCK_ACQUIRED") && /LOCK_RELEASING>LOCK_RELEASED>REQUEST_END$/.test(steps)); }
{ const e = makeEnv(); const id = uid();
  let r = e.post(lead(id, { reqId: "bad id!" })); T("reqId with invalid characters rejected", "invalid", r, r.error === "invalid");
  r = e.post(lead(id)); T("no reqId still works (backwards compatible)", "ok", r, r.ok === true);
  r = e.post({ action: "mark", leadId: id, kind: "admin", result: "sent", attemptId: uid(), reqId: "ok-1234" }); T("reqId accepted on mark", "applied:false (wrong attempt), not invalid", r, r.error !== "invalid"); }
for (const r of results) console.log(r.join(" | "));
const failed = results.filter(r => r[3] === "FAIL").length;
console.log(failed ? `FAILED: ${failed}` : `ALL ${results.length} PASS`);
process.exit(failed ? 1 : 0);

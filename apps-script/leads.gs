/**
 * ReMark AI Leads - Google Apps Script (bound to the Google Sheet).  VERSION 3 (idempotent claim)
 * Actions (POST JSON): save | claim | mark
 * Secret is read from Script Properties (key: LEADS_SECRET). Never hard-code it.
 * Responses are minimal and never contain personal data.
 *
 * Email status values (clean, no timestamps inside): Pending, Sending, Sent, Failed, Unknown.
 *  - Only Pending can be claimed for an automatic send.
 *  - Failed and Unknown wait for manual review.
 *  - Sending older than STALE_MS is reported as Unknown (never re-sent automatically).
 *  - mark only works for the attempt that holds a valid claim (attemptId) while status is Sending.
 *
 * v2 lock design:
 *  - Validation, JSON parsing and opening the spreadsheet happen BEFORE the lock.
 *  - tryLock(LOCK_WAIT_MS): if the lock is busy the request returns {ok:false,error:"busy"} fast.
 *  - Inside the lock: a minimal, fixed number of Sheets calls (bulk getValues / setValues).
 *  - Exactly one flush(), only if something was written, BEFORE releaseLock(), so the next
 *    execution that gets the lock always sees committed data.
 *  - releaseLock() is in finally. Lock timings are logged for every request.
 *
 * v2.1 = v2 + step-by-step trace logging ONLY (LEADS_TRACE lines). No business-logic, lock or
 * claim/mark change. The only non-log change: an OPTIONAL diagnostic field "reqId" is accepted in
 * every action's allowlist; it is validated, logged and otherwise ignored (never stored).
 * Trace lines never contain names, emails, phones, secrets or full lead IDs.
 *
 * v3 = v2.1 + idempotent claim. "claim" accepts an optional caller-generated attemptId (UUID). A claim
 * that already holds the Sending state with that exact attemptId is answered claimed:true, replay:true
 * (no write), so a retry after a lost answer can proceed without ever allowing a second sender. Without
 * attemptId the behaviour is unchanged. No change to the sheet layout, lock, save or mark logic.
 */

var SHEET_NAME = "Leads";
var HEADERS = [
  "Lead ID",                 // 1
  "Date",                    // 2
  "Time",                    // 3
  "Full Name",               // 4
  "Email",                   // 5
  "Phone",                   // 6
  "Business",                // 7
  "Marketing Consent",       // 8
  "Consent Date",            // 9
  "Consent Version",         // 10
  "Lead Status",             // 11
  "Contact Date",            // 12
  "Follow Up Date",          // 13
  "Notes",                   // 14
  "Admin Email Status",      // 15
  "Admin Email Updated At",  // 16
  "Thank You Email Status",  // 17
  "Thank You Email Updated At", // 18
  "Admin Attempt ID",        // 19 (internal, hidden)
  "Thank You Attempt ID"     // 20 (internal, hidden)
];
// Columns 15..20 are read/written together as one 6-cell block: [aStatus, aUpdated, tStatus, tUpdated, aAttempt, tAttempt]
var STATE_FIRST_COL = 15;
var STATE_WIDTH = 6;
var IDX = {
  admin:  { status: 0, updated: 1, attempt: 4 },
  thanks: { status: 2, updated: 3, attempt: 5 }
};
var MAX_BODY_BYTES = 5000;     // actual UTF-8 bytes of the request body
var PROP_SHEET_ID = "SPREADSHEET_ID";
var LOCK_WAIT_MS = 5000;       // tryLock wait; busy => fast error, the caller retries once
var STALE_MS = 10 * 60 * 1000; // "Sending" older than this is Unknown
var ROW_GROW = 200;            // rows added when the sheet is full

var ALLOWED_FIELDS = {
  save:  ["action", "secret", "leadId", "fullName", "email", "phone", "business",
          "date", "time", "marketingConsent", "consentDate", "consentVersion", "reqId"],
  claim: ["action", "secret", "leadId", "kind", "attemptId", "reqId"],
  mark:  ["action", "secret", "leadId", "kind", "result", "attemptId", "reqId"]
};
var REQID_RE = /^[A-Za-z0-9-]{4,40}$/; // optional diagnostic correlation id sent by the caller

/**
 * Run ONCE manually from the Apps Script editor of the bound script (opened from the Sheet via
 * Extensions > Apps Script). Stores the spreadsheet ID in Script Properties (SPREADSHEET_ID);
 * every API request then uses SpreadsheetApp.openById(id).
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Run setupSheet from the script bound to the Google Sheet.");
  PropertiesService.getScriptProperties().setProperty(PROP_SHEET_ID, ss.getId());
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  sh.getRange(2, 1, sh.getMaxRows() - 1, HEADERS.length).setNumberFormat("@"); // plain text
  sh.setFrozenRows(1);
  sh.hideColumns(19, 2); // internal attempt IDs
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function safeEqual_(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function nowIso_() {
  return Utilities.formatDate(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

/* ---------- diagnostic trace (v2.1) ---------- */

/**
 * One line per step: LEADS_TRACE sid=<server id> rid=<caller id|-> act=<action|?> t=<ms since start> step=<STEP> [extra]
 * tr is created at the very top of doPost and passed down; it never throws.
 */
function makeTrace_(t0) {
  var tr = { sid: Utilities.getUuid().slice(0, 8), rid: "-", act: "?", t0: t0, step: "INIT" };
  tr.log = function (step, extra) {
    tr.step = step;
    try {
      console.log("LEADS_TRACE sid=" + tr.sid + " rid=" + tr.rid + " act=" + tr.act +
                  " t=" + (Date.now() - tr.t0) + " step=" + step + (extra ? " " + extra : ""));
    } catch (e) { /* logging must never break a request */ }
  };
  return tr;
}

/* ---------- validation ---------- */

function str_(v, max, required) {
  if (v === undefined || v === null) v = "";
  if (typeof v !== "string") return null;
  v = v.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  if (required && !v) return null;
  if (v.length > max) return null;
  return v;
}

var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var PHONE_RE = /^[0-9+\-() ]{5,30}$/;
var VERSION_RE = /^[A-Za-z0-9._-]{1,20}$/;

function validDate_(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  var y = +m[1], mo = +m[2], d = +m[3];
  if (y < 2025 || y > 2100) return false;
  var dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function validTime_(s) {
  var m = /^(\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (!m) return false;
  return +m[1] <= 23 && +m[2] <= 59 && +m[3] <= 59;
}

function validDateTime_(s) {
  var m = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(s);
  return !!m && validDate_(m[1]) && validTime_(m[2]);
}

/** Explicit formula-injection protection (in addition to the text number format). */
function guard_(v, isPhone) {
  v = String(v);
  if (isPhone && /^\+\d[\d\s\-()]*$/.test(v)) return v;
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function fieldsAllowed_(data, action) {
  var allowed = ALLOWED_FIELDS[action];
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    if (allowed.indexOf(keys[i]) === -1) return false;
  }
  return true;
}

/* ---------- per-action preparation (NO sheet access, runs BEFORE the lock) ---------- */

function prepareSave_(d) {
  var fullName = str_(d.fullName, 100, true);
  var email = str_(d.email, 120, true);
  var phone = str_(d.phone, 30, true);
  var business = str_(d.business, 150, false);
  var date = str_(d.date, 10, true);
  var time = str_(d.time, 8, true);
  var consentDate = str_(d.consentDate, 19, false);
  var consentVersion = str_(d.consentVersion, 20, false);
  var consent = d.marketingConsent;

  if (fullName === null || email === null || phone === null || business === null ||
      date === null || time === null || consentDate === null || consentVersion === null ||
      typeof consent !== "boolean" ||
      !EMAIL_RE.test(email) || !PHONE_RE.test(phone) ||
      !validDate_(date) || !validTime_(time)) {
    return null;
  }
  if (consent) {
    if (!validDateTime_(consentDate) || !VERSION_RE.test(consentVersion)) return null;
  } else if (consentDate !== "" || consentVersion !== "") {
    return null;
  }

  var now = nowIso_();
  return [
    d.leadId, date, time,
    guard_(fullName, false), guard_(email, false), guard_(phone, true), guard_(business, false),
    consent ? "true" : "false",
    consent ? consentDate : "",
    consent ? consentVersion : "",
    "New", "", "", "",
    "Pending", now,
    "Pending", now,
    "", ""
  ];
}

function prepareClaim_(d) {
  if (d.kind !== "admin" && d.kind !== "thanks") return null;
  // v3: the caller may supply the attemptId (a UUID) so a retried claim can be recognised.
  if (d.attemptId !== undefined && !UUID_RE.test(String(d.attemptId))) return null;
  return { kind: d.kind, attemptId: d.attemptId === undefined ? "" : String(d.attemptId) };
}

function prepareMark_(d) {
  if ((d.kind !== "admin" && d.kind !== "thanks") ||
      (d.result !== "sent" && d.result !== "failed") ||
      !UUID_RE.test(String(d.attemptId || ""))) return null;
  return { kind: d.kind, result: d.result, attemptId: d.attemptId };
}

/* ---------- entry point ---------- */

function doPost(e) {
  var t0 = Date.now();
  var tr = makeTrace_(t0);          // FIRST statement: nothing else runs before the start log
  tr.log("LEADS_START");
  var action = "?";
  var tAcquired = 0;
  var outcome = "error";
  var dirty = false;
  var errText = "";
  try {
    var raw = (e && e.postData && e.postData.contents) || "";
    var bytes = Utilities.newBlob(raw).getBytes().length;
    if (bytes > MAX_BODY_BYTES) { outcome = "too_large"; return out_({ ok: false, error: "too_large" }); }

    var data;
    try { data = JSON.parse(raw); } catch (err) { outcome = "invalid"; return out_({ ok: false, error: "invalid" }); }
    if (!data || typeof data !== "object") { outcome = "invalid"; return out_({ ok: false, error: "invalid" }); }
    if (typeof data.reqId === "string" && REQID_RE.test(data.reqId)) tr.rid = data.reqId;
    if (typeof data.action === "string") tr.act = data.action.slice(0, 10);
    tr.log("REQUEST_READ", "bytes=" + bytes);

    var secret = PropertiesService.getScriptProperties().getProperty("LEADS_SECRET");
    if (!secret || !safeEqual_(data.secret, secret)) { outcome = "unauthorized"; return out_({ ok: false, error: "unauthorized" }); }
    tr.log("SECRET_OK");

    action = data.action;
    if (action !== "save" && action !== "claim" && action !== "mark") { outcome = "invalid"; return out_({ ok: false, error: "invalid" }); }
    if (data.reqId !== undefined && !REQID_RE.test(String(data.reqId))) { outcome = "invalid"; return out_({ ok: false, error: "invalid" }); }
    if (!fieldsAllowed_(data, action)) { outcome = "invalid"; return out_({ ok: false, error: "invalid" }); }
    if (!UUID_RE.test(String(data.leadId || ""))) { outcome = "invalid"; return out_({ ok: false, error: "invalid" }); }

    // Validate everything and open the spreadsheet BEFORE taking the lock.
    var prepared = action === "save" ? prepareSave_(data)
                 : action === "claim" ? prepareClaim_(data)
                 : prepareMark_(data);
    if (!prepared) { outcome = "invalid"; return out_({ ok: false, error: "invalid" }); }
    tr.log("VALIDATION_OK", "lead=" + String(data.leadId).slice(0, 8));

    var sh = sheet_();
    tr.log("SHEET_OPENED");

    var lock = LockService.getScriptLock();
    tr.log("LOCK_TRY");
    if (!lock.tryLock(LOCK_WAIT_MS)) {
      outcome = "busy";
      tr.log("LOCK_BUSY", "waitedMs=" + (Date.now() - t0));
      return out_({ ok: false, error: "busy" });
    }
    tAcquired = Date.now();
    tr.log("LOCK_ACQUIRED", "waitedMs=" + (tAcquired - t0));
    try {
      var ctx = { dirty: false, tr: tr };
      var result = action === "save" ? save_(sh, data.leadId, prepared, ctx)
                 : action === "claim" ? claim_(sh, data.leadId, prepared, ctx)
                 : mark_(sh, data.leadId, prepared, ctx);
      dirty = ctx.dirty;
      // One flush, only after a write, BEFORE releasing the lock: the next lock holder must see committed data.
      if (dirty) { SpreadsheetApp.flush(); tr.log("FLUSH_DONE"); }
      outcome = result.ok ? "ok" : String(result.error || "rejected");
      return out_(result);
    } catch (inner) {
      tr.failStep = tr.step; // remember where it failed, before the release lines overwrite tr.step
      throw inner;
    } finally {
      tr.log("LOCK_RELEASING", "heldMs=" + (Date.now() - tAcquired));
      lock.releaseLock();
      tr.log("LOCK_RELEASED");
    }
  } catch (err) {
    outcome = "server";
    errText = String(err && err.message).slice(0, 120);
    console.error("LEADS_SCRIPT_ERROR action=" + action + " sid=" + tr.sid + " rid=" + tr.rid + " step=" + (tr.failStep || tr.step) + " message=" + errText);
    return out_({ ok: false, error: "server" });
  } finally {
    tr.log("REQUEST_END", "res=" + outcome + " totalMs=" + (Date.now() - t0) +
           (tAcquired ? " heldMs=" + (Date.now() - tAcquired) : "") + " wrote=" + dirty + (errText ? " err=" + errText : ""));
  }
}

/* ---------- sheet helpers (called inside the lock) ---------- */

/** Opens the spreadsheet by the ID saved by setupSheet() in Script Properties. */
function sheet_() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID);
  if (!id) throw new Error("setupSheet has not been run");
  var sh = SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);
  if (!sh) throw new Error("missing sheet");
  return sh;
}

/** Finds the row of a lead with 2 Sheets calls (getLastRow + one getValues of column A). */
function findRow_(sh, leadId) {
  var last = sh.getLastRow();
  if (last < 2) return { row: 0, last: last };
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  var want = String(leadId).toLowerCase();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).toLowerCase() === want) return { row: i + 2, last: last };
  }
  return { row: 0, last: last };
}

/** One getValues for the whole 6-cell email-state block. */
function readState_(sh, row) {
  var v = sh.getRange(row, STATE_FIRST_COL, 1, STATE_WIDTH).getValues()[0];
  for (var i = 0; i < v.length; i++) v[i] = String(v[i] === null || v[i] === undefined ? "" : v[i]);
  return v;
}

/** One setValues for the whole block. */
function writeState_(sh, row, state) {
  sh.getRange(row, STATE_FIRST_COL, 1, STATE_WIDTH).setValues([state]);
}

/** Effective status WITHOUT writing: a stale Sending is reported as Unknown. */
function effectiveStatus_(state, kind) {
  var status = state[IDX[kind].status] || "Pending";
  if (status === "Sending") {
    var updated = Date.parse(state[IDX[kind].updated]);
    if (!updated || Date.now() - updated > STALE_MS) status = "Unknown";
  }
  return status;
}

/** Persists a stale Sending as Unknown (in memory; the caller writes the block once). Returns true if changed. */
function settleStale_(state, kind) {
  if (state[IDX[kind].status] === "Sending" && effectiveStatus_(state, kind) === "Unknown") {
    state[IDX[kind].status] = "Unknown";
    state[IDX[kind].updated] = nowIso_();
    state[IDX[kind].attempt] = "";
    return true;
  }
  return false;
}

/* ---------- actions ---------- */

/** Save: read-only if the lead already exists (duplicate), otherwise exactly one append. */
function save_(sh, leadId, row, ctx) {
  var f = findRow_(sh, leadId);
  ctx.tr.log("SHEET_READ_IDS", "found=" + (f.row ? "yes" : "no") + " lastRow=" + f.last);
  if (f.row) {
    var s = readState_(sh, f.row);
    ctx.tr.log("SHEET_READ_STATE");
    return { ok: true, duplicate: true, admin: effectiveStatus_(s, "admin"), thanks: effectiveStatus_(s, "thanks") };
  }

  var r = f.last + 1;
  if (r > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), ROW_GROW); // sheet full: grow it
  sh.getRange(r, 1, 1, HEADERS.length).setNumberFormat("@").setValues([row]);
  ctx.dirty = true;
  ctx.tr.log("SHEET_WRITE", "kind=append");
  return { ok: true, duplicate: false, admin: "Pending", thanks: "Pending" };
}

/**
 * Atomically claim the right to send one email. ONLY Pending can be claimed.
 * v3 replay rule: if the status is Sending (not stale) and the stored attempt is EXACTLY the attemptId
 * supplied by the caller, this call is a retry of a claim that already executed here (its answer was
 * lost on the way back). It is answered claimed:true, replay:true and writes nothing. Any other
 * attemptId is refused, and once the status is Sent / Failed / Unknown nothing can be claimed or replayed.
 */
function claim_(sh, leadId, p, ctx) {
  var f = findRow_(sh, leadId);
  ctx.tr.log("SHEET_READ_IDS", "found=" + (f.row ? "yes" : "no") + " lastRow=" + f.last);
  if (!f.row) return { ok: false, error: "not_found" };

  var state = readState_(sh, f.row);
  ctx.tr.log("SHEET_READ_STATE");
  var changed = settleStale_(state, p.kind);
  var cur = effectiveStatus_(state, p.kind);
  if (cur === "Sending" && p.attemptId && safeEqual_(p.attemptId, state[IDX[p.kind].attempt])) {
    ctx.tr.log("CLAIM_RESULT", "r=replay");
    return { ok: true, claimed: true, replay: true, attemptId: p.attemptId };
  }
  if (cur !== "Pending") {
    if (changed) { writeState_(sh, f.row, state); ctx.dirty = true; ctx.tr.log("SHEET_WRITE", "kind=settle-stale"); }
    ctx.tr.log("CLAIM_RESULT", "r=refused status=" + cur);
    return { ok: true, claimed: false, status: cur };
  }

  var attemptId = p.attemptId || Utilities.getUuid();
  state[IDX[p.kind].status] = "Sending";
  state[IDX[p.kind].updated] = nowIso_();
  state[IDX[p.kind].attempt] = attemptId;
  writeState_(sh, f.row, state);
  ctx.dirty = true;
  ctx.tr.log("SHEET_WRITE", "kind=claim");
  ctx.tr.log("CLAIM_RESULT", "r=claimed");
  return { ok: true, claimed: true, attemptId: attemptId };
}

/** Record the result of a claimed send. Only the holder of the valid attemptId can do it, once. */
function mark_(sh, leadId, p, ctx) {
  var f = findRow_(sh, leadId);
  ctx.tr.log("SHEET_READ_IDS", "found=" + (f.row ? "yes" : "no") + " lastRow=" + f.last);
  if (!f.row) return { ok: false, error: "not_found" };

  var state = readState_(sh, f.row);
  ctx.tr.log("SHEET_READ_STATE");
  var changed = settleStale_(state, p.kind);
  var status = effectiveStatus_(state, p.kind);
  var stored = state[IDX[p.kind].attempt];

  if (status !== "Sending" || !stored || !safeEqual_(p.attemptId, stored)) {
    // old/duplicate/late mark: never overwrite a newer attempt or an already-final status
    if (changed) { writeState_(sh, f.row, state); ctx.dirty = true; ctx.tr.log("SHEET_WRITE", "kind=settle-stale"); }
    return { ok: true, applied: false, status: status };
  }

  state[IDX[p.kind].status] = p.result === "sent" ? "Sent" : "Failed";
  state[IDX[p.kind].updated] = nowIso_();
  state[IDX[p.kind].attempt] = ""; // a mark can only apply once
  writeState_(sh, f.row, state);
  ctx.dirty = true;
  ctx.tr.log("SHEET_WRITE", "kind=mark");
  return { ok: true, applied: true };
}

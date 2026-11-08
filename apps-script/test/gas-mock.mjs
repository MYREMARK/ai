// Shared mock of the Google services for running apps-script/leads.gs locally in a Node vm.
// Local logic tests only: this is NOT a substitute for tests on the real Apps Script.
import fs from "fs";
import vm from "vm";
import crypto from "crypto";

const SRC = fs.readFileSync(new URL("../leads.gs", import.meta.url), "utf8");
export const SECRET = "mock-secret";
const COLS = 20;

export function makeEnv({ rows = 1000 } = {}) {
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

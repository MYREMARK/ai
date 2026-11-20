// Server-only client for the Google Apps Script Web App that stores leads in Google Sheets.
// URL and secret come from environment variables and are never exposed to the browser or logged.
import { randomUUID } from "crypto";
import https from "https";

type SheetResponse = {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
  claimed?: boolean;
  replay?: boolean;
  applied?: boolean;
  attemptId?: string;
  status?: string;
  admin?: string;
  thanks?: string;
};

export type EmailKind = "admin" | "thanks";

/**
 * Timeouts and budgets. Exported (mutable) only so the local tests can shorten them.
 *
 * Why these values (measured against the TEST Web App, not guessed):
 *  - POST -> 302: 1.0-2.7 s normally; when the script lock is busy the script answers "busy" after
 *    tryLock(5000), so the slowest LEGITIMATE answer is about 7.7 s. POST gets 8 s. The stalls we guard
 *    against never answer at all, so 8 s detects them early; the POST is then retried once (safe: save is
 *    idempotent by lead id, claim by attemptId, mark applies once).
 *  - GET of the redirect target: 0.1-0.5 s normally. 6 s for the first GET, then ONE more GET to the same
 *    address on a NEW connection with 3 s.
 *  - requestBudgetMs keeps the whole API request under maxDuration (60 s).
 *  - emailStartBudgetMs: no NEW email claim is started after this much time (the lead is already
 *    saved; the email stays Pending for manual handling instead of risking a cut-off function).
 */
export const tuning = {
  postTimeoutMs: 8000,
  getTimeoutMs: 6000,
  getRetryTimeoutMs: 3000,
  busyRetryDelayMs: 1200,
  errorRetryDelayMs: 300,
  requestBudgetMs: 52000,
  emailStartBudgetMs: 35000,
};

/** Timing of one HTTP round trip (offsets in ms from the start of that call). Same numbers as the LEADS_CALL log line. */
export type CallTiming = {
  reqId: string;
  attempt: number;
  startIso: string;
  postSent: number;
  r302?: number;
  status?: number;
  getSent?: number;
  getDone?: number;
  json?: number;
  totalMs: number;
  result: string;
};

/**
 * Per API request: a short id that appears in Vercel logs AND in the Apps Script LEADS_TRACE lines.
 * onCall (optional, observability only) receives the timing of every HTTP round trip; it never affects
 * the request and an error inside it is ignored.
 */
export type CallCtx = { rid: string; startedAt: number; onCall?: (t: CallTiming) => void };

export function newCallCtx(): CallCtx {
  return { rid: randomUUID().replace(/-/g, "").slice(0, 8), startedAt: Date.now() };
}

type Phase = "post" | "redirect" | "get" | "parse";

export class LeadsCallError extends Error {
  constructor(public code: string, public phase: Phase) {
    super(`LEADS_${code}_${phase.toUpperCase()}`);
    this.name = "LeadsCallError";
  }
}

type HopInit = { method: "POST" | "GET"; headers?: Record<string, string>; body?: string };
type HopResult = { status: number; location: string | null; text: string };
const MAX_BODY_BYTES = 256 * 1024;

/**
 * One HTTP hop over node:https with a NEW Agent({ keepAlive: false }): every request (and every GET after a
 * redirect) uses its own fresh TCP+TLS connection and is sent with "Connection: close". Pooled keep-alive
 * connections (Node's fetch) were the suspected cause of POSTs that never left the server. The timer covers
 * connecting, sending and reading the whole body. Redirects are NOT followed here (handled by the caller).
 */
function hopHttps(urlStr: string, init: HopInit, budgetMs: number, phase: Phase): Promise<HopResult> {
  return new Promise<HopResult>((resolve, reject) => {
    const u = new URL(urlStr);
    const agent = new https.Agent({ keepAlive: false });
    let settled = false;
    let timedOut = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      agent.destroy();
      fn();
    };
    const fail = () => finish(() => reject(new LeadsCallError(timedOut ? "TIMEOUT" : "NETWORK", phase)));
    const headers: Record<string, string> = { ...(init.headers ?? {}) };
    if (init.body !== undefined) headers["Content-Length"] = String(Buffer.byteLength(init.body));
    const req = https.request(
      { protocol: u.protocol, hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: init.method, headers, agent },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > MAX_BODY_BYTES) return req.destroy();
          chunks.push(c);
        });
        res.on("end", () =>
          finish(() =>
            resolve({
              status: res.statusCode ?? 0,
              location: typeof res.headers.location === "string" ? res.headers.location : null,
              text: Buffer.concat(chunks).toString("utf8"),
            })
          )
        );
        res.on("error", fail);
      }
    );
    req.on("error", fail);
    const timer = setTimeout(() => {
      timedOut = true;
      req.destroy();
    }, budgetMs);
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}

/** The transport is replaceable only so the local tests can inject a fake Google. */
export const transport = { hop: hopHttps };

type CallMeta = {
  reqId: string;
  action: string;
  kind: string;
  lead: string;
  attempt: number;
  onCall?: (t: CallTiming) => void;
};

/**
 * One round trip to the Web App: POST (executes the action), 302, GET of the Google redirect target
 * (serves the result). Redirects are handled manually because following them automatically hung
 * inside Next.js. Logs ONE line with the timing of every step; it never logs the secret, the body,
 * the redirect URL or personal data.
 */
async function callOnce(url: string, body: string, m: CallMeta, deadlineAt: number): Promise<SheetResponse> {
  const t0 = Date.now();
  const at: { r302?: number; status?: number; getSent?: number; getDone?: number; getRetry?: number; json?: number } = {};
  let result = "ok";
  const budget = (cap: number, phase: Phase) => {
    const b = Math.min(cap, deadlineAt - Date.now());
    if (b <= 0) throw new LeadsCallError("DEADLINE", phase);
    return b;
  };
  try {
    let r = await transport.hop(
      url,
      { method: "POST", headers: { "Content-Type": "application/json" }, body },
      budget(tuning.postTimeoutMs, "post"),
      "post"
    );
    at.r302 = Date.now() - t0;
    at.status = r.status;

    for (let hops = 0; hops < 3 && r.status >= 300 && r.status < 400; hops++) {
      if (!r.location || !/^https:\/\/(script|script\.googleusercontent)\.(google|googleusercontent)\.com\//.test(r.location)) {
        throw new LeadsCallError("BAD_REDIRECT", "redirect");
      }
      const location = r.location;
      const b = budget(tuning.getTimeoutMs, "get");
      at.getSent = Date.now() - t0;
      try {
        r = await transport.hop(location, { method: "GET" }, b, "get");
      } catch (e) {
        // The POST already executed and only the answer is missing: one more GET to the SAME address on a
        // new connection. Only for a timeout; the redirect address is read-only, so repeating it is harmless.
        if (!(e instanceof LeadsCallError && e.code === "TIMEOUT")) throw e;
        at.getRetry = 1;
        r = await transport.hop(location, { method: "GET" }, budget(tuning.getRetryTimeoutMs, "get"), "get");
      }
      at.getDone = Date.now() - t0;
    }

    let parsed: SheetResponse;
    try {
      parsed = JSON.parse(r.text) as SheetResponse;
    } catch {
      throw new LeadsCallError(`BAD_RESPONSE_${r.status}`, "parse");
    }
    at.json = Date.now() - t0;
    result = parsed.ok ? "ok" : `rejected_${parsed.error ?? "unknown"}`;
    return parsed;
  } catch (e) {
    result = e instanceof LeadsCallError ? `${e.code.toLowerCase()}_${e.phase}` : "unexpected";
    throw e;
  } finally {
    const f = (v: number | undefined) => (v === undefined ? "-" : String(v));
    console.log(
      `LEADS_CALL rid=${m.reqId} act=${m.action} kind=${m.kind} lead=${m.lead} try=${m.attempt}` +
        ` start=${new Date(t0).toISOString()} post_sent=0 r302=${f(at.r302)} status=${f(at.status)}` +
        ` get_sent=${f(at.getSent)} get_done=${f(at.getDone)} get_retry=${at.getRetry ?? 0} json=${f(at.json)}` +
        ` total_ms=${Date.now() - t0} result=${result}`
    );
    try {
      m.onCall?.({
        reqId: m.reqId,
        attempt: m.attempt,
        startIso: new Date(t0).toISOString(),
        postSent: 0,
        r302: at.r302,
        status: at.status,
        getSent: at.getSent,
        getDone: at.getDone,
        json: at.json,
        totalMs: Date.now() - t0,
        result,
      });
    } catch {
      /* observability must never affect a request */
    }
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Every call is safe to repeat with the SAME payload, so each is retried at most ONCE:
 *  - save: idempotent by lead id (an existing lead is answered "duplicate", nothing is appended again);
 *  - claim: carries a client-generated attemptId, so replaying it returns the claim we already hold;
 *  - mark: applies at most once for the matching attemptId.
 * Retried: script answers "busy" or a script "server" error, a POST/GET timeout, a network error, an
 * unreadable answer. Never retried: business rejections (bad data, unauthorized, not_found, ...), a bad
 * redirect, or a spent time budget. The retry keeps the same lead id / attemptId and gets a new reqId.
 */
async function call(payload: Record<string, unknown>, opts: { ctx: CallCtx; tag: string }): Promise<SheetResponse> {
  const url = process.env.LEADS_WEBAPP_URL;
  const secret = process.env.LEADS_WEBAPP_SECRET;
  if (!url || !secret) throw new Error("LEADS_ENV_MISSING");
  const deadlineAt = opts.ctx.startedAt + tuning.requestBudgetMs;
  const meta = {
    action: String(payload.action),
    kind: typeof payload.kind === "string" ? payload.kind : "-",
    lead: String(payload.leadId).slice(0, 8),
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    const reqId = `${opts.ctx.rid}-${opts.tag}${attempt}`;
    const body = JSON.stringify({ ...payload, secret, reqId });
    try {
      const r = await callOnce(url, body, { ...meta, reqId, attempt, onCall: opts.ctx.onCall }, deadlineAt);
      const retryable = r.error === "busy" || r.error === "server";
      if (r.ok || !retryable || attempt === 2) return r;
      await sleep(tuning.busyRetryDelayMs + Math.floor(Math.random() * 400));
    } catch (e) {
      const transient =
        e instanceof LeadsCallError && (e.code === "TIMEOUT" || e.code === "NETWORK" || e.code.startsWith("BAD_RESPONSE"));
      if (!transient || attempt === 2) throw e;
      await sleep(tuning.errorRetryDelayMs);
    }
  }
  throw new Error("LEADS_UNREACHABLE");
}

export type LeadInput = {
  leadId: string;
  fullName: string;
  email: string;
  phone: string;
  business: string;
  date: string;
  time: string;
  marketingConsent: boolean;
  consentDate: string;
  consentVersion: string;
};

export async function saveLead(lead: LeadInput, ctx: CallCtx) {
  const r = await call({ action: "save", ...lead }, { ctx, tag: "s" });
  if (!r.ok) throw new Error(`LEADS_SAVE_REJECTED_${r.error ?? "unknown"}`);
  return { duplicate: !!r.duplicate, admin: r.admin ?? "Pending", thanks: r.thanks ?? "Pending" };
}

export type ClaimResult = { claimed: boolean; replay: boolean; status?: string };

/**
 * Asks for the right to send one email, identified by a client-generated attemptId.
 * claimed:true means THIS attemptId holds the claim (either freshly, or because an earlier call with
 * the same attemptId already executed but its answer was lost: replay). Any other attemptId is refused
 * while the status is Sending, and nobody can claim once the status is Sent, Failed or Unknown.
 */
export async function claimEmail(
  leadId: string,
  kind: EmailKind,
  attemptId: string,
  ctx: CallCtx
): Promise<ClaimResult> {
  const r = await call(
    { action: "claim", leadId, kind, attemptId },
    { ctx, tag: kind === "admin" ? "ca" : "ct" }
  );
  if (!r.ok) throw new Error(`LEADS_CLAIM_REJECTED_${r.error ?? "unknown"}`);
  if (r.claimed) {
    // Never trust a claim that is not bound to the attemptId we sent (e.g. an older script version).
    if (r.attemptId !== attemptId) throw new Error("LEADS_CLAIM_ATTEMPT_MISMATCH");
    return { claimed: true, replay: !!r.replay };
  }
  return { claimed: false, replay: false, status: r.status };
}

export async function markEmail(
  leadId: string,
  kind: EmailKind,
  result: "sent" | "failed",
  attemptId: string,
  ctx: CallCtx
) {
  const r = await call(
    { action: "mark", leadId, kind, result, attemptId },
    { ctx, tag: kind === "admin" ? "ma" : "mt" }
  );
  if (!r.ok) throw new Error(`LEADS_MARK_REJECTED_${r.error ?? "unknown"}`);
  return !!r.applied;
}

// Server-only client for the Google Apps Script Web App that stores leads in Google Sheets.
// URL and secret come from environment variables and are never exposed to the browser or logged.
import { randomUUID } from "crypto";

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
 * Why these values (measured against the TEST Web App on 2026-11-08, not guessed):
 *  - POST -> 302: 974-2671 ms over 10 sequential requests; script execution 0.7-2.3 s.
 *    When the script lock is busy the script answers "busy" after tryLock(5000), so the slowest
 *    LEGITIMATE answer is about 5 s + 2.7 s = 7.7 s. An 8 s limit would cut that case off with
 *    only ~0.3 s margin, so POST gets 12 s.
 *  - GET of the redirect target: 191-542 ms. 6 s is >10x the slowest observed.
 *  - The stalls we are guarding against lasted 20 s or more, so 12 s still detects them early.
 *  - requestBudgetMs keeps the whole API request under maxDuration (60 s).
 *  - emailStartBudgetMs: no NEW email claim is started after this much time (the lead is already
 *    saved; the email stays Pending for manual handling instead of risking a cut-off function).
 */
export const tuning = {
  postTimeoutMs: 12000,
  getTimeoutMs: 6000,
  busyRetryDelayMs: 1200,
  errorRetryDelayMs: 300,
  requestBudgetMs: 52000,
  emailStartBudgetMs: 35000,
};

/** Per API request: a short id that appears in Vercel logs AND in the Apps Script LEADS_TRACE lines. */
export type CallCtx = { rid: string; startedAt: number };

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

/** One HTTP hop with its own timeout. The timer also covers reading the body. */
async function hop(url: string, init: RequestInit, budgetMs: number, phase: Phase) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      redirect: "manual",
    });
    const text = await res.text();
    return { status: res.status, location: res.headers.get("location"), text };
  } catch {
    throw new LeadsCallError(controller.signal.aborted ? "TIMEOUT" : "NETWORK", phase);
  } finally {
    clearTimeout(timer);
  }
}

type CallMeta = { reqId: string; action: string; kind: string; lead: string; attempt: number };

/**
 * One round trip to the Web App: POST (executes the action), 302, GET of the Google redirect target
 * (serves the result). Redirects are handled manually because following them automatically hung
 * inside Next.js. Logs ONE line with the timing of every step; it never logs the secret, the body,
 * the redirect URL or personal data.
 */
async function callOnce(url: string, body: string, m: CallMeta, deadlineAt: number): Promise<SheetResponse> {
  const t0 = Date.now();
  const at: { r302?: number; status?: number; getSent?: number; getDone?: number; json?: number } = {};
  let result = "ok";
  const budget = (cap: number, phase: Phase) => {
    const b = Math.min(cap, deadlineAt - Date.now());
    if (b <= 0) throw new LeadsCallError("DEADLINE", phase);
    return b;
  };
  try {
    let r = await hop(
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
      const b = budget(tuning.getTimeoutMs, "get");
      at.getSent = Date.now() - t0;
      r = await hop(r.location, { method: "GET" }, b, "get");
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
        ` get_sent=${f(at.getSent)} get_done=${f(at.getDone)} json=${f(at.json)}` +
        ` total_ms=${Date.now() - t0} result=${result}`
    );
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * "busy-only": retry ONCE, only if Apps Script answered "busy" (nothing was done). Timeouts and
 *   other errors are never retried, because the request may already have been executed.
 * "idempotent": retry ONCE on busy, a script "server" error, a timeout or a network error. Only for
 *   calls that are safe to repeat: claim carries a client-generated attemptId, so replaying it
 *   returns the claim we already hold instead of a refusal; mark applies at most once.
 * The retry always uses the SAME payload (same leadId / attemptId) and a new reqId for tracing.
 */
async function call(
  payload: Record<string, unknown>,
  opts: { ctx: CallCtx; tag: string; retry: "busy-only" | "idempotent" }
): Promise<SheetResponse> {
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
      const r = await callOnce(url, body, { ...meta, reqId, attempt }, deadlineAt);
      const retryable =
        r.error === "busy" || (opts.retry === "idempotent" && r.error === "server");
      if (r.ok || !retryable || attempt === 2) return r;
      await sleep(tuning.busyRetryDelayMs + Math.floor(Math.random() * 400));
    } catch (e) {
      const deadline = e instanceof LeadsCallError && e.code === "DEADLINE";
      if (opts.retry !== "idempotent" || attempt === 2 || deadline) throw e;
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
  const r = await call({ action: "save", ...lead }, { ctx, tag: "s", retry: "busy-only" });
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
    { ctx, tag: kind === "admin" ? "ca" : "ct", retry: "idempotent" }
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
    { ctx, tag: kind === "admin" ? "ma" : "mt", retry: "idempotent" }
  );
  if (!r.ok) throw new Error(`LEADS_MARK_REJECTED_${r.error ?? "unknown"}`);
  return !!r.applied;
}

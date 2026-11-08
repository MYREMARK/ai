// Server-only client for the Google Apps Script Web App that stores leads in Google Sheets.
// URL and secret come from environment variables and are never exposed to the browser or logged.

type SheetResponse = {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
  claimed?: boolean;
  applied?: boolean;
  attemptId?: string;
  status?: string;
  admin?: string;
  thanks?: string;
};

export type EmailKind = "admin" | "thanks";

const REQUEST_TIMEOUT_MS = 25000; // longer than Apps Script's lock wait (5s) + sheet work
const BUSY_RETRY_DELAY_MS = 1200;

/** One HTTP round trip to the Web App. Throws on network error/timeout/non-JSON. */
async function callOnce(url: string, body: string): Promise<SheetResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Apps Script answers POST with a 302 to script.googleusercontent.com. The POST has already
    // been executed at that point; the redirect only serves the result, so it is fetched with GET.
    // Redirects are handled manually because following them automatically hung inside Next.js.
    let res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: controller.signal,
      cache: "no-store",
      redirect: "manual",
    });
    for (let hops = 0; hops < 3 && res.status >= 300 && res.status < 400; hops++) {
      const location = res.headers.get("location");
      if (!location || !/^https:\/\/(script|script\.googleusercontent)\.(google|googleusercontent)\.com\//.test(location)) {
        throw new Error("LEADS_BAD_REDIRECT");
      }
      res = await fetch(location, { method: "GET", signal: controller.signal, cache: "no-store", redirect: "manual" });
    }
    const text = await res.text();
    try {
      return JSON.parse(text) as SheetResponse;
    } catch {
      throw new Error(`LEADS_BAD_RESPONSE_${res.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls the Web App. If (and only if) Apps Script answers "busy" (lock not acquired, nothing was
 * done), retries ONCE after a short delay with the SAME payload (same leadId). Timeouts and other
 * errors are never retried here, because the request may already have been executed.
 */
async function call(payload: Record<string, unknown>): Promise<SheetResponse> {
  const url = process.env.LEADS_WEBAPP_URL;
  const secret = process.env.LEADS_WEBAPP_SECRET;
  if (!url || !secret) throw new Error("LEADS_ENV_MISSING");
  const body = JSON.stringify({ ...payload, secret });

  const first = await callOnce(url, body);
  if (first.ok || first.error !== "busy") return first;

  await new Promise((r) => setTimeout(r, BUSY_RETRY_DELAY_MS + Math.floor(Math.random() * 400)));
  return callOnce(url, body);
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

export async function saveLead(lead: LeadInput) {
  const r = await call({ action: "save", ...lead });
  if (!r.ok) throw new Error(`LEADS_SAVE_REJECTED_${r.error ?? "unknown"}`);
  return { duplicate: !!r.duplicate, admin: r.admin ?? "Pending", thanks: r.thanks ?? "Pending" };
}

/** Returns an attemptId if this caller may send the email, otherwise null. */
export async function claimEmail(leadId: string, kind: EmailKind): Promise<string | null> {
  const r = await call({ action: "claim", leadId, kind });
  if (!r.ok) throw new Error(`LEADS_CLAIM_REJECTED_${r.error ?? "unknown"}`);
  return r.claimed && r.attemptId ? r.attemptId : null;
}

export async function markEmail(
  leadId: string,
  kind: EmailKind,
  result: "sent" | "failed",
  attemptId: string
) {
  const r = await call({ action: "mark", leadId, kind, result, attemptId });
  if (!r.ok) throw new Error(`LEADS_MARK_REJECTED_${r.error ?? "unknown"}`);
  return !!r.applied;
}

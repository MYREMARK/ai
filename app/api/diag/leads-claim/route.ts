// TEMPORARY diagnostic endpoint (Preview only). Remove before merging to main.
//
// Measures the Vercel -> Google Apps Script round trip using the SAME call path as the lead flow
// (lib/leads-sheet.ts call/callOnce/fetch). It sends N sequential "claim" requests for lead ids that have
// a valid format but do not exist, so the script answers not_found: nothing is created, no status is
// changed, nothing is written to the sheet and no email is sent.
//
// Protection: POST only; answers 404 outside a Preview deployment (including Production); requires the
// header x-diag-token = HMAC-SHA256(LEADS_WEBAPP_SECRET, "leads-diag-v1") in hex, compared in constant
// time. The raw secret is never sent or returned. No new environment variable is needed.
import { createHmac, timingSafeEqual } from "crypto";
import { diagClaimMissingLead, newCallCtx, type CallTiming } from "@/lib/leads-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_REQUESTS = 10;

function expectedToken(secret: string) {
  return createHmac("sha256", secret).update("leads-diag-v1").digest("hex");
}

function tokenOk(given: string | null, secret: string | undefined) {
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expectedToken(secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // Hidden unless this is a Preview deployment.
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });
  if (!tokenOk(req.headers.get("x-diag-token"), process.env.LEADS_WEBAPP_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const n = Math.max(1, Math.min(MAX_REQUESTS, Number(new URL(req.url).searchParams.get("n")) || MAX_REQUESTS));
  const rows: Array<Partial<CallTiming> & { i: number; outcome: string; attempts: number }> = [];
  const batch = newCallCtx();

  for (let i = 1; i <= n; i++) {
    const timings: CallTiming[] = [];
    // One context per request so each call gets its own reqId; startedAt is shared so the whole run
    // stays inside the same request budget as a real lead submission.
    const ctx = { ...newCallCtx(), startedAt: batch.startedAt, onCall: (t: CallTiming) => timings.push(t) };
    let outcome = "ok";
    try {
      const r = await diagClaimMissingLead(ctx, `d${i}x`); // awaited: the next request starts only after this one ends
      outcome = r.ok ? "unexpected_ok" : `answered_${r.error ?? "unknown"}`;
    } catch (e) {
      outcome = e instanceof Error ? e.message : "error";
    }
    const t = timings[timings.length - 1];
    rows.push({ i, outcome, attempts: timings.length, ...(t ?? {}) }); // t = the last (normally the only) attempt
  }

  return Response.json({ n, rid: batch.rid, startedAt: new Date(batch.startedAt).toISOString(), rows });
}

// TEMPORARY diagnostic endpoint (Preview only). Remove before merging to main.
//
// Experiment: does a GET of the Google redirect target succeed when it is simply repeated after a timeout?
// It sends N sequential "claim" requests for lead ids that have a valid format but do not exist, so the
// script answers not_found: nothing is created, no status is changed, nothing is written to the sheet and
// no email is sent.
//
// The requests use the same fetch options as lib/leads-sheet.ts (POST with redirect:"manual", then a GET of
// the Location with redirect:"manual", one AbortController per hop, POST/GET limits from `tuning`).
// Differences from the lead flow, on purpose: (1) when the FIRST GET times out, exactly ONE more GET is
// sent to the SAME Location with a 3 s limit; it is not sent when the first GET succeeded. (2) The POST is
// never retried. Each hop is timed separately.
//
// Protection: POST only; answers 404 outside a Preview deployment (including Production); requires the
// header x-diag-token = HMAC-SHA256(LEADS_WEBAPP_SECRET, "leads-diag-v1") in hex, compared in constant
// time. The raw secret is never sent or returned. No new environment variable is needed.
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { newCallCtx, tuning } from "@/lib/leads-sheet";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_REQUESTS = 10;
const RETRY_GET_TIMEOUT_MS = 3000;
const LOCATION_RE = /^https:\/\/(script|script\.googleusercontent)\.(google|googleusercontent)\.com\//;

function expectedToken(secret: string) {
  return createHmac("sha256", secret).update("leads-diag-v1").digest("hex");
}

function tokenOk(given: string | null, secret: string | undefined) {
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expectedToken(secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

class HopError extends Error {
  constructor(public kind: "timeout" | "network" | "deadline") {
    super(kind);
  }
}

/** One HTTP hop with its own timeout; the timer also covers reading the body (as in lib/leads-sheet.ts). */
async function hop(url: string, init: RequestInit, budgetMs: number) {
  if (budgetMs <= 0) throw new HopError("deadline");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budgetMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store", redirect: "manual" });
    const text = await res.text();
    return { status: res.status, location: res.headers.get("location"), text };
  } catch {
    throw new HopError(controller.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}

type Row = {
  i: number;
  reqId: string;
  startIso: string;
  postSent: 0;
  r302?: number;
  status?: number;
  get1Sent?: number;
  get1Result?: string; // ok | timeout | network | deadline
  get1Ms?: number; // time the first GET took (or the time at which it was cut)
  get2Sent?: number;
  get2Result?: string; // not_needed | ok | timeout | network | deadline
  get2Ms?: number;
  json?: number;
  totalMs: number;
  outcome: string;
};

export async function POST(req: Request) {
  // Hidden unless this is a Preview deployment.
  if (process.env.VERCEL_ENV !== "preview") return new Response("Not found", { status: 404 });
  if (!tokenOk(req.headers.get("x-diag-token"), process.env.LEADS_WEBAPP_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const url = process.env.LEADS_WEBAPP_URL;
  const secret = process.env.LEADS_WEBAPP_SECRET;
  if (!url || !secret) return new Response("Not configured", { status: 500 });

  const n = Math.max(1, Math.min(MAX_REQUESTS, Number(new URL(req.url).searchParams.get("n")) || MAX_REQUESTS));
  const batch = newCallCtx();
  const deadlineAt = batch.startedAt + tuning.requestBudgetMs;
  const remaining = () => deadlineAt - Date.now();
  const rows: Row[] = [];

  for (let i = 1; i <= n; i++) {
    // Strictly sequential: the next request starts only after this one has fully ended.
    const t0 = Date.now();
    const at = () => Date.now() - t0;
    const reqId = `${batch.rid}-g${i}x1`;
    const row: Row = { i, reqId, startIso: new Date(t0).toISOString(), postSent: 0, totalMs: 0, outcome: "ok" };
    try {
      const body = JSON.stringify({
        action: "claim",
        leadId: randomUUID(), // valid format, not in the sheet
        kind: "admin",
        attemptId: randomUUID(),
        secret,
        reqId,
      });
      const post = await hop(
        url,
        { method: "POST", headers: { "Content-Type": "application/json" }, body },
        Math.min(tuning.postTimeoutMs, remaining())
      );
      row.r302 = at();
      row.status = post.status;

      let res = post;
      if (post.status >= 300 && post.status < 400) {
        const location = post.location;
        if (!location || !LOCATION_RE.test(location)) throw new Error("BAD_REDIRECT");

        row.get1Sent = at();
        const g1Start = Date.now();
        try {
          res = await hop(location, { method: "GET" }, Math.min(tuning.getTimeoutMs, remaining()));
          row.get1Result = "ok";
          row.get1Ms = Date.now() - g1Start;
          row.get2Result = "not_needed"; // no retry when the first GET succeeded
        } catch (e) {
          row.get1Result = e instanceof HopError ? e.kind : "error";
          row.get1Ms = Date.now() - g1Start;
          if (row.get1Result !== "timeout") throw e; // only a timeout earns the single extra GET
          row.get2Sent = at();
          const g2Start = Date.now();
          try {
            // exactly one more GET, to the exact same Location, 3 s limit
            res = await hop(location, { method: "GET" }, Math.min(RETRY_GET_TIMEOUT_MS, remaining()));
            row.get2Result = "ok";
            row.get2Ms = Date.now() - g2Start;
          } catch (e2) {
            row.get2Result = e2 instanceof HopError ? e2.kind : "error";
            row.get2Ms = Date.now() - g2Start;
            throw e2;
          }
        }
      }

      const parsed = JSON.parse(res.text) as { ok?: boolean; error?: string };
      row.json = at();
      row.outcome = parsed.ok ? "unexpected_ok" : `answered_${parsed.error ?? "unknown"}`;
    } catch (e) {
      if (e instanceof HopError) {
        const phase = row.r302 === undefined ? "post" : row.get2Result && row.get2Result !== "not_needed" ? "get2" : "get1";
        row.outcome = `${e.kind}_${phase}`;
      } else {
        row.outcome = e instanceof Error ? `error_${e.message.slice(0, 40)}` : "error";
      }
    }
    row.totalMs = at();
    rows.push(row);
    console.log(
      `LEADS_DIAG rid=${reqId} start=${row.startIso} r302=${row.r302 ?? "-"} status=${row.status ?? "-"}` +
        ` get1_sent=${row.get1Sent ?? "-"} get1=${row.get1Result ?? "-"}@${row.get1Ms ?? "-"}` +
        ` get2_sent=${row.get2Sent ?? "-"} get2=${row.get2Result ?? "-"}@${row.get2Ms ?? "-"}` +
        ` json=${row.json ?? "-"} total_ms=${row.totalMs} outcome=${row.outcome}`
    );
  }

  return Response.json({ n, rid: batch.rid, startedAt: new Date(batch.startedAt).toISOString(), rows });
}

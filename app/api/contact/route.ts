import { randomUUID } from "crypto";
import {
  claimEmail,
  markEmail,
  newCallCtx,
  saveLead,
  tuning,
  type CallCtx,
  type EmailKind,
} from "@/lib/leads-sheet";
import { sendAdminNotification, sendSaveFailureAlert, sendThankYou } from "@/lib/lead-mail";

export const runtime = "nodejs";
export const maxDuration = 60;

const CONSENT_VERSION = "v1";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-() ]{5,30}$/;

function israelNow() {
  // "YYYY-MM-DD HH:mm:ss" in Israel time
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jerusalem",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());
  const [date, time] = s.split(" ");
  return { date, time, dateTime: s };
}

function clean(v: unknown, max: number) {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

/**
 * Claim -> send -> mark. Never sends if the status is not Pending. Never auto-retries Failed/Unknown.
 *
 * The attemptId is generated HERE, once per send attempt of THIS request, and is reused only when the
 * same claim call is retried after a timeout (so a claim that reached Google but whose answer was lost
 * is recognised as ours). It is never derived from the lead and never shared between requests: a second
 * request for the same lead (e.g. the visitor pressing submit again) gets a different attemptId and is
 * refused while the first one holds the claim.
 */
async function sendOnce(leadId: string, kind: EmailKind, send: () => Promise<void>, ctx: CallCtx) {
  const tag = `rid=${ctx.rid} lead=${leadId.slice(0, 8)} kind=${kind}`;
  if (Date.now() - ctx.startedAt > tuning.emailStartBudgetMs) {
    // Out of time: do not start a new claim. The lead is saved and the email stays Pending (manual).
    console.error(`LEADS_API ${tag} step=EMAIL_SKIPPED_BUDGET elapsed_ms=${Date.now() - ctx.startedAt}`);
    return;
  }

  const attemptId = randomUUID();
  const t0 = Date.now();
  let claim;
  try {
    claim = await claimEmail(leadId, kind, attemptId, ctx);
  } catch (e) {
    console.error("EMAIL_CLAIM_ERROR", kind, e instanceof Error ? e.message : "unknown");
    console.error(`LEADS_API ${tag} step=CLAIM_FAILED ms=${Date.now() - t0}`);
    return; // cannot guarantee no duplicates, so do not send; status stays visible in the sheet
  }
  if (!claim.claimed) {
    console.log(`LEADS_API ${tag} step=NOT_CLAIMED status=${claim.status ?? "-"} ms=${Date.now() - t0}`);
    return; // already Sent / Sending (another request) / Failed / Unknown
  }
  console.log(`LEADS_API ${tag} step=CLAIMED replay=${claim.replay} ms=${Date.now() - t0}`);

  let result: "sent" | "failed" = "sent";
  try {
    await send();
  } catch (e) {
    result = "failed";
    console.error("EMAIL_SEND_ERROR", kind, e instanceof Error ? e.message : "unknown");
  }
  try {
    const applied = await markEmail(leadId, kind, result, attemptId, ctx);
    console.log(`LEADS_API ${tag} step=MARKED result=${result} applied=${applied}`);
  } catch (e) {
    console.error("EMAIL_MARK_ERROR", kind, e instanceof Error ? e.message : "unknown");
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) ?? {};
  } catch {
    return Response.json({ success: false, message: "נא למלא את כל השדות" }, { status: 400 });
  }

  const fullName = clean(body.fullName, 100);
  const phone = clean(body.phone, 30);
  const email = clean(body.email, 120);
  const business = clean(body.business, 150);
  const marketingConsent = body.marketingConsent === true;
  const leadId =
    typeof body.leadId === "string" && UUID_RE.test(body.leadId) ? body.leadId : randomUUID();

  if (!fullName || !phone || !email || !EMAIL_RE.test(email) || !PHONE_RE.test(phone)) {
    return Response.json({ success: false, message: "נא למלא את כל השדות" }, { status: 400 });
  }

  const now = israelNow();
  const lead = { fullName, phone, email, business, marketingConsent };
  const ctx = newCallCtx(); // rid links Vercel logs to LEADS_TRACE lines in Apps Script
  console.log(`LEADS_API rid=${ctx.rid} lead=${leadId.slice(0, 8)} step=API_START`);

  // 1. Save to Google Sheets. No success is shown unless this succeeds.
  try {
    await saveLead(
      {
        leadId,
        ...lead,
        date: now.date,
        time: now.time,
        consentDate: marketingConsent ? now.dateTime : "",
        consentVersion: marketingConsent ? CONSENT_VERSION : "",
      },
      ctx
    );
    console.log(`LEADS_API rid=${ctx.rid} lead=${leadId.slice(0, 8)} step=SAVED elapsed_ms=${Date.now() - ctx.startedAt}`);
  } catch (e) {
    console.error("LEAD_SAVE_ERROR", e instanceof Error ? e.message : "unknown");
    try {
      await sendSaveFailureAlert(lead, leadId); // keeps the inquiry from being lost
    } catch (mailErr) {
      console.error("LEAD_ALERT_ERROR", mailErr instanceof Error ? mailErr.message : "unknown");
    }
    return Response.json(
      { success: false, message: "אירעה שגיאה בשליחת הטופס" },
      { status: 500 }
    );
  }

  // 2. Emails (independent claim/mark per email). A failure here never removes the lead.
  // Run in sequence (not in parallel) so the two claim calls never compete for the same lock.
  await sendOnce(leadId, "admin", () => sendAdminNotification(lead), ctx);
  await sendOnce(leadId, "thanks", () => sendThankYou({ fullName, email }), ctx);

  console.log(`LEADS_API rid=${ctx.rid} lead=${leadId.slice(0, 8)} step=API_END total_ms=${Date.now() - ctx.startedAt}`);
  return Response.json({ success: true });
}

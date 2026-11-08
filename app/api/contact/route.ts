import { randomUUID } from "crypto";
import { claimEmail, markEmail, saveLead, type EmailKind } from "@/lib/leads-sheet";
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

/** Claim -> send -> mark. Never sends if the status is not Pending. Never auto-retries Failed/Unknown. */
async function sendOnce(leadId: string, kind: EmailKind, send: () => Promise<void>) {
  let attemptId: string | null = null;
  try {
    attemptId = await claimEmail(leadId, kind);
  } catch (e) {
    console.error("EMAIL_CLAIM_ERROR", kind, e instanceof Error ? e.message : "unknown");
    return; // cannot guarantee no duplicates, so do not send; status stays visible in the sheet
  }
  if (!attemptId) return; // already Sent / Sending / Failed / Unknown

  let result: "sent" | "failed" = "sent";
  try {
    await send();
  } catch (e) {
    result = "failed";
    console.error("EMAIL_SEND_ERROR", kind, e instanceof Error ? e.message : "unknown");
  }
  try {
    await markEmail(leadId, kind, result, attemptId);
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

  // 1. Save to Google Sheets. No success is shown unless this succeeds.
  try {
    await saveLead({
      leadId,
      ...lead,
      date: now.date,
      time: now.time,
      consentDate: marketingConsent ? now.dateTime : "",
      consentVersion: marketingConsent ? CONSENT_VERSION : "",
    });
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
  await sendOnce(leadId, "admin", () => sendAdminNotification(lead));
  await sendOnce(leadId, "thanks", () => sendThankYou({ fullName, email }));

  return Response.json({ success: true });
}

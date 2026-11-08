import nodemailer from "nodemailer";

/**
 * TEST LOCK (server side): unless this is the Production deployment AND LEADS_LIVE_MODE=true,
 * every email (admin alerts and thank-you mails) goes ONLY to TEST_RECIPIENT,
 * regardless of the address typed in the form.
 */
const TEST_RECIPIENT = "icxmark@gmail.com";

export function isLiveMode() {
  return process.env.VERCEL_ENV === "production" && process.env.LEADS_LIVE_MODE === "true";
}

function recipient(intended: string | undefined) {
  return isLiveMode() && intended ? intended : TEST_RECIPIENT;
}

function subjectFor(subject: string) {
  return isLiveMode() ? subject : `[TEST] ${subject}`;
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** In test mode only: log who the SMTP server actually accepted, to prove the recipient lock. */
function audit(kind: string, info: { accepted?: unknown[] }) {
  if (!isLiveMode()) console.log("MAIL_AUDIT", kind, "accepted:", JSON.stringify(info.accepted ?? []));
}

export function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Lead = { fullName: string; phone: string; email: string; business: string; marketingConsent: boolean };

export async function sendAdminNotification(lead: Lead) {
  const info = await transporter().sendMail({
    from: `"Mark AI Landing" <${process.env.SMTP_USER}>`,
    to: recipient(process.env.MAIL_TO),
    subject: subjectFor("ליד חדש מהעמוד 🥳"),
    replyTo: lead.email,
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>ליד חדש מהעמוד</h2>
        <p><strong>שם מלא:</strong> ${esc(lead.fullName)}</p>
        <p><strong>טלפון:</strong> ${esc(lead.phone)}</p>
        <p><strong>אימייל:</strong> ${esc(lead.email)}</p>
        <p><strong>תחום העסק:</strong> ${esc(lead.business || "לא צוין")}</p>
        <p><strong>הסכמה לדיוור:</strong> ${lead.marketingConsent ? "כן" : "לא"}</p>
      </div>`,
  });
  audit("admin", info);
}

/** Sent when the lead could NOT be saved to the sheet, so that the inquiry is never lost. */
export async function sendSaveFailureAlert(lead: Lead, leadId: string) {
  const info = await transporter().sendMail({
    from: `"Mark AI Landing" <${process.env.SMTP_USER}>`,
    to: recipient(process.env.MAIL_TO),
    subject: subjectFor("⚠️ ליד לא נשמר בגיליון"),
    replyTo: lead.email,
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
        <h2>הליד לא נשמר ב-Google Sheets</h2>
        <p>הפונה ראה הודעת שגיאה ויתכן שינסה שוב. הפרטים להלן כדי שלא יאבדו:</p>
        <p><strong>שם מלא:</strong> ${esc(lead.fullName)}</p>
        <p><strong>טלפון:</strong> ${esc(lead.phone)}</p>
        <p><strong>אימייל:</strong> ${esc(lead.email)}</p>
        <p><strong>תחום העסק:</strong> ${esc(lead.business || "לא צוין")}</p>
        <p><strong>הסכמה לדיוור:</strong> ${lead.marketingConsent ? "כן" : "לא"}</p>
        <p style="color:#666;font-size:12px">Lead ID: ${esc(leadId)}</p>
      </div>`,
  });
  audit("save-failure-alert", info);
}

export async function sendThankYou(lead: { fullName: string; email: string }) {
  const firstName = lead.fullName.trim().split(/\s+/)[0] || lead.fullName;
  const name = esc(firstName);
  const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>קיבלתי את הפנייה שלך, תודה!</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;">
      <tr><td style="background:#020617;padding:22px 28px;text-align:right;font-family:Arial,Helvetica,sans-serif;">
        <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">ReMark</span>
        <span style="font-size:20px;font-weight:700;color:#67e8f9;"> AI</span>
      </td></tr>
      <tr><td style="height:3px;background:#22d3ee;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td dir="rtl" style="padding:30px 28px 8px;text-align:right;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:17px;line-height:1.75;">
        <p style="margin:0 0 14px;font-size:20px;font-weight:700;">היי ${name},</p>
        <p style="margin:0 0 14px;">תודה שפנית אליי!</p>
        <p style="margin:0 0 14px;">קיבלתי את הפרטים שלך ואחזור אליך בהקדם כדי להבין מה העסק שלך צריך ואיך אפשר להפוך את ה AI לכלי עבודה שיעזור לך באמת.</p>
      </td></tr>
      <tr><td dir="rtl" style="padding:6px 28px 8px;text-align:right;font-family:Arial,Helvetica,sans-serif;">
        <div style="background:#f0f9ff;border-right:4px solid #22d3ee;border-radius:10px;padding:16px 18px;color:#0f172a;font-size:16px;line-height:1.75;">
          <p style="margin:0 0 8px;font-weight:700;">בינתיים, טיפ קטן ממני:</p>
          <p style="margin:0 0 8px;font-weight:700;">אל תבקשו מ AI רק לבצע משימה. תנו לו להבין את העסק שלכם.</p>
          <p style="margin:0 0 8px;">במקום לכתוב לו "תכתוב לי פוסט", ספרו לו מי קהל היעד שלכם, מה אתם מוכרים, מה מייחד אתכם ואיזה מסר אתם רוצים להעביר.</p>
          <p style="margin:0;">ככל שה AI יבין טוב יותר את העסק, כך התוצאות יהיו רלוונטיות ומדויקות יותר.</p>
        </div>
      </td></tr>
      <tr><td dir="rtl" style="padding:18px 28px 30px;text-align:right;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:17px;line-height:1.75;">
        <p style="margin:0 0 14px;">נתראה בקרוב!</p>
        <p style="margin:0;font-weight:700;">מארק זוסמנוביץ</p>
        <p style="margin:0;color:#475569;">ReMark AI</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = `היי ${firstName},

תודה שפנית אליי!
קיבלתי את הפרטים שלך ואחזור אליך בהקדם כדי להבין מה העסק שלך צריך ואיך אפשר להפוך את ה AI לכלי עבודה שיעזור לך באמת.

בינתיים, טיפ קטן ממני:
אל תבקשו מ AI רק לבצע משימה. תנו לו להבין את העסק שלכם.
במקום לכתוב לו "תכתוב לי פוסט", ספרו לו מי קהל היעד שלכם, מה אתם מוכרים, מה מייחד אתכם ואיזה מסר אתם רוצים להעביר.
ככל שה AI יבין טוב יותר את העסק, כך התוצאות יהיו רלוונטיות ומדויקות יותר.

נתראה בקרוב!
מארק זוסמנוביץ
ReMark AI`;

  const info = await transporter().sendMail({
    from: `"מארק זוסמנוביץ | ReMark AI" <${process.env.SMTP_USER}>`,
    to: recipient(lead.email),
    replyTo: process.env.MAIL_TO,
    subject: subjectFor("קיבלתי את הפנייה שלך, תודה!"),
    html,
    text,
  });
  audit("thanks", info);
}

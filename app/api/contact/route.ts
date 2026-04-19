import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, phone, email, business } = body ?? {};

    if (!fullName || !phone || !email) {
      return Response.json(
        { success: false, message: "נא למלא את כל השדות" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Mark AI Landing" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO,
      subject: "ליד חדש מהעמוד 🥳",
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
          <h2>ליד חדש מהעמוד</h2>
          <p><strong>שם מלא:</strong> ${fullName}</p>
          <p><strong>טלפון:</strong> ${phone}</p>
          <p><strong>אימייל:</strong> ${email}</p>
          <p><strong>תחום העסק:</strong> ${business || "לא צוין"}</p>        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("MAIL_ERROR", error);

    return Response.json(
      { success: false, message: "אירעה שגיאה בשליחת הטופס" },
      { status: 500 }
    );
  }
}
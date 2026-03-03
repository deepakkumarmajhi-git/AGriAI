export const runtime = "nodejs";

import { sendEmail } from "@/lib/mailer";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !subject || !message) {
      return Response.json({ error: "name, email, subject and message are required" }, { status: 400 });
    }
    if (!isEmail(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const adminEmail = process.env.CONTACT_ADMIN_EMAIL || process.env.ALERT_EMAIL_FROM;
    if (!adminEmail) {
      return Response.json({ error: "Missing CONTACT_ADMIN_EMAIL or ALERT_EMAIL_FROM in environment" }, { status: 500 });
    }

    const lines = [
      "New contact message from SmartAgri",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "N/A"}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ];

    await sendEmail({
      to: adminEmail,
      subject: `[SmartAgri Contact] ${subject}`,
      text: lines.join("\n"),
    });

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Contact API failed" }, { status: 500 });
  }
}

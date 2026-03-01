import nodemailer from "nodemailer";

const FROM = process.env.ALERT_EMAIL_FROM as string;
const APP_PASSWORD = process.env.ALERT_EMAIL_APP_PASSWORD as string;

export function assertMailerEnv() {
  if (!FROM) throw new Error("Missing ALERT_EMAIL_FROM in .env.local");
  if (!APP_PASSWORD) throw new Error("Missing ALERT_EMAIL_APP_PASSWORD in .env.local");
}

export function getTransporter() {
  assertMailerEnv();

  // Gmail SMTP (App Password)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: FROM,
      pass: APP_PASSWORD,
    },
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const transporter = getTransporter();
  const from = FROM;

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
import nodemailer from "nodemailer";

export function assertMailerEnv() {
  const from = process.env.ALERT_EMAIL_FROM?.trim();
  const appPassword = process.env.ALERT_EMAIL_APP_PASSWORD?.trim();

  if (!from) throw new Error("Missing ALERT_EMAIL_FROM in the server environment");
  if (!appPassword) throw new Error("Missing ALERT_EMAIL_APP_PASSWORD in the server environment");

  return { from, appPassword };
}

export function getTransporter() {
  const { from, appPassword } = assertMailerEnv();

  // Gmail SMTP (App Password)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: from,
      pass: appPassword,
    },
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const { from } = assertMailerEnv();
  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

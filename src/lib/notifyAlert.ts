import { Alert } from "@/models/Alert";
import { User } from "@/models/User";
import { sendEmail } from "@/lib/mailer";

function buildEmail(alert: any, user: any) {
  const subject = `SmartAgri Alert: ${alert.title}`;

  const text =
    `Hello ${user.name || "Farmer"},\n\n` +
    `You have a new alert in SmartAgri:\n\n` +
    `Level: ${String(alert.level).toUpperCase()}\n` +
    `Title: ${alert.title}\n` +
    `Message: ${alert.message}\n\n` +
    `Open your dashboard to view details.\n\n` +
    `— SmartAgri MVP`;

  const html =
    `<div style="font-family:Arial,sans-serif;line-height:1.5;">` +
    `<h2>SmartAgri Alert</h2>` +
    `<p>Hello <b>${user.name || "Farmer"}</b>,</p>` +
    `<p>You have a new alert:</p>` +
    `<ul>` +
    `<li><b>Level:</b> ${String(alert.level).toUpperCase()}</li>` +
    `<li><b>Title:</b> ${alert.title}</li>` +
    `<li><b>Message:</b> ${alert.message}</li>` +
    `</ul>` +
    `<p>Open your dashboard to view details.</p>` +
    `<p style="color:#666;">— SmartAgri MVP</p>` +
    `</div>`;

  return { subject, text, html };
}

// Call this AFTER you create an alert
export async function notifyAlertById(alertId: string) {
  const alert = await Alert.findById(alertId).lean();
  if (!alert) return;

  // Do not send again
  if ((alert as any).notifyEmailSent) return;

  const user = await User.findById((alert as any).userId).lean();
  if (!user || !(user as any).email) return;

  const { subject, text, html } = buildEmail(alert, user);

  try {
    // Send to user email
    await sendEmail({
      to: (user as any).email,
      subject,
      text,
      html,
    });

    // Optional: also send copy to yourself for demo
    if (process.env.ALERT_EMAIL_TO_SELF === "true" && process.env.ALERT_EMAIL_FROM) {
      await sendEmail({
        to: process.env.ALERT_EMAIL_FROM,
        subject: `[COPY] ${subject}`,
        text,
        html,
      });
    }

    await Alert.findByIdAndUpdate(
      alertId,
      {
        $set: {
          notifyEmailSent: true,
          notifyEmailSentAt: new Date(),
          notifyEmailError: "",
        },
      },
      { returnDocument: "after" }
    );
  } catch (err: any) {
    await Alert.findByIdAndUpdate(alertId, {
      $set: {
        notifyEmailSent: false,
        notifyEmailSentAt: null,
        notifyEmailError: err?.message || String(err),
      },
    });
  }
}
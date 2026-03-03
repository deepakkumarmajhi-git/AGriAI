import { sendEmail } from "@/lib/mailer";
import { isSmsConfigured, sendSMS } from "@/lib/sms";
import { Alert } from "@/models/Alert";
import { User } from "@/models/User";

function buildEmail(alert: any, user: any) {
  const subject = `SmartAgri Alert: ${alert.title}`;
  const text =
    `Hello ${user.name || "Farmer"},\n\n` +
    `You have a new alert in SmartAgri:\n\n` +
    `Level: ${String(alert.level).toUpperCase()}\n` +
    `Title: ${alert.title}\n` +
    `Message: ${alert.message}\n\n` +
    `Open your dashboard to view details.\n\n` +
    `- SmartAgri MVP`;

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
    `<p style="color:#666;">- SmartAgri MVP</p>` +
    `</div>`;

  return { subject, text, html };
}

function buildSmsBody(alert: any, user: any) {
  return (
    `SmartAgri Alert for ${user.name || "Farmer"}\n` +
    `Level: ${String(alert.level).toUpperCase()}\n` +
    `Title: ${alert.title}\n` +
    `Message: ${alert.message}\n` +
    `Open dashboard for details.`
  );
}

// Call this AFTER you create an alert
export async function notifyAlertById(alertId: string) {
  const alert = await Alert.findById(alertId).lean();
  if (!alert) return;

  // Stop only when both channels are already marked delivered.
  if ((alert as any).notifyEmailSent && (alert as any).notifySmsSent) return;

  const user = await User.findById((alert as any).userId).lean();
  if (!user) return;

  let emailSent = Boolean((alert as any).notifyEmailSent);
  let smsSent = Boolean((alert as any).notifySmsSent);
  let emailErr = "";
  let smsErr = "";

  if (!emailSent && (user as any).email) {
    const { subject, text, html } = buildEmail(alert, user);

    try {
      await sendEmail({
        to: (user as any).email,
        subject,
        text,
        html,
      });

      if (process.env.ALERT_EMAIL_TO_SELF === "true" && process.env.ALERT_EMAIL_FROM) {
        await sendEmail({
          to: process.env.ALERT_EMAIL_FROM,
          subject: `[COPY] ${subject}`,
          text,
          html,
        });
      }

      emailSent = true;
    } catch (err: any) {
      emailErr = err?.message || String(err);
    }
  }

  if (!smsSent) {
    const phone = String((user as any).phone || "").trim();
    const canSendSms = Boolean(phone) && isSmsConfigured();

    if (canSendSms) {
      try {
        await sendSMS({
          to: phone,
          body: buildSmsBody(alert, user),
        });
        smsSent = true;
      } catch (err: any) {
        smsErr = err?.message || String(err);
      }
    } else if (!phone) {
      smsErr = "User phone not available";
    } else {
      smsErr = "SMS service not configured";
    }
  }

  await Alert.findByIdAndUpdate(alertId, {
    $set: {
      notifyEmailSent: emailSent,
      notifyEmailSentAt: emailSent ? (alert as any).notifyEmailSentAt || new Date() : null,
      notifyEmailError: emailErr,
      notifySmsSent: smsSent,
      notifySmsSentAt: smsSent ? (alert as any).notifySmsSentAt || new Date() : null,
      notifySmsError: smsErr,
    },
  });
}

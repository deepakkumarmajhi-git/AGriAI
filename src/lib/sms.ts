const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || "";

export function isSmsConfigured() {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
}

export function assertSmsEnv() {
  if (!TWILIO_ACCOUNT_SID) throw new Error("Missing TWILIO_ACCOUNT_SID in environment");
  if (!TWILIO_AUTH_TOKEN) throw new Error("Missing TWILIO_AUTH_TOKEN in environment");
  if (!TWILIO_FROM_NUMBER) throw new Error("Missing TWILIO_FROM_NUMBER in environment");
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  return `+${trimmed.replace(/\s+/g, "")}`;
}

export async function sendSMS(opts: { to: string; body: string }) {
  assertSmsEnv();

  const to = normalizePhone(opts.to);
  if (!to) throw new Error("Missing destination phone number");

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("From", TWILIO_FROM_NUMBER);
  form.set("Body", opts.body);

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twilio SMS failed (${res.status}): ${body}`);
  }
}

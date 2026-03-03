export const runtime = "nodejs";

const DEFAULT_TTS_URL = "https://api.sarvam.ai/text-to-speech";
const DEFAULT_TTS_MODEL = "bulbul:v3";
const DEFAULT_TTS_SPEAKER = "shubh";

function sanitizeForVoice(input: string) {
  return input
    .replace(/\((\/[^)\s]+)\)/g, "") // remove parenthesized paths like "(/weather)"
    .replace(/(^|\s)\/[a-z0-9/_-]+/gi, " ") // remove stray route/path tokens
    .replace(/[|`*_#[\]{}<>]/g, " ") // remove markup-like symbols
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const key = process.env.SARVAM_API_KEY;
    if (!key) {
      return Response.json({ error: "Missing SARVAM_API_KEY" }, { status: 500 });
    }

    const body = await req.json();
    const text = String(body?.text || "").trim();
    const voiceText = sanitizeForVoice(text);
    const targetLanguageCode = String(body?.target_language_code || "en-IN");
    const model = DEFAULT_TTS_MODEL;
    const speaker = DEFAULT_TTS_SPEAKER;

    if (!voiceText) {
      return Response.json({ error: "text is required" }, { status: 400 });
    }

    const endpoint = process.env.SARVAM_TTS_URL || DEFAULT_TTS_URL;
    const payload: Record<string, unknown> = {
      text: voiceText,
      target_language_code: targetLanguageCode,
      model,
    };
    payload.speaker = speaker;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": key,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json(
        {
          error: "Sarvam text-to-speech failed",
          status: res.status,
          details: data?.error || data,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    const audioBase64 =
      typeof data?.audios?.[0] === "string"
        ? data.audios[0]
        : typeof data?.audio === "string"
        ? data.audio
        : "";

    if (!audioBase64) {
      return Response.json({ error: "No audio returned by Sarvam" }, { status: 502 });
    }

    return Response.json({
      ok: true,
      audioBase64,
      mimeType: "audio/wav",
      provider: "sarvam-tts",
    });
  } catch {
    return Response.json({ error: "Speech synthesis failed" }, { status: 500 });
  }
}

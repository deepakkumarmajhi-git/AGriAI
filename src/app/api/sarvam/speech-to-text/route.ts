export const runtime = "nodejs";

const DEFAULT_STT_URL = "https://api.sarvam.ai/speech-to-text";

export async function POST(req: Request) {
  try {
    const key = process.env.SARVAM_API_KEY;
    if (!key) {
      return Response.json({ error: "Missing SARVAM_API_KEY" }, { status: 500 });
    }

    const inForm = await req.formData();
    const file = inForm.get("file");
    const languageCode = String(inForm.get("language_code") || "unknown");
    const mode = String(inForm.get("mode") || "transcribe");
    const model = String(inForm.get("model") || process.env.SARVAM_STT_MODEL || "saaras:v3");

    if (!(file instanceof Blob)) {
      return Response.json({ error: "Audio file is required" }, { status: 400 });
    }

    const outForm = new FormData();
    outForm.append("file", file, "voice.webm");
    outForm.append("model", model);
    outForm.append("mode", mode);
    outForm.append("language_code", languageCode);

    const endpoint = process.env.SARVAM_STT_URL || DEFAULT_STT_URL;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "api-subscription-key": key,
      },
      body: outForm,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json(
        {
          error: "Sarvam speech-to-text failed",
          status: res.status,
          details: data?.error || data,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
      );
    }

    const transcript = typeof data?.transcript === "string" ? data.transcript.trim() : "";
    const detectedLanguageCode = typeof data?.language_code === "string" ? data.language_code : null;

    return Response.json({
      ok: true,
      transcript,
      languageCode: detectedLanguageCode,
      provider: "sarvam-stt",
    });
  } catch {
    return Response.json({ error: "Speech transcription failed" }, { status: 500 });
  }
}

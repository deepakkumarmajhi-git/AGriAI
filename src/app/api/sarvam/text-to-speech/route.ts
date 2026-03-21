export const runtime = "nodejs";

import knowledgeBaseJson from "@/data/sarvamKnowledgeBase.json";

const DEFAULT_TTS_URL = "https://api.sarvam.ai/text-to-speech";
const DEFAULT_TTS_MODEL = "bulbul:v3";
const DEFAULT_TTS_SPEAKER = "shubh";
const MAX_TTS_TEXT_CHARS = 2400;

type SiteSection = { title: string; path: string; purpose: string; keywords: string[] };

const SITE_SECTIONS = (knowledgeBaseJson.siteSections || []) as SiteSection[];

function formatPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function pathToSpeakablePage(pathToken: string) {
  const normalized = formatPath(pathToken.replace(/[()]/g, ""));
  const section = SITE_SECTIONS.find(
    (item) => formatPath(item.path).toLowerCase() === normalized.toLowerCase()
  );

  if (section) return `${section.title} page`;

  return normalized
    .replace(/^\//, "")
    .replace(/[/-]+/g, " ")
    .trim();
}

function sanitizeForVoice(input: string) {
  return input
    .replace(/\((\/[^)\s]+)\)/g, "") // keep nearby page names, drop duplicate parenthesized path tokens
    .replace(/(^|\s)(\/[a-z0-9/_-]+)/gi, (_, prefix: string, path: string) => `${prefix}${pathToSpeakablePage(path)}`)
    .replace(/[|`*_#[\]{}<>]/g, " ") // remove markup-like symbols
    .replace(/\s{2,}/g, " ")
    .trim();
}

function splitLongPart(part: string, maxChars: number) {
  const words = part.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);

    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    for (let i = 0; i < word.length; i += maxChars) {
      chunks.push(word.slice(i, i + maxChars));
    }
    current = "";
  }

  if (current) chunks.push(current);
  return chunks;
}

function splitTextForTts(text: string, maxChars: number) {
  if (text.length <= maxChars) return [text];

  const parts = text
    .split(/(?<=[.!?।])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const part of parts) {
    if (part.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(...splitLongPart(part, maxChars));
      continue;
    }

    const next = current ? `${current} ${part}` : part;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) chunks.push(current);
      current = part;
    }
  }

  if (current) chunks.push(current);
  return chunks.length ? chunks : [text.slice(0, maxChars)];
}

async function requestTtsChunk(params: {
  endpoint: string;
  key: string;
  text: string;
  targetLanguageCode: string;
  model: string;
  speaker: string;
}) {
  const payload: Record<string, unknown> = {
    text: params.text,
    target_language_code: params.targetLanguageCode,
    model: params.model,
    speaker: params.speaker,
  };

  const res = await fetch(params.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": params.key,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      details: data?.error || data,
      chunks: [] as string[],
    };
  }

  const chunks = Array.isArray(data?.audios)
    ? data.audios.filter((chunk: unknown): chunk is string => typeof chunk === "string" && chunk.trim().length > 0)
    : typeof data?.audio === "string" && data.audio.trim()
    ? [data.audio]
    : [];

  return {
    ok: true as const,
    status: res.status,
    details: null,
    chunks,
  };
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
    const textParts = splitTextForTts(voiceText, MAX_TTS_TEXT_CHARS);
    const audioBase64Chunks: string[] = [];

    for (const part of textParts) {
      const ttsResult = await requestTtsChunk({
        endpoint,
        key,
        text: part,
        targetLanguageCode,
        model,
        speaker,
      });

      if (!ttsResult.ok) {
        return Response.json(
          {
            error: "Sarvam text-to-speech failed",
            status: ttsResult.status,
            details: ttsResult.details,
          },
          { status: ttsResult.status >= 400 && ttsResult.status < 600 ? ttsResult.status : 502 }
        );
      }

      audioBase64Chunks.push(...ttsResult.chunks);
    }

    if (!audioBase64Chunks.length) {
      return Response.json({ error: "No audio returned by Sarvam" }, { status: 502 });
    }

    return Response.json({
      ok: true,
      audioBase64: audioBase64Chunks[0],
      audioBase64Chunks,
      chunkCount: audioBase64Chunks.length,
      mimeType: "audio/wav",
      provider: "sarvam-tts",
    });
  } catch {
    return Response.json({ error: "Speech synthesis failed" }, { status: 500 });
  }
}

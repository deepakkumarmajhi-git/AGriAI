export const runtime = "nodejs";

import OpenAI from "openai";

type Lang = "en" | "hi" | "or" | "ml" | "te" | "ta" | "pa";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function normalizeLang(x: string): Lang {
  const allowed: Lang[] = ["en", "hi", "or", "ml", "te", "ta", "pa"];
  return allowed.includes(x as Lang) ? (x as Lang) : "en";
}

function languageName(lang: Lang) {
  if (lang === "hi") return "Hindi";
  if (lang === "or") return "Odia";
  if (lang === "ml") return "Malayalam";
  if (lang === "te") return "Telugu";
  if (lang === "ta") return "Tamil";
  if (lang === "pa") return "Punjabi";
  return "English";
}

async function translateWithOpenAI(texts: string[], targetLang: Lang) {
  if (!openaiClient) return null;
  const model = process.env.OPENAI_MODEL || "gpt-5";
  const system = [
    `Translate each input string to ${languageName(targetLang)}.`,
    "Keep meaning, keep brevity, keep list/number/bullet structure.",
    "Return only valid JSON object: {\"translations\": [{\"source\":\"...\",\"translated\":\"...\"}]}",
    "Do not add extra keys or explanation.",
  ].join(" ");

  const user = JSON.stringify({ texts });
  const completion = await openaiClient.chat.completions.create({
    model,
    // temperature: 0.2,
    max_tokens: 1200,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices?.[0]?.message?.content || "";
  try {
    const parsed = JSON.parse(content);
    return parsed?.translations as { source: string; translated: string }[];
  } catch {
    return null;
  }
}

async function translateWithGemini(texts: string[], targetLang: Lang) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return null;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const prompt = [
    `Translate each string to ${languageName(targetLang)}.`,
    "Keep structure exactly. Return JSON only in this format:",
    "{\"translations\":[{\"source\":\"...\",\"translated\":\"...\"}]}",
    JSON.stringify({ texts }),
  ].join("\n");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1200 }, // temperature: 0.2,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") return null;
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return parsed?.translations as { source: string; translated: string }[];
  } catch {
    return null;
  }
}

async function translateWithSarvam(texts: string[], targetLang: Lang) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return null;
  const endpoint = process.env.SARVAM_API_URL || "https://api.sarvam.ai/v1/chat/completions";
  const model = process.env.SARVAM_MODEL || "sarvam-m";
  const system = [
    `Translate each string to ${languageName(targetLang)}.`,
    "Return JSON only in format: {\"translations\":[{\"source\":\"...\",\"translated\":\"...\"}]}",
  ].join(" ");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      // temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ texts }) },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") return null;
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return parsed?.translations as { source: string; translated: string }[];
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const texts = (body?.texts || []) as string[];
    const targetLang = normalizeLang(String(body?.targetLang || "en"));

    if (!Array.isArray(texts) || texts.length === 0) {
      return Response.json({ error: "texts array required" }, { status: 400 });
    }
    if (targetLang === "en") {
      const direct = Object.fromEntries(texts.map((t) => [t, t]));
      return Response.json({ ok: true, provider: "identity", translations: direct });
    }

    let provider = "none";
    let items: { source: string; translated: string }[] | null = null;

    try {
      items = await translateWithOpenAI(texts, targetLang);
      if (items?.length) provider = "openai";
    } catch {
      items = null;
    }

    if (!items?.length) {
      try {
        items = await translateWithGemini(texts, targetLang);
        if (items?.length) provider = "gemini";
      } catch {
        items = null;
      }
    }

    if (!items?.length) {
      try {
        items = await translateWithSarvam(texts, targetLang);
        if (items?.length) provider = "sarvam";
      } catch {
        items = null;
      }
    }

    const map: Record<string, string> = {};
    if (items?.length) {
      items.forEach((it) => {
        if (typeof it?.source === "string" && typeof it?.translated === "string") {
          map[it.source] = it.translated;
        }
      });
    }
    texts.forEach((t) => {
      if (!map[t]) map[t] = t;
    });

    return Response.json({ ok: true, provider, translations: map });
  } catch {
    return Response.json({ ok: true, provider: "fallback", translations: {} });
  }
}

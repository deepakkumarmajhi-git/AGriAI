export const runtime = "nodejs";

import knowledgeBaseJson from "@/data/sarvamKnowledgeBase.json";
import OpenAI from "openai";

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };
type SiteSection = { title: string; path: string; purpose: string; keywords: string[] };
type VoiceLanguage = { code: string; label: string; nativeLabel: string };
type PageHint = { title: string; path: string; purpose: string };

const FOUNDATION_PARAGRAPH = String(knowledgeBaseJson.foundationParagraph || "");
const SITE_SECTIONS = (knowledgeBaseJson.siteSections || []) as SiteSection[];
const VOICE_LANGUAGES = (knowledgeBaseJson.voiceLanguages || []) as VoiceLanguage[];
const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function getLastUserMessage(messages: ChatMsg[]) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (last?.content || "").trim();
}

function stripProviderArtifacts(text: string) {
  const raw = String(text || "").trim();
  if (/^<think>/i.test(raw) && !/<\/think>/i.test(raw)) return "";

  return raw
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function formatPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function getLanguageInfo(code?: string) {
  const value = String(code || "").trim();
  return (
    VOICE_LANGUAGES.find((lang) => lang.code.toLowerCase() === value.toLowerCase()) || {
      code: "en-IN",
      label: "English",
      nativeLabel: "English",
    }
  );
}

function normalizeLangCode(code?: string) {
  return getLanguageInfo(code).code;
}

function detectHints(input: string): PageHint[] {
  const q = input.toLowerCase();
  if (!q) return [];
  return SITE_SECTIONS.filter((s) => s.keywords.some((kw) => q.includes(kw.toLowerCase())))
    .slice(0, 3)
    .map((s) => ({ title: s.title, path: s.path, purpose: s.purpose }));
}

function buildSectionCatalog() {
  return SITE_SECTIONS.map((s) => `- ${s.title} (${formatPath(s.path)}): ${s.purpose}`).join("\n");
}

function buildSystemPrompt(userLangCode: string, hints: PageHint[]) {
  const language = getLanguageInfo(userLangCode);
  const hintText = hints.length
    ? hints.map((h) => `- ${h.title} (${formatPath(h.path)}): ${h.purpose}`).join("\n")
    : "- Choose the most relevant SmartAgri section path based on user intent.";

  return [
    "You are SmartAgri Voice Assistant for farmers.",
    "Use only the given Foundation Paragraph as core knowledge context.",
    `Reply fully in ${language.label} (${language.nativeLabel}) with language code ${language.code}.`,
    "Do not switch to English unless the farmer explicitly asks for English.",
    "Answer the farmer's exact question directly with practical, farmer-friendly advice.",
    "Do not start with meta lines like 'the user is asking', 'you asked', 'your question is', or 'this question is about'.",
    "Do not repeat or paraphrase the question before answering. Start directly with the answer or first action.",
    "Keep the reply concise, natural for voice, and specific to the farmer's question.",
    "Prefer affordable, low-risk actions first, then mention when to escalate.",
    "Always mention one most relevant SmartAgri page title the farmer should open next, and include its exact path token once.",
    "Use the SmartAgri website sections whenever they can directly help solve the farmer's problem.",
    "Do not include markdown or JSON. Return plain spoken text only.",
    "Foundation Paragraph (exact context):",
    FOUNDATION_PARAGRAPH,
    "SmartAgri Sections:",
    buildSectionCatalog(),
    "Priority Section Hints:",
    hintText,
  ].join("\n");
}

function buildGeminiPrompt(messages: ChatMsg[], system: string) {
  const conversation = messages
    .map((message) => {
      const speaker = message.role === "assistant" ? "Assistant" : "Farmer";
      return `${speaker}: ${message.content}`;
    })
    .join("\n");

  return [system, "Conversation:", conversation, "Answer the farmer now."].join("\n\n");
}

async function callGemini(messages: ChatMsg[], system: string) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildGeminiPrompt(messages, system) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 400,
      },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts
    .map((part: { text?: string }) => (typeof part?.text === "string" ? part.text : ""))
    .join(" ")
    .trim();

  return text || null;
}

async function translateWithOpenAI(text: string, language: VoiceLanguage) {
  if (!openaiClient) return null;

  const model = process.env.OPENAI_MODEL || "gpt-5";
  const completion = await openaiClient.chat.completions.create({
    model,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: [
          `Translate the response fully into ${language.label} (${language.nativeLabel}).`,
          "Return only the translated text.",
          "Keep SmartAgri page titles and exact path tokens unchanged.",
          "Do not add explanation.",
        ].join(" "),
      },
      { role: "user", content: text },
    ],
  });

  const translated = completion.choices?.[0]?.message?.content;
  if (typeof translated !== "string" || !translated.trim()) return null;
  const clean = stripProviderArtifacts(translated);
  return clean || null;
}

async function translateWithSarvam(text: string, language: VoiceLanguage) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return null;

  const endpoint = process.env.SARVAM_API_URL || "https://api.sarvam.ai/v1/chat/completions";
  const model = process.env.SARVAM_MODEL || "sarvam-m";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: [
            `Translate the response fully into ${language.label} (${language.nativeLabel}) with language code ${language.code}.`,
            "Return only the translated text.",
            "Keep SmartAgri page titles and exact path tokens unchanged.",
          ].join(" "),
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const translated = data?.choices?.[0]?.message?.content;
  if (typeof translated !== "string" || !translated.trim()) return null;
  const clean = stripProviderArtifacts(translated);
  return clean || null;
}

async function callSarvam(messages: ChatMsg[], system: string) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) return null;

  const endpoint = process.env.SARVAM_API_URL || "https://api.sarvam.ai/v1/chat/completions";
  const model = process.env.SARVAM_MODEL || "sarvam-m";
  const body = {
    model,
    messages: [{ role: "system", content: system }, ...messages],
    temperature: 0.35,
    max_tokens: 450,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) return null;
  const clean = stripProviderArtifacts(text);
  return clean || null;
}

function shouldEnforceLanguage(reply: string, userLangCode: string) {
  if (normalizeLangCode(userLangCode).toLowerCase() === "en-in") return false;
  return !/[^\u0000-\u007f]/.test(reply);
}

async function enforceReplyLanguage(reply: string, userLangCode: string) {
  if (!shouldEnforceLanguage(reply, userLangCode)) {
    return { reply, translationProvider: null as "openai" | "sarvam" | null };
  }

  const language = getLanguageInfo(userLangCode);

  try {
    const translated = await translateWithSarvam(reply, language);
    if (translated) return { reply: translated, translationProvider: "sarvam" as const };
  } catch {
    // ignore and continue
  }

  try {
    const translated = await translateWithOpenAI(reply, language);
    if (translated) return { reply: translated, translationProvider: "openai" as const };
  } catch {
    // ignore and continue
  }

  return { reply, translationProvider: null as "openai" | "sarvam" | null };
}

function stripMetaLead(reply: string) {
  const patterns = [
    /^the user is asking[^.?!]*[.?!]\s*/i,
    /^the farmer is asking[^.?!]*[.?!]\s*/i,
    /^you are asking[^.?!]*[.?!]\s*/i,
    /^you asked[^.?!]*[.?!]\s*/i,
    /^your question is about[^.?!]*[.?!]\s*/i,
    /^this question is about[^.?!]*[.?!]\s*/i,
  ];

  return patterns.reduce((out, pattern) => out.replace(pattern, "").trim(), reply.trim());
}

function hasWebsiteHint(reply: string) {
  const lower = reply.toLowerCase();
  return SITE_SECTIONS.some((section) => {
    const title = section.title.toLowerCase();
    const path = formatPath(section.path).toLowerCase();
    return lower.includes(title) || lower.includes(path);
  });
}

function finalizeReply(reply: string, hints: PageHint[]) {
  let clean = stripMetaLead(stripProviderArtifacts(reply)).replace(/\s{2,}/g, " ").trim();
  if (!clean) clean = localFallback(hints);
  if (!hasWebsiteHint(clean) && hints[0]) {
    clean = `${clean} ${hints[0].title} (${formatPath(hints[0].path)}).`.trim();
  }
  return clean;
}

function localFallback(hints: PageHint[]) {
  const hint = hints[0] || { title: "Weather", path: "weather", purpose: "Forecast and planning support." };
  return `Start with one safe practical step, observe crop response, and then adjust gradually. Open ${hint.title} (${formatPath(hint.path)}) for your next action.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages = (body?.messages || []) as ChatMsg[];
    const preferredLangCode = normalizeLangCode(body?.preferredLangCode || body?.preferredLang);
    const messages = rawMessages
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-12);

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 });
    }

    if (FOUNDATION_PARAGRAPH.length !== 3500) {
      return Response.json({ error: "foundationParagraph must be exactly 3500 characters" }, { status: 500 });
    }

    const userText = getLastUserMessage(messages);
    const hints = detectHints(userText);
    const system = buildSystemPrompt(preferredLangCode, hints);

    let reply: string | null = null;
    let provider: "gemini" | "sarvam" | "local-fallback" = "local-fallback";

    try {
      reply = await callGemini(messages, system);
      if (reply) provider = "gemini";
    } catch {
      reply = null;
    }

    if (!reply) {
      try {
        reply = await callSarvam(messages, system);
        if (reply) provider = "sarvam";
      } catch {
        reply = null;
      }
    }

    if (!reply) {
      reply = localFallback(hints);
      provider = "local-fallback";
    }

    const finalized = finalizeReply(reply, hints);
    const enforced = await enforceReplyLanguage(finalized, preferredLangCode);

    return Response.json({
      ok: true,
      provider,
      translationProvider: enforced.translationProvider,
      reply: enforced.reply,
    });
  } catch {
    return Response.json({
      ok: true,
      provider: "local-fallback",
      reply: "I can help. Please ask your farming question again.",
    });
  }
}


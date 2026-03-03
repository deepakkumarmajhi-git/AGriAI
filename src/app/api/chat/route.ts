export const runtime = "nodejs";

import knowledgeBaseJson from "@/data/sarvamKnowledgeBase.json";

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };
type SiteSection = { title: string; path: string; purpose: string; keywords: string[] };
type VoiceLanguage = { code: string; label: string; nativeLabel: string };
type PageHint = { title: string; path: string; purpose: string };

const FOUNDATION_PARAGRAPH = String(knowledgeBaseJson.foundationParagraph || "");
const SITE_SECTIONS = (knowledgeBaseJson.siteSections || []) as SiteSection[];
const VOICE_LANGUAGES = (knowledgeBaseJson.voiceLanguages || []) as VoiceLanguage[];

function getLastUserMessage(messages: ChatMsg[]) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (last?.content || "").trim();
}

function normalizeLangCode(code?: string) {
  const value = String(code || "").trim();
  const found = VOICE_LANGUAGES.find((lang) => lang.code.toLowerCase() === value.toLowerCase());
  return found?.code || "en-IN";
}

function detectHints(input: string): PageHint[] {
  const q = input.toLowerCase();
  if (!q) return [];
  return SITE_SECTIONS.filter((s) => s.keywords.some((kw) => q.includes(kw.toLowerCase())))
    .slice(0, 3)
    .map((s) => ({ title: s.title, path: s.path, purpose: s.purpose }));
}

function buildSectionCatalog() {
  return SITE_SECTIONS.map((s) => `- ${s.title} (${s.path}): ${s.purpose}`).join("\n");
}

function buildSystemPrompt(userLangCode: string, hints: PageHint[]) {
  const hintText = hints.length
    ? hints.map((h) => `- ${h.title} (${h.path}): ${h.purpose}`).join("\n")
    : "- Choose the most relevant SmartAgri section path based on user intent.";

  return [
    "You are SmartAgri Voice Assistant for farmers.",
    "Use only the given Foundation Paragraph as core knowledge context.",
    "Generalize the user question into practical farmer-friendly advice and keep the answer concise.",
    "Use warm, supportive, conversational style suitable for voice responses.",
    `Reply in this language code style: ${userLangCode}.`,
    "Always include at least one exact SmartAgri section path that user should open next.",
    "Do not include markdown or JSON. Return plain spoken text only.",
    "Foundation Paragraph (exact context):",
    FOUNDATION_PARAGRAPH,
    "SmartAgri Sections:",
    buildSectionCatalog(),
    "Priority Section Hints:",
    hintText,
  ].join("\n");
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
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

function localFallback(hints: PageHint[]) {
  const hint = hints[0] || { title: "Weather", path: "weather", purpose: "Forecast and planning support." };
  return `I can help with that. Start with one safe practical step, observe crop response, and then adjust gradually. Open ${hint.title} at ${hint.path} for your next action.`;
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
    let provider: "sarvam" | "local-fallback" = "local-fallback";

    try {
      reply = await callSarvam(messages, system);
      if (reply) provider = "sarvam";
    } catch {
      reply = null;
    }

    if (!reply) {
      reply = localFallback(hints);
      provider = "local-fallback";
    }

    return Response.json({ ok: true, provider, reply });
  } catch {
    return Response.json({
      ok: true,
      provider: "local-fallback",
      reply: "I can help. Please ask your farming question again.",
    });
  }
}


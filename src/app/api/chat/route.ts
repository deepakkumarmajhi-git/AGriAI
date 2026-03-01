export const runtime = "nodejs";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log("OPENAI_API_KEY exists?", !!process.env.OPENAI_API_KEY);
type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "Missing OPENAI_API_KEY in .env.local" }, { status: 500 });
    }

    const body = await req.json();
    const messages = (body?.messages || []) as ChatMsg[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages array required" }, { status: 400 });
    }

    const system: ChatMsg = {
      role: "system",
      content:
        "You are SmartAgri Assistant. Help farmers with crop health, disease prevention, irrigation, weather impact, and safe actionable steps. " +
        "Be concise, beginner-friendly. Ask 1–2 clarifying questions only if needed. " +
        "Respond in the SAME language as the user's last message (multilingual). " +
        "If you are unsure, say so and give safe general guidance.",
    };

    const model = process.env.OPENAI_MODEL || "gpt-5";

    const completion = await client.chat.completions.create({
      model,
      messages: [system, ...messages],
      // keep it stable and not too long for MVP
      temperature: 0.4,
      max_tokens: 350,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "I couldn't generate a reply.";

    return Response.json({ ok: true, reply });
  } catch (err: any) {
    return Response.json(
      { error: "Chat API failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
  
}
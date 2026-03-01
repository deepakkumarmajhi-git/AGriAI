"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function AssistantPage() {
  const router = useRouter();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Hi! I’m SmartAgri Assistant. Ask me about crop care, watering, or leaf disease." },
  ]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const quick = useMemo(
    () => [
      "How to treat leaf spot?",
      "Best time to irrigate in summer?",
      "How to reduce fungal disease risk?",
      "What to do if soil moisture is low?",
    ],
    []
  );

  async function send(text: string) {
    const t = text.trim();
    if (!t || loading) return;

    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setLoading(true);

    try {
      // Convert UI messages -> API messages format
      const apiMessages = [
        // send last ~10 turns for context (MVP)
        ...messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.text,
          })),
        { role: "user", content: t },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Chat failed");
      }

      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Sorry, I couldn’t reach the AI service right now. Check your OPENAI_API_KEY in .env.local and restart the server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
          <p className="mt-1 text-slate-600">
            Real AI chat (multilingual). Your OpenAI key stays on the server.
          </p>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-4">
            <div className="flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[420px] overflow-y-auto p-4">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto bg-green-600 text-white"
                      : "bg-slate-100 text-slate-800",
                  ].join(" ")}
                >
                  {m.text}
                </div>
              ))}

              {loading ? (
                <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">
                  Thinking...
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") send(input);
                }}
                disabled={loading}
              />
              <button
                onClick={() => send(input)}
                disabled={loading}
                className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                Send
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Tip: Try asking in Hindi/Odia — it will reply in the same language.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
"use client";

import knowledgeBaseJson from "@/data/sarvamKnowledgeBase.json";
import { Bot, Mic, MicOff, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type VoiceLanguage = { code: string; label: string; nativeLabel: string };
type ChatMsg = { role: "user" | "assistant"; content: string };

const VOICE_LANGUAGES = (knowledgeBaseJson.voiceLanguages || []) as VoiceLanguage[];

export default function FarmerVoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [voiceOut, setVoiceOut] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [selectedLangCode, setSelectedLangCode] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusText, setStatusText] = useState("Choose language to begin.");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const conversationRef = useRef<ChatMsg[]>([]);

  const selectedLanguage = useMemo(
    () => VOICE_LANGUAGES.find((l) => l.code === selectedLangCode) || null,
    [selectedLangCode]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasMediaDevices = Boolean(navigator.mediaDevices?.getUserMedia);
    const hasMediaRecorder = typeof MediaRecorder !== "undefined";
    setSpeechSupported(hasMediaDevices && hasMediaRecorder);
  }, []);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      currentAudioRef.current?.pause();
      currentAudioRef.current = null;
    };
  }, []);

  async function speak(text: string, languageCode: string) {
    if (!voiceOut) return;
    const t = text.trim();
    if (!t) return;
    setStatusText("Speaking...");
    try {
      const res = await fetch("/api/sarvam/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: t.slice(0, 1800),
          target_language_code: languageCode,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.audioBase64) {
        setStatusText("Voice output failed. Tap mic and try again.");
        return;
      }
      currentAudioRef.current?.pause();
      const audio = new Audio(`data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`);
      currentAudioRef.current = audio;
      audio.onended = () => setStatusText("Tap mic to ask next question.");
      await audio.play();
    } catch {
      setStatusText("Voice output failed. Tap mic and try again.");
    }
  }

  async function transcribe(blob: Blob, languageCode: string) {
    const form = new FormData();
    form.append("file", blob, "voice.webm");
    form.append("language_code", languageCode);
    form.append("mode", "transcribe");
    const res = await fetch("/api/sarvam/speech-to-text", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Transcription failed");
    return String(data?.transcript || "").trim();
  }

  async function askAssistant(userTranscript: string, languageCode: string) {
    const t = userTranscript.trim();
    if (!t) return;

    const nextMessages: ChatMsg[] = [...conversationRef.current.slice(-10), { role: "user", content: t }];
    conversationRef.current = nextMessages;

    setProcessing(true);
    setStatusText("Thinking...");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          preferredLangCode: languageCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Assistant failed");

      const reply = String(data?.reply || "").trim();
      if (!reply) throw new Error("Empty response");
      conversationRef.current = [...nextMessages, { role: "assistant", content: reply }];
      await speak(reply, languageCode);
    } catch {
      await speak("I could not answer right now. Please try again.", languageCode);
    } finally {
      setProcessing(false);
    }
  }

  async function toggleListening() {
    if (!speechSupported || !selectedLangCode || transcribing || processing) return;

    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setStatusText("Processing your question...");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setIsListening(false);
        setStatusText("Mic error. Try again.");
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        setIsListening(false);
        if (!blob.size) {
          setStatusText("No voice captured. Tap mic and try again.");
          return;
        }
        setTranscribing(true);
        try {
          const transcript = await transcribe(blob, selectedLangCode);
          if (!transcript) {
            setStatusText("Could not understand audio. Please repeat.");
            return;
          }
          await askAssistant(transcript, selectedLangCode);
        } catch {
          setStatusText("Voice processing failed. Try again.");
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      setIsListening(true);
      setStatusText("Listening... tap again to send.");
    } catch {
      setIsListening(false);
      setStatusText("Microphone permission is required.");
    }
  }

  function resetVoiceSession() {
    conversationRef.current = [];
    setSelectedLangCode("");
    setStatusText("Choose language to begin.");
    setIsListening(false);
    setTranscribing(false);
    setProcessing(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/35 bg-emerald-500/20 text-emerald-100 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl transition hover:scale-105 hover:bg-emerald-400/30"
        aria-label="Open voice assistant"
        title="Open voice assistant"
      >
        <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-emerald-400/20" />
        <Bot className="relative h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 w-[360px] max-w-[calc(100vw-20px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0f1628]/90 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 text-white">
        <div>
          <p className="text-sm font-bold">Sarvam Krishi Voice</p>
          <p className="text-xs text-slate-300">Voice-only assistant</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVoiceOut((v) => !v)}
            className="rounded-md p-1 text-slate-200 hover:bg-white/10"
            aria-label={voiceOut ? "Mute voice output" : "Unmute voice output"}
            title={voiceOut ? "Mute voice output" : "Unmute voice output"}
          >
            {voiceOut ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              resetVoiceSession();
            }}
            className="rounded-md p-1 text-slate-200 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!selectedLanguage ? (
        <div className="p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200">Select Language</p>
          <div className="grid max-h-[260px] grid-cols-2 gap-2 overflow-y-auto">
            {VOICE_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setSelectedLangCode(lang.code);
                  setStatusText("Tap mic and ask your question.");
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-100 hover:bg-white/10"
              >
                <p className="font-semibold">{lang.label}</p>
                <p className="text-[11px] text-slate-300">{lang.nativeLabel}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 py-5">
          <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <div>
              <p className="text-xs text-slate-300">Language</p>
              <p className="text-sm font-semibold text-emerald-100">
                {selectedLanguage.label} ({selectedLanguage.nativeLabel})
              </p>
            </div>
            <button
              onClick={resetVoiceSession}
              className="rounded-lg border border-white/10 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Change
            </button>
          </div>

          <button
            onClick={toggleListening}
            disabled={!speechSupported || transcribing || processing}
            className={[
              "mx-auto flex h-20 w-20 items-center justify-center rounded-full border transition",
              isListening
                ? "border-red-300/45 bg-red-500/25 text-red-100"
                : "border-emerald-300/35 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
            aria-label={isListening ? "Stop microphone" : "Start microphone"}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>

          <p className="mt-4 text-center text-sm text-slate-200">{statusText}</p>
          {!speechSupported ? (
            <p className="mt-2 text-center text-xs text-amber-300">This browser does not support voice recording.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}


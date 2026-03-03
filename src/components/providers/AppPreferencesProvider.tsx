"use client";

import {
  AppLanguage,
  PREF_EVENT,
  PREF_LANG_KEY,
  PREF_THEME_KEY,
  applyLanguage,
  applyTheme,
  loadLanguage,
  loadTheme,
  normalizeLanguage,
  normalizeTheme,
} from "@/lib/preferences";
import { getStaticTextMap } from "@/lib/staticTextMap";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const textNodeOriginal = new WeakMap<Text, string>();
const translationCacheByLang = new Map<string, Record<string, string>>();

type AttrTarget = { el: Element; attr: "placeholder" | "title" | "aria-label"; original: string };

function getDigitMap(lang: AppLanguage) {
  if (lang === "hi") return ["\u0966", "\u0967", "\u0968", "\u0969", "\u096A", "\u096B", "\u096C", "\u096D", "\u096E", "\u096F"];
  if (lang === "or") return ["\u0B66", "\u0B67", "\u0B68", "\u0B69", "\u0B6A", "\u0B6B", "\u0B6C", "\u0B6D", "\u0B6E", "\u0B6F"];
  if (lang === "ml") return ["\u0D66", "\u0D67", "\u0D68", "\u0D69", "\u0D6A", "\u0D6B", "\u0D6C", "\u0D6D", "\u0D6E", "\u0D6F"];
  if (lang === "te") return ["\u0C66", "\u0C67", "\u0C68", "\u0C69", "\u0C6A", "\u0C6B", "\u0C6C", "\u0C6D", "\u0C6E", "\u0C6F"];
  if (lang === "ta") return ["\u0BE6", "\u0BE7", "\u0BE8", "\u0BE9", "\u0BEA", "\u0BEB", "\u0BEC", "\u0BED", "\u0BEE", "\u0BEF"];
  if (lang === "pa") return ["\u0A66", "\u0A67", "\u0A68", "\u0A69", "\u0A6A", "\u0A6B", "\u0A6C", "\u0A6D", "\u0A6E", "\u0A6F"];
  return null;
}

function localizeDigits(text: string, lang: AppLanguage) {
  if (lang === "en") return text;
  const digits = getDigitMap(lang);
  if (!digits) return text;
  return text.replace(/[0-9]/g, (d) => digits[Number(d)] || d);
}

function getCache(lang: AppLanguage) {
  if (translationCacheByLang.has(lang)) return translationCacheByLang.get(lang)!;
  try {
    const raw = localStorage.getItem(`smartAgriTransCache:${lang}`);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const seeded = { ...getStaticTextMap(lang), ...parsed };
    translationCacheByLang.set(lang, seeded);
    return seeded;
  } catch {
    const seeded = { ...getStaticTextMap(lang) };
    translationCacheByLang.set(lang, seeded);
    return seeded;
  }
}

function persistCache(lang: AppLanguage) {
  const data = translationCacheByLang.get(lang);
  if (!data) return;
  try {
    localStorage.setItem(`smartAgriTransCache:${lang}`, JSON.stringify(data));
  } catch {
    // ignore storage quota
  }
}

function collectNodes() {
  const textNodes: { node: Text; original: string }[] = [];
  const attrNodes: AttrTarget[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (!parent) continue;
    if (parent.closest("script,style,pre,code,textarea,[data-no-translate]")) continue;
    const raw = node.nodeValue || "";
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.length > 500) continue;
    if (/^[\d\s.,:/\-+()%]+$/.test(trimmed)) continue;
    if (!textNodeOriginal.has(node)) textNodeOriginal.set(node, raw);
    textNodes.push({ node, original: textNodeOriginal.get(node) || raw });
  }

  const elements = document.querySelectorAll("input,textarea,button,a,[title],[aria-label]");
  elements.forEach((el) => {
    (["placeholder", "title", "aria-label"] as const).forEach((attr) => {
      const v = el.getAttribute(attr);
      if (!v || !v.trim()) return;
      if (/^[\d\s.,:/\-+()%]+$/.test(v.trim())) return;
      const key = `data-sa-orig-${attr}`;
      if (!el.getAttribute(key)) el.setAttribute(key, v);
      attrNodes.push({ el, attr, original: el.getAttribute(key) || v });
    });
  });

  return { textNodes, attrNodes };
}

function restoreEnglish() {
  const { textNodes, attrNodes } = collectNodes();
  textNodes.forEach(({ node, original }) => {
    node.nodeValue = original;
  });
  attrNodes.forEach(({ el, attr, original }) => {
    el.setAttribute(attr, original);
  });
}

function applyFromCache(lang: AppLanguage) {
  const cache = getCache(lang);
  const { textNodes, attrNodes } = collectNodes();

  textNodes.forEach(({ node, original }) => {
    const key = original.trim();
    const translated = cache[key];
    if (translated) node.nodeValue = localizeDigits(translated, lang);
  });

  attrNodes.forEach(({ el, attr, original }) => {
    const key = original.trim();
    const translated = cache[key];
    if (translated) el.setAttribute(attr, localizeDigits(translated, lang));
  });
}

async function translateTexts(missing: string[], targetLang: AppLanguage) {
  if (!missing.length) return {};
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: missing, targetLang }),
  });
  if (!res.ok) return {};
  const data = await res.json();
  return (data?.translations || {}) as Record<string, string>;
}

function setTranslating(on: boolean) {
  document.documentElement.setAttribute("data-sa-translating", on ? "true" : "false");
}

async function applyTranslationsWithBuffer(targetLang: AppLanguage) {
  if (targetLang === "en") {
    setTranslating(false);
    restoreEnglish();
    return;
  }

  // Instant apply from persistent cache to avoid repeated English flashes on revisit.
  applyFromCache(targetLang);

  const cache = getCache(targetLang);
  const { textNodes, attrNodes } = collectNodes();
  const pool = new Set<string>();
  textNodes.forEach(({ original }) => pool.add(original.trim()));
  attrNodes.forEach(({ original }) => pool.add(original.trim()));

  const missing = [...pool].filter((t) => t && !cache[t]);
  if (!missing.length) {
    setTranslating(false);
    return;
  }

  const startAt = Date.now();
  setTranslating(true);

  for (let i = 0; i < missing.length; i += 40) {
    const chunk = missing.slice(i, i + 40);
    const result = await translateTexts(chunk, targetLang);
    Object.entries(result).forEach(([src, out]) => {
      cache[src] = out;
    });
  }

  persistCache(targetLang);

  // Re-apply final values including newly translated API/DB content.
  const latest = collectNodes();
  latest.textNodes.forEach(({ node, original }) => {
    const key = original.trim();
    const translated = cache[key] || key;
    node.nodeValue = localizeDigits(translated, targetLang);
  });
  latest.attrNodes.forEach(({ el, attr, original }) => {
    const key = original.trim();
    const translated = cache[key] || key;
    el.setAttribute(attr, localizeDigits(translated, targetLang));
  });

  const elapsed = Date.now() - startAt;
  const minBufferMs = 900;
  if (elapsed < minBufferMs) {
    await new Promise((resolve) => setTimeout(resolve, minBufferMs - elapsed));
  }
  setTranslating(false);
}

export default function AppPreferencesProvider() {
  const pathname = usePathname();
  const currentLangRef = useRef<AppLanguage>("en");
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function runTranslate() {
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    inFlightRef.current = true;
    try {
      await applyTranslationsWithBuffer(currentLangRef.current);
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        runTranslate();
      }
    }
  }

  useEffect(() => {
    const theme = loadTheme();
    const language = loadLanguage();
    currentLangRef.current = language;
    applyTheme(theme);
    applyLanguage(language);
    runTranslate();

    const userId = localStorage.getItem("smartAgriUserId");
    if (userId) {
      fetch("/api/profile", {
        method: "GET",
        headers: { "x-user-id": userId },
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.profile) return;
          const nextTheme = normalizeTheme(data.profile.theme || theme);
          const nextLang = normalizeLanguage(data.profile.language || language);
          currentLangRef.current = nextLang;
          localStorage.setItem(PREF_THEME_KEY, nextTheme);
          localStorage.setItem(PREF_LANG_KEY, nextLang);
          applyTheme(nextTheme);
          applyLanguage(nextLang);
          runTranslate();
        })
        .catch(() => {
          // ignore
        });
    }

    const onPrefs = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      const t = normalizeTheme(detail.theme || localStorage.getItem(PREF_THEME_KEY));
      const l = normalizeLanguage(detail.language || localStorage.getItem(PREF_LANG_KEY));
      currentLangRef.current = l;
      applyTheme(t);
      applyLanguage(l);
      runTranslate();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== PREF_THEME_KEY && e.key !== PREF_LANG_KEY) return;
      const t = normalizeTheme(localStorage.getItem(PREF_THEME_KEY));
      const l = normalizeLanguage(localStorage.getItem(PREF_LANG_KEY));
      currentLangRef.current = l;
      applyTheme(t);
      applyLanguage(l);
      runTranslate();
    };

    const observer = new MutationObserver(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => runTranslate(), 180);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener(PREF_EVENT, onPrefs as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener(PREF_EVENT, onPrefs as EventListener);
      window.removeEventListener("storage", onStorage);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // On route change, re-apply cached translations immediately and refresh only uncached values.
    runTranslate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

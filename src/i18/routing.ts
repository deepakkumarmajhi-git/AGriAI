export const locales = ["en", "hi", "or", "ml", "te", "ta", "pa"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  or: "ଓଡ଼ିଆ",
  ml: "മലയാളം",
  te: "తెలుగు",
  ta: "தமிழ்",
  pa: "ਪੰਜਾਬੀ",
};

// for browser voice features later, optional
export const localeToSpeechLang: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  or: "or-IN",
  ml: "ml-IN",
  te: "te-IN",
  ta: "ta-IN",
  pa: "pa-IN",
};
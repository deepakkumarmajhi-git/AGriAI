export type AppTheme = "dark" | "light";
export type AppLanguage = "en" | "hi" | "or" | "ml" | "te" | "ta" | "pa";

export const PREF_THEME_KEY = "smartAgriTheme";
export const PREF_LANG_KEY = "smartAgriLanguage";
export const PREF_EVENT = "smartagri:prefs-changed";

export const supportedLanguages: { code: AppLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "or", label: "Odia" },
  { code: "ml", label: "Malayalam" },
  { code: "te", label: "Telugu" },
  { code: "ta", label: "Tamil" },
  { code: "pa", label: "Punjabi" },
];

export function normalizeTheme(input: string | null | undefined): AppTheme {
  return input === "light" ? "light" : "dark";
}

export function normalizeLanguage(input: string | null | undefined): AppLanguage {
  return supportedLanguages.some((l) => l.code === input) ? (input as AppLanguage) : "en";
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function applyLanguage(language: AppLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", language);
}

export function savePrefs(theme: AppTheme, language: AppLanguage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREF_THEME_KEY, theme);
  localStorage.setItem(PREF_LANG_KEY, language);
  window.dispatchEvent(new CustomEvent(PREF_EVENT, { detail: { theme, language } }));
}

export function loadTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  const v = normalizeTheme(localStorage.getItem(PREF_THEME_KEY));
  if (!localStorage.getItem(PREF_THEME_KEY)) localStorage.setItem(PREF_THEME_KEY, v);
  return v;
}

export function loadLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  const v = normalizeLanguage(localStorage.getItem(PREF_LANG_KEY));
  if (!localStorage.getItem(PREF_LANG_KEY)) localStorage.setItem(PREF_LANG_KEY, "en");
  return v;
}

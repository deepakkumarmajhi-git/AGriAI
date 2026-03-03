import type { AppLanguage } from "@/lib/preferences";
import en from "@/i18/static/en.json";
import hi from "@/i18/static/hi.json";
import or from "@/i18/static/or.json";
import ml from "@/i18/static/ml.json";
import te from "@/i18/static/te.json";
import ta from "@/i18/static/ta.json";
import pa from "@/i18/static/pa.json";

const dict: Record<AppLanguage, Record<string, string>> = {
  en,
  hi,
  or,
  ml,
  te,
  ta,
  pa,
};

export function getStaticTextMap(lang: AppLanguage) {
  return dict[lang] || {};
}

"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import {
  AppLanguage,
  AppTheme,
  applyLanguage,
  applyTheme,
  loadLanguage,
  loadTheme,
  savePrefs,
  supportedLanguages,
} from "@/lib/preferences";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  language: AppLanguage;
  theme?: AppTheme;
  role: string;
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [theme, setTheme] = useState<AppTheme>("dark");

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  async function loadProfile() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setLoading(true);
      const res = await fetch("/api/profile", {
        method: "GET",
        headers: { "x-user-id": userId },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to load profile");
        setProfile(null);
        return;
      }

      const p = data.profile as Profile;
      setProfile(p);
      setName(p.name || "");
      setPhone(p.phone || "");
      setLanguage((p.language as AppLanguage) || loadLanguage());
      setTheme((p.theme as AppTheme) || loadTheme());
    } catch (e: any) {
      alert(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialTheme = loadTheme();
    const initialLang = loadLanguage();
    setTheme(initialTheme);
    setLanguage(initialLang);
    applyTheme(initialTheme);
    applyLanguage(initialLang);
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onThemeChange(next: AppTheme) {
    setTheme(next);
    applyTheme(next);
    savePrefs(next, language);
  }

  function onLanguageChange(next: AppLanguage) {
    setLanguage(next);
    applyLanguage(next);
    savePrefs(theme, next);
  }

  async function saveProfile() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setSaving(true);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ name, phone, language, theme }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to save profile");
        return;
      }

      localStorage.setItem("smartAgriName", name);
      savePrefs(theme, language);
      alert("Profile updated");
      await loadProfile();
    } catch (e: any) {
      alert(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-slate-600">
            Theme and language are applied globally across the app immediately.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 text-slate-600 shadow-sm">Loading profile...</div>
        ) : !profile ? (
          <div className="rounded-2xl border bg-white p-6 text-slate-600 shadow-sm">
            Could not load profile. Please login again.
          </div>
        ) : (
          <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Theme</span>
                <div className="grid grid-cols-2 gap-1 rounded-lg border p-1">
                  <button
                    onClick={() => onThemeChange("dark")}
                    className={[
                      "rounded-md px-3 py-1.5 text-xs font-semibold inline-flex items-center justify-center",
                      theme === "dark" ? "bg-emerald-500/20 text-emerald-100" : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onThemeChange("light")}
                    className={[
                      "rounded-md px-3 py-1.5 text-xs font-semibold inline-flex items-center justify-center",
                      theme === "light" ? "bg-emerald-500/20 text-emerald-100" : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <Sun className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Language</span>
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as AppLanguage)}
                  className="min-w-[170px] text-sm outline-none"
                >
                  {supportedLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Name</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Phone</label>
                <input
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Email (read-only)</label>
                <input
                  className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2 text-slate-600"
                  value={profile.email}
                  readOnly
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={loadProfile}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-50"
              >
                Refresh
              </button>
              <span className="ml-auto rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                Role: {profile.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

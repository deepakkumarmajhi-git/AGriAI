"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Profile = {
  name: string;
  email: string;
  phone: string;
  language: string;
  role: string;
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("en");

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
        headers: {
          "x-user-id": userId,
        },
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

      // Set form fields
      setName(p.name || "");
      setPhone(p.phone || "");
      setLanguage(p.language || "en");
    } catch (e: any) {
      alert(e?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify({
          name,
          phone,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to save profile");
        return;
      }

      // keep localStorage name consistent (used by dashboard greeting)
      localStorage.setItem("smartAgriName", name);

      alert("✅ Profile updated!");
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
            Profile settings are saved in MongoDB (real backend).
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            Loading profile...
          </div>
        ) : !profile ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            Could not load profile. Please login again.
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
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
                <label className="text-sm font-semibold text-slate-700">Language</label>
                <select
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="or">Odia</option>
                  <option value="bn">Bengali</option>
                  <option value="te">Telugu</option>
                  <option value="ta">Tamil</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  This will be used later for multilingual assistant & UI.
                </p>
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
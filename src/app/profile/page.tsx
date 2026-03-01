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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  useEffect(() => {
    async function load() {
      try {
        const userId = localStorage.getItem("smartAgriUserId");
        if (!userId) {
          router.push("/auth/login");
          return;
        }

        setLoading(true);
        const res = await fetch("/api/profile", {
          headers: { "x-user-id": userId },
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data?.error || "Failed to load profile");
          setProfile(null);
          return;
        }

        setProfile(data.profile);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="mt-1 text-slate-600">Your account information.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            Loading...
          </div>
        ) : !profile ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            Could not load profile. Please login again.
          </div>
        ) : (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-600">Name</p>
                <p className="mt-1 text-slate-900 font-bold">{profile.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Email</p>
                <p className="mt-1 text-slate-900 font-bold">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Phone</p>
                <p className="mt-1 text-slate-900 font-bold">{profile.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Language</p>
                <p className="mt-1 text-slate-900 font-bold">{profile.language || "en"}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                Role: {profile.role}
              </span>

              <button
                onClick={() => router.push("/settings")}
                className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
              >
                Edit in Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
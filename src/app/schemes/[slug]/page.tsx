"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type EligibilityForm = {
  state: string;
  hasAadhaar: boolean;
  hasBank: boolean;
  hasLandProof: boolean;
  isFarmer: boolean;
};

export default function SchemeDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [savedItem, setSavedItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EligibilityForm>({
    state: localStorage.getItem("smartAgriState") || "Odisha",
    hasAadhaar: true,
    hasBank: true,
    hasLandProof: true,
    isFarmer: true,
  });

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/schemes/${encodeURIComponent(slug)}`);
    const data = await res.json();

    if (!res.ok) {
      setScheme(null);
      setLoading(false);
      return;
    }

    setScheme(data.scheme);
    setLoading(false);

    // check saved status
    const userId = localStorage.getItem("smartAgriUserId");
    if (userId && data.scheme?._id) {
      const c = await fetch(
        `/api/schemes/my/check?userId=${encodeURIComponent(userId)}&schemeId=${encodeURIComponent(data.scheme._id)}`
      );
      const cd = await c.json();
      setSavedItem(cd?.item || null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const eligibilityScore = useMemo(() => {
    if (!scheme) return { score: 0, msg: "—", level: "low" as const };

    let score = 0;
    if (form.isFarmer) score += 30;
    if (form.hasAadhaar) score += 25;
    if (form.hasBank) score += 25;
    if (form.hasLandProof) score += 20;

    // state check: central schemes always OK, state schemes must match
    if (scheme.scope === "state") {
      if (form.state.trim().toLowerCase() !== String(scheme.state || "").trim().toLowerCase()) {
        score = Math.min(score, 40);
      }
    }

    if (score >= 80) return { score, msg: "High chance (You look eligible).", level: "high" as const };
    if (score >= 55) return { score, msg: "Medium chance (Missing some items).", level: "mid" as const };
    return { score, msg: "Low chance (Many requirements missing).", level: "low" as const };
  }, [form, scheme]);

  async function onSave() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      alert("Please login first.");
      router.push("/auth/login");
      return;
    }

    if (!scheme?._id) return;

    setSaving(true);
    try {
      const res = await fetch("/api/schemes/my", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, schemeId: scheme._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to save");
        return;
      }
      setSavedItem(data.item);
      alert("Saved to My Schemes ✅");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">Loading...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!scheme) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-xl font-bold text-slate-900">Scheme not found</div>
              <Link className="mt-4 inline-flex rounded-xl bg-green-600 px-4 py-2 text-white" href="/schemes">
                Back to Schemes →
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const tag = scheme.scope === "central" ? "Central" : `State: ${scheme.state}`;

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {tag}
                </div>
                <h1 className="mt-3 text-2xl font-bold text-slate-900">{scheme.title}</h1>
                <p className="mt-1 text-slate-600">{scheme.shortDescription}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/schemes"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  ← Back
                </Link>

                <button
                  onClick={onSave}
                  disabled={saving || !!savedItem}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {savedItem ? "Saved ✅" : saving ? "Saving..." : "Save to My Schemes"}
                </button>

                <Link
                  href="/schemes/my"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  My Schemes →
                </Link>
              </div>
            </div>

            {scheme.officialLink ? (
              <div className="mt-4 text-sm">
                Official link:{" "}
                <a className="font-semibold text-green-700 hover:underline" href={scheme.officialLink} target="_blank" rel="noreferrer">
                  Open portal ↗
                </a>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-500">
                Official link not added yet (you can add later in seed/admin).
              </div>
            )}
          </div>

          {/* 2 columns */}
          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Benefits">
              <Bullet items={scheme.benefits || []} empty="Benefits not added yet." />
            </Section>
            <Section title="Eligibility">
              <Bullet items={scheme.eligibility || []} empty="Eligibility not added yet." />
            </Section>
            <Section title="Required Documents">
              <Bullet items={scheme.documents || []} empty="Documents not added yet." />
            </Section>
            <Section title="How to Apply">
              <Bullet items={scheme.howToApply || []} empty="Steps not added yet." />
            </Section>
          </div>

          {/* Eligibility Quick Check */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">Quick Eligibility Check</div>
                <div className="mt-1 text-sm text-slate-600">
                  Answer quickly to get a simple estimate (not official verification).
                </div>
              </div>

              <div
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  eligibilityScore.level === "high"
                    ? "bg-green-50 text-green-700"
                    : eligibilityScore.level === "mid"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-red-50 text-red-700",
                ].join(" ")}
              >
                Score: {eligibilityScore.score}/100 • {eligibilityScore.msg}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Your State">
                <select
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  value={form.state}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, state: e.target.value }));
                    localStorage.setItem("smartAgriState", e.target.value);
                  }}
                >
                  <option value="Odisha">Odisha</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                </select>
              </Field>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-sm font-bold text-slate-900">Checklist</div>
                <div className="mt-3 space-y-2">
                  <Check label="I am a farmer" checked={form.isFarmer} onChange={(v) => setForm((p) => ({ ...p, isFarmer: v }))} />
                  <Check label="I have Aadhaar" checked={form.hasAadhaar} onChange={(v) => setForm((p) => ({ ...p, hasAadhaar: v }))} />
                  <Check label="I have bank account" checked={form.hasBank} onChange={(v) => setForm((p) => ({ ...p, hasBank: v }))} />
                  <Check label="I have land/cultivation proof" checked={form.hasLandProof} onChange={(v) => setForm((p) => ({ ...p, hasLandProof: v }))} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <b>Why not 100%?</b> Missing documents/KYC/land proof often reduces eligibility. Complete the checklist to improve chances.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-lg font-bold text-slate-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Bullet({ items, empty }: { items: string[]; empty: string }) {
  if (!items || items.length === 0) return <div className="text-sm text-slate-600">{empty}</div>;
  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {items.map((t, i) => (
        <li key={i}>• {t}</li>
      ))}
    </ul>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
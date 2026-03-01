"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

const cropGuide: Record<string, { bestSeason: string; howToGrow: string; tips: string[] }> = {
  rice: {
    bestSeason: "Kharif (monsoon); depends on region",
    howToGrow:
      "Prepare nursery or direct sowing. Maintain water level, manage weeds, monitor pests and diseases.",
    tips: ["Level the field", "Avoid over-fertilization", "High humidity increases fungal risk"],
  },
  wheat: {
    bestSeason: "Rabi (winter season)",
    howToGrow:
      "Sow in well-prepared field. Irrigate at key stages, monitor rust, use balanced NPK.",
    tips: ["Irrigate at crown root initiation", "Watch for rust", "Use balanced NPK"],
  },
};

export default function CropDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name || "");
  const key = name.toLowerCase().trim();

  const guide = cropGuide[key];

  const badge = useMemo(() => {
    if (guide) return { text: "Guide Available", cls: "bg-green-50 text-green-700" };
    return { text: "AI Guide Coming", cls: "bg-slate-100 text-slate-700" };
  }, [guide]);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>
                  {badge.text}
                </div>
                <h1 className="mt-3 text-2xl font-bold text-slate-900">{name}</h1>
                <p className="mt-1 text-slate-600">
                  Crop details + farming tips. (Later we’ll generate fully from Farm AI + Weather.)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/soil/lab"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Re-check Soil →
                </Link>
                <Link
                  href="/farm-ai/new"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Create Farm AI Plan →
                </Link>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Best Season" icon={<IconCalendar />}>
              {guide?.bestSeason || "Will be generated from AI later based on your location & weather."}
            </InfoCard>

            <InfoCard title="How to Grow" icon={<IconPlant />}>
              {guide?.howToGrow || "Detailed steps will be generated from AI later."}
            </InfoCard>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-bold text-slate-900">AI Recommendations</div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Practical tips
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(guide?.tips || ["Maintain soil moisture", "Scan leaves 3–4 days/week", "Monitor weather changes"]).map(
                (t, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <b className="text-slate-900">Tip {i + 1}:</b> {t}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 border">{icon}</div>
        <div className="text-lg font-bold text-slate-900">{title}</div>
      </div>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </div>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-800">
      <path d="M7 2v3M17 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
      <path
        d="M6 5h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconPlant() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-slate-800">
      <path
        d="M12 21V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 11c-3 0-6-2.5-6-6 3.5 0 6 2.5 6 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 11c3 0 6-2.5 6-6-3.5 0-6 2.5-6 6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
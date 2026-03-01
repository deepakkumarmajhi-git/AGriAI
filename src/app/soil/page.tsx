"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";

export default function SoilHomePage() {
  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Soil Analysis</h1>
                <p className="mt-1 text-slate-600">
                  Choose home testing (traditional) or AI-based lab analysis with crop recommendations.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-600">Tip</div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  Best results: Use Lab Analysis + Weather
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <FeatureCard
              href="/soil/pre"
              badge="Home Method"
              title="Pre-Soil Analysis"
              desc="Step-by-step traditional methods to check soil texture, pH, drainage, and soil health at home."
              cta="Start Home Test →"
              icon={<IconFlask />}
              accent="from-amber-500/20 to-orange-500/10"
            />

            <FeatureCard
              href="/soil/lab"
              badge="AI + Weather"
              title="Lab Report Soil Analysis by AI"
              desc="Enter NPK, pH, rainfall (auto weather). Get soil health score, crop suitability %, and improvement plan."
              cta="Analyze with AI →"
              icon={<IconSpark />}
              accent="from-green-500/20 to-emerald-500/10"
            />
          </div>

          {/* Extra strip */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Pro tip:</span>{" "}
                After soil analysis, open <b>Farm AI</b> and create a plan for the selected crop.
              </div>
              <Link
                href="/farm-ai"
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Go to Farm AI →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FeatureCard({
  href,
  badge,
  title,
  desc,
  cta,
  icon,
  accent,
}: {
  href: string;
  badge: string;
  title: string;
  desc: string;
  cta: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">
            {badge}
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white ring-1 ring-slate-200">
            {icon}
          </div>
        </div>

        <div className="mt-4 text-xl font-bold text-slate-900">{title}</div>
        <p className="mt-2 text-sm text-slate-600">{desc}</p>

        <div className="mt-5 text-sm font-semibold text-green-700 group-hover:underline">
          {cta}
        </div>
      </div>
    </Link>
  );
}

function IconFlask() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-slate-800">
      <path
        d="M10 2h4M10 2v6l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 14h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-slate-800">
      <path
        d="M12 2l1.5 6L20 10l-6.5 2L12 18l-1.5-6L4 10l6.5-2L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
"use client";

import AppShell from "@/components/layout/AppShell";
import { Bot, ChevronRight, Microscope, ScanLine, Sprout } from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "Scan Leaf",
    desc: "Upload a plant image and get disease prediction with treatment guidance.",
    href: "/scan",
    icon: ScanLine,
    accent: "from-emerald-300/30 to-teal-300/10",
  },
  {
    title: "Farm AI",
    desc: "Generate adaptive farm plans using weather and crop context.",
    href: "/farm-ai",
    icon: Sprout,
    accent: "from-cyan-300/30 to-emerald-300/10",
  },
  {
    title: "Soil AI",
    desc: "Analyze soil health and crop suitability from lab or manual values.",
    href: "/soil",
    icon: Microscope,
    accent: "from-lime-300/30 to-emerald-300/10",
  },
  {
    title: "AI Assistant",
    desc: "Ask natural-language questions about weather, farming, and actions.",
    href: "/assistant",
    icon: Bot,
    accent: "from-sky-300/30 to-teal-300/10",
  },
];

export default function WithAIPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-14 -top-14 h-52 w-52 rounded-full bg-emerald-300/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 top-4 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative">
            <span className="inline-flex items-center rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              SmartAgri feature workspace
            </span>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">With AI</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Your AI-powered tools are organized here as interactive cards so it is easier to move between leaf
              scanning, farm planning, and soil analysis.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300/35"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition group-hover:opacity-100`} />
                <div className="relative">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
                  <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-emerald-200">
                    Open <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}

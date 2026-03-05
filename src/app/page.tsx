import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CloudSun,
  Droplets,
  Leaf,
  ScanSearch,
  ShieldCheck,
  Sprout,
  Tractor,
  Waves,
  Store
} from "lucide-react";

const features = [
  {
    title: "Live Crop Insights",
    desc: "Track weather, soil, and crop risk in one farmer-friendly dashboard.",
    icon: CloudSun,
  },
  {
    title: "Leaf Disease Scan",
    desc: "Upload a leaf image and get disease prediction with actionable guidance.",
    icon: ScanSearch,
  },
  {
    title: "Smart Irrigation",
    desc: "Generate water plans using forecast and soil moisture trends.",
    icon: Droplets,
  },
  {
    title: "Voice Assistant",
    desc: "Ask farm questions in your regional language with voice-first flows.",
    icon: Bot,
  },
  {
    title: "Produce Marketplace",
    desc: "List produce and connect directly with buyers from one place.",
    icon: Store,
  },
  {
    title: "Waste Exchange",
    desc: "Convert agri-waste into extra income through recycler demand.",
    icon: Waves,
  },
];

const trustStats = [
  { label: "Decisions covered", value: "Weather, Soil, Scan, Sell" },
  { label: "Designed for", value: "Small & mid-size farmers" },
  { label: "Interaction mode", value: "Mobile-first + Voice" },
  { label: "Market model", value: "Produce + Waste exchange" },
];

const steps = [
  {
    title: "Capture farm signals",
    desc: "Add city, sensor feed, and leaf photos to build context.",
  },
  {
    title: "Get practical guidance",
    desc: "Receive disease, irrigation, and action suggestions in simple language.",
  },
  {
    title: "Act and monitor",
    desc: "Track alerts, follow recommendations, and monitor results weekly.",
  },
  {
    title: "Monetize output",
    desc: "Sell produce and agri-waste directly through marketplace channels.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 pb-14 pt-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/15 text-emerald-200">
                <Leaf className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold tracking-wide text-slate-100">SmartAgri MVP</p>
                <p className="text-xs text-slate-300">Farmer Operating System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        <section className="relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-xl md:p-10">
          <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative grid gap-7 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                <Sprout className="h-3.5 w-3.5" />
                Farmer-first agriculture intelligence
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-100 md:text-6xl">
                Decide faster.
                <br />
                <span className="bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
                  Reduce losses.
                </span>
                <br />
                Sell smarter.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
                SmartAgri combines live weather, scan diagnostics, irrigation planning, and marketplace operations into
                one production-ready workflow for everyday farm decisions.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  Open Demo Dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#071221]/80 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">Control Center Snapshot</p>
                <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-[11px] font-bold text-emerald-200">
                  LIVE
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-300">Rain Chance</p>
                  <p className="mt-1 text-xl font-bold text-slate-100">62%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-300">Soil Moisture</p>
                  <p className="mt-1 text-xl font-bold text-slate-100">41%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-300">Active Alerts</p>
                  <p className="mt-1 text-xl font-bold text-slate-100">3</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-slate-300">Today Actions</p>
                  <p className="mt-1 text-xl font-bold text-slate-100">5</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Recommended next step</p>
                <p className="mt-1 text-sm text-slate-100">
                  Irrigate in early evening and run leaf scan before spray schedule.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {trustStats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
              <p className="mt-2 text-sm font-bold text-slate-100">{s.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-xl md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 md:text-3xl">Platform Capabilities</h2>
              <p className="mt-1 text-sm text-slate-300 md:text-base">
                Production-ready modules for the full farm decision cycle.
              </p>
            </div>
            <ShieldCheck className="hidden h-8 w-8 text-emerald-200 md:block" />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-emerald-300/30 hover:shadow-[0_0_24px_rgba(53,212,192,0.16)]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-slate-100">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{f.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-xl md:p-8">
            <h2 className="text-2xl font-bold text-slate-100">How It Works</h2>
            <div className="mt-5 space-y-3">
              {steps.map((step, i) => (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-200">Step {i + 1}</p>
                  <p className="mt-1 text-base font-semibold text-slate-100">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm backdrop-blur-xl md:p-8">
            <h2 className="text-2xl font-bold text-slate-100">Built for Scale</h2>
            <p className="mt-2 text-sm text-slate-300 md:text-base">
              SmartAgri supports farmers, buyers, recyclers, and institutional programs on one shared workflow layer.
            </p>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-slate-100">For farmers</p>
                <p className="mt-1 text-slate-300">Free core access to advisory, scan, alerts, and operations.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-slate-100">For ecosystem partners</p>
                <p className="mt-1 text-slate-300">Structured lead and transaction channels with measurable outcomes.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-slate-100">For FPO/NGO programs</p>
                <p className="mt-1 text-slate-300">Cohort monitoring, advisory rollups, and operator dashboards.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/with-ai"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
              >
                Explore AI Workspace
              </Link>
              <Link
                href="/marketplace"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
              >
                Open Marketplace
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-300/25 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/10 p-6 shadow-sm backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Start now</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-100 md:text-3xl">Launch your farm decision workspace</h2>
              <p className="mt-2 text-sm text-slate-300 md:text-base">
                Join SmartAgri to run weather intelligence, disease diagnostics, and market actions from one platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
              >
                Create Account
              </Link>
              <Link
                href="/auth/login"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/15"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Bot, CloudSun, Droplets, Leaf, ScanSearch, Tractor } from "lucide-react";

const features = [
  {
    title: "Live Crop Insights",
    desc: "Track weather, soil, and crop risk in one farmer-friendly dashboard.",
    icon: CloudSun,
  },
  {
    title: "Leaf Disease Scan",
    desc: "Upload a leaf image and get disease prediction with action advice.",
    icon: ScanSearch,
  },
  {
    title: "Smart Irrigation",
    desc: "Get practical irrigation plans based on weather and moisture trends.",
    icon: Droplets,
  },
  {
    title: "Sarvam Farm Assistant",
    desc: "Tap the assistant icon and ask farming questions in your regional language.",
    icon: Bot,
  },
  {
    title: "Produce Marketplace",
    desc: "Sell cultivated products directly to buyers from your dashboard.",
    icon: Tractor,
  },
  {
    title: "Waste Exchange",
    desc: "Sell agri-waste to recyclers and companies for extra income.",
    icon: Leaf,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 pb-10 pt-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Farmer-first agriculture platform
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
                SmartAgri helps farmers decide faster,{" "}
                <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  sell smarter
                </span>
                , and reduce losses.
              </h1>
              <p className="mt-4 text-base text-slate-300 md:text-lg">
                Monitor farm conditions, scan diseases, generate irrigation plans, sell produce, and connect waste to
                recyclers from one interactive app.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/auth/register"
                  className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10"
                >
                  View Demo Dashboard
                </Link>
              </div>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-xl">
              <p className="text-sm font-semibold text-slate-100">Today in your farm workspace</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-xl bg-white/5 p-3 text-slate-300">Weather watch and rain chance updates</div>
                <div className="rounded-xl bg-white/5 p-3 text-slate-300">Sarvam assistant for instant voice guidance</div>
                <div className="rounded-xl bg-white/5 p-3 text-slate-300">
                  Marketplace and waste selling opportunities
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-xl md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Everything in one place</h2>
              <p className="mt-2 text-slate-300">Designed to be simple on mobile and clear for everyday use.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm backdrop-blur-md transition duration-300 hover:scale-[1.02] hover:border-emerald-300/30 hover:shadow-[0_0_24px_rgba(53,212,192,0.14)]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-slate-100">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{f.desc}</p>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:28px_28px] opacity-35" />
      </div>

      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="group flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-wide">SmartAgri</div>
              <div className="text-xs text-white/60">AI + Sensors + Forecast</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#demo" className="hover:text-white">Demo Flow</a>
            <a href="#how" className="hover:text-white">How it Works</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="auth/login"
              className="rounded-xl px-4 py-2 text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              href="auth/register"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-14 pb-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              AI-Based Smart Agriculture Monitoring
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Monitor crop health in real-time with{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                sensors + AI leaf scanning
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/70">
              Weather insights, precision irrigation planning, leaf disease scanning,
              alerts, and a multilingual AI assistant — in one futuristic dashboard.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="auth/register"
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:bg-emerald-400"
              >
                Get Started
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
              >
                Open Demo Dashboard →
              </Link>
            </div>

            {/* Hero chips */}
            <div className="mt-8 flex flex-wrap gap-2">
              <Chip>7-day forecast</Chip>
              <Chip>Auto refresh + cache</Chip>
              <Chip>Soil moisture history</Chip>
              <Chip>Scan history + reports</Chip>
              <Chip>AI assistant (multilingual)</Chip>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">SmartAgri MVP</div>
                <div className="text-xs text-white/60">Live preview</div>
              </div>

              <div className="mt-4 grid gap-3">
                <GlowCard title="Weather" subtitle="Forecast + rain chance + alerts">
                  <MiniRow label="Temp" value="32°C" />
                  <MiniRow label="Humidity" value="86%" />
                  <MiniRow label="Rain (next hr)" value="5%" />
                </GlowCard>

                <div className="grid grid-cols-2 gap-3">
                  <GlowCard title="Soil Moisture" subtitle="Sensor/Simulator ready">
                    <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                      <div className="h-2 w-[45%] rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.6)]" />
                    </div>
                    <div className="mt-2 text-xs text-white/60">45% (stable)</div>
                  </GlowCard>

                  <GlowCard title="Scan Leaf" subtitle="Detect disease instantly">
                    <div className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70 ring-1 ring-white/10">
                      Upload image → AI prediction → recommendation
                    </div>
                  </GlowCard>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-fuchsia-500/10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Core Modules</h2>
            <p className="mt-2 text-sm text-white/70">
              A clean MVP today, upgradeable to full AI + edge inference later.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Weather Intelligence"
            desc="7-day forecast, next 24h rain chance, extreme alerts with cached fallback."
            tag="Forecast + Alerts"
          />
          <FeatureCard
            title="Precision Irrigation"
            desc="Rules-based schedule using soil moisture history + forecast + crop type."
            tag="Water Saving"
          />
          <FeatureCard
            title="Leaf Disease Scanning"
            desc="Upload leaf image → prediction + confidence + recommended actions."
            tag="AI Vision"
          />
          <FeatureCard
            title="Scan History"
            desc="Search, filter healthy vs diseased, view image + result timeline."
            tag="Reports"
          />
          <FeatureCard
            title="Sensor Simulator"
            desc="Demo-ready soil moisture slider + auto mode + database storage."
            tag="Realtime Demo"
          />
          <FeatureCard
            title="AI Assistant"
            desc="Multilingual chat for crop care, irrigation tips, and disease guidance."
            tag="Chat"
          />
        </div>
      </section>

      {/* Demo Flow */}
      <section id="demo" className="mx-auto max-w-6xl px-5 py-12">
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">MVP Demo Flow</h3>
              <p className="mt-2 text-sm text-white/70">
                Perfect for hackathon walkthrough: clear, fast, and impressive.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
            >
              Try Demo →
            </Link>
          </div>

          <ol className="mt-6 grid gap-3 md:grid-cols-2">
            <Step n="1" title="Register / Login" desc="Create account stored in MongoDB." />
            <Step n="2" title="Dashboard" desc="See weather + soil moisture + alerts." />
            <Step n="3" title="Scan Leaf" desc="Upload image and get prediction + confidence." />
            <Step n="4" title="History" desc="Search scans, filter, open full image." />
            <Step n="5" title="Irrigation Plan" desc="Generate schedule + tips from rules." />
            <Step n="6" title="AI Assistant" desc="Ask in Hindi/Odia/English; get guidance." />
          </ol>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="mx-auto max-w-6xl px-5 pb-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <h3 className="text-xl font-semibold">How the AI Magic Works</h3>
            <p className="mt-2 text-sm text-white/70">
              Simple pipeline, futuristic experience.
            </p>

            <div className="mt-6 space-y-4">
              <PipelineRow title="1) Collect" desc="Sensor readings + weather forecast + crop context" />
              <PipelineRow title="2) Analyze" desc="Rules now (MVP), ML later (edge-ready)" />
              <PipelineRow title="3) Act" desc="Alerts + irrigation plan + recommendations" />
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <h3 className="text-xl font-semibold">Trust + Practical UX</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                Cached fallback so farmers always see something (even offline-ish).
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                Clear confidence + simple recommendations (easy to follow).
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-fuchsia-300" />
                Designed for demo: quick wins, visual wow, readable data.
              </li>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                Start Now
              </Link>
              <a
                href="#features"
                className="rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold ring-1 ring-white/10 hover:bg-white/10"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#070A12]/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-white/60">
            © {new Date().getFullYear()} SmartAgri MVP — Built for farmers & hackathons.
          </div>
          <div className="flex gap-4 text-sm text-white/60">
            <a className="hover:text-white" href="#features">Features</a>
            <a className="hover:text-white" href="#demo">Demo</a>
            <a className="hover:text-white" href="#how">How it works</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------- UI Bits ---------- */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
      {children}
    </span>
  );
}

function GlowCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-white/60">{subtitle}</div>
        </div>
        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs ring-1 ring-white/10">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function FeatureCard({ title, desc, tag }: { title: string; desc: string; tag: string }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/7">
      <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-cyan-500/10 blur-2xl transition group-hover:bg-cyan-500/20" />
      <div className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
        {tag}
      </div>
      <div className="mt-3 text-lg font-semibold">{title}</div>
      <p className="mt-2 text-sm text-white/70">{desc}</p>
      <div className="mt-5 text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
        Learn more →
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <li className="flex gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
        <span className="text-sm font-semibold text-emerald-200">{n}</span>
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-white/70">{desc}</div>
      </div>
    </li>
  );
}

function PipelineRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-white/70">{desc}</div>
      </div>
    </div>
  );
}
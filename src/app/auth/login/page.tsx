"use client";

import { isLoggedIn } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.push("/dashboard");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Login failed");
        return;
      }

      localStorage.setItem("smartAgriName", data.name);
      localStorage.setItem("smartAgriAuth", "true");
      localStorage.setItem("smartAgriUserId", data.userId);
      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      {/* Backdrop: base + aurora + texture + vignette */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_92%_42%,rgba(16,185,129,0.22),transparent_60%),radial-gradient(900px_600px_at_84%_56%,rgba(45,212,191,0.2),transparent_58%),linear-gradient(180deg,#05070d_0%,#04060b_100%)]" />
        <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.16)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,transparent_45%,rgba(0,0,0,0.56)_100%)]" />
        <div className="absolute inset-0 opacity-[0.12] mix-blend-soft-light [background-image:radial-gradient(rgba(255,255,255,0.45)_0.55px,transparent_0.55px)] [background-size:3px_3px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 pb-12 pt-7">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.95)]" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-wide text-white">SmartAgri MVP</span>
              <span className="block text-xs text-white/60">Login</span>
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md hover:bg-white/10"
          >
            Back
          </Link>
        </header>

        <section className="mx-auto mt-10 grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/8 px-3 py-1 text-xs font-medium text-emerald-100/90 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              Secure Access • Dashboard Ready
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
              <span className="block text-white">Welcome back to</span>
              <span className="block bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                SmartAgri
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              Login to view weather insights, soil moisture readings, scan history and irrigation schedule, designed
              for fast demo flow.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FeatureCard title="Weather" sub="Forecast + alerts" />
              <FeatureCard title="Irrigation" sub="Plan + tips" />
              <FeatureCard title="Scan Leaf" sub="AI vision UI" />
              <FeatureCard title="History" sub="Search & filters" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_60%_20%,rgba(52,211,153,0.25),transparent_48%),radial-gradient(circle_at_30%_70%,rgba(45,212,191,0.22),transparent_52%)] blur-2xl" />

            <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Login</h2>
                  <p className="mt-1 text-sm text-slate-300">Access your SmartAgri dashboard securely.</p>
                </div>
                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <Field label="Email">
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-md transition focus:border-emerald-300/40 focus:ring-2 focus:ring-emerald-300/25"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>

                <Field label="Password">
                  <div className="relative mt-1">
                    <input
                      type={show ? "text" : "password"}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-16 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-md transition focus:border-emerald-300/40 focus:ring-2 focus:ring-emerald-300/25"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                    >
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                </Field>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-3 font-semibold text-slate-950 shadow-[0_0_30px_rgba(45,212,191,0.28)] transition duration-300 hover:scale-[1.01] hover:from-emerald-300 hover:to-teal-300"
                >
                  Login
                </button>
              </form>

              <p className="mt-5 text-sm text-slate-300">
                New user?{" "}
                <Link href="/auth/register" className="font-semibold text-emerald-300 transition hover:text-emerald-200">
                  Register
                </Link>
              </p>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
                Ensure your environment variables are configured in <b>.env.local</b>.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-wide text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function FeatureCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="group cursor-pointer rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition duration-300 hover:scale-[1.03] hover:border-emerald-300/35 hover:shadow-[0_0_30px_rgba(45,212,191,0.16)]">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-slate-300">{sub}</p>
    </div>
  );
}

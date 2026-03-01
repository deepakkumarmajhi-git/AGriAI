"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";

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

      // ✅ Save session for MVP
      localStorage.setItem("smartAgriName", data.name);
      localStorage.setItem("smartAgriAuth", "true");
      localStorage.setItem("smartAgriUserId", data.userId);

      router.push("/dashboard");
    } catch (err: any) {
      alert(err?.message || "Something went wrong");
    }
  }

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* Futuristic Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute top-24 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-35" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.85)]" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">SmartAgri MVP</div>
            <div className="text-xs text-white/60">Login</div>
          </div>
        </Link>

        <Link
          href="/"
          className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/10"
        >
          Back
        </Link>
      </header>

      {/* Content */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-6 md:grid-cols-2">
        {/* Left */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            Secure Access • Dashboard Ready
          </div>

          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Welcome back to{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              SmartAgri
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-sm text-white/70">
            Login to view weather insights, soil moisture readings, scan history and
            irrigation schedule — designed for fast demo flow.
          </p>

          <div className="mt-7 grid max-w-lg grid-cols-2 gap-3">
            <MiniCard title="Weather" sub="Forecast + alerts" />
            <MiniCard title="Irrigation" sub="Plan + tips" />
            <MiniCard title="Scan Leaf" sub="AI vision UI" />
            <MiniCard title="History" sub="Search & filters" />
          </div>
        </div>

        {/* Right */}
        <div className="relative">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Login</h2>
                <p className="mt-1 text-sm text-white/60">
                  Login using MongoDB stored account.
                </p>
              </div>
              <span className="relative mt-1 inline-flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/35" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.7)]" />
              </span>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Field label="Email">
                <input
                  className="mt-1 w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-emerald-400/40"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>

              <Field label="Password">
                <div className="relative mt-1">
                  <input
                    type={show ? "text" : "password"}
                    className="w-full rounded-2xl bg-white/5 px-4 py-3 pr-14 text-sm text-white placeholder:text-white/35 ring-1 ring-white/10 outline-none transition focus:ring-2 focus:ring-emerald-400/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white/5 px-3 py-2 text-xs text-white/70 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>

              <button className="group relative w-full overflow-hidden rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-black shadow-[0_0_26px_rgba(16,185,129,0.35)] hover:bg-emerald-400">
                <span className="relative z-10">Login</span>
                <span className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <span className="absolute -left-24 top-0 h-full w-24 rotate-12 bg-white/35 blur-xl" />
                </span>
              </button>
            </form>

            <p className="mt-5 text-sm text-white/70">
              New user?{" "}
              <Link href="/auth/register" className="font-semibold text-emerald-200 hover:text-emerald-100">
                Register
              </Link>
            </p>

            <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-xs text-white/60 ring-1 ring-white/10">
              Make sure your MongoDB connection string is correct in <b>.env.local</b>.
            </div>
          </div>

          <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-fuchsia-500/10 blur-2xl" />
        </div>
      </section>
    </main>
  );
}

/* ---------- UI helpers (UI only) ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-white/70">{label}</label>
      {children}
    </div>
  );
}

function MiniCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/60">{sub}</div>
    </div>
  );
}
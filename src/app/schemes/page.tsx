"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function SchemesPage() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"all" | "central" | "state">("all");
  const [stateName, setStateName] = useState("Odisha");
  const [category, setCategory] = useState("all");
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load(nextStateName = stateName) {
    setLoading(true);
    const url =
      `/api/schemes?q=${encodeURIComponent(q)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(nextStateName)}` +
      `&category=${encodeURIComponent(category)}`;

    const res = await fetch(url);
    const data = await res.json();
    setSchemes(data.schemes || []);
    setLoading(false);
  }

  useEffect(() => {
    const savedState =
      typeof window === "undefined"
        ? "Odisha"
        : localStorage.getItem("smartAgriState") || "Odisha";

    setStateName(savedState);
    load(savedState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Government Schemes</h1>
            <p className="mt-1 text-slate-600">
              Explore central + state schemes. Save schemes and track your application status.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search schemes..."
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
              />

              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="all">All (Central + State)</option>
                <option value="central">Central</option>
                <option value="state">State</option>
              </select>

              <select
                value={stateName}
                onChange={(e) => {
                  setStateName(e.target.value);
                  localStorage.setItem("smartAgriState", e.target.value);
                }}
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="Odisha">Odisha</option>
                <option value="Bihar">Bihar</option>
                <option value="Punjab">Punjab</option>
                <option value="Kerala">Kerala</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
              </select>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="all">All categories</option>
                <option value="income_support">Income Support</option>
                <option value="subsidy">Subsidy</option>
                <option value="insurance">Insurance</option>
                <option value="loan">Loan</option>
                <option value="irrigation">Irrigation</option>
                <option value="equipment">Equipment</option>
                <option value="training">Training</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              onClick={() => {
                void load();
              }}
              className="mt-4 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              {loading ? "Loading..." : "Search"}
            </button>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/schemes/pm-kisan">
                PM-KISAN Assistant →
              </Link>
              <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/schemes/insurance">
                Crop Insurance Guide →
              </Link>
              <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/schemes/loans">
                Loan Eligibility →
              </Link>
              <Link className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50" href="/schemes/my">
                My Schemes →
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            {schemes.length === 0 ? (
              <div className="text-slate-600">No schemes found. Try different search/filter.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {schemes.map((s) => (
                  <Link
                    key={s._id}
                    href={`/schemes/${s.slug}`}
                    className="rounded-2xl border bg-white p-5 shadow-sm hover:bg-slate-50"
                  >
                    <div className="text-xs font-semibold text-slate-500">
                      {s.scope === "central" ? "Central" : `State: ${s.state}`}
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">{s.title}</div>
                    <div className="mt-2 text-sm text-slate-600 line-clamp-3">{s.shortDescription}</div>
                    <div className="mt-3 text-xs font-semibold text-green-700">Open →</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Note: This tool provides guidance. Final eligibility/benefits depend on official rules and verification.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

export default function FarmAIPlanPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  // For B: prevent infinite auto recompute loop
  const didAutoRecompute = useRef(false);

  function isAdviceStale(generatedAt?: string) {
    if (!generatedAt) return true;
    const ageMs = Date.now() - new Date(generatedAt).getTime();
    return ageMs > 6 * 60 * 60 * 1000; // 6 hours
  }

  async function load() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/farm-plans/${id}?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    const p = data.plan || null;

    setPlan(p);
    setLoading(false);

    // ✅ B) Auto recompute if stale (only once per mount)
    if (p && !didAutoRecompute.current && isAdviceStale(p.latestAdvice?.generatedAt)) {
      didAutoRecompute.current = true;
      await recompute();
    }
  }

  async function recompute() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    setRecomputing(true);
    try {
      const res = await fetch(`/api/farm-plans/${id}/recompute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Recompute failed");
        return;
      }
      setPlan(data.plan || plan);
    } finally {
      setRecomputing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
              Loading...
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!plan) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
              Plan not found.
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const scans = (plan.linkedScans || []).slice(-5).reverse();

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {plan.cropName} • Farm AI
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Location: <b>{plan.location?.city}</b> • Stage: <b>{plan.stage}</b>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Last updated:{" "}
                  {plan.latestAdvice?.generatedAt
                    ? new Date(plan.latestAdvice.generatedAt).toLocaleString()
                    : "—"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* ✅ A) pass farmPlanId to scan */}
                <Link
                  href={`/scan?farmPlanId=${encodeURIComponent(id)}`}
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Scan Now →
                </Link>

                <button
                  onClick={recompute}
                  disabled={recomputing}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {recomputing ? "Recomputing..." : "Recompute with Weather"}
                </button>
              </div>
            </div>

            {plan.latestAdvice?.summary && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                {plan.latestAdvice.summary}
              </div>
            )}
          </div>

          {/* 3 columns */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Today Tasks">
              <ul className="space-y-2 text-sm text-slate-700">
                {(plan.latestAdvice?.todayTasks || []).length ? (
                  plan.latestAdvice.todayTasks.map((t: string, i: number) => (
                    <li key={i}>• {t}</li>
                  ))
                ) : (
                  <li className="text-slate-500">No tasks yet. Auto recompute will run or click recompute.</li>
                )}
              </ul>
            </Card>

            <Card title="Scan Routine">
              <div className="text-sm text-slate-700">
                Days/week: <b>{plan.scanPlan?.daysPerWeek}</b>
              </div>
              <div className="mt-1 text-sm text-slate-700">
                Next due:{" "}
                <b>
                  {plan.scanPlan?.nextScanDueAt
                    ? new Date(plan.scanPlan.nextScanDueAt).toLocaleString()
                    : "—"}
                </b>
              </div>
              <div className="mt-1 text-sm text-slate-700">
                Last scan:{" "}
                <b>
                  {plan.scanPlan?.lastScanAt
                    ? new Date(plan.scanPlan.lastScanAt).toLocaleString()
                    : "—"}
                </b>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Recommended: scan 3–4 days/week for best health tracking.
              </div>
            </Card>

            <Card title="Disease Risk">
              <div className="space-y-3">
                {(plan.latestAdvice?.diseaseRisks || []).length ? (
                  plan.latestAdvice.diseaseRisks.slice(0, 3).map((r: any, i: number) => (
                    <div key={i} className="rounded-xl border bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                        <span className={`text-xs font-bold ${riskColor(r.risk)}`}>
                          {String(r.risk).toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">{r.reason}</div>
                      <div className="mt-2 text-xs text-slate-600">
                        <b>Prevention:</b> {r.prevention}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No risks yet. Click recompute.</div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent scans */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Recent Scans</h2>
              <Link
                href={`/scans`}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Open Scan History →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {scans.length ? (
                scans.map((s: any, i: number) => (
                  <div key={i} className="rounded-xl border bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {s.result || "Scan"}
                      </div>
                      <div className="text-xs text-slate-600">
                        {s.date ? new Date(s.date).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Confidence: <b>{Math.round((Number(s.confidence) || 0) * 100)}%</b> • ScanId:{" "}
                      <span className="font-mono">{s.scanId}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  No scans linked yet. Use “Scan Now” to link scans to this plan.
                </div>
              )}
            </div>
          </div>

          {/* Irrigation */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Irrigation Plan (Next 7 Days)
            </h2>

            <div className="mt-4 overflow-hidden rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr className="border-b">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Recommendation</th>
                    <th className="px-4 py-3">Intensity</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(plan.latestAdvice?.irrigationNext7Days || []).length ? (
                    plan.latestAdvice.irrigationNext7Days.map((it: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-800">{it.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {it.recommendation}
                        </td>
                        <td className="px-4 py-3 text-slate-800">{it.intensity}</td>
                        <td className="px-4 py-3 text-slate-600">{it.reason}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-4 text-slate-500" colSpan={4}>
                        No irrigation plan yet. Click recompute.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-slate-500">
              MVP rules-based now → later upgrade to IMD seasonal intelligence + crop-specific models.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-lg font-bold text-slate-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function riskColor(risk: string) {
  if (risk === "high") return "text-red-600";
  if (risk === "medium") return "text-yellow-600";
  return "text-green-700";
}
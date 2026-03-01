"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function SoilReportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  async function load() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/soil/reports/${id}?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) {
      setReport(null);
      setLoading(false);
      return;
    }

    setReport(data.report);
    setLoading(false);
  }

  async function onDelete() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    if (!confirm("Delete this soil report?")) return;

    const res = await fetch(`/api/soil/reports/${id}?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.error || "Delete failed");
      return;
    }

    router.push("/soil/history");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const topCrops = useMemo(() => {
    const crops = report?.recommendations?.crops || [];
    const conf = report?.recommendations?.confidences || [];
    return crops.slice(0, 5).map((name: string, i: number) => ({
      name,
      pct:
        typeof conf?.[i] === "number"
          ? Math.round(conf[i] * 100)
          : undefined,
    }));
  }, [report]);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
              Loading report...
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!report) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h1 className="text-xl font-bold text-slate-900">Report not found</h1>
              <p className="mt-1 text-slate-600">It may have been deleted.</p>
              <Link
                href="/soil/history"
                className="mt-4 inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Back to History →
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const createdAt = report.createdAt ? new Date(report.createdAt).toLocaleString() : "—";
  const location = report.weather?.locationName || report.weather?.city || "—";

  const score = Number(report.soilReport?.overallScore || 0);
  const npkScore = Number(report.soilReport?.npkScore || 0);
  const phLabel = report.soilReport?.phLabel || "—";

  const inputs = report.inputs || {};
  const weatherSnap = report.weather || {};

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Soil Report
                </div>
                <h1 className="mt-3 text-2xl font-bold text-slate-900">Soil Analysis Report</h1>
                <p className="mt-1 text-slate-600">
                  Created: <b>{createdAt}</b> • Location: <b>{location}</b>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Source: <b>{weatherSnap.source || "—"}</b>
                  {weatherSnap.cachedAt ? ` • CachedAt: ${weatherSnap.cachedAt}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/soil/history"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  ← Back
                </Link>
                <Link
                  href="/soil/lab"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  New Analysis →
                </Link>
                <button
                  onClick={onDelete}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Score row */}
          <div className="grid gap-4 md:grid-cols-3">
            <ScoreCard title="Soil Health Score" value={score} hint="Higher is better" />
            <ScoreCard title="NPK Balance" value={npkScore} hint="Balanced nutrition improves yield" />
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold text-slate-500">pH Status</div>
              <div className="mt-2 text-2xl font-bold text-slate-900">{phLabel}</div>
              <div className="mt-2 text-sm text-slate-600">
                Neutral (6.0–7.5) is best for most crops.
              </div>
            </div>
          </div>

          {/* Inputs + Weather */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Soil Inputs</div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <KeyVal label="Nitrogen (N)" value={inputs.N} />
                <KeyVal label="Phosphorus (P)" value={inputs.P} />
                <KeyVal label="Potassium (K)" value={inputs.K} />
                <KeyVal label="pH" value={inputs.ph} />
                <KeyVal label="Rainfall (mm)" value={inputs.rainfall} />
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <b>Farmer Note:</b> If N/P/K is low, improve using compost + balanced fertilizer.
                If pH is too acidic/alkaline, correct gradually (avoid sudden changes).
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Weather Used</div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <KeyVal label="Temperature (°C)" value={inputs.temperature} />
                <KeyVal label="Humidity (%)" value={inputs.humidity} />
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <b>Why this matters:</b> Temperature and humidity affect crop suitability,
                disease risk, and water needs.
              </div>
            </div>
          </div>

          {/* Crops list */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">Top Recommended Crops</div>
                <div className="mt-1 text-sm text-slate-600">
                  Based on soil values + model confidence.
                </div>
              </div>

              <Link
                href="/soil/lab"
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Re-run Analysis →
              </Link>
            </div>

            {topCrops.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No crops found for this report.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {topCrops.map((c: { name: string; pct: number | undefined }) => (
                  <Link
                    key={c.name}
                    href={`/soil/crop/${encodeURIComponent(c.name)}`}
                    className="rounded-2xl border bg-white p-5 shadow-sm hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-bold text-slate-900">{c.name}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          Suitability:{" "}
                          <span className="font-bold text-green-700">
                            {c.pct != null ? `${c.pct}%` : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-green-50 px-3 py-2">
                        <div className="text-[11px] font-semibold text-green-700">Score</div>
                        <div className="text-lg font-extrabold text-green-800">
                          {c.pct != null ? c.pct : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Tap to view crop details & growing guidance.
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Raw JSON (optional) */}
          <details className="rounded-2xl border bg-white p-6 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">
              Advanced: View Raw Report JSON
            </summary>
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </AppShell>
  );
}

function KeyVal({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value ?? "—"}</div>
    </div>
  );
}

function ScoreCard({ title, value, hint }: { title: string; value: number; hint: string }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-extrabold text-slate-900">{v}</div>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-green-600" style={{ width: `${v}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SoilHistoryPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await fetch(
      `/api/soil/reports?userId=${encodeURIComponent(userId)}`,
    );
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Soil Reports History
                </h1>
                <p className="mt-1 text-slate-600">
                  All your saved soil analysis reports with scores and
                  recommended crops.
                </p>
              </div>

              <Link
                href="/soil/lab"
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                + New Report
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            {loading ? (
              <div className="text-slate-600">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-slate-600">
                No saved reports yet. Create one from Soil Lab.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((r) => (
                  <div
                    key={r._id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          Created
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleString()
                            : "—"}
                        </div>
                        <div className="mt-2 text-sm text-slate-700">
                          Location:{" "}
                          <b>
                            {r.weather?.locationName || r.weather?.city || "—"}
                          </b>
                        </div>
                      </div>

                      <div className="rounded-xl bg-green-50 px-3 py-2 text-center">
                        <div className="text-[11px] font-semibold text-green-700">
                          Score
                        </div>
                        <div className="text-lg font-extrabold text-green-800">
                          {r.soilReport?.overallScore ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      NPK:{" "}
                      <b>
                        {r.inputs?.N}/{r.inputs?.P}/{r.inputs?.K}
                      </b>{" "}
                      • pH: <b>{r.inputs?.ph}</b>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-500">
                        Top Crops
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(r.recommendations?.crops || [])
                          .slice(0, 3)
                          .map((c: string) => (
                            <span
                              key={c}
                              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                            >
                              {c}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/soil/history/${r._id}`}
                        className="flex-1 rounded-xl border bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        View Report →
                      </Link>

                      <button
                        onClick={async () => {
                          const userId =
                            localStorage.getItem("smartAgriUserId");
                          if (!userId) return;
                          if (!confirm("Delete this report?")) return;

                          await fetch(
                            `/api/soil/reports/${r._id}?userId=${encodeURIComponent(userId)}`,
                            {
                              method: "DELETE",
                            },
                          );

                          load();
                        }}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Tip: You can re-run soil analysis anytime for updated
                      weather conditions.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

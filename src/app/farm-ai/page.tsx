"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";

export default function FarmAIListPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch(`/api/farm-plans?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((d) => setPlans(d.plans || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Farm AI Plans</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Dedicated AI guidance from sowing to harvest (weather + scans + irrigation).
                </p>
              </div>

              <Link
                href="/farm-ai/new"
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                + Create Plan
              </Link>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            {loading ? (
              <div className="text-slate-600">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="text-slate-600">
                No plans yet. Create your first Farm AI plan.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((p) => (
                  <Link
                    key={p._id}
                    href={`/farm-ai/${p._id}`}
                    className="rounded-2xl border bg-white p-5 shadow-sm hover:bg-slate-50"
                  >
                    <div className="text-xs font-semibold text-slate-500">Crop</div>
                    <div className="mt-1 text-lg font-bold text-slate-900">{p.cropName}</div>

                    <div className="mt-3 text-sm text-slate-700">
                      <span className="font-semibold">Location:</span> {p.location?.city}
                    </div>
                    <div className="mt-1 text-sm text-slate-700">
                      <span className="font-semibold">Stage:</span> {p.stage}
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">Next scan due</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {p.scanPlan?.nextScanDueAt
                          ? new Date(p.scanPlan.nextScanDueAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>

                    <div className="mt-4 text-sm font-semibold text-green-700">
                      Open Plan →
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
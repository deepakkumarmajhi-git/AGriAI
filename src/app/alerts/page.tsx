"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AlertItem = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
  resolved: boolean;
  createdAt: string;
};

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AlertsPage() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  async function loadAlerts() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setLoading(true);
      const res = await fetch(`/api/alerts?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to load alerts");
        setAlerts([]);
        return;
      }

      setAlerts(data.alerts || []);
    } catch (e: any) {
      alert(e?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    if (filter === "open") return alerts.filter((a) => !a.resolved);
    return alerts.filter((a) => a.resolved);
  }, [alerts, filter]);

  async function toggleResolve(alertId: string, nextResolved: boolean) {
  try {
    setBusyId(alertId);

    const res = await fetch(`/api/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved: nextResolved }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error || "Failed to update alert");
      return;
    }

    // update local state
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: nextResolved } : a))
    );

    // ✅ instantly refresh badge count in navbar
    window.dispatchEvent(new Event("smartagri:alerts-updated"));
  } catch (e: any) {
    alert(e?.message || "Failed to update alert");
  } finally {
    setBusyId(null);
  }
}

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
              <p className="mt-1 text-slate-600">
                These alerts are stored in MongoDB. You can resolve them after taking action.
              </p>
            </div>

            <button
              onClick={loadAlerts}
              className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "open", label: "Open" },
              { key: "resolved", label: "Resolved" },
            ].map((x) => {
              const active = filter === (x.key as any);
              return (
                <button
                  key={x.key}
                  onClick={() => setFilter(x.key as any)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold",
                    active
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            Loading...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            No alerts found for this filter. Try doing a scan or sending low moisture from Simulator.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {a.level.toUpperCase()} • {a.resolved ? "RESOLVED" : "OPEN"}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{a.title}</p>
                  </div>
                  <span className="text-xs text-slate-500">{fmtTime(a.createdAt)}</span>
                </div>

                <p className="mt-2 text-slate-700">{a.message}</p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Tip: Resolve after you irrigate / treat disease / take action.
                  </span>

                  {a.resolved ? (
                    <button
                      disabled={busyId === a.id}
                      onClick={() => toggleResolve(a.id, false)}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {busyId === a.id ? "Updating..." : "Mark Open"}
                    </button>
                  ) : (
                    <button
                      disabled={busyId === a.id}
                      onClick={() => toggleResolve(a.id, true)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {busyId === a.id ? "Updating..." : "Mark Resolved"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const statusOptions = [
  { value: "saved", label: "Saved" },
  { value: "started", label: "Started" },
  { value: "applied", label: "Applied" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "paid", label: "Paid" },
  { value: "claim_submitted", label: "Claim Submitted" },
  { value: "claim_approved", label: "Claim Approved" },
];

export default function MySchemesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);

  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState("applied");

  async function load() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/schemes/my?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateItem(itemId: string) {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    const res = await fetch(`/api/schemes/my/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        status: newStatus,
        label: `Status updated: ${newStatus}`,
        details: note,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Update failed");
      return;
    }

    setNote("");
    setActive(data.item);
    await load();
  }

  const activeScheme = active?.schemeId;

  const statusChip = useMemo(() => {
    const s = active?.status || "";
    if (s === "paid" || s === "approved" || s === "claim_approved") return "bg-green-50 text-green-700";
    if (s === "rejected") return "bg-red-50 text-red-700";
    if (s === "applied" || s === "started") return "bg-yellow-50 text-yellow-700";
    return "bg-slate-100 text-slate-700";
  }, [active?.status]);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Schemes</h1>
                <p className="mt-1 text-slate-600">
                  Save schemes and track application / payment / claim status.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/schemes"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Browse Schemes →
                </Link>
                <Link
                  href="/schemes/pm-kisan"
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  PM-KISAN Assistant →
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
            {/* Left list */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Saved Schemes</div>

              {loading ? (
                <div className="mt-4 text-sm text-slate-600">Loading...</div>
              ) : items.length === 0 ? (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  No saved schemes yet. Open Schemes page and click “Save”.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {items.map((it) => (
                    <button
                      key={it._id}
                      onClick={() => setActive(it)}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-left hover:bg-slate-50",
                        active?._id === it._id ? "bg-green-50 border-green-200" : "bg-white",
                      ].join(" ")}
                    >
                      <div className="text-xs font-semibold text-slate-500">
                        {it.schemeId?.scope === "central" ? "Central" : `State: ${it.schemeId?.state}`}
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {it.schemeId?.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Status: <b>{it.status}</b>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right details */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              {!active ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  Select a scheme from the left to view details and update status.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">
                        {activeScheme?.scope === "central" ? "Central" : `State: ${activeScheme?.state}`}
                      </div>
                      <div className="mt-1 text-xl font-bold text-slate-900">
                        {activeScheme?.title}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {activeScheme?.shortDescription}
                      </div>

                      <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusChip}`}>
                        Current status: {active.status}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/schemes/${activeScheme?.slug}`}
                        className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                      >
                        Open Scheme →
                      </Link>
                      <a
                        href={activeScheme?.officialLink || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Official Portal ↗
                      </a>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-5">
                    <div className="text-sm font-bold text-slate-900">Timeline</div>
                    <div className="mt-3 space-y-2">
                      {(active.timeline || []).slice().reverse().map((t: any, i: number) => (
                        <div key={i} className="rounded-xl border bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                            <div className="text-xs text-slate-600">
                              {t.at ? new Date(t.at).toLocaleString() : ""}
                            </div>
                          </div>
                          {t.details ? <div className="mt-2 text-sm text-slate-700">{t.details}</div> : null}
                        </div>
                      ))}
                      {(active.timeline || []).length === 0 && (
                        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                          No timeline yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Update status */}
                  <div className="mt-6 rounded-2xl border bg-white p-5">
                    <div className="text-sm font-bold text-slate-900">Update Status</div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-600">New Status</div>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                        >
                          {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-slate-600">Note (optional)</div>
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder='e.g., "Applied via CSC on 12 Feb"'
                          className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => updateItem(active._id)}
                      className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Save Update
                    </button>

                    <div className="mt-3 text-xs text-slate-500">
                      This tracker is your personal log (not official government status).
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
"use client";

import AppShell from "@/components/layout/AppShell";
import { useState } from "react";

type RequestItem = {
  id: string;
  farmerName: string;
  farmerPhone: string;
  consultationMode: "phone_call" | "video_call" | "offline_visit";
  discussionType: string;
  problemDetails: string;
  preferredDateTime: string;
  location: string;
  preferredLanguage: string;
  status: "submitted" | "in_review" | "approved" | "rejected" | "completed";
  doctorName: string;
  doctorPhone: string;
  doctorNotes: string;
  scheduledAt: string;
  createdAt: string;
};

const fieldInputClass =
  "rounded-xl border border-slate-300/30 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-green-300/40";

function fmtDate(iso: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function modeLabel(mode: string) {
  if (mode === "phone_call") return "Phone Call";
  if (mode === "video_call") return "Video Call";
  if (mode === "offline_visit") return "Offline Visit";
  return mode;
}

export default function AgroDoctorAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [doctorName, setDoctorName] = useState("Agri Doctor Team");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [busyId, setBusyId] = useState("");

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/agro-doctor/requests?scope=all&adminKey=${encodeURIComponent(adminKey)}`,
        {
          cache: "no-store",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to load requests");
        return;
      }
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: RequestItem["status"]) {
    try {
      setBusyId(id);
      const res = await fetch(`/api/agro-doctor/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminKey,
          status,
          doctorName,
          doctorPhone,
          scheduledAt,
          doctorNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to update request");
        return;
      }
      setRequests((prev) => prev.map((x) => (x.id === id ? data.request : x)));
      alert(`Request status updated to ${status.toUpperCase()}`);
    } finally {
      setBusyId("");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Agro Doctor Admin Panel</h1>
          <p className="mt-1 text-slate-600">
            Review farmer requests and approve/reject/schedule consultations. Status updates send alerts to farmers.
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
              className={fieldInputClass}
            />
            <input
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Doctor name"
              className={fieldInputClass}
            />
            <input
              value={doctorPhone}
              onChange={(e) => setDoctorPhone(e.target.value)}
              placeholder="Doctor phone"
              className={fieldInputClass}
            />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={fieldInputClass}
            />
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Doctor notes (reason, prep steps, medicines to keep ready...)"
              className={`${fieldInputClass} min-h-24 md:col-span-2`}
            />
          </div>

          <button
            onClick={loadRequests}
            className="mt-4 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            {loading ? "Loading..." : "Load Requests"}
          </button>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Requests</h2>
          {requests.length === 0 ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No requests loaded. Enter admin key and load requests.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {r.farmerName} ({r.farmerPhone}) - {r.discussionType}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Mode: {modeLabel(r.consultationMode)} - Preferred: {r.preferredDateTime ? fmtDate(r.preferredDateTime) : "-"}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700">{r.problemDetails}</p>
                  {r.location ? <p className="mt-1 text-xs text-slate-600">Location: {r.location}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">Created: {fmtDate(r.createdAt)}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => updateStatus(r.id, "in_review")}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    >
                      In Review
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => updateStatus(r.id, "approved")}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => updateStatus(r.id, "rejected")}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => updateStatus(r.id, "completed")}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

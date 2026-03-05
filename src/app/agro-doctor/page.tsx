"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

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
  updatedAt: string;
};

type FormState = {
  farmerName: string;
  farmerPhone: string;
  consultationMode: "phone_call" | "video_call" | "offline_visit";
  discussionType: string;
  problemDetails: string;
  preferredDateTime: string;
  location: string;
  preferredLanguage: string;
};

const initialForm: FormState = {
  farmerName: "",
  farmerPhone: "",
  consultationMode: "phone_call",
  discussionType: "Disease Diagnosis",
  problemDetails: "",
  preferredDateTime: "",
  location: "",
  preferredLanguage: "English",
};

const fieldInputClass =
  "mt-1 w-full rounded-xl border border-slate-300/30 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-green-300/40";

function fmtDate(iso: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function toDateTimeInputValue(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60_000);
  return local.toISOString().slice(0, 16);
}

function modeLabel(mode: string) {
  if (mode === "phone_call") return "Phone Call";
  if (mode === "video_call") return "Video Call";
  if (mode === "offline_visit") return "Offline Visit";
  return mode;
}

function statusClass(status: RequestItem["status"]) {
  if (status === "approved") return "bg-green-50 text-green-700";
  if (status === "completed") return "bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "bg-red-50 text-red-700";
  if (status === "in_review") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

export default function AgroDoctorPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupRequestId, setPopupRequestId] = useState("");
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editRequestId, setEditRequestId] = useState("");
  const [editForm, setEditForm] = useState<FormState>(initialForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState("");

  const userId = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("smartAgriUserId") || "" : ""),
    []
  );

  useEffect(() => {
    requireAuthOrRedirect(router.push);
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("smartAgriName") || "";
      setForm((f) => ({ ...f, farmerName: savedName || f.farmerName }));
    }
  }, [router]);

  async function loadRequests() {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/agro-doctor/requests?scope=mine&userId=${encodeURIComponent(userId)}`,
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

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (!form.farmerName.trim() || !form.farmerPhone.trim() || !form.problemDetails.trim()) {
      alert("Please fill name, phone number, and consultation details.");
      return;
    }
    if (form.consultationMode === "offline_visit" && !form.location.trim()) {
      alert("Location is required for offline visit.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/agro-doctor/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          farmerName: form.farmerName,
          farmerPhone: form.farmerPhone,
          consultationMode: form.consultationMode,
          discussionType: form.discussionType,
          problemDetails: form.problemDetails,
          preferredDateTime: form.preferredDateTime,
          location: form.location,
          preferredLanguage: form.preferredLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to submit request");
        return;
      }

      const id = data?.request?.id || "";
      setPopupRequestId(id);
      setShowPopup(true);
      setForm((f) => ({
        ...f,
        consultationMode: "phone_call",
        discussionType: "Disease Diagnosis",
        problemDetails: "",
        preferredDateTime: "",
        location: "",
      }));
      await loadRequests();
      window.dispatchEvent(new Event("smartagri:alerts-updated"));
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(r: RequestItem) {
    setEditRequestId(r.id);
    setEditForm({
      farmerName: r.farmerName || "",
      farmerPhone: r.farmerPhone || "",
      consultationMode: r.consultationMode || "phone_call",
      discussionType: r.discussionType || "Disease Diagnosis",
      problemDetails: r.problemDetails || "",
      preferredDateTime: toDateTimeInputValue(r.preferredDateTime || ""),
      location: r.location || "",
      preferredLanguage: r.preferredLanguage || "English",
    });
    setShowEditPopup(true);
  }

  async function onSaveEditRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !editRequestId || savingEdit) return;
    if (
      !editForm.farmerName.trim() ||
      !editForm.farmerPhone.trim() ||
      !editForm.discussionType.trim() ||
      !editForm.problemDetails.trim()
    ) {
      alert("Please fill name, phone, discussion type, and problem details.");
      return;
    }
    if (editForm.consultationMode === "offline_visit" && !editForm.location.trim()) {
      alert("Location is required for offline visit.");
      return;
    }

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/agro-doctor/requests/${editRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          farmerName: editForm.farmerName,
          farmerPhone: editForm.farmerPhone,
          consultationMode: editForm.consultationMode,
          discussionType: editForm.discussionType,
          problemDetails: editForm.problemDetails,
          preferredDateTime: editForm.preferredDateTime,
          location: editForm.location,
          preferredLanguage: editForm.preferredLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to update request");
        return;
      }
      const updated = data?.request;
      if (updated?.id) {
        setRequests((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        await loadRequests();
      }
      setShowEditPopup(false);
      setEditRequestId("");
      alert("Request updated successfully.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function onDeleteRequest(requestId: string) {
    if (!userId || !requestId || deletingRequestId) return;
    const proceed = window.confirm(
      "Cancel this consultation request? This action cannot be undone."
    );
    if (!proceed) return;

    try {
      setDeletingRequestId(requestId);
      const res = await fetch(`/api/agro-doctor/requests/${requestId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to cancel request");
        return;
      }

      setRequests((prev) => prev.filter((x) => x.id !== requestId));
      alert("Request cancelled successfully.");
      window.dispatchEvent(new Event("smartagri:alerts-updated"));
    } finally {
      setDeletingRequestId("");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Agro Doctor</h1>
          <p className="mt-1 text-slate-600">
            Talk to a real agricultural professional by phone call, video call, or offline farm visit.
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Request Consultation</h2>
          <form onSubmit={onSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Farmer Name *">
              <input
                value={form.farmerName}
                onChange={(e) => setForm((f) => ({ ...f, farmerName: e.target.value }))}
                className={fieldInputClass}
                placeholder="Enter your full name"
              />
            </Field>
            <Field label="Phone Number *">
              <input
                value={form.farmerPhone}
                onChange={(e) => setForm((f) => ({ ...f, farmerPhone: e.target.value }))}
                className={fieldInputClass}
                placeholder="+91..."
              />
            </Field>

            <Field label="Consultation Mode *">
              <select
                value={form.consultationMode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, consultationMode: e.target.value as FormState["consultationMode"] }))
                }
                className={fieldInputClass}
              >
                <option value="phone_call">Phone Call</option>
                <option value="video_call">Video Call</option>
                <option value="offline_visit">Offline Visit</option>
              </select>
            </Field>

            <Field label="Discussion Type *">
              <select
                value={form.discussionType}
                onChange={(e) => setForm((f) => ({ ...f, discussionType: e.target.value }))}
                className={fieldInputClass}
              >
                <option>Disease Diagnosis</option>
                <option>Pest Attack</option>
                <option>Soil Health Issue</option>
                <option>Irrigation Problem</option>
                <option>Yield Loss</option>
                <option>Market or Price Advisory</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Preferred Date & Time">
              <input
                type="datetime-local"
                value={form.preferredDateTime}
                onChange={(e) => setForm((f) => ({ ...f, preferredDateTime: e.target.value }))}
                className={fieldInputClass}
              />
            </Field>

            <Field label="Preferred Language">
              <input
                value={form.preferredLanguage}
                onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value }))}
                className={fieldInputClass}
                placeholder="English / Hindi / Odia..."
              />
            </Field>

            {form.consultationMode === "offline_visit" ? (
              <div className="md:col-span-2">
                <Field label="Farm Location *">
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className={fieldInputClass}
                    placeholder="Village, block, district, landmark"
                  />
                </Field>
              </div>
            ) : null}

            <div className="md:col-span-2">
              <Field label="Problem Details *">
                <textarea
                  value={form.problemDetails}
                  onChange={(e) => setForm((f) => ({ ...f, problemDetails: e.target.value }))}
                  className={`${fieldInputClass} min-h-28`}
                  placeholder="Describe crop stage, symptoms, weather condition, and what treatment already used."
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Agro Doctor Request"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">My Consultation Requests</h2>
            <button
              onClick={loadRequests}
              className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No requests yet. Submit your first Agro Doctor consultation request above.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {r.discussionType} - {modeLabel(r.consultationMode)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Requested: {fmtDate(r.createdAt)}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(r.status)}`}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700">{r.problemDetails}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    Preferred time: <b>{r.preferredDateTime ? fmtDate(r.preferredDateTime) : "Not specified"}</b>
                    {r.location ? (
                      <>
                        {" "}
                        - Location: <b>{r.location}</b>
                      </>
                    ) : null}
                  </p>

                  {r.status === "approved" || r.status === "completed" ? (
                    <div className="mt-3 rounded-lg bg-green-50 p-3 text-xs text-green-800">
                      <p>
                        Doctor: <b>{r.doctorName || "Assigned soon"}</b>
                        {r.doctorPhone ? (
                          <>
                            {" "}
                            - Contact: <b>{r.doctorPhone}</b>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-1">
                        Scheduled: <b>{r.scheduledAt ? fmtDate(r.scheduledAt) : "Will be shared soon"}</b>
                      </p>
                      {r.doctorNotes ? <p className="mt-1">Notes: {r.doctorNotes}</p> : null}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openEditModal(r)}
                      className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Edit Request
                    </button>
                    <button
                      onClick={() => onDeleteRequest(r.id)}
                      disabled={deletingRequestId === r.id}
                      title="Cancel Request"
                      aria-label={`Cancel request ${r.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingRequestId === r.id ? "Cancelling..." : "Cancel Request"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f172a] p-5 shadow-2xl">
            <div className="text-lg font-bold text-slate-100">Request Received</div>
            <p className="mt-2 text-sm text-slate-200">
              Your Agro Doctor consultation request has been received and forwarded to the doctor team.
            </p>
            <p className="mt-2 text-xs text-slate-300">
              Request ID: <b>{popupRequestId || "-"}</b>
            </p>
            <p className="mt-1 text-xs text-slate-300">
              You will receive approval notification in Alerts when doctor approves.
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {showEditPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0f172a] p-5 shadow-2xl">
            <div className="text-lg font-bold text-slate-100">Edit Consultation Request</div>
            <p className="mt-1 text-xs text-slate-300">Request ID: {editRequestId || "-"}</p>

            <form onSubmit={onSaveEditRequest} className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Farmer Name *">
                <input
                  value={editForm.farmerName}
                  onChange={(e) => setEditForm((f) => ({ ...f, farmerName: e.target.value }))}
                  className={fieldInputClass}
                />
              </Field>
              <Field label="Phone Number *">
                <input
                  value={editForm.farmerPhone}
                  onChange={(e) => setEditForm((f) => ({ ...f, farmerPhone: e.target.value }))}
                  className={fieldInputClass}
                />
              </Field>

              <Field label="Consultation Mode *">
                <select
                  value={editForm.consultationMode}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      consultationMode: e.target.value as FormState["consultationMode"],
                    }))
                  }
                  className={fieldInputClass}
                >
                  <option value="phone_call">Phone Call</option>
                  <option value="video_call">Video Call</option>
                  <option value="offline_visit">Offline Visit</option>
                </select>
              </Field>

              <Field label="Discussion Type *">
                <select
                  value={editForm.discussionType}
                  onChange={(e) => setEditForm((f) => ({ ...f, discussionType: e.target.value }))}
                  className={fieldInputClass}
                >
                  <option>Disease Diagnosis</option>
                  <option>Pest Attack</option>
                  <option>Soil Health Issue</option>
                  <option>Irrigation Problem</option>
                  <option>Yield Loss</option>
                  <option>Market or Price Advisory</option>
                  <option>Other</option>
                </select>
              </Field>

              <Field label="Preferred Date & Time">
                <input
                  type="datetime-local"
                  value={editForm.preferredDateTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, preferredDateTime: e.target.value }))}
                  className={fieldInputClass}
                />
              </Field>

              <Field label="Preferred Language">
                <input
                  value={editForm.preferredLanguage}
                  onChange={(e) => setEditForm((f) => ({ ...f, preferredLanguage: e.target.value }))}
                  className={fieldInputClass}
                />
              </Field>

              {editForm.consultationMode === "offline_visit" ? (
                <div className="md:col-span-2">
                  <Field label="Farm Location *">
                    <input
                      value={editForm.location}
                      onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                      className={fieldInputClass}
                    />
                  </Field>
                </div>
              ) : null}

              <div className="md:col-span-2">
                <Field label="Problem Details *">
                  <textarea
                    value={editForm.problemDetails}
                    onChange={(e) => setEditForm((f) => ({ ...f, problemDetails: e.target.value }))}
                    className={`${fieldInputClass} min-h-28`}
                  />
                </Field>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPopup(false);
                    setEditRequestId("");
                  }}
                  className="rounded-lg border border-slate-500 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700">{label}</div>
      {children}
    </div>
  );
}

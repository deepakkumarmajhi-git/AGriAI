"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useEffect, useState } from "react";

const checklist = [
  { title: "Aadhaar linked to mobile", desc: "Required for eKYC and verification." },
  { title: "Bank account + IFSC", desc: "Payment will go directly to your bank." },
  { title: "Land/cultivation details", desc: "As per eligibility rules." },
  { title: "eKYC completed", desc: "Complete on PM-KISAN portal/CSC." },
];

export default function PMKisanPage() {
  const [loading, setLoading] = useState(true);
  const [tracker, setTracker] = useState<any>(null);

  const [farmerName, setFarmerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");

  const [timelineLabel, setTimelineLabel] = useState("eKYC completed");
  const [timelineDetails, setTimelineDetails] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  async function load() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    setLoading(true);
    const res = await fetch(`/api/pm-kisan?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    setTracker(data.tracker || null);

    if (data.tracker) {
      setFarmerName(data.tracker.farmerName || "");
      setMobile(data.tracker.mobile || "");
      setAadhaarLast4(data.tracker.aadhaarLast4 || "");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProfile() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    const res = await fetch("/api/pm-kisan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, farmerName, mobile, aadhaarLast4 }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Save failed");
      return;
    }
    setTracker(data.tracker);
    alert("Saved ✅");
  }

  async function addTimeline() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    const res = await fetch("/api/pm-kisan/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, label: timelineLabel, details: timelineDetails }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Update failed");
      return;
    }
    setTimelineDetails("");
    setTracker(data.tracker);
  }

  async function addPayment() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return;

    const res = await fetch("/api/pm-kisan/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: Number(payAmount || 0), note: payNote }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Payment add failed");
      return;
    }
    setPayAmount("");
    setPayNote("");
    setTracker(data.tracker);
  }

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">PM-KISAN Assistant</h1>
                <p className="mt-1 text-slate-600">
                  Step-by-step guidance + your personal status/payment tracker.
                </p>
              </div>

              <a
                href="https://pmkisan.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Open Official Portal ↗
              </a>
            </div>
          </div>

          {/* checklist */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Checklist (For Application)</div>
              <div className="mt-3 space-y-3">
                {checklist.map((c, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4">
                    <div className="text-sm font-bold text-slate-900">{c.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* profile */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Your Details (for tracking)</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Farmer Name">
                  <input className="input" value={farmerName} onChange={(e) => setFarmerName(e.target.value)} />
                </Field>
                <Field label="Mobile">
                  <input className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </Field>
                <Field label="Aadhaar last 4 digits">
                  <input className="input" value={aadhaarLast4} onChange={(e) => setAadhaarLast4(e.target.value)} />
                </Field>
              </div>

              <button onClick={saveProfile} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-black">
                Save
              </button>

              <div className="mt-3 text-xs text-slate-500">
                This tracker is personal (not official). Use portal for official status.
              </div>
            </div>
          </div>

          {/* timeline + payments */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Status Updates (Timeline)</div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Update type">
                  <select className="input" value={timelineLabel} onChange={(e) => setTimelineLabel(e.target.value)}>
                    <option>eKYC completed</option>
                    <option>Applied via CSC</option>
                    <option>Bank details corrected</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </Field>
                <Field label="Details (optional)">
                  <input className="input" value={timelineDetails} onChange={(e) => setTimelineDetails(e.target.value)} placeholder="Any note..." />
                </Field>
              </div>

              <button onClick={addTimeline} className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700">
                Add Update
              </button>

              <div className="mt-4 space-y-2">
                {(tracker?.timeline || []).slice().reverse().map((t: any, i: number) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between gap-2">
                      <div className="text-sm font-bold text-slate-900">{t.label}</div>
                      <div className="text-xs text-slate-600">{t.at ? new Date(t.at).toLocaleString() : ""}</div>
                    </div>
                    {t.details ? <div className="mt-1 text-sm text-slate-700">{t.details}</div> : null}
                  </div>
                ))}
                {(tracker?.timeline || []).length === 0 && (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No updates yet.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-lg font-bold text-slate-900">Payment Tracker (Personal)</div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Amount received (₹)">
                  <input className="input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="e.g., 2000" />
                </Field>
                <Field label="Note">
                  <input className="input" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="e.g., installment 15" />
                </Field>
              </div>

              <button onClick={addPayment} className="mt-4 w-full rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700">
                Add Payment
              </button>

              <div className="mt-4 space-y-2">
                {(tracker?.payments || []).slice().reverse().map((p: any, i: number) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between gap-2">
                      <div className="text-sm font-bold text-slate-900">₹ {p.amount}</div>
                      <div className="text-xs text-slate-600">{p.at ? new Date(p.at).toLocaleString() : ""}</div>
                    </div>
                    {p.note ? <div className="mt-1 text-sm text-slate-700">{p.note}</div> : null}
                  </div>
                ))}
                {(tracker?.payments || []).length === 0 && (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No payments added yet.</div>
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            .input {
              margin-top: 6px;
              width: 100%;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
              padding: 10px 12px;
              outline: none;
            }
            .input:focus {
              box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
            }
          `}</style>
        </div>
      </div>
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
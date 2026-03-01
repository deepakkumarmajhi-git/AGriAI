"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppShell from "@/components/layout/AppShell";

export default function FarmAINewPage() {
  const router = useRouter();

  const [cropName, setCropName] = useState("Rice");
  const [city, setCity] = useState("Bhubaneswar");
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [irrigationMethod, setIrrigationMethod] =
    useState<"drip" | "sprinkler" | "flood" | "manual" | "unknown">("unknown");
  const [scanDaysPerWeek, setScanDaysPerWeek] = useState(3);
  const [loading, setLoading] = useState(false);

  async function createPlan() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) return alert("Please login first.");

    setLoading(true);
    try {
      const res = await fetch("/api/farm-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          cropName,
          location: { city },
          sowingDate,
          irrigationMethod,
          scanDaysPerWeek,
        }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Failed to create plan");

      router.push(`/farm-ai/${data.plan._id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Create Farm AI Plan</h1>
            <p className="mt-1 text-sm text-slate-600">
              AI will guide you from sowing → irrigation → disease risk → harvesting.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <Field label="Crop">
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
              />
            </Field>

            <Field label="City / District">
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </Field>

            <Field label="Sowing Date">
              <input
                type="date"
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
              />
            </Field>

            <Field label="Irrigation Method">
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                value={irrigationMethod}
                onChange={(e) => setIrrigationMethod(e.target.value as any)}
              >
                <option value="unknown">Unknown</option>
                <option value="drip">Drip</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood</option>
                <option value="manual">Manual</option>
              </select>
            </Field>

            <Field label="Scan Days per Week (3–4 recommended)">
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                value={scanDaysPerWeek}
                onChange={(e) => setScanDaysPerWeek(Number(e.target.value))}
              >
                <option value={3}>3 days/week</option>
                <option value={4}>4 days/week</option>
              </select>
            </Field>

            <button
              onClick={createPlan}
              disabled={loading}
              className="w-full rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
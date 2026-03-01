"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PlanResp = {
  ok: boolean;
  locationName: string;
  crop: string;
  soilType: string;
  soil: {
    latestMoisture: number | null;
    avgMoisture: number | null;
    trend: number;
  };
  schedule: {
    date: string;
    tMax: number;
    rainProb: number;
    rainSum: number;
    recommendedLitersPerAcre: number;
    action: string;
  }[];
  tips: string[];
  note: string;
};

export default function IrrigationPage() {
  const router = useRouter();

  const [city, setCity] = useState("");
  const [crop, setCrop] = useState("Wheat");
  const [soilType, setSoilType] = useState("Loam");

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResp | null>(null);

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  useEffect(() => {
    const savedCity = localStorage.getItem("smartAgriCity") || "Bhubaneswar, India";
    setCity(savedCity);
  }, []);

  const moistureLabel = useMemo(() => {
    if (!plan?.soil) return "—";
    if (plan.soil.latestMoisture == null) return "No sensor data";
    return `${Math.round(plan.soil.latestMoisture)}%`;
  }, [plan]);

  async function generatePlan() {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      router.push("/auth/login");
      return;
    }

    if (!city.trim()) return alert("Please enter your city/district.");
    if (!crop.trim()) return alert("Please enter crop.");

    setLoading(true);
    setPlan(null);

    try {
      const res = await fetch("/api/irrigation/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          city,
          crop,
          soilType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Failed to generate plan");
        return;
      }

      setPlan(data);
      localStorage.setItem("smartAgriCity", city);
    } catch (e: any) {
      alert(e?.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Precision Irrigation Planning</h1>
          <p className="mt-1 text-slate-600">
            Uses soil moisture history + 7-day forecast to recommend irrigation schedule (MVP rules).
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">City / District</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                placeholder="e.g., Bhubaneswar, India"
              />
              <p className="mt-1 text-xs text-slate-500">
                Tip: Use district/city name for best forecast.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Soil Type</label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
              >
                <option>Loam</option>
                <option>Sandy</option>
                <option>Clay</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Crop</label>
              <input
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
                placeholder="e.g., Paddy, Wheat, Tomato, Cotton"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Generating..." : "Generate Plan"}
              </button>
            </div>
          </div>

          {plan ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 font-semibold">
                  Location: {plan.locationName}
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold">
                  Latest moisture: {moistureLabel}
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold">
                  Avg: {plan.soil.avgMoisture == null ? "—" : `${plan.soil.avgMoisture}%`}
                </span>
                <span className="rounded-full bg-white px-3 py-1 font-semibold">
                  Trend: {plan.soil.trend}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{plan.note}</p>
            </div>
          ) : null}
        </div>

        {/* Schedule */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">7-Day Irrigation Schedule</h2>

          {!plan ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Generate a plan to view schedule.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-600">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Temp (max)</th>
                    <th className="py-2 pr-4">Rain chance</th>
                    <th className="py-2 pr-4">Rain (mm)</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Recommended (L/acre)</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.schedule.map((d) => (
                    <tr key={d.date} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{d.date}</td>
                      <td className="py-2 pr-4">{d.tMax}°C</td>
                      <td className="py-2 pr-4">{d.rainProb}%</td>
                      <td className="py-2 pr-4">{d.rainSum.toFixed(1)}</td>
                      <td className="py-2 pr-4 font-semibold text-slate-900">{d.action}</td>
                      <td className="py-2 pr-4">{d.recommendedLitersPerAcre.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-500">
                These are advisory values. We’ll add crop stage + ET0 + satellite later for higher accuracy.
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Water Saving Tips</h2>
          {!plan ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Generate a plan to see tips.</div>
          ) : (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
              {plan.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
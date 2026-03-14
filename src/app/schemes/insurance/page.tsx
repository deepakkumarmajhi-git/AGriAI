"use client";

import AppShell from "@/components/layout/AppShell";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type AlertItem = {
  type: string;
  level: string;
  message: string;
};

type WeatherData = {
  alerts?: AlertItem[];
};

export default function InsuranceGuidePage() {
  const [mounted, setMounted] = useState(false);
  const [city, setCity] = useState("Bhubaneswar");
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const [crop, setCrop] = useState("Rice");
  const [season, setSeason] = useState<"kharif" | "rabi" | "zaid">("kharif");

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const savedCity = localStorage.getItem("smartAgriCity");
      if (savedCity) {
        setCity(savedCity);
      }
    }
  }, []);

  async function loadWeather(selectedCity?: string) {
    const cityToUse = selectedCity || city;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/weather/forecast?city=${encodeURIComponent(cityToUse)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.error("Failed to load weather:", error);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;
    loadWeather(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const alerts = weather?.alerts || [];

  const riskLevel = alerts.some((a) => a.level === "critical")
    ? "High"
    : alerts.some((a) => a.level === "warning")
    ? "Medium"
    : "Low";

  if (!mounted) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-80px)] bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">
                Crop Insurance Guidance
              </h1>
              <p className="mt-2 text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Crop Insurance Guidance
                </h1>
                <p className="mt-1 text-slate-600">
                  Suggests insurance focus based on weather risk signals (MVP).
                </p>
              </div>
              <a
                href="https://pmfby.gov.in/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Open PMFBY Portal ↗
              </a>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-sm font-semibold text-slate-700">City</div>
                <input
                  value={city}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCity(value);

                    if (typeof window !== "undefined") {
                      localStorage.setItem("smartAgriCity", value);
                    }
                  }}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700">Crop</div>
                <input
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700">Season</div>
                <select
                  value={season}
                  onChange={(e) =>
                    setSeason(e.target.value as "kharif" | "rabi" | "zaid")
                  }
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="kharif">Kharif</option>
                  <option value="rabi">Rabi</option>
                  <option value="zaid">Zaid</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => loadWeather()}
              className="mt-4 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              {loading ? "Refreshing..." : "Refresh Risk Signals"}
            </button>

            <div className="mt-4 rounded-2xl bg-slate-50 p-5">
              <div className="text-sm font-bold text-slate-900">
                Risk level (from alerts):
              </div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">
                {riskLevel}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                Crop: <b>{crop}</b> • Season: <b>{season.toUpperCase()}</b>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">Weather Alerts</div>

            {alerts.length === 0 ? (
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No alerts right now. Risk appears low.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between gap-2">
                      <div className="text-sm font-bold text-slate-900">
                        {a.type}
                      </div>
                      <div className="text-xs font-semibold text-slate-700">
                        {a.level.toUpperCase()}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-700">{a.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-bold text-slate-900">
              Insurance Recommendation (MVP)
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <b>What to choose:</b> PMFBY is usually the primary crop insurance
              option. Check notified crops/areas and enrollment deadline.
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm font-bold text-slate-900">
                  If risk is HIGH
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Enroll immediately (don’t miss cut-off date).</li>
                  <li>• Keep sowing proof / receipts.</li>
                  <li>• Take photos during damage for claim support.</li>
                </ul>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm font-bold text-slate-900">
                  If risk is LOW/MEDIUM
                </div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>• Still enroll if crop is notified (safe protection).</li>
                  <li>• Maintain records of crop inputs.</li>
                  <li>• Track local advisories.</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              This is guidance, not official claim approval. Follow PMFBY/Bank/CSC
              instructions.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
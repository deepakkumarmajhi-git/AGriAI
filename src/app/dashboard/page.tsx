"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ScanItem = {
  id: string;
  disease: string;
  confidence: number;
  createdAt: string;
  imageName: string;
};

type AlertItem = {
  id: string;
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
  resolved: boolean;
  createdAt: string;
};

type SensorLatest = {
  moisture: number | null;
  temperature: number | null;
  humidity: number | null;
  createdAt: string;
} | null;

type WeatherForecast = {
  source?: "live" | "cache" | "fallback-cache";
  cachedAt?: string;

  locationName: string;
  latitude: number;
  longitude: number;

  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    rain: number;
    showers: number;
    wind_speed_10m?: number;
  };

  next_hour?: {
    time: string | null;
    precip_probability: number | null;
  };

  alerts?: { type: string; level: "info" | "warning" | "critical"; message: string }[];
} | null;

const WEATHER_REFRESH_MS = 5 * 60 * 1000; // 5 minutes (cache is 6 hours, but this keeps UI responsive)

function Card({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-sm text-slate-500">{sub}</p> : null}
    </div>
  );
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatMMSS(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const router = useRouter();

  const [scans, setScans] = useState<ScanItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [sensorLatest, setSensorLatest] = useState<SensorLatest>(null);

  const [weatherCity, setWeatherCity] = useState("");
  const [weather, setWeather] = useState<WeatherForecast>(null);

  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const weatherInFlightRef = useRef(false);

  // Countdown state
  const [nextRefreshInMs, setNextRefreshInMs] = useState<number>(WEATHER_REFRESH_MS);
  const nextRefreshAtRef = useRef<number>(Date.now() + WEATHER_REFRESH_MS);

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  const name = useMemo(() => {
    if (typeof window === "undefined") return "Farmer";
    return localStorage.getItem("smartAgriName") || "Farmer";
  }, []);

  useEffect(() => {
    const savedCity = localStorage.getItem("smartAgriCity") || "Bhubaneswar, India";
    setWeatherCity(savedCity);
  }, []);

  async function loadCore() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setLoading(true);

      const [scansRes, alertsRes, sensorsRes] = await Promise.all([
        fetch(`/api/scans?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/alerts?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/sensors?userId=${encodeURIComponent(userId)}`),
      ]);

      const scansData = await scansRes.json();
      const alertsData = await alertsRes.json();
      const sensorsData = await sensorsRes.json();

      if (scansRes.ok) setScans(scansData.scans || []);
      if (alertsRes.ok) setAlerts(alertsData.alerts || []);
      if (sensorsRes.ok) setSensorLatest(sensorsData.latest || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function resetWeatherCountdown() {
    nextRefreshAtRef.current = Date.now() + WEATHER_REFRESH_MS;
    setNextRefreshInMs(WEATHER_REFRESH_MS);
  }

  async function loadForecast(city: string, resetCountdown = true) {
    if (!city) return;
    if (weatherInFlightRef.current) return;

    try {
      const userId = localStorage.getItem("smartAgriUserId") || "";
      weatherInFlightRef.current = true;
      setWeatherLoading(true);
      setWeatherError(null);

      const res = await fetch(`/api/weather/forecast?city=${encodeURIComponent(city)}&userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        setWeatherError(data?.error || "Weather forecast failed");
        setWeather(null);
        return;
      }

      setWeather(data);

      if (resetCountdown) resetWeatherCountdown();
    } catch (e: any) {
      setWeatherError(e?.message || "Weather forecast failed");
      setWeather(null);
    } finally {
      setWeatherLoading(false);
      weatherInFlightRef.current = false;
    }
  }

  useEffect(() => {
    loadCore();
  }, []);

  useEffect(() => {
    if (!weatherCity) return;
    resetWeatherCountdown();
    loadForecast(weatherCity, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherCity]);

  // auto refresh UI (backend cache handles 6h)
  useEffect(() => {
    if (!weatherCity) return;
    const t = setInterval(() => loadForecast(weatherCity, true), WEATHER_REFRESH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherCity]);

  // countdown tick
  useEffect(() => {
    const tick = setInterval(() => {
      setNextRefreshInMs(nextRefreshAtRef.current - Date.now());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const moistureText = sensorLatest?.moisture == null ? "—" : `${Math.round(sensorLatest.moisture)}%`;

  const tempText =
    weather?.current?.temperature_2m == null ? "0" : `${Math.round(weather.current.temperature_2m)}°C`;

  const humText =
    weather?.current?.relative_humidity_2m == null ? "—" : `${Math.round(weather.current.relative_humidity_2m)}%`;

  const rainChanceText =
    weather?.next_hour?.precip_probability == null
      ? "—"
      : `${Math.round(weather.next_hour.precip_probability)}%`;

  const precipMmText =
    weather?.current?.precipitation == null ? "—" : `${Number(weather.current.precipitation).toFixed(1)} mm`;

  const sourceText =
    weather?.source === "live"
      ? "Live"
      : weather?.source === "cache"
      ? "Cached"
      : weather?.source === "fallback-cache"
      ? "Offline fallback"
      : "—";

  const nextRefreshText = formatMMSS(nextRefreshInMs);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Welcome, {name} 👋</h1>
              {/* <p className="mt-1 text-slate-600">
                Weather forecasting (India-ready): cached 6 hours + fallback + alerts.
              </p> */}

              <button
                onClick={() => router.push("/weather")}
                className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Open Weather Forecast →
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Weather Auto-Refresh</div>
              <div className="mt-1">
                Next refresh in <b>{nextRefreshText}</b>
              </div>
              {/* <div className="mt-1 text-xs text-slate-500">Source: {sourceText}</div> */}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Your City (District/City)</label>
              <input
                value={weatherCity}
                onChange={(e) => setWeatherCity(e.target.value)}
                placeholder="e.g., Bhubaneswar, India"
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
              />
              {/* <p className="mt-1 text-xs text-slate-500">
                Example: “Bhubaneswar, India”, “Cuttack, India”, “Balasore, India”
              </p> */}
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  localStorage.setItem("smartAgriCity", weatherCity);
                  loadForecast(weatherCity, true);
                }}
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                disabled={weatherLoading || !weatherCity}
              >
                {weatherLoading ? "Fetching..." : "Refresh Weather"}
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            {weatherError ? (
              <span className="text-red-600">Weather error: {weatherError}</span>
            ) : weather?.current?.time ? (
              <>
                Forecast time: <b>{fmtTime(weather.current.time)}</b> • CachedAt:{" "}
                {weather.cachedAt ? fmtTime(weather.cachedAt) : "—"} • Source: {sourceText}
              </>
            ) : (
              "Weather not loaded yet."
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Soil Moisture"
            value={moistureText}
            sub={sensorLatest?.createdAt ? `Last: ${fmtTime(sensorLatest.createdAt)}` : "Use Simulator to send data"}
          />
          <Card title="Temperature" value={tempText} sub="Forecast (current)" />
          <Card title="Humidity" value={humText} sub="Forecast (current)" />
          <Card title="Rain Chance (Next Hour)" value={rainChanceText} sub={`Current precip: ${precipMmText}`} />
        </div>

        {/* Extreme alerts preview */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Weather Alerts</h2>
            <button
              onClick={() => router.push("/weather")}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              View Details
            </button>
          </div>

          {!weather?.alerts?.length ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No alerts right now.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {weather.alerts.slice(0, 3).map((a, i) => (
                <div key={i} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{a.type}</p>
                    <span className="text-xs text-slate-500">{a.level.toUpperCase()}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scans + Alerts blocks remain as before */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Scans</h2>
              <button
                onClick={() => router.push("/scan")}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                New Scan
              </button>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-slate-600">Loading...</p>
            ) : scans.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No scans yet. Go to <b>Scan Leaf</b> and upload an image.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {scans.map((s) => (
                  <div key={s.id} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{s.disease}</p>
                        <p className="text-sm text-slate-600">
                          Confidence: {(s.confidence * 100).toFixed(0)}% • Image: {s.imageName || "N/A"}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">{fmtTime(s.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Alerts</h2>
              <button
                onClick={() => router.push("/alerts")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                View All
              </button>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-slate-600">Loading...</p>
            ) : alerts.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No alerts yet. Alerts will appear after scans or sensor rules.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {alerts.slice(0, 5).map((a) => (
                  <div key={a.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <span className="text-xs text-slate-500">{a.level.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{a.message}</p>
                    <p className="mt-2 text-xs text-slate-500">{fmtTime(a.createdAt)}</p>
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

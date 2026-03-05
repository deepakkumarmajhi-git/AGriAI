"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type ScanItem = {
  id: string;
  disease: string;
  confidence: number;
  createdAt: string;
  imageName: string;
};

type PlanRisk = {
  name: string;
  risk: "low" | "medium" | "high";
  reason: string;
  prevention: string;
  watchFor: string;
};

type PlanIrrigation = {
  date: string;
  recommendation: string;
  reason: string;
  intensity: "low" | "medium" | "high";
};

type FarmPlan = {
  _id: string;
  cropName: string;
  stage: "planning" | "sown" | "vegetative" | "flowering" | "fruiting" | "harvest-ready" | "harvested";
  sowingDate: string;
  location?: {
    city?: string;
    district?: string;
    state?: string;
  };
  scanPlan?: {
    daysPerWeek?: number;
    lastScanAt?: string;
    nextScanDueAt?: string;
    adherenceScore?: number;
  };
  linkedScans?: {
    scanId?: string;
    date?: string;
    result?: string;
    confidence?: number;
  }[];
  latestAdvice?: {
    generatedAt?: string;
    todayTasks?: string[];
    irrigationNext7Days?: PlanIrrigation[];
    diseaseRisks?: PlanRisk[];
    summary?: string;
  };
  createdAt?: string;
  updatedAt?: string;
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
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
} | null;

const WEATHER_REFRESH_MS = 5 * 60 * 1000; // 5 minutes (cache is 6 hours, but this keeps UI responsive)

type MetricKind = "moisture" | "temperature" | "humidity" | "rain";

const metricPalette: Record<
  MetricKind,
  {
    c1: string;
    c2: string;
    c3: string;
    border: string;
    badge: string;
    bar: string;
    value: string;
  }
> = {
  moisture: {
    c1: "rgba(56, 189, 248, 0.22)",
    c2: "rgba(14, 165, 233, 0.16)",
    c3: "rgba(59, 130, 246, 0.16)",
    border: "border-cyan-100",
    badge: "bg-cyan-100 text-cyan-700",
    bar: "from-cyan-500 to-sky-500",
    value: "text-cyan-700",
  },
  temperature: {
    c1: "rgba(251, 146, 60, 0.22)",
    c2: "rgba(239, 68, 68, 0.18)",
    c3: "rgba(245, 158, 11, 0.16)",
    border: "border-orange-100",
    badge: "bg-orange-100 text-orange-700",
    bar: "from-orange-500 to-rose-500",
    value: "text-orange-700",
  },
  humidity: {
    c1: "rgba(99, 102, 241, 0.22)",
    c2: "rgba(168, 85, 247, 0.18)",
    c3: "rgba(59, 130, 246, 0.14)",
    border: "border-indigo-100",
    badge: "bg-indigo-100 text-indigo-700",
    bar: "from-indigo-500 to-violet-500",
    value: "text-indigo-700",
  },
  rain: {
    c1: "rgba(14, 165, 233, 0.2)",
    c2: "rgba(16, 185, 129, 0.16)",
    c3: "rgba(59, 130, 246, 0.16)",
    border: "border-sky-100",
    badge: "bg-sky-100 text-sky-700",
    bar: "from-sky-500 to-emerald-500",
    value: "text-sky-700",
  },
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function extractNumber(value: string) {
  const m = value.match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function metricIntensity(kind: MetricKind, value: string) {
  const n = extractNumber(value);
  if (n == null) return 16;
  if (kind === "temperature") {
    return clamp(((n + 5) / 50) * 100, 0, 100);
  }
  return clamp(n, 0, 100);
}

function metricLabel(kind: MetricKind, value: string) {
  const n = extractNumber(value);
  if (n == null) return "No data";

  if (kind === "moisture") {
    if (n < 35) return "Dry soil";
    if (n <= 70) return "Balanced";
    return "High moisture";
  }

  if (kind === "temperature") {
    if (n < 20) return "Cool";
    if (n <= 32) return "Optimal";
    return "Heat risk";
  }

  if (kind === "humidity") {
    if (n < 45) return "Low RH";
    if (n <= 75) return "Normal RH";
    return "High RH";
  }

  if (n < 30) return "Low rain";
  if (n <= 70) return "Possible rain";
  return "Rain likely";
}

function MetricCard({
  kind,
  title,
  value,
  sub,
}: {
  kind: MetricKind;
  title: string;
  value: string;
  sub?: string;
}) {
  const tone = metricPalette[kind];
  const intensity = metricIntensity(kind, value);
  const stateText = metricLabel(kind, value);

  const styleVars = {
    "--metric-c1": tone.c1,
    "--metric-c2": tone.c2,
    "--metric-c3": tone.c3,
    "--metric-opacity": String(0.42 + intensity / 190),
    "--metric-speed": `${Math.max(10, 24 - intensity / 6)}s`,
  } as CSSProperties;

  return (
    <div className={`metric-animated rounded-2xl border bg-white p-5 shadow-sm ${tone.border}`} style={styleVars}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.badge}`}>{stateText}</span>
      </div>
      <p className={`mt-2 text-3xl font-bold ${tone.value}`}>{value}</p>
      {sub ? <p className="mt-1 text-sm text-slate-500">{sub}</p> : null}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar} transition-all duration-700`}
          style={{ width: `${Math.max(8, Math.round(intensity))}%` }}
        />
      </div>
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

function stageProgress(stage: FarmPlan["stage"] | string | undefined) {
  switch (stage) {
    case "planning":
      return 10;
    case "sown":
      return 24;
    case "vegetative":
      return 44;
    case "flowering":
      return 64;
    case "fruiting":
      return 80;
    case "harvest-ready":
      return 94;
    case "harvested":
      return 100;
    default:
      return 20;
  }
}

function toShortDayLabel(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function weatherImpactScore(tempMax: number, rainChance: number, rainMm: number) {
  let score = 84;
  const tPenalty = Math.max(0, Math.abs(tempMax - 28) - 4) * 5.2;
  score -= tPenalty;

  if (rainChance >= 70) score -= (rainChance - 70) * 0.45;
  if (rainChance <= 15 && rainMm < 1) score -= (15 - rainChance) * 0.7;
  if (rainMm >= 14) score -= (rainMm - 14) * 0.75;

  return clamp(Math.round(score), 18, 96);
}

function scanHealthScore(scans: FarmPlan["linkedScans"] = []) {
  if (!scans.length) return 62;
  const recent = [...scans].slice(-4);

  let score = 72;
  for (const s of recent) {
    const result = String(s.result || "").toLowerCase();
    const conf = clamp(Number(s.confidence || 0), 0, 1);
    if (result && result !== "healthy") score -= conf * 22;
    else score += conf * 7;
  }

  return clamp(Math.round(score), 22, 96);
}

function riskWeight(risk?: string) {
  if (risk === "high") return 3;
  if (risk === "medium") return 2;
  return 1;
}

function TrendLine({
  title,
  subtitle,
  labels,
  values,
  stroke,
  fill,
}: {
  title: string;
  subtitle: string;
  labels: string[];
  values: number[];
  stroke: string;
  fill: string;
}) {
  const points = values.length >= 2 ? values : [values[0] ?? 0, values[0] ?? 0];
  const width = 320;
  const height = 130;
  const pad = 16;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);

  const mapped = points.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePath = mapped.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L ${mapped[mapped.length - 1].x},${height - pad} L ${mapped[0].x},${height - pad} Z`;

  const previewLabels = labels.length >= 3
    ? [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]]
    : labels;

  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-slate-900">{title}</div>
          <div className="text-[11px] text-slate-600">{subtitle}</div>
        </div>
        <div className="text-right text-[11px] text-slate-500">
          <div>Min: {Math.round(min)}</div>
          <div>Max: {Math.round(max)}</div>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-28 w-full">
        <path d={areaPath} fill={fill} />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
        {mapped.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.8} fill={stroke} />
        ))}
      </svg>

      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
        {previewLabels.map((x, i) => (
          <span key={`${x}-${i}`}>{x}</span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [scans, setScans] = useState<ScanItem[]>([]);
  const [sensorLatest, setSensorLatest] = useState<SensorLatest>(null);
  const [recentPlan, setRecentPlan] = useState<FarmPlan | null>(null);

  const [weatherCity, setWeatherCity] = useState("");
  const [weather, setWeather] = useState<WeatherForecast>(null);
  const [planWeather, setPlanWeather] = useState<WeatherForecast>(null);

  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [planWeatherLoading, setPlanWeatherLoading] = useState(false);
  const [planRecomputing, setPlanRecomputing] = useState(false);
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

  async function loadPlanWeather(city: string, userId: string) {
    if (!city || !userId) {
      setPlanWeather(null);
      return;
    }

    setPlanWeatherLoading(true);
    try {
      const res = await fetch(
        `/api/weather/forecast?city=${encodeURIComponent(city)}&userId=${encodeURIComponent(userId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok) {
        setPlanWeather(null);
        return;
      }
      setPlanWeather(data);
    } catch {
      setPlanWeather(null);
    } finally {
      setPlanWeatherLoading(false);
    }
  }

  async function loadCore() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setLoading(true);

      const [scansRes, sensorsRes, plansRes] = await Promise.all([
        fetch(`/api/scans?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/sensors?userId=${encodeURIComponent(userId)}`),
        fetch(`/api/farm-plans?userId=${encodeURIComponent(userId)}`),
      ]);

      const scansData = await scansRes.json();
      const sensorsData = await sensorsRes.json();
      const plansData = await plansRes.json();

      if (scansRes.ok) setScans(scansData.scans || []);
      if (sensorsRes.ok) setSensorLatest(sensorsData.latest || null);
      if (plansRes.ok) {
        const latestPlan = (plansData.plans || [])[0] || null;
        setRecentPlan(latestPlan);
        if (latestPlan?.location?.city) {
          void loadPlanWeather(String(latestPlan.location.city), userId);
        } else {
          setPlanWeather(null);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function recomputeRecentPlan() {
    const userId = localStorage.getItem("smartAgriUserId") || "";
    if (!userId || !recentPlan?._id) return;

    setPlanRecomputing(true);
    try {
      const res = await fetch(`/api/farm-plans/${recentPlan._id}/recompute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) return;

      const updated = (data?.plan || null) as FarmPlan | null;
      if (updated) {
        setRecentPlan(updated);
        if (updated.location?.city) {
          await loadPlanWeather(String(updated.location.city), userId);
        }
      }
    } finally {
      setPlanRecomputing(false);
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

  const recentPlanScans = useMemo(() => {
    return [...(recentPlan?.linkedScans || [])]
      .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
      .slice(0, 4);
  }, [recentPlan]);

  const planAdviceStale = useMemo(() => {
    const generatedAt = recentPlan?.latestAdvice?.generatedAt;
    if (!generatedAt) return true;
    const ageMs = Date.now() - new Date(generatedAt).getTime();
    return ageMs > 6 * 60 * 60 * 1000;
  }, [recentPlan]);

  const scanDueInfo = useMemo(() => {
    const due = recentPlan?.scanPlan?.nextScanDueAt;
    if (!due) {
      return { label: "Scan schedule not generated yet", overdue: true };
    }
    const dueAt = new Date(due);
    if (Number.isNaN(dueAt.getTime())) {
      return { label: "Invalid scan schedule date", overdue: true };
    }
    const overdue = dueAt.getTime() <= Date.now();
    return { label: overdue ? "Scan is due now" : `Next scan: ${fmtTime(due)}`, overdue };
  }, [recentPlan]);

  const planSeries = useMemo(() => {
    const d = planWeather?.daily;
    const length = Math.max(
      0,
      Math.min(
        7,
        d?.time?.length || 0,
        d?.temperature_2m_max?.length || 0,
        d?.precipitation_probability_max?.length || 0,
        d?.precipitation_sum?.length || 0
      )
    );

    const labels: string[] = [];
    const impact: number[] = [];
    for (let i = 0; i < length; i += 1) {
      labels.push(toShortDayLabel(d?.time?.[i] || `D${i + 1}`));
      impact.push(
        weatherImpactScore(
          Number(d?.temperature_2m_max?.[i] || 0),
          Number(d?.precipitation_probability_max?.[i] || 0),
          Number(d?.precipitation_sum?.[i] || 0)
        )
      );
    }

    if (!labels.length) {
      const fallback = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
      const defaultImpact = [70, 68, 71, 69, 67, 70, 72];
      labels.push(...fallback);
      impact.push(...defaultImpact);
    }

    const growth: number[] = [];
    let cursor = stageProgress(recentPlan?.stage);
    const scanScore = scanHealthScore(recentPlan?.linkedScans || []);
    const riskPenalty = riskWeight(recentPlan?.latestAdvice?.diseaseRisks?.[0]?.risk) * 0.35;

    for (let i = 0; i < labels.length; i += 1) {
      const impactBoost = (impact[i] - 50) * 0.055;
      const scanBoost = (scanScore - 60) * 0.028;
      const delta = Math.max(0.25, 1.55 + impactBoost + scanBoost - riskPenalty);
      cursor = clamp(cursor + delta, 8, 100);
      growth.push(Math.round(cursor));
    }

    return { labels, impact, growth, scanScore };
  }, [planWeather, recentPlan]);

  return (
    <AppShell>
      <div className="dashboard-atmosphere space-y-6">
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
          <MetricCard
            kind="moisture"
            title="Soil Moisture"
            value={moistureText}
            sub={sensorLatest?.createdAt ? `Last: ${fmtTime(sensorLatest.createdAt)}` : "Use Simulator to send data"}
          />
          <MetricCard kind="temperature" title="Temperature" value={tempText} sub="Forecast (current)" />
          <MetricCard kind="humidity" title="Humidity" value={humText} sub="Forecast (current)" />
          <MetricCard
            kind="rain"
            title="Rain Chance (Next Hour)"
            value={rainChanceText}
            sub={`Current precip: ${precipMmText}`}
          />
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

        {/* Scans + Farm AI recent plan */}
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
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Recent Farm AI Plan</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push("/farm-ai")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Open Plans
                </button>
                {recentPlan?._id ? (
                  <button
                    onClick={() => router.push(`/farm-ai/${recentPlan._id}`)}
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Open Plan
                  </button>
                ) : null}
              </div>
            </div>

            {loading ? (
              <p className="mt-4 text-sm text-slate-600">Loading...</p>
            ) : !recentPlan ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                No Farm AI plan found. Create one to get daily crop analysis, scan routine, and weather impact graphs.
                <div className="mt-3">
                  <button
                    onClick={() => router.push("/farm-ai/new")}
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Create Farm AI Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {recentPlan.cropName} | {recentPlan.location?.city || "Location not set"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Stage: <b>{recentPlan.stage}</b> | Sowing:{" "}
                        <b>{recentPlan.sowingDate ? fmtTime(recentPlan.sowingDate) : "N/A"}</b>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Scan health score</p>
                      <p className="text-xl font-bold text-emerald-700">{planSeries.scanScore}/100</p>
                    </div>
                  </div>

                  <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${scanDueInfo.overdue ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
                    {scanDueInfo.label}.{" "}
                    {recentPlan.scanPlan?.lastScanAt
                      ? `Last scan: ${fmtTime(recentPlan.scanPlan.lastScanAt)}.`
                      : "No linked scan yet."}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/scan?farmPlanId=${encodeURIComponent(recentPlan._id)}`)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Scan for this plan
                    </button>
                    <button
                      onClick={recomputeRecentPlan}
                      disabled={planRecomputing}
                      className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {planRecomputing ? "Updating..." : "Refresh analysis"}
                    </button>
                    {planAdviceStale ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        Advice needs refresh
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Advice up to date
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <TrendLine
                    title="Projected Growth Curve"
                    subtitle="Estimated progression over the next 7 days"
                    labels={planSeries.labels}
                    values={planSeries.growth}
                    stroke="#22c55e"
                    fill="rgba(34, 197, 94, 0.16)"
                  />
                  <TrendLine
                    title="Weather Impact Index"
                    subtitle={planWeatherLoading ? "Refreshing weather..." : "Higher score means better conditions"}
                    labels={planSeries.labels}
                    values={planSeries.impact}
                    stroke="#0ea5e9"
                    fill="rgba(14, 165, 233, 0.14)"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-900">Today's Tasks</div>
                    {(recentPlan.latestAdvice?.todayTasks || []).length ? (
                      <ul className="mt-2 space-y-1 text-xs text-slate-700">
                        {(recentPlan.latestAdvice?.todayTasks || []).slice(0, 5).map((t, i) => (
                          <li key={`${t}-${i}`}>- {t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-600">
                        No tasks generated yet. Click "Refresh analysis" to produce today tasks.
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-900">Recent Scan Signals</div>
                    {recentPlanScans.length ? (
                      <div className="mt-2 space-y-2">
                        {recentPlanScans.map((s, i) => (
                          <div key={`${s.scanId || "scan"}-${i}`} className="rounded-lg border bg-white px-2 py-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-900">{s.result || "Scan"}</span>
                              <span className="text-[11px] text-slate-600">
                                {Math.round(Number(s.confidence || 0) * 100)}%
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500">{s.date ? fmtTime(s.date) : "N/A"}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-600">
                        No linked scans. Run a scan to improve risk detection and planning quality.
                      </p>
                    )}
                  </div>
                </div>

                {(recentPlan.latestAdvice?.diseaseRisks || []).length ? (
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-900">Top Risk Notes</div>
                    <div className="mt-2 space-y-2">
                      {(recentPlan.latestAdvice?.diseaseRisks || []).slice(0, 2).map((r, i) => (
                        <div key={`${r.name}-${i}`} className="rounded-lg border bg-white p-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{r.name}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                r.risk === "high"
                                  ? "bg-rose-100 text-rose-700"
                                  : r.risk === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {String(r.risk).toUpperCase()}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-600">{r.reason}</p>
                          <p className="mt-1 text-[11px] text-slate-600">
                            Prevention: <b>{r.prevention || "Keep monitoring and scan frequently."}</b>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

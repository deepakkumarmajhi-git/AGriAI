"use client";

import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildCropSuitability, buildSoilReport, SoilInputs } from "@/lib/soil/soilAnalysis";

type WeatherSnapshot = {
  temperature?: number;
  humidity?: number;
  locationLabel?: string;
  source?: string;
  cachedAt?: string;
};

type CropCard = {
  name: string;
  suitability: number; // 0..100
  whyNot100: string[];
  improvements: { type: "fertilizer" | "organic" | "ph"; text: string }[];
  links: { label: string; url: string }[];
};

export default function SoilLabPage() {
  const [tab, setTab] = useState<"manual" | "upload">("manual");

  // Inputs
  const [N, setN] = useState("");
  const [P, setP] = useState("");
  const [K, setK] = useState("");
  const [ph, setPh] = useState("");
  const [rainfall, setRainfall] = useState("");

  // Weather
  const [weather, setWeather] = useState<WeatherSnapshot>({});
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Results
  const [loading, setLoading] = useState(false);
  const [soilReport, setSoilReport] = useState<any>(null);
  const [cropCards, setCropCards] = useState<CropCard[]>([]);

  // Save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string>("");

  // UX helpers
  const [searchCrop, setSearchCrop] = useState("");
  const [sortBy, setSortBy] = useState<"suitability" | "name">("suitability");
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);

  function numOrUndef(v: any): number | undefined {
    const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) ? n : undefined;
  }

  async function loadWeather() {
    setLoadingWeather(true);
    try {
      const city = localStorage.getItem("smartAgriCity") || "Bhubaneswar";
      const res = await fetch(`/api/weather/forecast?city=${encodeURIComponent(city)}`, { cache: "no-store" });
      const data = await res.json();

      const temp =
        numOrUndef(data?.current?.temperature_2m) ??
        numOrUndef(data?.hourly?.temperature_2m?.[0]);

      const hum =
        numOrUndef(data?.current?.relative_humidity_2m) ??
        numOrUndef(data?.hourly?.relative_humidity_2m?.[0]);

      setWeather({
        temperature: temp,
        humidity: hum,
        locationLabel: data?.locationName || city,
        source: data?.source || "—",
        cachedAt: data?.cachedAt ? new Date(data.cachedAt).toLocaleString() : undefined,
      });
    } catch {
      setWeather({});
    } finally {
      setLoadingWeather(false);
    }
  }

  useEffect(() => {
    loadWeather();
  }, []);

  const tempStr = useMemo(
    () => (weather.temperature == null ? "—" : weather.temperature.toFixed(1)),
    [weather.temperature]
  );
  const humStr = useMemo(
    () => (weather.humidity == null ? "—" : weather.humidity.toFixed(0)),
    [weather.humidity]
  );

  const canAnalyze = useMemo(() => {
    return Boolean(N && P && K && ph && rainfall);
  }, [N, P, K, ph, rainfall]);

  // ✅ NEW: save report to MongoDB
  async function saveReportToMongo(args: {
    input: SoilInputs;
    report: any;
    crops: string[];
    conf: number[];
  }) {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      setSaveStatus("error");
      setSaveMessage("Not saved: Please login again.");
      return;
    }

    setSaveStatus("saving");
    setSaveMessage("");

    const city = localStorage.getItem("smartAgriCity") || "";

    const payload = {
      userId,
      inputs: args.input,
      weather: {
        city,
        locationName: weather.locationLabel || "",
        source: weather.source || "",
        cachedAt: weather.cachedAt || "",
      },
      soilReport: {
        overallScore: args.report?.overallScore ?? 0,
        npkScore: args.report?.npkScore ?? 0,
        phLabel: args.report?.ph?.label || "",
        levels: args.report?.levels || { N: "", P: "", K: "" },
      },
      recommendations: {
        crops: args.crops || [],
        confidences: args.conf || [],
      },
    };

    try {
      const res = await fetch("/api/soil/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setSaveStatus("error");
        setSaveMessage(data?.error || "Failed to save report");
        return;
      }

      setSaveStatus("saved");
      setSaveMessage("Saved successfully in Soil History ✅");
    } catch (e: any) {
      setSaveStatus("error");
      setSaveMessage(e?.message || "Failed to save report");
    }
  }

  async function onAnalyze() {
    setSoilReport(null);
    setCropCards([]);
    setExpandedCrop(null);

    setSaveStatus("idle");
    setSaveMessage("");

    if (!canAnalyze) {
      alert("Please fill N, P, K, pH, rainfall.");
      return;
    }

    setLoading(true);
    try {
      const input: SoilInputs = {
        N: Number(N),
        P: Number(P),
        K: Number(K),
        temperature: weather.temperature ?? 0,
        humidity: weather.humidity ?? 0,
        ph: Number(ph),
        rainfall: Number(rainfall),
      };

      const res = await fetch("/api/soil/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Recommendation failed");
        return;
      }

      const crops: string[] = data.crops || [];
      const conf: number[] = data.confidences || [];

      const report = buildSoilReport(input);
      setSoilReport(report);

      const cards = buildCropSuitability(input, crops, conf) as CropCard[];
      setCropCards(cards);

      // ✅ NEW: auto save to MongoDB
      await saveReportToMongo({ input, report, crops, conf });
    } finally {
      setLoading(false);
    }
  }

  const shownCards = useMemo(() => {
    const q = searchCrop.trim().toLowerCase();
    let list = [...cropCards];

    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));

    if (sortBy === "suitability") list.sort((a, b) => b.suitability - a.suitability);
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [cropCards, searchCrop, sortBy]);

  const step = useMemo(() => {
    if (!weather.temperature && !weather.humidity) return 1;
    if (!canAnalyze) return 2;
    if (!soilReport && cropCards.length === 0) return 3;
    return 4;
  }, [weather.temperature, weather.humidity, canAnalyze, soilReport, cropCards.length]);

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Soil Analysis by AI</h1>
                <p className="mt-1 text-slate-600">
                  Farmer-friendly soil health report + crop suitability + improvement actions.
                </p>

                {/* ✅ NEW: Save status */}
                {saveStatus !== "idle" && (
                  <div
                    className={[
                      "mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                      saveStatus === "saving"
                        ? "bg-slate-100 text-slate-700"
                        : saveStatus === "saved"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {saveStatus === "saving" ? "Saving report..." : saveMessage || "—"}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="rounded-xl border bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold text-slate-600">Progress</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    Step {step} / 4
                  </div>
                  <div className="mt-2 h-2 w-40 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-green-600 transition-all"
                      style={{ width: `${(step / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* ✅ NEW: history shortcut */}
                <Link
                  href="/soil/history"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  View Soil History →
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex flex-wrap gap-2">
              <TabButton active={tab === "manual"} onClick={() => setTab("manual")}>
                Manual Values
              </TabButton>
              <TabButton active={tab === "upload"} onClick={() => setTab("upload")}>
                Upload Report (MVP)
              </TabButton>
            </div>
          </div>

          {/* Sticky Analyze Bar */}
          <div className="sticky top-[76px] z-40">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Tip:</span> Fill NPK + pH + rainfall, then analyze.
                  <span className="ml-2 text-slate-500">
                    Weather auto: {tempStr}°C, {humStr}%.
                  </span>
                </div>

                <button
                  onClick={onAnalyze}
                  disabled={!canAnalyze || loading}
                  className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? "Analyzing..." : "Analyze Soil & Recommend Crops"}
                </button>
              </div>

              {!canAnalyze && (
                <div className="mt-2 text-xs text-slate-500">
                  Required: N, P, K, pH, rainfall.
                </div>
              )}
            </div>
          </div>

          {/* Weather Snapshot */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">Weather Snapshot</div>
                <div className="mt-1 text-sm text-slate-600">
                  Location: <b>{weather.locationLabel || "—"}</b>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Source: <b>{weather.source || "—"}</b>
                  {weather.cachedAt ? ` • CachedAt: ${weather.cachedAt}` : ""}
                </div>
              </div>

              <button
                onClick={loadWeather}
                disabled={loadingWeather}
                className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingWeather ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <StatCard title="Temperature" value={tempStr} suffix="°C" hint="Auto from forecast" />
              <StatCard title="Humidity" value={humStr} suffix="%" hint="Auto from forecast" />
            </div>
          </div>

          {/* Input Panels */}
          {tab === "upload" ? (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">Upload Soil Lab Report</div>
                  <p className="mt-1 text-sm text-slate-600">
                    MVP: upload for storage only. Extraction (OCR) can be added later.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Coming soon: OCR
                </span>
              </div>

              <div className="mt-4">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-green-700"
                />
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                For best accuracy, please enter the NPK/pH values manually.
              </div>

              <button
                onClick={() => setTab("manual")}
                className="mt-4 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Switch to Manual →
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">Enter Soil Values</div>
                  <p className="mt-1 text-sm text-slate-600">
                    Enter lab values. Weather values will be used automatically.
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  Fields marked <span className="font-bold text-red-600">*</span> are required
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Nitrogen (N) *">
                  <input className="input" value={N} onChange={(e) => setN(e.target.value)} placeholder="e.g., 90" />
                </Field>
                <Field label="Phosphorus (P) *">
                  <input className="input" value={P} onChange={(e) => setP(e.target.value)} placeholder="e.g., 42" />
                </Field>
                <Field label="Potassium (K) *">
                  <input className="input" value={K} onChange={(e) => setK(e.target.value)} placeholder="e.g., 43" />
                </Field>

                <Field label="pH *">
                  <input className="input" value={ph} onChange={(e) => setPh(e.target.value)} placeholder="e.g., 6.5" />
                </Field>

                <Field label="Rainfall (mm) *">
                  <input className="input" value={rainfall} onChange={(e) => setRainfall(e.target.value)} placeholder="e.g., 120" />
                </Field>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-600">Auto from Weather</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <MiniRead label="Temp" value={`${tempStr}°C`} />
                    <MiniRead label="Humidity" value={`${humStr}%`} />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    If missing, press Refresh Weather above.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Soil Health Report */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">Soil Health Report</div>
                <div className="mt-1 text-sm text-slate-600">
                  Easy indicators that a farmer can understand quickly.
                </div>
              </div>
              {soilReport && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  Score: {soilReport.overallScore}/100
                </span>
              )}
            </div>

            {!soilReport ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Submit values to generate report.
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <ScoreRing title="Overall Soil Health" value={soilReport.overallScore} />
                  <ScoreRing title="NPK Balance" value={soilReport.npkScore} />
                  <div className="rounded-2xl border bg-slate-50 p-5">
                    <div className="text-sm font-bold text-slate-900">pH Status</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">{soilReport.ph.label}</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Neutral (6.0–7.5) is best for most crops.
                    </div>
                    <div className="mt-4 space-y-2">
                      <Progress label={`Nitrogen: ${soilReport.levels.N}`} value={soilReport.levels.N === "High" ? 90 : soilReport.levels.N === "Medium" ? 70 : 30} />
                      <Progress label={`Phosphorus: ${soilReport.levels.P}`} value={soilReport.levels.P === "High" ? 90 : soilReport.levels.P === "Medium" ? 70 : 30} />
                      <Progress label={`Potassium: ${soilReport.levels.K}`} value={soilReport.levels.K === "High" ? 90 : soilReport.levels.K === "Medium" ? 70 : 30} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                  <div className="text-sm font-bold text-slate-900">Farmer Summary</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {soilReport.overallScore >= 80
                      ? "Your soil is healthy. You can grow many crops with good yield."
                      : soilReport.overallScore >= 60
                      ? "Your soil is okay. Improve nutrients/pH to increase yield."
                      : "Your soil needs improvement. Start with compost + balanced NPK and correct pH."}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Crops */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">Recommended Crops</div>
                <div className="mt-1 text-sm text-slate-600">
                  Suitability % + what to add to reach better result.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    value={searchCrop}
                    onChange={(e) => setSearchCrop(e.target.value)}
                    placeholder="Search crop..."
                    className="w-56 rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="suitability">Sort: Suitability</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>

            {shownCards.length === 0 ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                Run analysis to see crops here.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {shownCards.map((c) => {
                  const open = expandedCrop === c.name;
                  return (
                    <div key={c.name} className="rounded-2xl border bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <SuitabilityBadge value={c.suitability} />
                          <div>
                            <div className="text-lg font-bold text-slate-900">{c.name}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              Suitability:{" "}
                              <span className="font-bold text-green-700">{c.suitability}%</span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/soil/crop/${encodeURIComponent(c.name)}`}
                          className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          Details →
                        </Link>
                      </div>

                      <div className="mt-4">
                        <button
                          onClick={() => setExpandedCrop(open ? null : c.name)}
                          className="w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:bg-slate-100"
                        >
                          {open ? "Hide" : "Show"} why not 100% + improvement plan
                        </button>

                        {open && (
                          <div className="mt-3 space-y-3">
                            <div className="rounded-xl border bg-slate-50 p-4">
                              <div className="text-xs font-semibold text-slate-600">Why not 100%?</div>
                              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                {c.whyNot100.map((r, i) => (
                                  <li key={i}>• {r}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-sm font-bold text-slate-900">What to add / Improve</div>
                              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                {c.improvements.map((a, i) => (
                                  <li key={i}>• {a.text}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="rounded-xl border bg-white p-4">
                              <div className="text-sm font-bold text-slate-900">Recommended Inputs (Links)</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {c.links.slice(0, 8).map((l, i) => (
                                  <a
                                    key={i}
                                    href={l.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                                  >
                                    {l.label}
                                  </a>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                Use as per label & local agriculture guidance. Avoid overdose.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Small styles */}
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

/* ---------- Small UI components ---------- */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-semibold border transition",
        active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-900 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatCard({ title, value, suffix, hint }: { title: string; value: string; suffix?: string; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-5">
      <div className="text-xs font-semibold text-slate-600">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">
        {value} <span className="text-base font-bold text-slate-600">{suffix || ""}</span>
      </div>
      {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function MiniRead({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-semibold">{label}</span>
        <span className="font-bold">{v}%</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-green-600" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function ScoreRing({ title, value }: { title: string; value: number }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  const dash = 2 * Math.PI * 18;
  const filled = (v / 100) * dash;

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-sm font-bold text-slate-900">{title}</div>

      <div className="mt-4 flex items-center gap-4">
        <svg width="48" height="48" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" strokeWidth="6" stroke="rgb(226 232 240)" fill="none" />
          <circle
            cx="22"
            cy="22"
            r="18"
            strokeWidth="6"
            stroke="rgb(22 163 74)"
            fill="none"
            strokeDasharray={`${filled} ${dash - filled}`}
            transform="rotate(-90 22 22)"
            strokeLinecap="round"
          />
        </svg>

        <div>
          <div className="text-3xl font-bold text-slate-900">{v}</div>
          <div className="text-xs text-slate-500">out of 100</div>
        </div>
      </div>
    </div>
  );
}

function SuitabilityBadge({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  const color =
    v >= 85 ? "bg-green-600" : v >= 70 ? "bg-yellow-500" : v >= 50 ? "bg-orange-500" : "bg-red-600";
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border">
      <div className={`h-10 w-10 rounded-xl ${color} text-white flex items-center justify-center`}>
        <span className="text-sm font-extrabold">{v}</span>
      </div>
    </div>
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
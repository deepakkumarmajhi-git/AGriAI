"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";

type Daily = {
  dt: number; // unix seconds (we normalize)
  tempMax: number;
  tempMin: number;
  rainChance: number; // 0..100
  rainSumMm?: number;
  condition?: string;
};

type Hourly = {
  dt: number; // unix seconds (we normalize)
  temp: number;
  humidity: number;
  rainChance: number; // 0..100
  precipMm?: number;
  windKmh?: number;
};

type ForecastUI = {
  locationLabel: string;
  updatedAt?: string; // ISO
  sourceLabel?: string;
  daily: Daily[];
  hourly: Hourly[];
};

export default function WeatherPage() {
  const [city, setCity] = useState("");
  const [unit, setUnit] = useState<"C" | "F">("C");
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [now, setNow] = useState<Date>(() => new Date());

  // rolling window updates automatically
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // update at midnight so Today/Tomorrow labels stay correct
  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(new Date());
      setActiveDayIndex(0);
    }, msToNextMidnight() + 500);
    return () => clearTimeout(timer);
  }, [now]);

  // -------------------------
  // 🔁 Replace this with your real API response mapping (UI-only)
  // -------------------------
  const forecast: ForecastUI = useMemo(() => {
    const base = Math.floor(Date.now() / 1000);

    const daily: Daily[] = Array.from({ length: 7 }).map((_, i) => ({
      dt: base + i * 86400,
      tempMax: 32 + (i % 3),
      tempMin: 21 + (i % 2),
      rainChance: i === 0 ? 42 : i === 1 ? 28 : i === 2 ? 12 : i === 3 ? 6 : 2,
      rainSumMm: i === 0 ? 6.8 : i === 1 ? 1.4 : i === 2 ? 0.3 : 0,
      condition: i === 0 ? "Cloudy" : i === 1 ? "Partly Cloudy" : "Clear",
    }));

    // NOTE: This generates valid hourly timestamps; your real API might return ms or strings → fixed below.
    const hourly: Hourly[] = Array.from({ length: 80 }).map((_, i) => ({
      dt: base + i * 3600,
      temp: 26 + Math.sin(i / 3) * 3,
      humidity: 72 + (i % 18),
      rainChance: Math.max(0, Math.round(35 - (i % 12) * 3)),
      precipMm: (i % 9) < 2 ? 0.4 : 0,
      windKmh: 3 + (i % 6),
    }));

    return {
      locationLabel: "Bhubaneswar, Odisha, India",
      updatedAt: new Date().toISOString(),
      sourceLabel: "Cached (6h)",
      daily,
      hourly,
    };
  }, []);

  const toTemp = (c: number) => (unit === "C" ? c : c * 9 / 5 + 32);
  const fmtTemp = (c: number) => `${Math.round(toTemp(c))}°`;

  // ✅ Normalize dt for ALL hourly rows (fixes Next 24 Hours empty bug)
  const hourlyNormalized = useMemo(() => {
    return (forecast.hourly || [])
      .map((h: any) => {
        const dtRaw = h.dt ?? h.time ?? h.date; // supports common keys
        return { ...h, dt: toUnixSeconds(dtRaw) } as Hourly;
      })
      .filter((h) => h.dt > 0)
      .sort((a, b) => a.dt - b.dt);
  }, [forecast.hourly]);

  // ✅ Normalize daily dt too (safe)
  const dailyNormalized = useMemo(() => {
    return (forecast.daily || [])
      .map((d: any) => {
        const dtRaw = d.dt ?? d.time ?? d.date;
        return { ...d, dt: toUnixSeconds(dtRaw) } as Daily;
      })
      .filter((d) => d.dt > 0)
      .sort((a, b) => a.dt - b.dt);
  }, [forecast.daily]);

  const safeActiveIndex = Math.min(activeDayIndex, Math.max(0, dailyNormalized.length - 1));
  const selectedDay = dailyNormalized[safeActiveIndex] ?? dailyNormalized[0];

  const selectedStart = selectedDay ? startOfDayUnix(selectedDay.dt) : 0;
  const selectedEnd = selectedStart + 86400;

  const hourlyForSelected = useMemo(() => {
    if (!hourlyNormalized.length || !selectedDay) return [];
    return hourlyNormalized.filter((h) => h.dt >= selectedStart && h.dt < selectedEnd).slice(0, 24);
  }, [hourlyNormalized, selectedDay, selectedStart, selectedEnd]);

  // ✅ Next 24 Hours rolling window + fallback so it never stays empty
  const next24h = useMemo(() => {
    if (!hourlyNormalized.length) return [];

    const nowUnix = Math.floor(now.getTime() / 1000);
    const end = nowUnix + 24 * 3600;

    const filtered = hourlyNormalized.filter((h) => h.dt >= nowUnix && h.dt < end);

    // fallback if timestamps don't align
    if (filtered.length === 0) {
      const startIdx = hourlyNormalized.findIndex((h) => h.dt >= nowUnix);
      if (startIdx >= 0) return hourlyNormalized.slice(startIdx, startIdx + 24);
      return hourlyNormalized.slice(Math.max(0, hourlyNormalized.length - 24));
    }

    return filtered;
  }, [hourlyNormalized, now]);

  const nowUnix = Math.floor(now.getTime() / 1000);

  function onRefreshUIOnly() {
    localStorage.setItem("smartAgriCity", city);
    // if you already have refreshWeather(city), call it here
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />

          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Live Forecast • {forecast.sourceLabel ?? "Source"}
                </div>

                <h1 className="mt-3 text-2xl font-bold text-slate-900 md:text-3xl">
                  Weather •{" "}
                  <span className="bg-gradient-to-r from-green-700 to-emerald-500 bg-clip-text text-transparent">
                    {forecast.locationLabel}
                  </span>
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                  7-day forecast + rolling next 24 hours rain table + alerts.{" "}
                  <span className="text-slate-500">
                    Updated: {forecast.updatedAt ? new Date(forecast.updatedAt).toLocaleString() : "—"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <UnitToggleLight unit={unit} setUnit={setUnit} />
                <button
                  type="button"
                  onClick={onRefreshUIOnly}
                  className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-green-200"
                placeholder="Search city / district (e.g., Cuttack, Odisha)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRefreshUIOnly();
                }}
              />

              <div className="rounded-xl border bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-600">UI Auto Updates</div>
                <div className="mt-1 text-sm font-bold text-slate-900">Next 24h rolls every minute</div>
                <div className="mt-1 text-xs text-slate-500">Today/Tomorrow updates at midnight</div>
              </div>
            </div>
          </div>
        </section>

        {/* 7 DAY */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">7-Day Forecast</h2>
              <p className="mt-1 text-sm text-slate-600">
                Tap a day to update hourly chips and insights.
              </p>
            </div>
            {selectedDay && (
              <div className="text-xs text-slate-500">
                Selected:{" "}
                <span className="font-semibold text-slate-900">
                  {dayLabelFromNow(selectedDay.dt, now)} • {formatDay(selectedDay.dt)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {dailyNormalized.slice(0, 7).map((d, idx) => (
              <DayCardLight
                key={d.dt}
                active={idx === safeActiveIndex}
                label={dayLabelFromNow(d.dt, now)}
                date={formatDay(d.dt)}
                max={fmtTemp(d.tempMax)}
                min={fmtTemp(d.tempMin)}
                rainChance={d.rainChance}
                rainSumMm={d.rainSumMm ?? 0}
                onClick={() => setActiveDayIndex(idx)}
              />
            ))}
          </div>
        </section>

        {/* HOURLY */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Hourly • {selectedDay ? dayLabelFromNow(selectedDay.dt, now) : "—"}
            </h2>
            <div className="text-xs text-slate-500">Scroll →</div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {hourlyForSelected.map((h) => (
              <HourlyCardLight
                key={h.dt}
                time={formatTime(h.dt)}
                temp={fmtTemp(h.temp)}
                humidity={`${Math.round(h.humidity)}%`}
                rainChance={h.rainChance}
                isNow={Math.abs(h.dt - nowUnix) < 1800}
              />
            ))}

            {hourlyForSelected.length === 0 && (
              <div className="text-sm text-slate-600">No hourly data for selected day.</div>
            )}
          </div>
        </section>

        {/* NEXT 24 HOURS */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Next 24 Hours</h2>
              <p className="mt-1 text-sm text-slate-600">
                Rolling window from now. Visual rain intensity bar.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Now: {now.toLocaleTimeString()}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <div className="max-h-[440px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b text-xs text-slate-600">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Temp</th>
                    <th className="px-4 py-3">Humidity</th>
                    <th className="px-4 py-3">Rain</th>
                    <th className="px-4 py-3">Precip</th>
                    <th className="px-4 py-3">Wind</th>
                  </tr>
                </thead>
                <tbody>
                  {next24h.map((h) => {
                    const isNowRow = Math.abs(h.dt - nowUnix) < 1800;
                    return (
                      <tr
                        key={h.dt}
                        className={[
                          "border-b transition",
                          isNowRow ? "bg-green-50" : "hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 text-slate-800">
                          {formatDateTimeUnix(h.dt)}
                          {isNowRow && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                              NOW
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{fmtTemp(h.temp)}</td>
                        <td className="px-4 py-3 text-slate-800">{Math.round(h.humidity)}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-12 font-bold text-slate-900">
                              {Math.round(h.rainChance)}%
                            </span>
                            <RainBarLight value={h.rainChance} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {(h.precipMm ?? 0).toFixed(1)} mm
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          {Math.round(h.windKmh ?? 0)} km/h
                        </td>
                      </tr>
                    );
                  })}

                  {next24h.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-slate-600" colSpan={6}>
                        Next 24 hours data is empty. This usually means your hourly timestamps are not being normalized correctly.
                        (This code fixes ms/seconds/strings, but your API may use a different field name.)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            If still empty: paste one hourly object from your API response, I’ll map the correct key.
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/* --------- Helpers ---------- */

function toUnixSeconds(dt: any): number {
  if (typeof dt === "number") {
    if (dt > 1e12) return Math.floor(dt / 1000); // ms
    if (dt > 1e10) return Math.floor(dt / 1000); // ms
    return dt; // sec
  }
  const d = new Date(dt);
  const ms = d.getTime();
  if (!Number.isFinite(ms)) return 0;
  return Math.floor(ms / 1000);
}

function UnitToggleLight({
  unit,
  setUnit,
}: {
  unit: "C" | "F";
  setUnit: (u: "C" | "F") => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-1">
      <button
        type="button"
        onClick={() => setUnit("C")}
        className={[
          "rounded-lg px-3 py-2 text-sm font-semibold transition",
          unit === "C" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
        ].join(" ")}
      >
        °C
      </button>
      <button
        type="button"
        onClick={() => setUnit("F")}
        className={[
          "rounded-lg px-3 py-2 text-sm font-semibold transition",
          unit === "F" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
        ].join(" ")}
      >
        °F
      </button>
    </div>
  );
}

function DayCardLight({
  active,
  label,
  date,
  max,
  min,
  rainChance,
  rainSumMm,
  onClick,
}: {
  active: boolean;
  label: string;
  date: string;
  max: string;
  min: string;
  rainChance: number;
  rainSumMm: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-w-[220px] rounded-xl border p-4 text-left shadow-sm transition",
        active ? "border-green-200 bg-green-50" : "bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-bold text-slate-900">{label}</div>
          <div className="text-xs text-slate-500">{date}</div>
        </div>
        <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
          {Math.round(rainChance)}%
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-bold text-slate-900">{max}</div>
        <div className="text-sm text-slate-500">/ {min}</div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-slate-500">Rain sum</div>
        <div className="text-xs text-slate-500">{rainSumMm.toFixed(1)} mm</div>
      </div>

      <div className="mt-3">
        <RainBarLight value={rainChance} />
      </div>
    </button>
  );
}

function HourlyCardLight({
  time,
  temp,
  humidity,
  rainChance,
  isNow,
}: {
  time: string;
  temp: string;
  humidity: string;
  rainChance: number;
  isNow: boolean;
}) {
  return (
    <div
      className={[
        "min-w-[160px] rounded-xl border p-4 shadow-sm transition",
        isNow ? "border-green-200 bg-green-50" : "bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{time}</div>
        {isNow && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
            NOW
          </span>
        )}
      </div>

      <div className="mt-1 text-2xl font-bold text-slate-900">{temp}</div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">Humidity</span>
        <span className="font-bold text-slate-800">{humidity}</span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">Rain</span>
        <span className="font-bold text-slate-800">{Math.round(rainChance)}%</span>
      </div>

      <div className="mt-2">
        <RainBarLight value={rainChance} />
      </div>
    </div>
  );
}

function RainBarLight({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full bg-green-600 transition-[width] duration-300"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

/* --------- Date helpers ---------- */

function formatDay(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function formatDateTimeUnix(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}
function startOfDayUnix(unixSeconds: number) {
  const d = new Date(unixSeconds * 1000);
  d.setHours(0, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}
function msToNextMidnight() {
  const d = new Date();
  const next = new Date(d);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - d.getTime();
}
function dayLabelFromNow(unixSeconds: number, now: Date) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const dayStart = new Date(unixSeconds * 1000);
  dayStart.setHours(0, 0, 0, 0);

  const diffDays = Math.round((dayStart.getTime() - todayStart.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return dayStart.toLocaleDateString(undefined, { weekday: "long" });
}
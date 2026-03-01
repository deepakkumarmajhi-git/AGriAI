export const runtime = "nodejs";

import { connectDB } from "@/lib/db";
import { WeatherCache } from "@/models/WeatherCache";

const CACHE_HOURS = 6;

type GeoResult = {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
};

function normalizeKey(city: string) {
  return city.trim().toLowerCase();
}

function hoursBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

function buildExtremeAlerts(data: any) {
  const alerts: { type: string; level: "info" | "warning" | "critical"; message: string }[] = [];

  const current = data?.current;
  if (!current) return alerts;

  const temp = Number(current.temperature_2m);
  const wind = Number(current.wind_speed_10m ?? 0);
  const rainChance = Number(data?.next_hour?.precip_probability ?? 0);
  const rainMm = Number(current.precipitation ?? 0);

  // simple India-relevant heuristics (can be tuned)
  if (!Number.isNaN(temp) && temp >= 40) {
    alerts.push({ type: "HEATWAVE", level: "critical", message: "Heatwave risk (≥40°C). Avoid afternoon irrigation; irrigate early morning/evening." });
  } else if (!Number.isNaN(temp) && temp >= 35) {
    alerts.push({ type: "HEAT_STRESS", level: "warning", message: "High temperature (≥35°C). Increase irrigation efficiency and mulch to reduce evaporation." });
  }

  if (!Number.isNaN(rainMm) && rainMm >= 10) {
    alerts.push({ type: "HEAVY_RAIN", level: "warning", message: "Heavy precipitation recorded recently. Ensure drainage and avoid fertilizer application during heavy rain." });
  }

  if (!Number.isNaN(rainChance) && rainChance >= 70) {
    alerts.push({ type: "RAIN_PROB", level: "info", message: "High chance of rain soon. Plan spraying/irrigation accordingly." });
  }

  if (!Number.isNaN(wind) && wind >= 35) {
    alerts.push({ type: "HIGH_WIND", level: "warning", message: "Strong winds expected/observed. Support tall crops and avoid spraying." });
  }

  return alerts;
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

  if (!city) return Response.json({ error: "Missing city" }, { status: 400 });

  const key = normalizeKey(city);

  // 1) Check cache
  const cached = await WeatherCache.findOne({ key }).lean();
  if (cached) {
    const ageHrs = hoursBetween(new Date(), new Date((cached as any).fetchedAt));
    if (ageHrs <= CACHE_HOURS) {
      return Response.json({
        ok: true,
        source: "cache",
        cachedAt: (cached as any).fetchedAt,
        ...((cached as any).payload || {}),
      });
    }
  }

  try {
    // 2) Geocode city -> lat/lon (Open-Meteo)
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}` +
      `&count=1&language=en&format=json`;

    const geoRes = await fetch(geoUrl, { cache: "no-store" });
    const geoData = await geoRes.json();

    if (!geoRes.ok || !geoData?.results?.length) {
      throw new Error("City not found (geocoding)");
    }

    const g: GeoResult = geoData.results[0];
    const latitude = g.latitude;
    const longitude = g.longitude;
    const locationName = [g.name, g.admin1, g.country].filter(Boolean).join(", ");

    // 3) Forecast (Open-Meteo)
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers,wind_speed_10m` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
      `&forecast_days=7&timezone=auto`;

    const wRes = await fetch(weatherUrl, { cache: "no-store" });
    const wData = await wRes.json();

    if (!wRes.ok || !wData?.current) throw new Error("Forecast fetch failed");

    // build “next hour” convenience fields
    const hourlyTimes: string[] = wData?.hourly?.time || [];
    const pProb: number[] = wData?.hourly?.precipitation_probability || [];
    const nowTime = wData.current.time;
    const idx = hourlyTimes.indexOf(nowTime);
    const nextIdx = idx >= 0 ? Math.min(idx + 1, pProb.length - 1) : 0;

    const payload = {
      locationName,
      latitude,
      longitude,

      current: wData.current, // includes temp/humidity/precip/wind
      next_hour: {
        time: hourlyTimes[nextIdx] || null,
        precip_probability: typeof pProb[nextIdx] === "number" ? pProb[nextIdx] : null,
      },

      hourly: {
        time: wData.hourly.time?.slice(0, 24) || [],
        temperature_2m: wData.hourly.temperature_2m?.slice(0, 24) || [],
        relative_humidity_2m: wData.hourly.relative_humidity_2m?.slice(0, 24) || [],
        precipitation_probability: wData.hourly.precipitation_probability?.slice(0, 24) || [],
        precipitation: wData.hourly.precipitation?.slice(0, 24) || [],
        wind_speed_10m: wData.hourly.wind_speed_10m?.slice(0, 24) || [],
      },

      daily: {
        time: wData.daily.time || [],
        temperature_2m_max: wData.daily.temperature_2m_max || [],
        temperature_2m_min: wData.daily.temperature_2m_min || [],
        precipitation_sum: wData.daily.precipitation_sum || [],
        precipitation_probability_max: wData.daily.precipitation_probability_max || [],
      },
    };

    const alerts = buildExtremeAlerts({
      current: wData.current,
      next_hour: payload.next_hour,
    });

    const fullPayload = { ...payload, alerts };

    // 4) Upsert cache
    await WeatherCache.updateOne(
      { key },
      {
        $set: {
          key,
          provider: "open-meteo",
          fetchedAt: new Date(),
          payload: fullPayload,
        },
      },
      { upsert: true }
    );

    return Response.json({ ok: true, source: "live", cachedAt: new Date(), ...fullPayload });
  } catch (err: any) {
    // 5) Fallback to last known cache
    if (cached?.payload) {
      return Response.json({
        ok: true,
        source: "fallback-cache",
        cachedAt: (cached as any).fetchedAt,
        ...((cached as any).payload || {}),
        warning: "Live weather unavailable. Showing last known forecast.",
      });
    }

    return Response.json({ error: "Weather unavailable", details: err?.message || String(err) }, { status: 500 });
  }
}
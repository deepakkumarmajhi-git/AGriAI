export const runtime = "nodejs";

import { connectDB } from "@/lib/db";
import { SensorReading } from "@/models/SensorReading";
import { Alert } from "@/models/Alert";
import { notifyAlertById } from "@/lib/notifyAlert";

type GeoResult = {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
};

function getUserId(req: Request) {
  const userId = req.headers.get("x-user-id");
  return userId && userId.trim() ? userId.trim() : null;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function cropBaseLitersPerAcrePerDay(crop: string) {
  // MVP realistic-ish ranges (very rough, will improve later)
  // acre liters/day
  const c = crop.toLowerCase();
  if (c.includes("paddy") || c.includes("rice")) return 45000;
  if (c.includes("sugarcane")) return 60000;
  if (c.includes("cotton")) return 30000;
  if (c.includes("wheat")) return 25000;
  if (c.includes("maize") || c.includes("corn")) return 28000;
  if (c.includes("pulses") || c.includes("dal") || c.includes("gram")) return 18000;
  if (c.includes("vegetable") || c.includes("tomato") || c.includes("chilli")) return 32000;
  return 25000; // default
}

function soilFactor(soilType: string) {
  const s = soilType.toLowerCase();
  if (s.includes("sandy")) return 1.15;   // needs more frequent water
  if (s.includes("clay")) return 0.90;    // holds water longer
  if (s.includes("loam")) return 1.0;
  return 1.0;
}

async function geocode(city: string) {
  const geoUrl =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}` +
    `&count=1&language=en&format=json`;

  const geoRes = await fetch(geoUrl, { cache: "no-store" });
  const geoData = await geoRes.json();

  if (!geoRes.ok || !geoData?.results?.length) {
    throw new Error("City not found (geocoding)");
  }

  const g: GeoResult = geoData.results[0];
  const locationName = [g.name, g.admin1, g.country].filter(Boolean).join(", ");

  return { latitude: g.latitude, longitude: g.longitude, locationName };
}

async function fetchDailyForecast(latitude: number, longitude: number) {
  // daily precipitation + probability + temperature max/min
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
    `&forecast_days=7&timezone=auto`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data?.daily?.time) throw new Error("Forecast fetch failed");

  return {
    time: data.daily.time as string[],
    precipSum: data.daily.precipitation_sum as number[],
    precipProbMax: data.daily.precipitation_probability_max as number[],
    tMax: data.daily.temperature_2m_max as number[],
    tMin: data.daily.temperature_2m_min as number[],
  };
}

function makeTips(crop: string, soilType: string) {
  const tips: string[] = [
    "Prefer irrigation early morning (5–8 AM) or late evening to reduce evaporation.",
    "Avoid wetting leaves; drip/near-root watering reduces fungal risk.",
    "Mulching reduces evaporation and keeps soil temperature stable.",
  ];

  if (soilType.toLowerCase().includes("sandy")) {
    tips.push("Sandy soil drains fast: irrigate smaller amounts but more frequently.");
  }
  if (soilType.toLowerCase().includes("clay")) {
    tips.push("Clay soil holds water: avoid over-irrigation; ensure drainage to prevent waterlogging.");
  }

  if (crop.toLowerCase().includes("paddy") || crop.toLowerCase().includes("rice")) {
    tips.push("For paddy, maintain adequate moisture; avoid long dry spells during critical stages.");
  }

  return tips;
}

export async function POST(req: Request) {
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Missing x-user-id header" }, { status: 401 });

  await connectDB();

  const body = await req.json();
  const city = String(body?.city || "").trim();
  const crop = String(body?.crop || "").trim();
  const soilType = String(body?.soilType || "Loam").trim();

  if (!city) return Response.json({ error: "Missing city" }, { status: 400 });
  if (!crop) return Response.json({ error: "Missing crop" }, { status: 400 });

  // 1) Get recent soil moisture history (last 48 readings)
  const readings = await SensorReading.find({ userId })
    .sort({ createdAt: -1 })
    .limit(48)
    .lean();

  const moistureVals = readings
    .map((r: any) => r.moisture)
    .filter((x: any) => typeof x === "number");

  const latestMoisture = moistureVals.length ? Number(moistureVals[0]) : null;

  const avgMoisture =
    moistureVals.length ? moistureVals.reduce((a: number, b: number) => a + b, 0) / moistureVals.length : null;

  // Trend: compare recent half vs older half
  let trend = 0; // + means increasing, - means decreasing
  if (moistureVals.length >= 10) {
    const half = Math.floor(moistureVals.length / 2);
    const recent = moistureVals.slice(0, half);
    const older = moistureVals.slice(half);
    const rAvg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const oAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length;
    trend = rAvg - oAvg;
  }

  // 2) Forecast (7 days)
  const { latitude, longitude, locationName } = await geocode(city);
  const daily = await fetchDailyForecast(latitude, longitude);

  // 3) Rule-based irrigation schedule
  const base = cropBaseLitersPerAcrePerDay(crop);
  const sFactor = soilFactor(soilType);

  // moisture factor (lower moisture => increase irrigation)
  const moistureFactor =
    latestMoisture == null ? 1.0 : latestMoisture < 35 ? 1.25 : latestMoisture < 50 ? 1.10 : 0.95;

  // trend factor (decreasing moisture => slightly increase)
  const trendFactor = trend < -2 ? 1.10 : trend > 2 ? 0.95 : 1.0;

  const tips = makeTips(crop, soilType);

  const schedule = daily.time.map((date, i) => {
    const rainProb = Number(daily.precipProbMax[i] ?? 0);
    const rainSum = Number(daily.precipSum[i] ?? 0);
    const tMax = Number(daily.tMax[i] ?? 0);

    // temperature factor
    const tempFactor = tMax >= 40 ? 1.20 : tMax >= 35 ? 1.10 : tMax <= 20 ? 0.95 : 1.0;

    // rain adjustment
    const rainFactor =
      rainSum >= 10 ? 0.20 : rainSum >= 5 ? 0.45 : rainProb >= 70 ? 0.55 : rainProb >= 40 ? 0.75 : 1.0;

    const liters = Math.round(base * sFactor * moistureFactor * trendFactor * tempFactor * rainFactor);

    const action =
      liters <= 7000
        ? "Skip / very light irrigation"
        : liters <= 16000
        ? "Light irrigation"
        : liters <= 30000
        ? "Moderate irrigation"
        : "Heavy irrigation";

    return {
      date,
      tMax: Math.round(tMax),
      rainProb: Math.round(rainProb),
      rainSum: Number(rainSum.toFixed(1)),
      recommendedLitersPerAcre: clamp(liters, 0, 80000),
      action,
    };
  });

  // 4) Optional: create alert if very low moisture and low rain probability next 24h
  if (latestMoisture != null) {
    const nextDayRainProb = schedule[0]?.rainProb ?? 0;
    if (latestMoisture < 30 && nextDayRainProb < 40) {
      const a = await Alert.create({
        userId,
        level: "warning",
        title: "Irrigation Needed Soon",
        message: `Soil moisture is ${Math.round(latestMoisture)}%. Rain chance is low (${nextDayRainProb}%). Consider irrigation today.`,
      });
      await notifyAlertById(a._id.toString());
    }
  }

  return Response.json({
    ok: true,
    locationName,
    crop,
    soilType,
    soil: {
      latestMoisture,
      avgMoisture: avgMoisture == null ? null : Number(avgMoisture.toFixed(1)),
      trend: Number(trend.toFixed(2)), // + means rising, - means falling
    },
    schedule,
    tips,
    note:
      "This is a rule-based MVP plan using moisture trend + 7-day forecast. We'll upgrade to AI model later (ET0 + crop stage + satellite + IMD).",
  });
}
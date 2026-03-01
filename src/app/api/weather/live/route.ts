export const runtime = "nodejs";

type GeoResult = {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
};

// Small in-memory cache (prevents spamming API when you refresh quickly)
let cache: { key: string; ts: number; data: any } | null = null;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city"); // e.g. "Bhubaneswar, India"

  if (!city) return Response.json({ error: "Missing city" }, { status: 400 });

  const cacheKey = city.trim().toLowerCase();
  const now = Date.now();

  // cache for 2 minutes
  if (cache && cache.key === cacheKey && now - cache.ts < 2 * 60 * 1000) {
    return Response.json({ ok: true, ...cache.data, cached: true });
  }

  // 1) Geocode city -> lat/lon
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;

  const geoRes = await fetch(geoUrl, { cache: "no-store" });
  const geoData = await geoRes.json();

  if (!geoRes.ok || !geoData?.results?.length) {
    return Response.json({ error: "City not found in geocoding API" }, { status: 404 });
  }

  const g: GeoResult = geoData.results[0];
  const latitude = g.latitude;
  const longitude = g.longitude;
  const locationName = [g.name, g.admin1, g.country].filter(Boolean).join(", ");

  // 2) Weather: current values + hourly precipitation probability
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers` +
    `&hourly=precipitation_probability` +
    `&forecast_days=1` +
    `&timezone=auto`;

  const wRes = await fetch(weatherUrl, { cache: "no-store" });
  const wData = await wRes.json();

  if (!wRes.ok || !wData?.current) {
    return Response.json({ error: "Weather API failed" }, { status: 500 });
  }

  const current = wData.current;

  // Find the closest hourly precipitation probability to "current.time"
  let precipProb = null as number | null;
  try {
    const times: string[] = wData?.hourly?.time || [];
    const probs: number[] = wData?.hourly?.precipitation_probability || [];
    const idx = times.indexOf(current.time);
    if (idx >= 0 && typeof probs[idx] === "number") precipProb = probs[idx];
    else if (probs.length > 0) precipProb = probs[0]; // fallback
  } catch {
    precipProb = null;
  }

  const payload = {
    locationName,
    latitude,
    longitude,
    current: {
      time: current.time,
      temperature: Number(current.temperature_2m),
      humidity: Number(current.relative_humidity_2m),
      precipitation_mm: Number(current.precipitation), // mm
      rain_mm: Number(current.rain ?? 0), // mm
      showers_mm: Number(current.showers ?? 0), // mm
      precipitation_probability: precipProb, // %
    },
  };

  cache = { key: cacheKey, ts: now, data: payload };

  return Response.json({ ok: true, ...payload, cached: false });
}
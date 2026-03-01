export const runtime = "nodejs";

import { connectDB } from "@/lib/db";
import { WeatherSnapshot } from "@/models/WeatherSnapshot";

type GeoResult = {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
  admin1?: string;
};

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const city = searchParams.get("city"); // e.g., "Pune, India"

  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });
  if (!city) return Response.json({ error: "Missing city" }, { status: 400 });

  // 1) Geocoding (city -> lat/lon)
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

  // 2) Current weather from Open-Meteo
  // We request "current" temperature_2m and relative_humidity_2m
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`;

  const wRes = await fetch(weatherUrl, { cache: "no-store" });
  const wData = await wRes.json();

  if (!wRes.ok || !wData?.current) {
    return Response.json({ error: "Weather API failed" }, { status: 500 });
  }

  const temperature = Number(wData.current.temperature_2m);
  const humidity = Number(wData.current.relative_humidity_2m);

  // 3) Store in MongoDB
  const saved = await WeatherSnapshot.create({
    userId,
    locationName,
    latitude,
    longitude,
    temperature,
    humidity,
    source: "open-meteo",
  });

  // 4) Return
  return Response.json({
    ok: true,
    weather: {
      id: saved._id.toString(),
      locationName,
      latitude,
      longitude,
      temperature,
      humidity,
      createdAt: saved.createdAt,
    },
  });
}
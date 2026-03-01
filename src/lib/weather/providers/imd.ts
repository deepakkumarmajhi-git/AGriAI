export async function fetchIMDForecast(city: string) {
  const base = process.env.IMD_FORECAST_URL;
  if (!base) throw new Error("IMD_FORECAST_URL not set");

  const url = new URL(base);
  url.searchParams.set("city", city);

  const headers: Record<string, string> = {};
  if (process.env.IMD_API_KEY) headers["Authorization"] = `Bearer ${process.env.IMD_API_KEY}`;

  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error(data?.error || "IMD fetch failed");

  return data;
}
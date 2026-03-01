import { NextResponse } from "next/server";
import {connectDB} from "@/lib/db";
import FarmPlan from "@/models/FarmPlan";
import { computeFarmAdvice } from "@/lib/farm-ai/rules";

type Ctx = { params: Promise<{ id: string }> | { id: string } };

async function getId(ctx: Ctx) {
  const p: any = (ctx as any).params;
  const resolved = typeof p?.then === "function" ? await p : p;
  return resolved?.id as string;
}

function getRequestOrigin(req: Request) {
  // Works in dev + Vercel + reverse proxies
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.url.startsWith("https") ? "https" : "http");

  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host");

  if (!host) {
    // fallback to req.url origin
    return new URL(req.url).origin;
  }

  return `${proto}://${host}`;
}

// Robust: parse JSON if possible, otherwise return text
async function readJsonOrText(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return { kind: "json" as const, body: await res.json().catch(() => null) };
  }
  const text = await res.text().catch(() => "");
  // Sometimes APIs return JSON with wrong content-type:
  try {
    const maybe = JSON.parse(text);
    return { kind: "json" as const, body: maybe };
  } catch {
    return { kind: "text" as const, body: text };
  }
}

// Normalize forecast for your rules engine
function normalizeForecast7(data: any) {
  // If your /api/weather/forecast returns { daily: [...] }
  if (Array.isArray(data?.daily)) {
    return data.daily.slice(0, 7).map((d: any) => ({
      date:
        d.date ||
        d.time ||
        d.dtISO ||
        new Date((toUnixSeconds(d.dt) || Math.floor(Date.now() / 1000)) * 1000)
          .toISOString()
          .slice(0, 10),

      tempMax: num0(d.tempMax ?? d.max ?? d.temperatureMax),
      tempMin: num0(d.tempMin ?? d.min ?? d.temperatureMin),

      rainChance: pct(d.rainChance ?? d.pop ?? d.precipProbability ?? 0),
      rainMm: num0(d.rainMm ?? d.rain ?? d.precipMm ?? d.precipitation_sum ?? 0),

      humidity: num0(d.humidity ?? d.rh ?? d.relativeHumidity ?? 0),
    }));
  }

  // Open-Meteo-like shape
  if (data?.daily?.time && Array.isArray(data.daily.time)) {
    return data.daily.time.slice(0, 7).map((t: string, i: number) => ({
      date: t,
      tempMax: num0(data.daily.temperature_2m_max?.[i]),
      tempMin: num0(data.daily.temperature_2m_min?.[i]),
      rainChance: pct(data.daily.precipitation_probability_max?.[i] ?? 0),
      rainMm: num0(data.daily.precipitation_sum?.[i] ?? 0),
      humidity: 0,
    }));
  }

  return [];
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    await connectDB();

    const id = await getId(ctx);
    const { userId } = await req.json();

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const plan = await FarmPlan.findOne({ _id: id, userId });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const origin = getRequestOrigin(req);
    const city = plan.location?.city || "Bhubaneswar";

    const weatherUrl = `${origin}/api/weather/forecast?city=${encodeURIComponent(city)}`;

    // 🔥 This will show you the real issue clearly
    const weatherRes = await fetch(weatherUrl, { cache: "no-store" });
    const parsed = await readJsonOrText(weatherRes);

    if (!weatherRes.ok) {
      return NextResponse.json(
        {
          error: "Weather endpoint failed",
          weatherUrl,
          status: weatherRes.status,
          response: parsed.body,
        },
        { status: 500 }
      );
    }

    if (parsed.kind !== "json" || !parsed.body) {
      return NextResponse.json(
        {
          error: "Weather endpoint did not return JSON",
          weatherUrl,
          status: weatherRes.status,
          response: parsed.body,
        },
        { status: 500 }
      );
    }

    const forecast7 = normalizeForecast7(parsed.body);

    if (!forecast7.length) {
      return NextResponse.json(
        {
          error: "Forecast normalization produced empty daily forecast",
          weatherUrl,
          hint: "Your /api/weather/forecast JSON shape is different. Paste its response body.",
          sampleKeys: Object.keys(parsed.body || {}),
        },
        { status: 500 }
      );
    }

    const recentScans = (plan.linkedScans || [])
      .slice(-6)
      .reverse()
      .map((s: any) => ({
        result: s.result || "",
        confidence: Number(s.confidence || 0),
        date: s.date || "",
      }));

    const nowISO = new Date().toISOString();

    const advice = computeFarmAdvice({
      cropName: plan.cropName,
      stage: plan.stage,
      irrigationMethod: plan.irrigationMethod,
      forecast7,
      recentScans,
      nowISO,
      scanPlanDaysPerWeek: plan.scanPlan?.daysPerWeek || 3,
    });

    plan.latestAdvice = {
      generatedAt: nowISO,
      todayTasks: advice.todayTasks,
      irrigationNext7Days: advice.irrigationNext7Days,
      diseaseRisks: advice.diseaseRisks,
      summary: advice.summary,
    };

    plan.scanPlan.nextScanDueAt = advice.nextScanDueAt;

    await plan.save();

    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

function num0(x: any) {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}
function pct(x: any) {
  const v = Number(x);
  const p = v <= 1 ? v * 100 : v;
  return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0));
}
function toUnixSeconds(x: any) {
  if (typeof x === "number") {
    if (x > 1e12) return Math.floor(x / 1000);
    if (x > 1e10) return Math.floor(x / 1000);
    return x;
  }
  const d = new Date(x);
  const ms = d.getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}
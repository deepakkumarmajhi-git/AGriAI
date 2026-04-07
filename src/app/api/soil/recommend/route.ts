import { NextResponse } from "next/server";
import { recommendCropsLocally } from "@/lib/soil/localRecommendation";
import type { SoilInputs } from "@/lib/soil/soilAnalysis";

const ML_SERVER_TIMEOUT_MS = 8000;

function toFiniteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSoilInput(body: Record<string, unknown>): SoilInputs | null {
  const input = {
    N: toFiniteNumber(body.N),
    P: toFiniteNumber(body.P),
    K: toFiniteNumber(body.K),
    temperature: toFiniteNumber(body.temperature),
    humidity: toFiniteNumber(body.humidity),
    ph: toFiniteNumber(body.ph),
    rainfall: toFiniteNumber(body.rainfall),
  };

  if (Object.values(input).some((value) => value == null)) {
    return null;
  }

  return input as SoilInputs;
}

async function fetchFromMlServer(url: string, input: SoilInputs) {
  const res = await fetch(`${url}/predict-crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: AbortSignal.timeout(ML_SERVER_TIMEOUT_MS),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.detail || data?.error || "ML server failed");
  }

  return {
    crops: Array.isArray(data?.crops) ? data.crops : [],
    confidences: Array.isArray(data?.confidences) ? data.confidences : [],
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = parseSoilInput(body);

    if (!input) {
      return NextResponse.json(
        { error: "N, P, K, temperature, humidity, ph, and rainfall are required" },
        { status: 400 }
      );
    }

    const url = process.env.ML_SERVER_URL?.trim();

    if (url) {
      try {
        const data = await fetchFromMlServer(url, input);

        return NextResponse.json({
          ...data,
          provider: "ml-server",
        });
      } catch (error) {
        const fallback = recommendCropsLocally(input);

        return NextResponse.json({
          ...fallback,
          provider: "local-heuristic",
          warning:
            error instanceof Error
              ? `ML server unavailable. Using built-in crop recommendation fallback. ${error.message}`
              : "ML server unavailable. Using built-in crop recommendation fallback.",
        });
      }
    }

    const fallback = recommendCropsLocally(input);

    return NextResponse.json({
      ...fallback,
      provider: "local-heuristic",
      warning: "ML_SERVER_URL not set. Using built-in crop recommendation fallback.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

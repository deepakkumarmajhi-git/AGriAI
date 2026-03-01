import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = process.env.ML_SERVER_URL || "http://localhost:8000";
    const res = await fetch(`${url}/predict-crop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || "ML server failed", details: data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      crops: data?.crops || [],
      confidences: data?.confidences || [],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
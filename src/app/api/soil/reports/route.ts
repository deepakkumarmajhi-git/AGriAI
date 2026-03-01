import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SoilReport from "@/models/SoilReport";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { userId, inputs, weather, soilReport, recommendations } = body;

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (!inputs?.N && inputs?.N !== 0) return NextResponse.json({ error: "inputs required" }, { status: 400 });

    const doc = await SoilReport.create({
      userId,
      inputs,
      weather: weather || {},
      soilReport: soilReport || {},
      recommendations: recommendations || {},
    });

    return NextResponse.json({ ok: true, report: doc }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const reports = await SoilReport.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ ok: true, reports });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import {connectDB} from "@/lib/db";
import FarmPlan from "@/models/FarmPlan";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { userId, cropName, variety, location, sowingDate, irrigationMethod, scanDaysPerWeek } = body;

    if (!userId || !cropName || !location?.city || !sowingDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const plan = await FarmPlan.create({
      userId,
      cropName,
      variety: variety || "",
      location: {
        city: location.city,
        district: location.district || "",
        state: location.state || "",
      },
      sowingDate,
      irrigationMethod: irrigationMethod || "unknown",
      scanPlan: {
        daysPerWeek: Number(scanDaysPerWeek || 3),
        preferredDays: ["Mon", "Wed", "Fri"],
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const plans = await FarmPlan.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ plans });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PMKisanTracker from "@/models/PMKisanTracker";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const doc = await PMKisanTracker.findOne({ userId }).lean();
  return NextResponse.json({ ok: true, tracker: doc });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { userId, farmerName, mobile, aadhaarLast4 } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const tracker = await PMKisanTracker.findOneAndUpdate(
    { userId },
    { $set: { userId, farmerName: farmerName || "", mobile: mobile || "", aadhaarLast4: aadhaarLast4 || "" } },
    { new: true, upsert: true }
  );

  return NextResponse.json({ ok: true, tracker });
}
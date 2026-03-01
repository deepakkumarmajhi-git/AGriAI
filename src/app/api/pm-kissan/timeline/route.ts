import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PMKisanTracker from "@/models/PMKisanTracker";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { userId, label, details } = body;

  if (!userId || !label) return NextResponse.json({ error: "userId & label required" }, { status: 400 });

  const tracker = await PMKisanTracker.findOneAndUpdate(
    { userId },
    { $push: { timeline: { label, details: details || "" } } },
    { new: true, upsert: true }
  );

  return NextResponse.json({ ok: true, tracker });
}
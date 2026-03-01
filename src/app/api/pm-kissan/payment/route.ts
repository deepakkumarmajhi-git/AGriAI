import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import PMKisanTracker from "@/models/PMKisanTracker";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { userId, amount, note } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const tracker = await PMKisanTracker.findOneAndUpdate(
    { userId },
    { $push: { payments: { amount: Number(amount || 0), note: note || "" } } },
    { new: true, upsert: true }
  );

  return NextResponse.json({ ok: true, tracker });
}
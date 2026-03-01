import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserScheme from "@/models/UserScheme";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const items = await UserScheme.find({ userId })
    .populate("schemeId")
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ ok: true, items });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { userId, schemeId } = body;

  if (!userId || !schemeId) return NextResponse.json({ error: "userId & schemeId required" }, { status: 400 });

  const doc = await UserScheme.findOneAndUpdate(
    { userId, schemeId },
    { $setOnInsert: { userId, schemeId, status: "saved", timeline: [{ label: "Saved", details: "" }] } },
    { new: true, upsert: true }
  );

  return NextResponse.json({ ok: true, item: doc });
}
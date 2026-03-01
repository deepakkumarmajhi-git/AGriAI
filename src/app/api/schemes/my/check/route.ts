import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserScheme from "@/models/UserScheme";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const schemeId = searchParams.get("schemeId");

  if (!userId || !schemeId) {
    return NextResponse.json({ error: "userId & schemeId required" }, { status: 400 });
  }

  const item = await UserScheme.findOne({ userId, schemeId }).lean();
  return NextResponse.json({ ok: true, item });
}
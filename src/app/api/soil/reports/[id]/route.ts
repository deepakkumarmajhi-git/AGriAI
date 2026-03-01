import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SoilReport from "@/models/SoilReport";

type Ctx = { params: Promise<{ id: string }> | { id: string } };

async function getId(ctx: Ctx) {
  const p: any = (ctx as any).params;
  const resolved = typeof p?.then === "function" ? await p : p;
  return resolved?.id as string;
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    await connectDB();
    const id = await getId(ctx);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const report = await SoilReport.findOne({ _id: id, userId }).lean();
    if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, report });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    await connectDB();
    const id = await getId(ctx);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const deleted = await SoilReport.findOneAndDelete({ _id: id, userId });
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
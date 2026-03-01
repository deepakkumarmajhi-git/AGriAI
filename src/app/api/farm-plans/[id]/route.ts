import { NextResponse } from "next/server";
import {connectDB} from "@/lib/db";
import FarmPlan from "@/models/FarmPlan";

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
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const plan = await FarmPlan.findOne({ _id: id, userId });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await connectDB();

    const id = await getId(ctx);
    const body = await req.json();

    const { userId, stage, irrigationMethod, scanPlan } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const update: any = {};
    if (stage) update.stage = stage;
    if (irrigationMethod) update.irrigationMethod = irrigationMethod;
    if (scanPlan) update.scanPlan = scanPlan;

    const plan = await FarmPlan.findOneAndUpdate(
      { _id: id, userId },
      { $set: update },
      { new: true }
    );

    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    return NextResponse.json({ plan });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
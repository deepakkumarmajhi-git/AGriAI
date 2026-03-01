import { NextResponse } from "next/server";
import {connectDB} from "@/lib/db";
import FarmPlan from "@/models/FarmPlan";

type Ctx = { params: Promise<{ id: string }> | { id: string } };

async function getId(ctx: Ctx) {
  const p: any = (ctx as any).params;
  const resolved = typeof p?.then === "function" ? await p : p;
  return resolved?.id as string;
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    await connectDB();

    const id = await getId(ctx);
    const body = await req.json();

    const { userId, scanId, result, confidence, scannedAt } = body;

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (!scanId) return NextResponse.json({ error: "scanId required" }, { status: 400 });

    const plan = await FarmPlan.findOne({ _id: id, userId });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const nowISO = scannedAt || new Date().toISOString();

    // push scan link
    plan.linkedScans = plan.linkedScans || [];
    plan.linkedScans.push({
      scanId,
      date: nowISO,
      result: result || "",
      confidence: Number(confidence || 0),
    });

    // update scanPlan timestamps
    plan.scanPlan = plan.scanPlan || {};
    plan.scanPlan.lastScanAt = nowISO;

    // simple next due: 3 days/week => 2 days gap, 4 days/week => 1 day gap
    const daysPerWeek = Number(plan.scanPlan.daysPerWeek || 3);
    const gap = daysPerWeek >= 4 ? 1 : 2;
    const d = new Date(nowISO);
    d.setDate(d.getDate() + gap);
    plan.scanPlan.nextScanDueAt = d.toISOString();

    await plan.save();
    return NextResponse.json({ ok: true, plan });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
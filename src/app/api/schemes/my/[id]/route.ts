import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import UserScheme from "@/models/UserScheme";

type Ctx = { params: Promise<{ id: string }> | { id: string } };

async function getId(ctx: Ctx) {
  const p: any = (ctx as any).params;
  const resolved = typeof p?.then === "function" ? await p : p;
  return resolved?.id as string;
}

export async function PATCH(req: Request, ctx: Ctx) {
  await connectDB();
  const id = await getId(ctx);
  const body = await req.json();
  const { userId, status, label, details } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const update: any = {};
  if (status) update.status = status;

  const item = await UserScheme.findOneAndUpdate(
    { _id: id, userId },
    {
      $set: update,
      ...(label ? { $push: { timeline: { label, details: details || "" } } } : {}),
    },
    { new: true }
  );

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}   
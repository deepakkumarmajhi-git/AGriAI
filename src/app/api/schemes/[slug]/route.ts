import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Scheme from "@/models/Scheme";

type Ctx = { params: Promise<{ slug: string }> | { slug: string } };

async function getSlug(ctx: Ctx) {
  const p: any = (ctx as any).params;
  const resolved = typeof p?.then === "function" ? await p : p;
  return resolved?.slug as string;
}

export async function GET(req: Request, ctx: Ctx) {
  await connectDB();
  const slug = await getSlug(ctx);
  const scheme = await Scheme.findOne({ slug }).lean();
  if (!scheme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, scheme });
}
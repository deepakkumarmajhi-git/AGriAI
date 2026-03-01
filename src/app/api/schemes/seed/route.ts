import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Scheme from "@/models/Scheme";
import { seedSchemes } from "@/lib/schemes/seedSchemes";

export async function POST() {
  await connectDB();
  // Avoid duplicates by slug
  for (const s of seedSchemes as unknown as any[]) {
    await Scheme.updateOne({ slug: s.slug }, { $set: s }, { upsert: true });
  }
  return NextResponse.json({ ok: true });
}
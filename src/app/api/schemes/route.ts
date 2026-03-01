import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Scheme from "@/models/Scheme";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const scope = searchParams.get("scope"); // central|state|all
  const state = searchParams.get("state"); // e.g. Odisha
  const category = searchParams.get("category");

  const filter: any = { isActive: true };

  if (scope && scope !== "all") filter.scope = scope;
  if (state && state !== "All") filter.$or = [{ scope: "central" }, { scope: "state", state }];
  if (category && category !== "all") filter.category = category;

  if (q) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { shortDescription: { $regex: q, $options: "i" } },
          { tags: { $in: [new RegExp(q, "i")] } },
        ],
      },
    ];
  }

  const schemes = await Scheme.find(filter).sort({ updatedAt: -1 }).limit(200).lean();
  return NextResponse.json({ ok: true, schemes });
}
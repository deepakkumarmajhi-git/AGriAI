import { connectDB } from "@/lib/db";
import { Scan } from "@/models/Scan";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status"); // all | healthy | diseased
  const q = searchParams.get("q"); // search

  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const filter: any = { userId };

  if (status === "healthy") filter.disease = "Healthy";
  if (status === "diseased") filter.disease = { $ne: "Healthy" };

  if (q && q.trim()) {
    filter.$or = [
      { disease: { $regex: q.trim(), $options: "i" } },
      { imageName: { $regex: q.trim(), $options: "i" } },
      { crop: { $regex: q.trim(), $options: "i" } },
    ];
  }

  const scans = await Scan.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  return Response.json({
    ok: true,
    scans: scans.map((s: any) => ({
      id: s._id.toString(),
      crop: s.crop || "",
      disease: s.disease,
      confidence: s.confidence,
      recommendation: s.recommendation || "",
      reason: s.reason || "",
      organicTreatment: s.organicTreatment || "",
      artificialTreatment: s.artificialTreatment || "",
      prevention: s.prevention || "",
      imageName: s.imageName || "",
      imageUrl: s.imageUrl || "",
      createdAt: s.createdAt,
    })),
  });
}

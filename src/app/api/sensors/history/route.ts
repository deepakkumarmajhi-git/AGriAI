export const runtime = "nodejs";

import { connectDB } from "@/lib/db";
import { SensorReading } from "@/models/SensorReading";

function getUserId(req: Request) {
  const userId = req.headers.get("x-user-id");
  return userId && userId.trim() ? userId.trim() : null;
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Missing x-user-id header" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

  const rows = await SensorReading.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return Response.json({
    ok: true,
    readings: rows
      .reverse()
      .map((r: any) => ({
        id: r._id.toString(),
        moisture: r.moisture ?? null,
        temperature: r.temperature ?? null,
        humidity: r.humidity ?? null,
        deviceId: r.deviceId || "simulator",
        location: r.location || "demo",
        createdAt: r.createdAt,
      })),
  });
}

// Optional: clear demo data
export async function DELETE(req: Request) {
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Missing x-user-id header" }, { status: 401 });

  await connectDB();
  await SensorReading.deleteMany({ userId });

  return Response.json({ ok: true });
}
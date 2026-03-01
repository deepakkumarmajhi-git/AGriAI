import { connectDB } from "@/lib/db";
import { SensorReading } from "@/models/SensorReading";
import { Alert } from "@/models/Alert";
import { notifyAlertById } from "@/lib/notifyAlert";

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const {
    userId,
    moisture = null,
    temperature = null,
    humidity = null,
    deviceId = "simulator",
    location = "demo",
  } = body;

  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const saved = await SensorReading.create({
    userId,
    moisture,
    temperature,
    humidity,
    deviceId,
    location,
  });

  // ✅ Auto alerts + email

  if (typeof moisture === "number" && moisture < 35) {
    const a = await Alert.create({
      userId,
      level: "warning",
      title: "Low Soil Moisture",
      message: `Soil moisture is ${moisture}%. Consider irrigation.`,
    });
    await notifyAlertById(a._id.toString());
  }

  if (typeof temperature === "number" && temperature > 35) {
    const a = await Alert.create({
      userId,
      level: "warning",
      title: "High Temperature",
      message: `Temperature is ${temperature}°C. Risk of heat stress. Water early morning / provide shade.`,
    });
    await notifyAlertById(a._id.toString());
  }

  return Response.json({
    ok: true,
    reading: {
      id: saved._id.toString(),
      moisture: saved.moisture,
      temperature: saved.temperature,
      humidity: saved.humidity,
      createdAt: saved.createdAt,
    },
  });
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const latest = await SensorReading.findOne({ userId }).sort({ createdAt: -1 }).lean();

  return Response.json({
    ok: true,
    latest: latest
      ? {
          id: (latest as any)._id.toString(),
          moisture: (latest as any).moisture ?? null,
          temperature: (latest as any).temperature ?? null,
          humidity: (latest as any).humidity ?? null,
          createdAt: (latest as any).createdAt,
        }
      : null,
  });
}
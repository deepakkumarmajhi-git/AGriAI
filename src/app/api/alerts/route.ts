import { connectDB } from "@/lib/db";
import { Alert } from "@/models/Alert";
import { notifyAlertById } from "@/lib/notifyAlert";

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });

  const alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();

  return Response.json({
    ok: true,
    alerts: alerts.map((a: any) => ({
      id: a._id.toString(),
      level: a.level,
      title: a.title,
      message: a.message,
      resolved: a.resolved,
      createdAt: a.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const { userId, level = "info", title, message, relatedScanId = null } = body;

  if (!userId || !title || !message) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const saved = await Alert.create({
    userId,
    level,
    title,
    message,
    relatedScanId,
  });

  // ✅ send email
  await notifyAlertById(saved._id.toString());

  return Response.json({
    ok: true,
    alert: {
      id: saved._id.toString(),
      level: saved.level,
      title: saved.title,
      message: saved.message,
      resolved: saved.resolved,
      createdAt: saved.createdAt,
    },
  });
}
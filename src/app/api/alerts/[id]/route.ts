import { connectDB } from "@/lib/db";
import { Alert } from "@/models/Alert";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDB();

  // ✅ Next.js dynamic params are async in your version
  const { id } = await context.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid alert id" }, { status: 400 });
  }

  const body = await req.json();
  const { resolved } = body;

  if (typeof resolved !== "boolean") {
    return Response.json({ error: "resolved must be boolean" }, { status: 400 });
  }

  // ✅ Mongoose: use returnDocument instead of new:true
  const updated = await Alert.findByIdAndUpdate(
    id,
    {
      resolved,
      resolvedAt: resolved ? new Date() : null,
    },
    { returnDocument: "after" }
  ).lean();

  if (!updated) {
    return Response.json({ error: "Alert not found" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    alert: {
      id: (updated as any)._id.toString(),
      level: (updated as any).level,
      title: (updated as any).title,
      message: (updated as any).message,
      resolved: (updated as any).resolved,
      createdAt: (updated as any).createdAt,
      resolvedAt: (updated as any).resolvedAt,
    },
  });
}
import { connectDB } from "@/lib/db";
import { WasteListing } from "@/models/WasteListing";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { userId, status } = body || {};

  if (!userId || !status) {
    return Response.json({ error: "Missing userId or status" }, { status: 400 });
  }

  if (!["open", "sold", "paused"].includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await WasteListing.findOneAndUpdate(
    { _id: id, userId },
    { status },
    { new: true }
  ).lean();

  if (!updated) {
    return Response.json({ error: "Listing not found" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    listing: {
      id: updated._id.toString(),
      status: updated.status,
    },
  });
}

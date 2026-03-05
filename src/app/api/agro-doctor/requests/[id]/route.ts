export const runtime = "nodejs";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { Alert } from "@/models/Alert";
import { AgroDoctorRequest } from "@/models/AgroDoctorRequest";
import { notifyAlertById } from "@/lib/notifyAlert";

function canUseAdminScope(adminKey: string) {
  const expected = process.env.AGRO_DOCTOR_ADMIN_KEY || "";
  if (!expected) return true; // MVP/dev fallback
  return adminKey === expected;
}

function modeLabel(mode: string) {
  if (mode === "phone_call") return "Phone Call";
  if (mode === "video_call") return "Video Call";
  if (mode === "offline_visit") return "Offline Visit";
  return mode;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await req.json();
    const status = typeof body?.status === "string" ? body.status : "";
    const adminKey = typeof body?.adminKey === "string" ? body.adminKey : "";
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const doctorName = typeof body?.doctorName === "string" ? body.doctorName.trim() : "";
    const doctorPhone = typeof body?.doctorPhone === "string" ? body.doctorPhone.trim() : "";
    const doctorNotes = typeof body?.doctorNotes === "string" ? body.doctorNotes.trim() : "";
    const scheduledAt = typeof body?.scheduledAt === "string" ? body.scheduledAt : "";

    let updated: any = null;

    // Admin/status update mode
    if (status) {
      if (!["in_review", "approved", "rejected", "completed"].includes(status)) {
        return Response.json({ error: "Invalid status" }, { status: 400 });
      }
      if (!canUseAdminScope(adminKey)) {
        return Response.json({ error: "Unauthorized admin access" }, { status: 401 });
      }

      updated = await AgroDoctorRequest.findByIdAndUpdate(
        id,
        {
          status,
          ...(doctorName ? { doctorName } : {}),
          ...(doctorPhone ? { doctorPhone } : {}),
          ...(doctorNotes ? { doctorNotes } : {}),
          ...(scheduledAt ? { scheduledAt } : {}),
        },
        { returnDocument: "after" }
      ).lean();
    } else {
      // Farmer edit mode
      if (!userId) {
        return Response.json(
          { error: "Missing userId for farmer edit or status for admin update" },
          { status: 400 }
        );
      }
      if (!Types.ObjectId.isValid(userId)) {
        return Response.json({ error: "Invalid userId" }, { status: 400 });
      }

      const existing = await AgroDoctorRequest.findOne({ _id: id, userId }).lean();
      if (!existing) {
        return Response.json({ error: "Request not found for this user" }, { status: 404 });
      }

      const patch: any = {};
      if (typeof body?.farmerName === "string") patch.farmerName = body.farmerName.trim();
      if (typeof body?.farmerPhone === "string") patch.farmerPhone = body.farmerPhone.trim();
      if (typeof body?.consultationMode === "string") patch.consultationMode = body.consultationMode;
      if (typeof body?.discussionType === "string") patch.discussionType = body.discussionType.trim();
      if (typeof body?.problemDetails === "string") patch.problemDetails = body.problemDetails.trim();
      if (typeof body?.preferredDateTime === "string") patch.preferredDateTime = body.preferredDateTime;
      if (typeof body?.location === "string") patch.location = body.location.trim();
      if (typeof body?.preferredLanguage === "string") patch.preferredLanguage = body.preferredLanguage.trim();

      if (!Object.keys(patch).length) {
        return Response.json({ error: "No fields provided for update" }, { status: 400 });
      }

      const mode = patch.consultationMode || (existing as any).consultationMode;
      const location =
        patch.location !== undefined ? patch.location : ((existing as any).location || "");

      if (!["phone_call", "video_call", "offline_visit"].includes(mode)) {
        return Response.json({ error: "Invalid consultationMode" }, { status: 400 });
      }
      if (mode === "offline_visit" && !String(location || "").trim()) {
        return Response.json(
          { error: "Location is required for offline visit" },
          { status: 400 }
        );
      }

      if ((patch.farmerName !== undefined && !patch.farmerName) || (patch.farmerPhone !== undefined && !patch.farmerPhone)) {
        return Response.json(
          { error: "Farmer name and phone cannot be empty" },
          { status: 400 }
        );
      }
      if ((patch.discussionType !== undefined && !patch.discussionType) || (patch.problemDetails !== undefined && !patch.problemDetails)) {
        return Response.json(
          { error: "Discussion type and problem details cannot be empty" },
          { status: 400 }
        );
      }

      updated = await AgroDoctorRequest.findOneAndUpdate(
        { _id: id, userId },
        patch,
        { returnDocument: "after" }
      ).lean();
    }

    if (!updated) {
      return Response.json({ error: "Request not found" }, { status: 404 });
    }

    const notifyUserId = String((updated as any).userId || "");
    if (status && Types.ObjectId.isValid(notifyUserId)) {
      let title = "Agro Doctor Request Updated";
      let message =
        `Your Agro Doctor request status is now ${status.toUpperCase()}. ` +
        `Mode: ${modeLabel(String((updated as any).consultationMode || ""))}.`;

      if (status === "approved") {
        title = "Agro Doctor Request Approved";
        message =
          `Your Agro Doctor request has been approved. ` +
          `${scheduledAt ? `Scheduled: ${scheduledAt}. ` : ""}` +
          `${doctorName ? `Doctor: ${doctorName}. ` : ""}` +
          `${doctorNotes ? `Notes: ${doctorNotes}` : ""}`;
      } else if (status === "rejected") {
        title = "Agro Doctor Request Rejected";
        message = `Your Agro Doctor request was rejected. ${doctorNotes ? `Reason: ${doctorNotes}` : ""}`;
      } else if (status === "completed") {
        title = "Agro Doctor Consultation Completed";
        message = `Your Agro Doctor consultation is marked completed.`;
      }

      const alert = await Alert.create({
        userId: notifyUserId,
        level: status === "rejected" ? "warning" : "info",
        title,
        message,
      });
      await notifyAlertById(alert._id.toString());
    }

    return Response.json({
      ok: true,
      request: {
        id: String((updated as any)._id),
        userId: String((updated as any).userId || ""),
        farmerName: (updated as any).farmerName || "",
        farmerPhone: (updated as any).farmerPhone || "",
        consultationMode: (updated as any).consultationMode || "",
        discussionType: (updated as any).discussionType || "",
        problemDetails: (updated as any).problemDetails || "",
        preferredDateTime: (updated as any).preferredDateTime || "",
        location: (updated as any).location || "",
        preferredLanguage: (updated as any).preferredLanguage || "en",
        status: (updated as any).status,
        doctorName: (updated as any).doctorName || "",
        doctorPhone: (updated as any).doctorPhone || "",
        doctorNotes: (updated as any).doctorNotes || "",
        scheduledAt: (updated as any).scheduledAt || "",
        createdAt: (updated as any).createdAt,
        updatedAt: (updated as any).updatedAt,
      },
    });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to update Agro Doctor request", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid request id" }, { status: 400 });
    }

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const url = new URL(req.url);
    const userIdFromBody = typeof body?.userId === "string" ? body.userId : "";
    const userIdFromQuery = url.searchParams.get("userId") || "";
    const userId = userIdFromBody || userIdFromQuery;

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(userId)) {
      return Response.json({ error: "Invalid userId" }, { status: 400 });
    }

    const deleted = await AgroDoctorRequest.findOneAndDelete({ _id: id, userId }).lean();
    if (!deleted) {
      return Response.json({ error: "Request not found for this user" }, { status: 404 });
    }

    const alert = await Alert.create({
      userId,
      level: "info",
      title: "Agro Doctor Request Cancelled",
      message: `Your Agro Doctor request (${id}) has been cancelled successfully.`,
    });
    await notifyAlertById(alert._id.toString());

    return Response.json({
      ok: true,
      deletedId: id,
    });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to cancel Agro Doctor request", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}

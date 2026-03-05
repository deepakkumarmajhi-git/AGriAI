export const runtime = "nodejs";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db";
import { Alert } from "@/models/Alert";
import { AgroDoctorRequest } from "@/models/AgroDoctorRequest";
import { notifyAlertById } from "@/lib/notifyAlert";
import { sendEmail } from "@/lib/mailer";

function mapRequest(x: any) {
  return {
    id: x._id.toString(),
    userId: x.userId?.toString?.() || "",
    farmerName: x.farmerName || "",
    farmerPhone: x.farmerPhone || "",
    consultationMode: x.consultationMode || "",
    discussionType: x.discussionType || "",
    problemDetails: x.problemDetails || "",
    preferredDateTime: x.preferredDateTime || "",
    location: x.location || "",
    preferredLanguage: x.preferredLanguage || "en",
    status: x.status || "submitted",
    doctorName: x.doctorName || "",
    doctorPhone: x.doctorPhone || "",
    doctorNotes: x.doctorNotes || "",
    scheduledAt: x.scheduledAt || "",
    createdAt: x.createdAt,
    updatedAt: x.updatedAt,
  };
}

function modeLabel(mode: string) {
  if (mode === "phone_call") return "Phone Call";
  if (mode === "video_call") return "Video Call";
  if (mode === "offline_visit") return "Offline Visit";
  return mode;
}

function canUseAdminScope(adminKey: string | null) {
  const expected = process.env.AGRO_DOCTOR_ADMIN_KEY || "";
  if (!expected) return true; // MVP/dev fallback
  return adminKey === expected;
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") || "mine";
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");
  const adminKey = searchParams.get("adminKey");

  const filter: any = {};

  if (scope === "all") {
    if (!canUseAdminScope(adminKey)) {
      return Response.json({ error: "Unauthorized admin access" }, { status: 401 });
    }
  } else {
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(userId)) {
      return Response.json({ error: "Invalid userId" }, { status: 400 });
    }
    filter.userId = userId;
  }

  if (status) filter.status = status;

  const requests = await AgroDoctorRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return Response.json({
    ok: true,
    requests: requests.map(mapRequest),
  });
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const userId = typeof body?.userId === "string" ? body.userId : "";
    const farmerName = typeof body?.farmerName === "string" ? body.farmerName.trim() : "";
    const farmerPhone = typeof body?.farmerPhone === "string" ? body.farmerPhone.trim() : "";
    const consultationMode =
      typeof body?.consultationMode === "string" ? body.consultationMode : "";
    const discussionType =
      typeof body?.discussionType === "string" ? body.discussionType.trim() : "";
    const problemDetails =
      typeof body?.problemDetails === "string" ? body.problemDetails.trim() : "";
    const preferredDateTime =
      typeof body?.preferredDateTime === "string" ? body.preferredDateTime.trim() : "";
    const location = typeof body?.location === "string" ? body.location.trim() : "";
    const preferredLanguage =
      typeof body?.preferredLanguage === "string" && body.preferredLanguage
        ? body.preferredLanguage
        : "en";

    if (!userId || !farmerName || !farmerPhone || !consultationMode || !discussionType || !problemDetails) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(userId)) {
      return Response.json({ error: "Invalid userId" }, { status: 400 });
    }
    if (!["phone_call", "video_call", "offline_visit"].includes(consultationMode)) {
      return Response.json({ error: "Invalid consultationMode" }, { status: 400 });
    }
    if (consultationMode === "offline_visit" && !location) {
      return Response.json({ error: "Location is required for offline visit" }, { status: 400 });
    }

    const saved = await AgroDoctorRequest.create({
      userId,
      farmerName,
      farmerPhone,
      consultationMode,
      discussionType,
      problemDetails,
      preferredDateTime,
      location,
      preferredLanguage,
      status: "submitted",
    });

    const a = await Alert.create({
      userId,
      level: "info",
      title: "Agro Doctor Request Received",
      message:
        `Your ${modeLabel(consultationMode)} request has been received and forwarded to Agro Doctor team. ` +
        `Request ID: ${saved._id.toString()}. You will get approval notification soon.`,
    });
    await notifyAlertById(a._id.toString());

    const doctorEmail =
      process.env.AGRO_DOCTOR_EMAIL ||
      process.env.CONTACT_ADMIN_EMAIL ||
      process.env.ALERT_EMAIL_FROM ||
      "";

    let emailForwarded = false;
    let emailForwardError = "";

    if (doctorEmail) {
      const lines = [
        "New Agro Doctor consultation request",
        `Request ID: ${saved._id.toString()}`,
        `Farmer name: ${farmerName}`,
        `Farmer phone: ${farmerPhone}`,
        `Mode: ${modeLabel(consultationMode)}`,
        `Discussion type: ${discussionType}`,
        `Preferred time: ${preferredDateTime || "Not specified"}`,
        `Preferred language: ${preferredLanguage}`,
        `Location: ${location || "N/A"}`,
        "",
        "Problem details:",
        problemDetails,
      ];

      try {
        await sendEmail({
          to: doctorEmail,
          subject: `[Agro Doctor] New Request ${saved._id.toString()}`,
          text: lines.join("\n"),
        });
        emailForwarded = true;
      } catch (e: any) {
        emailForwardError = e?.message || String(e);
      }
    }

    return Response.json({
      ok: true,
      request: mapRequest(saved),
      doctorForwarded: emailForwarded,
      doctorForwardError: emailForwardError,
    });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to create Agro Doctor request", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";

import { connectDB } from "@/lib/db";
import { Scan } from "@/models/Scan";
import { Alert } from "@/models/Alert";
import { uploadImageBuffer } from "@/lib/cloudinary";
import { notifyAlertById } from "@/lib/notifyAlert";

export async function POST(req: Request) {
  try {
    await connectDB();

    const form = await req.formData();
    const file = form.get("image");
    const userId = form.get("userId");

    if (!userId || typeof userId !== "string") {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!file || typeof file === "string") {
      return Response.json(
        { error: "No image found. Send form-data with key: image" },
        { status: 400 }
      );
    }

    const imageFile = file as File;

    // Convert file -> buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploaded = await uploadImageBuffer(buffer, {
      folder: process.env.CLOUDINARY_FOLDER || "smart-agri/scans",
      public_id: `${userId}_${Date.now()}`,
    });

    // MVP mock prediction (replace with real model later)
    const predictions = [
      {
        disease: "Healthy",
        confidence: 0.93,
        recommendation: "No action needed. Keep monitoring moisture and pests.",
      },
      {
        disease: "Leaf Spot (suspected)",
        confidence: 0.78,
        recommendation:
          "Remove affected leaves, avoid overhead watering, improve airflow. Use safe fungicide if needed.",
      },
      {
        disease: "Early Blight (suspected)",
        confidence: 0.74,
        recommendation:
          "Remove infected leaves, maintain spacing, and apply appropriate treatment based on crop guidance.",
      },
    ];

    const result = predictions[Math.floor(Math.random() * predictions.length)];

    // Save scan
    const savedScan = await Scan.create({
      userId,
      imageName: imageFile.name,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      disease: result.disease,
      confidence: result.confidence,
      recommendation: result.recommendation,
      source: "web",
      modelVersion: "mvp-mock",
    });

    // Create alert if not healthy + send email
    if (result.disease !== "Healthy") {
      const a = await Alert.create({
        userId,
        level: "warning",
        title: "Possible Leaf Disease Detected",
        message: `${result.disease} — ${(result.confidence * 100).toFixed(
          0
        )}% confidence. ${result.recommendation}`,
        relatedScanId: savedScan._id,
      });

      await notifyAlertById(a._id.toString());
    }

    return Response.json({
      ok: true,
      scanId: savedScan._id.toString(),
      imageUrl: uploaded.secure_url,
      result,
    });
  } catch (err) {
    return Response.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
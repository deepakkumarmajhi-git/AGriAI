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
        reason:
          "Leaf surface looks uniform with no major fungal spots, yellow halos, or rot-like lesions.",
        organicTreatment:
          "No treatment needed. Continue low-cost home care: morning watering, clean tools, and remove dry leaves.",
        artificialTreatment:
          "No chemical treatment required at this stage.",
        prevention:
          "Inspect leaves every 2-3 days, avoid water stagnation, and maintain plant spacing for airflow.",
        recommendation:
          "No action needed now. Keep monitoring with regular field checks.",
      },
      {
        disease: "Leaf Spot (suspected)",
        confidence: 0.78,
        reason:
          "Likely caused by high humidity, leaf wetness, and fungal/bacterial infection spread through splash water.",
        organicTreatment:
          "Remove infected leaves, spray diluted neem oil or baking-soda solution, and avoid overhead irrigation. These are low-cost in-home options.",
        artificialTreatment:
          "If spread continues, use a copper oxychloride or mancozeb based fungicide as per local label and safety instructions.",
        prevention:
          "Water only at root zone, improve airflow by pruning dense canopy, and disinfect tools after use.",
        recommendation:
          "Start with organic control for 3-5 days; shift to chemical fungicide only if progression continues.",
      },
      {
        disease: "Early Blight (suspected)",
        confidence: 0.74,
        reason:
          "Commonly linked to fungal pressure in warm-humid weather, weak plant nutrition, and repeated leaf wetness.",
        organicTreatment:
          "Prune affected leaves, apply compost tea or neem-based spray, and add mulch to reduce soil splash. These are low-cost farm practices.",
        artificialTreatment:
          "Use recommended fungicides like chlorothalonil or mancozeb (follow local advisory, dosage, and protective gear).",
        prevention:
          "Rotate crops, maintain balanced nutrients, irrigate in morning, and scan leaves weekly for early symptoms.",
        recommendation:
          "Immediately remove infected parts and begin treatment; repeat follow-up scan in 48 hours.",
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
      reason: result.reason,
      organicTreatment: result.organicTreatment,
      artificialTreatment: result.artificialTreatment,
      prevention: result.prevention,
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

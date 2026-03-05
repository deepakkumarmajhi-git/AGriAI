import mongoose, { Schema, model, models } from "mongoose";

const ScanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    crop: { type: String, default: "" },

    imageUrl: { type: String, default: "" },       // Cloudinary URL
    imagePublicId: { type: String, default: "" },  // Cloudinary public_id
    imageName: { type: String, default: "" },

    disease: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    recommendation: { type: String, default: "" },
    reason: { type: String, default: "" },
    organicTreatment: { type: String, default: "" },
    artificialTreatment: { type: String, default: "" },
    prevention: { type: String, default: "" },

    source: { type: String, enum: ["web", "mobile", "edge"], default: "web" },
    modelVersion: { type: String, default: "mvp-mock" },
  },
  { timestamps: true }
);

export const Scan = models.Scan || model("Scan", ScanSchema);

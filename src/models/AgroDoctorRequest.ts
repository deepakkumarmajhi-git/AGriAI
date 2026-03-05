import { Schema, model, models } from "mongoose";

const AgroDoctorRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    farmerName: { type: String, required: true, trim: true },
    farmerPhone: { type: String, required: true, trim: true },
    consultationMode: {
      type: String,
      enum: ["phone_call", "video_call", "offline_visit"],
      required: true,
      index: true,
    },
    discussionType: { type: String, required: true, trim: true },
    problemDetails: { type: String, required: true, trim: true },

    preferredDateTime: { type: String, default: "" },
    location: { type: String, default: "" },
    preferredLanguage: { type: String, default: "en" },

    status: {
      type: String,
      enum: ["submitted", "in_review", "approved", "rejected", "completed"],
      default: "submitted",
      index: true,
    },
    doctorName: { type: String, default: "" },
    doctorPhone: { type: String, default: "" },
    doctorNotes: { type: String, default: "" },
    scheduledAt: { type: String, default: "" },
  },
  { timestamps: true }
);

export const AgroDoctorRequest =
  models.AgroDoctorRequest || model("AgroDoctorRequest", AgroDoctorRequestSchema);

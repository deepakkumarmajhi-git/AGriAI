import mongoose, { Schema, model, models } from "mongoose";

const AlertSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    level: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    title: { type: String, required: true },
    message: { type: String, required: true },

    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },

    relatedScanId: { type: Schema.Types.ObjectId, ref: "Scan", default: null },

    // ✅ Notification tracking
    notifyEmailSent: { type: Boolean, default: false },
    notifyEmailSentAt: { type: Date, default: null },
    notifyEmailError: { type: String, default: "" },
    notifySmsSent: { type: Boolean, default: false },
    notifySmsSentAt: { type: Date, default: null },
    notifySmsError: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Alert = models.Alert || model("Alert", AlertSchema);

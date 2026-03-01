import mongoose, { Schema, models, model } from "mongoose";

const UserSchemeSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    schemeId: { type: Schema.Types.ObjectId, ref: "Scheme", required: true },

    status: {
      type: String,
      enum: ["saved", "started", "applied", "approved", "rejected", "paid", "claim_submitted", "claim_approved"],
      default: "saved",
    },

    notes: { type: String, default: "" },

    timeline: {
      type: [
        {
          at: { type: Date, default: Date.now },
          label: { type: String, required: true }, // e.g., "Applied on portal"
          details: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default models.UserScheme || model("UserScheme", UserSchemeSchema);
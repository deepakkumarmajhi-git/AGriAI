import mongoose, { Schema, models, model } from "mongoose";

const PMKisanTrackerSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },

    farmerName: { type: String, default: "" },
    mobile: { type: String, default: "" },
    aadhaarLast4: { type: String, default: "" },

    // personal tracking entries
    timeline: {
      type: [
        {
          at: { type: Date, default: Date.now },
          label: { type: String, required: true }, // e.g., "eKYC completed"
          details: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // optional: payment log as personal record
    payments: {
      type: [
        {
          at: { type: Date, default: Date.now },
          amount: { type: Number, default: 0 },
          note: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default models.PMKisanTracker || model("PMKisanTracker", PMKisanTrackerSchema);
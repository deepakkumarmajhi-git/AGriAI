import mongoose, { Schema, models, model } from "mongoose";

const SoilReportSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },

    // input values
    inputs: {
      N: { type: Number, required: true },
      P: { type: Number, required: true },
      K: { type: Number, required: true },
      ph: { type: Number, required: true },
      rainfall: { type: Number, required: true },
      temperature: { type: Number, default: 0 },
      humidity: { type: Number, default: 0 },
    },

    // weather snapshot info
    weather: {
      city: { type: String, default: "" },
      locationName: { type: String, default: "" },
      source: { type: String, default: "" },
      cachedAt: { type: String, default: "" },
    },

    // computed soil report summary (farmer-friendly)
    soilReport: {
      overallScore: { type: Number, default: 0 },
      npkScore: { type: Number, default: 0 },
      phLabel: { type: String, default: "" },
      levels: {
        N: { type: String, default: "" },
        P: { type: String, default: "" },
        K: { type: String, default: "" },
      },
    },

    // ML output
    recommendations: {
      crops: { type: [String], default: [] },
      confidences: { type: [Number], default: [] }, // 0..1 values
    },
  },
  { timestamps: true }
);

export default models.SoilReport || model("SoilReport", SoilReportSchema);
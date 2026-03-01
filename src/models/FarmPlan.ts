import mongoose, { Schema, models, model } from "mongoose";

const IrrigationItemSchema = new Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    recommendation: { type: String, required: true },
    reason: { type: String, default: "" },
    intensity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { _id: false }
);

const DiseaseRiskSchema = new Schema(
  {
    name: { type: String, required: true },
    risk: { type: String, enum: ["low", "medium", "high"], required: true },
    reason: { type: String, default: "" },
    prevention: { type: String, default: "" },
    watchFor: { type: String, default: "" },
  },
  { _id: false }
);

const FarmPlanSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },

    cropName: { type: String, required: true },
    variety: { type: String, default: "" },

    location: {
      city: { type: String, required: true },
      district: { type: String, default: "" },
      state: { type: String, default: "" },
    },

    sowingDate: { type: String, required: true }, // YYYY-MM-DD
    stage: {
      type: String,
      enum: ["planning", "sown", "vegetative", "flowering", "fruiting", "harvest-ready", "harvested"],
      default: "planning",
    },

    irrigationMethod: {
      type: String,
      enum: ["drip", "sprinkler", "flood", "manual", "unknown"],
      default: "unknown",
    },

    scanPlan: {
      daysPerWeek: { type: Number, default: 3 },
      preferredDays: { type: [String], default: ["Mon", "Wed", "Fri"] },
      lastScanAt: { type: String, default: "" },
      nextScanDueAt: { type: String, default: "" },
      adherenceScore: { type: Number, default: 0 },
    },

    linkedScans: {
      type: [
        {
          scanId: String,
          date: String,
          result: String,
          confidence: Number,
        },
      ],
      default: [],
    },

    latestAdvice: {
      generatedAt: { type: String, default: "" },
      todayTasks: { type: [String], default: [] },
      irrigationNext7Days: { type: [IrrigationItemSchema], default: [] },
      diseaseRisks: { type: [DiseaseRiskSchema], default: [] },
      summary: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default models.FarmPlan || model("FarmPlan", FarmPlanSchema);
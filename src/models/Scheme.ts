import mongoose, { Schema, models, model } from "mongoose";

const SchemeSchema = new Schema(
  {
    scope: { type: String, enum: ["central", "state"], required: true }, // central/state
    state: { type: String, default: "" }, // required when scope=state (e.g., "Odisha")
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },

    category: {
      type: String,
      enum: ["subsidy", "income_support", "insurance", "loan", "training", "equipment", "irrigation", "other"],
      default: "other",
    },

    shortDescription: { type: String, default: "" },
    benefits: { type: [String], default: [] },
    eligibility: { type: [String], default: [] },
    documents: { type: [String], default: [] },

    howToApply: { type: [String], default: [] },
    officialLink: { type: String, default: "" },

    tags: { type: [String], default: [] }, // crop tags etc.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Scheme || model("Scheme", SchemeSchema);
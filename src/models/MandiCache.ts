import mongoose, { Schema, model, models } from "mongoose";

const MandiCacheSchema = new Schema(
  {
    // unique cache key built from query
    key: { type: String, required: true, unique: true, index: true },

    provider: { type: String, default: "ceda" },
    fetchedAt: { type: Date, required: true },

    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const MandiCache = models.MandiCache || model("MandiCache", MandiCacheSchema);
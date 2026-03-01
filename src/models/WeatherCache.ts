import mongoose, { Schema, model, models } from "mongoose";

const WeatherCacheSchema = new Schema(
  {
    // key like "bhubaneswar, india" (lowercase)
    key: { type: String, required: true, unique: true, index: true },

    provider: { type: String, default: "open-meteo" },
    fetchedAt: { type: Date, required: true },

    // store raw response for easy future extension
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const WeatherCache = models.WeatherCache || model("WeatherCache", WeatherCacheSchema);
import mongoose, { Schema, model, models } from "mongoose";

const WeatherSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // where this weather belongs to
    locationName: { type: String, required: true }, // e.g., "Pune, India"

    // coordinates used
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },

    // values
    temperature: { type: Number, default: null }, // °C
    humidity: { type: Number, default: null }, // %

    // metadata
    source: { type: String, default: "open-meteo" },
  },
  { timestamps: true }
);

export const WeatherSnapshot =
  models.WeatherSnapshot || model("WeatherSnapshot", WeatherSnapshotSchema);
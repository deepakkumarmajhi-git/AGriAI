import mongoose, { Schema, model, models } from "mongoose";

const SensorReadingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    moisture: { type: Number, default: null }, // %
    temperature: { type: Number, default: null }, // °C (optional)
    humidity: { type: Number, default: null }, // % (optional)

    deviceId: { type: String, default: "simulator" },
    location: { type: String, default: "demo" },
  },
  { timestamps: true }
);

export const SensorReading =
  models.SensorReading || model("SensorReading", SensorReadingSchema);
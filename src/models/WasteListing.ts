import mongoose, { Schema, model, models } from "mongoose";

const WasteListingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerName: { type: String, required: true, trim: true },
    sellerPhone: { type: String, default: "", trim: true },

    wasteType: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "kg", trim: true },
    pricePerUnit: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    preferredBuyerType: { type: String, default: "Recycler", trim: true },

    status: { type: String, enum: ["open", "sold", "paused"], default: "open", index: true },
  },
  { timestamps: true }
);

export const WasteListing = models.WasteListing || model("WasteListing", WasteListingSchema);

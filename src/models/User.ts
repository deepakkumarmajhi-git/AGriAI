import mongoose, { Schema, model, models } from "mongoose";

export type UserRole = "farmer" | "admin";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["farmer", "admin"], default: "farmer" },
    phone: { type: String, default: "" },
    language: { type: String, default: "en" },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);

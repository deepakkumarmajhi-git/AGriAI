export const runtime = "nodejs";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// MVP auth: we read userId from request header set by frontend
function getUserId(req: Request) {
  const userId = req.headers.get("x-user-id");
  return userId && userId.trim() ? userId.trim() : null;
}

export async function GET(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    profile: {
      name: (user as any).name,
      email: (user as any).email,
      phone: (user as any).phone || "",
      language: (user as any).language || "en",
      theme: (user as any).theme || "dark",
      role: (user as any).role || "farmer",
    },
  });
}

export async function PATCH(req: Request) {
  const userId = getUserId(req);
  if (!userId) {
    return Response.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  await connectDB();

  const body = await req.json();

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const language = typeof body?.language === "string" ? body.language.trim() : "en";
  const theme = body?.theme === "light" ? "light" : "dark";

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: { name, phone, language, theme } },
    { returnDocument: "after" }
  ).lean();

  if (!updated) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    profile: {
      name: (updated as any).name,
      email: (updated as any).email,
      phone: (updated as any).phone || "",
      language: (updated as any).language || "en",
      theme: (updated as any).theme || "dark",
      role: (updated as any).role || "farmer",
    },
  });
}

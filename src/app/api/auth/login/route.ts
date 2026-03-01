import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  return Response.json({ ok: true, userId: user._id.toString(), name: user.name });
}
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const { name, email, password } = body;

  if (!name || !email || !password) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return Response.json({ error: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  return Response.json({ ok: true, userId: user._id.toString(), name: user.name });
}
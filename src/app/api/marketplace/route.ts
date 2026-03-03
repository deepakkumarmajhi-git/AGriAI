import { connectDB } from "@/lib/db";
import { MarketplaceListing } from "@/models/MarketplaceListing";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const scope = searchParams.get("scope") || "all";
  const q = searchParams.get("q")?.trim();

  const filter: any = {};

  if (scope === "mine") {
    if (!userId) return Response.json({ error: "Missing userId for mine scope" }, { status: 400 });
    filter.userId = userId;
  } else {
    filter.status = "open";
  }

  if (q) {
    filter.$or = [
      { productName: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }

  const listings = await MarketplaceListing.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  return Response.json({
    ok: true,
    listings: listings.map((x: any) => ({
      id: x._id.toString(),
      userId: x.userId?.toString?.() || "",
      sellerName: x.sellerName,
      sellerPhone: x.sellerPhone || "",
      productName: x.productName,
      category: x.category || "",
      quantity: x.quantity,
      unit: x.unit,
      pricePerUnit: x.pricePerUnit,
      location: x.location,
      description: x.description || "",
      status: x.status,
      createdAt: x.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  await connectDB();
  const body = await req.json();

  const {
    userId,
    sellerName,
    sellerPhone = "",
    productName,
    category = "",
    quantity,
    unit = "kg",
    pricePerUnit,
    location,
    description = "",
  } = body || {};

  if (!userId || !sellerName || !productName || !quantity || !pricePerUnit || !location) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const saved = await MarketplaceListing.create({
    userId,
    sellerName,
    sellerPhone,
    productName,
    category,
    quantity: Number(quantity),
    unit,
    pricePerUnit: Number(pricePerUnit),
    location,
    description,
  });

  return Response.json({
    ok: true,
    listing: {
      id: saved._id.toString(),
      userId: saved.userId.toString(),
      sellerName: saved.sellerName,
      sellerPhone: saved.sellerPhone,
      productName: saved.productName,
      category: saved.category,
      quantity: saved.quantity,
      unit: saved.unit,
      pricePerUnit: saved.pricePerUnit,
      location: saved.location,
      description: saved.description,
      status: saved.status,
      createdAt: saved.createdAt,
    },
  });
}

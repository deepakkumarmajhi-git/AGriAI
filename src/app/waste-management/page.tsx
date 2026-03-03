"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type WasteListing = {
  id: string;
  userId: string;
  sellerName: string;
  sellerPhone: string;
  wasteType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  location: string;
  description: string;
  preferredBuyerType: string;
  status: "open" | "sold" | "paused";
  createdAt: string;
};

type FormState = {
  wasteType: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  location: string;
  preferredBuyerType: string;
  sellerPhone: string;
  description: string;
};

const initialForm: FormState = {
  wasteType: "",
  quantity: "",
  unit: "kg",
  pricePerUnit: "",
  location: "",
  preferredBuyerType: "Recycler",
  sellerPhone: "",
  description: "",
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function WasteManagementPage() {
  const router = useRouter();
  const [myListings, setMyListings] = useState<WasteListing[]>([]);
  const [wasteFeed, setWasteFeed] = useState<WasteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  const userId = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("smartAgriUserId") || "";
  }, []);

  const sellerName = useMemo(() => {
    if (typeof window === "undefined") return "Farmer";
    return localStorage.getItem("smartAgriName") || "Farmer";
  }, []);

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  async function loadData() {
    if (!userId) return;
    try {
      setLoading(true);
      const [mineRes, allRes] = await Promise.all([
        fetch(`/api/waste-listings?scope=mine&userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
        fetch(`/api/waste-listings?scope=all`, { cache: "no-store" }),
      ]);

      const mineData = await mineRes.json();
      const allData = await allRes.json();

      if (mineRes.ok) setMyListings(mineData.listings || []);
      if (allRes.ok) setWasteFeed(allData.listings || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function createListing() {
    if (!userId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/waste-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          sellerName,
          sellerPhone: form.sellerPhone,
          wasteType: form.wasteType,
          quantity: Number(form.quantity),
          unit: form.unit,
          pricePerUnit: Number(form.pricePerUnit),
          location: form.location,
          preferredBuyerType: form.preferredBuyerType,
          description: form.description,
        }),
      });
      if (!res.ok) return;
      setForm(initialForm);
      loadData();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: "open" | "sold" | "paused") {
    if (!userId) return;
    await fetch(`/api/waste-listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    loadData();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Waste Management Exchange</h1>
          <p className="mt-1 text-slate-600">
            Sell agricultural waste (straw, husk, stalks, peels) to recyclers, biogas plants, and industry buyers.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Create Waste Listing</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={form.wasteType}
              onChange={(e) => setForm((f) => ({ ...f, wasteType: e.target.value }))}
              placeholder="Waste type (e.g., Rice Straw, Sugarcane Bagasse)"
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
            />
            <input
              value={form.preferredBuyerType}
              onChange={(e) => setForm((f) => ({ ...f, preferredBuyerType: e.target.value }))}
              placeholder="Preferred buyer (Recycler, Biogas, Packaging...)"
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
            />
            <input
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="Quantity"
              type="number"
              min="0"
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
            />
            <input
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="Unit (kg, ton, bale)"
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
            />
            <input
              value={form.pricePerUnit}
              onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
              placeholder="Price per unit (INR)"
              type="number"
              min="0"
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
            />
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Pickup location"
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
            />
            <input
              value={form.sellerPhone}
              onChange={(e) => setForm((f) => ({ ...f, sellerPhone: e.target.value }))}
              placeholder="Contact number"
              className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200 md:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Quality/moisture/packing details"
              className="min-h-24 rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200 md:col-span-2"
            />
          </div>

          <button
            onClick={createListing}
            disabled={submitting}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Posting..." : "Post Waste Listing"}
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">My Waste Listings</h2>
            {loading ? (
              <p className="mt-4 text-sm text-slate-600">Loading...</p>
            ) : myListings.length === 0 ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No listings yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {myListings.map((x) => (
                  <div key={x.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{x.wasteType}</p>
                        <p className="text-sm text-slate-600">
                          {x.quantity} {x.unit} at Rs {x.pricePerUnit}/{x.unit}
                        </p>
                        <p className="text-sm text-slate-600">
                          Target buyer: {x.preferredBuyerType} | {x.location}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Posted: {fmtDate(x.createdAt)}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {x.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => updateStatus(x.id, "open")}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Mark Open
                      </button>
                      <button
                        onClick={() => updateStatus(x.id, "sold")}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Mark Sold
                      </button>
                      <button
                        onClick={() => updateStatus(x.id, "paused")}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Pause
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Open Waste Feed</h2>
            {loading ? (
              <p className="mt-4 text-sm text-slate-600">Loading...</p>
            ) : wasteFeed.length === 0 ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No open waste listings available.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {wasteFeed.map((x) => (
                  <div key={x.id} className="rounded-xl border p-4">
                    <p className="font-semibold text-slate-900">{x.wasteType}</p>
                    <p className="text-sm text-slate-600">
                      {x.quantity} {x.unit} at Rs {x.pricePerUnit}/{x.unit}
                    </p>
                    <p className="text-sm text-slate-600">
                      Seller: {x.sellerName} {x.sellerPhone ? `- ${x.sellerPhone}` : ""}
                    </p>
                    <p className="text-sm text-slate-600">
                      Buyer type: {x.preferredBuyerType} | {x.location}
                    </p>
                    {x.description ? <p className="mt-1 text-sm text-slate-500">{x.description}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

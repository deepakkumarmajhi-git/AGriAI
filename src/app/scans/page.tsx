"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ScanItem = {
  id: string;
  crop: string;
  disease: string;
  confidence: number;
  recommendation: string;
  imageName: string;
  imageUrl: string;
  createdAt: string;
};

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ScansPage() {
  const router = useRouter();

  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<"all" | "healthy" | "diseased">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  async function load() {
    try {
      const userId = localStorage.getItem("smartAgriUserId");
      if (!userId) {
        router.push("/auth/login");
        return;
      }

      setLoading(true);

      const url =
        `/api/scans?userId=${encodeURIComponent(userId)}` +
        `&status=${encodeURIComponent(status)}` +
        `&q=${encodeURIComponent(q)}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Failed to load scans");
        setScans([]);
        return;
      }

      setScans(data.scans || []);
    } catch (e: any) {
      alert(e?.message || "Failed to load scans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const total = scans.length;
  const diseasedCount = useMemo(
    () => scans.filter((s) => s.disease !== "Healthy").length,
    [scans]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Scan History</h1>
              <p className="mt-1 text-slate-600">
                Total: <b>{total}</b> • Diseased: <b>{diseasedCount}</b>
              </p>
            </div>

            <button
              onClick={() => router.push("/scan")}
              className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
            >
              New Scan
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Search (disease / crop / image name)
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g., blight, leaf spot, tomato..."
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={load}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-50"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setQ("");
                  setStatus("all");
                }}
                className="w-full rounded-lg bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-200"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "healthy", label: "Healthy" },
              { key: "diseased", label: "Diseased" },
            ].map((x) => {
              const active = status === (x.key as any);
              return (
                <button
                  key={x.key}
                  onClick={() => setStatus(x.key as any)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-semibold",
                    active
                      ? "bg-green-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  ].join(" ")}
                >
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            Loading...
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm text-slate-600">
            No scans found. Go to <b>Scan Leaf</b> and upload an image.
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((s) => (
              <div key={s.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-xl border bg-slate-50">
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.imageUrl}
                          alt="scan"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                          No image
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">
                        {s.disease === "Healthy" ? "HEALTHY" : "DISEASED"} •{" "}
                        {(s.confidence * 100).toFixed(0)}%
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{s.disease}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Crop: <b>{s.crop || "—"}</b> • Image: <b>{s.imageName || "—"}</b>
                      </p>

                      {s.imageUrl ? (
                        <a
                          href={s.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-semibold text-green-700 hover:underline"
                        >
                          View full image
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">{fmtTime(s.createdAt)}</div>
                </div>

                {s.recommendation ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <b>Recommendation:</b> {s.recommendation}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
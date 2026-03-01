"use client";

import AppShell from "@/components/layout/AppShell";
import { requireAuthOrRedirect } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SimulatePage() {
  const router = useRouter();

  const [moisture, setMoisture] = useState(45);
  const [status, setStatus] = useState("");
  const [auto, setAuto] = useState(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    requireAuthOrRedirect(router.push);
  }, [router]);

  async function sendMoisture(valueOverride?: number) {
    const userId = localStorage.getItem("smartAgriUserId");
    if (!userId) {
      alert("UserId missing. Please login again.");
      router.push("/auth/login");
      return;
    }

    const v = typeof valueOverride === "number" ? valueOverride : moisture;

    try {
      const res = await fetch("/api/sensors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          moisture: v,
          deviceId: auto ? "simulator-auto" : "simulator",
          location: "demo",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");

      setStatus(`✅ Saved! Moisture = ${data.reading.moisture}%`);
    } catch (e: any) {
      setStatus(`❌ ${e.message || "Error"}`);
    }
  }

  // Auto mode: send every 5 seconds
  useEffect(() => {
    if (!auto) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    timerRef.current = setInterval(() => {
      // small random variation ±3
      const jitter = Math.round((Math.random() * 6 - 3) * 10) / 10;
      const next = Math.max(0, Math.min(100, moisture + jitter));
      sendMoisture(next);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, moisture]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Soil Moisture Simulator</h1>
          <p className="mt-1 text-slate-600">
            Generate readings and store in MongoDB. Use Auto mode for live demo.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="font-semibold text-slate-900">Auto mode</p>
              <p className="text-sm text-slate-600">Send reading every 5 seconds</p>
            </div>

            <button
              onClick={() => setAuto((x) => !x)}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold",
                auto ? "bg-green-600 text-white hover:bg-green-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300",
              ].join(" ")}
            >
              {auto ? "ON" : "OFF"}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Soil Moisture</p>
              <p className="text-sm text-slate-600">{moisture}%</p>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={moisture}
              onChange={(e) => setMoisture(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-xs text-slate-500">
              Tip: set below 35% to generate a “Low Soil Moisture” alert.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => sendMoisture()}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
            >
              Send Once
            </button>

            <button
              onClick={async () => {
                const userId = localStorage.getItem("smartAgriUserId");
                if (!userId) return alert("Login again");
                const res = await fetch("/api/sensors/history", {
                  method: "DELETE",
                  headers: { "x-user-id": userId },
                });
                const data = await res.json();
                if (!res.ok) return alert(data?.error || "Failed to clear");
                setStatus("🧹 Cleared sensor history");
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-900 hover:bg-slate-50"
            >
              Clear History
            </button>
          </div>

          {status ? (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{status}</div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
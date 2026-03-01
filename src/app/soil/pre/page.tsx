"use client";

import AppShell from "@/components/layout/AppShell";
import { useMemo, useState } from "react";

const steps = [
  {
    title: "Soil Texture (Hand Feel Test)",
    points: [
      "Moisten soil and rub between fingers.",
      "Sandy: gritty, doesn’t form ribbon.",
      "Clay: sticky, forms long ribbon.",
      "Loam: balanced feel (best for many crops).",
    ],
  },
  {
    title: "Jar Test (Estimate Sand/Silt/Clay)",
    points: [
      "Jar: 1/3 soil + water + pinch detergent. Shake well.",
      "Settle: sand (1 min), silt (1–2 hrs), clay (24 hrs).",
      "Measure layers to estimate texture %.",
    ],
  },
  {
    title: "pH Check (Home Kit/Strips)",
    points: [
      "pH < 6: acidic (lime may help).",
      "pH 6–7.5: neutral (ideal range).",
      "pH > 7.5: alkaline (gypsum + organic matter helps).",
    ],
  },
  {
    title: "Drainage / Infiltration Test",
    points: [
      "Dig ~30cm hole. Fill water, let drain.",
      "Refill and time drainage.",
      "Very fast = sandy; very slow = clay; moderate = best.",
    ],
  },
  {
    title: "Organic Matter Indicator",
    points: [
      "Darker soil often has more organic matter.",
      "Earthworms = good sign.",
      "Add compost/FYM regularly.",
    ],
  },
  {
    title: "Quick Fertility Signs",
    points: [
      "Pale leaves: low Nitrogen (N).",
      "Purple tint: low Phosphorus (P).",
      "Leaf edge burn: low Potassium (K).",
    ],
  },
];

export default function PreSoilAnalysisPage() {
  const [active, setActive] = useState(0);

  const progress = useMemo(() => {
    return Math.round(((active + 1) / steps.length) * 100);
  }, [active]);

  const s = steps[active];

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-80px)] bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Pre-Soil Analysis</h1>
                <p className="mt-1 text-slate-600">
                  Home/traditional soil testing with a step-by-step guide.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-600">Progress</div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  Step {active + 1} / {steps.length}
                </div>
                <div className="mt-2 h-2 w-44 rounded-full bg-slate-200">
                  <div className="h-2 rounded-full bg-green-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            {/* Sidebar steps */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm font-bold text-slate-900">Steps</div>
              <div className="mt-3 space-y-2">
                {steps.map((st, idx) => {
                  const isActive = idx === active;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActive(idx)}
                      className={[
                        "w-full rounded-xl border px-4 py-3 text-left transition",
                        isActive
                          ? "bg-green-50 border-green-200"
                          : "bg-white hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="text-xs font-semibold text-slate-500">Step {idx + 1}</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">{st.title}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active step details */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Current Step</div>
                  <div className="mt-1 text-xl font-bold text-slate-900">{s.title}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    onClick={() => setActive((v) => Math.max(0, v - 1))}
                    disabled={active === 0}
                  >
                    ← Back
                  </button>
                  <button
                    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    onClick={() => setActive((v) => Math.min(steps.length - 1, v + 1))}
                    disabled={active === steps.length - 1}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">What to do</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {s.points.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-2 w-2 rounded-full bg-green-600" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-xl border bg-white p-4">
                <div className="text-sm font-bold text-slate-900">Farmer Tip</div>
                <div className="mt-2 text-sm text-slate-700">
                  If you can, do this home test first. Then use{" "}
                  <b>Lab Analysis by AI</b> for accurate crop recommendation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
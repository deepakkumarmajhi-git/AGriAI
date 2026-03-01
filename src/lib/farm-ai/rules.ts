type ForecastDay = {
  date: string;         // YYYY-MM-DD
  tempMax?: number;
  tempMin?: number;
  rainChance?: number;  // 0..100 or 0..1
  rainMm?: number;
  humidity?: number;
};

type ScanSignal = { result: string; confidence: number; date: string };

export function computeFarmAdvice(input: {
  cropName: string;
  stage: string;
  irrigationMethod: string;
  forecast7: ForecastDay[];
  recentScans: ScanSignal[];
  nowISO: string;
  scanPlanDaysPerWeek: number;
}) {
  const { cropName, stage, irrigationMethod, forecast7, recentScans, nowISO, scanPlanDaysPerWeek } = input;

  const today = forecast7[0] || { date: new Date(nowISO).toISOString().slice(0, 10) };
  const rainChance = clampPct(today.rainChance ?? 0);
  const rainMm = num0(today.rainMm);
  const humidity = num0(today.humidity);

  // Disease risks
  const risks: any[] = [];

  if (humidity >= 80 && rainChance >= 40) {
    risks.push({
      name: "Fungal Infection Risk",
      risk: "high",
      reason: "High humidity + high rain chance increases fungal disease risk.",
      prevention: "Avoid stagnation, increase airflow, remove infected leaves early.",
      watchFor: "Leaf spots, powdery growth, yellowing, rot smell.",
    });
  } else if (humidity >= 70 || rainChance >= 30) {
    risks.push({
      name: "Fungal Infection Risk",
      risk: "medium",
      reason: "Moderate humidity/rain may support fungal growth.",
      prevention: "Water in morning, keep spacing, monitor leaves closely.",
      watchFor: "Small spots, curling leaves, mild mildew.",
    });
  } else {
    risks.push({
      name: "Fungal Infection Risk",
      risk: "low",
      reason: "Conditions less favorable for fungal spread today.",
      prevention: "Continue regular monitoring.",
      watchFor: "Any new spots or unusual discoloration.",
    });
  }

  // scan-based bump
  const lastBad = [...recentScans].reverse().find(
    (s) => s.result && s.result.toLowerCase() !== "healthy" && (s.confidence ?? 0) >= 0.5
  );
  if (lastBad) {
    risks.unshift({
      name: "Scan indicates disease",
      risk: "high",
      reason: `Recent scan suggests: ${lastBad.result} (${Math.round(lastBad.confidence * 100)}%).`,
      prevention: "Follow crop-specific treatment steps. Remove severely infected leaves.",
      watchFor: "Spread to nearby leaves, wilting, fast yellowing.",
    });
  }

  // irrigation next 7 days
  const irrigationNext7Days = forecast7.slice(0, 7).map((d) => {
    const rc = clampPct(d.rainChance ?? 0);
    const rm = num0(d.rainMm);
    const tmax = num0(d.tempMax);

    let intensity: "low" | "medium" | "high" = "medium";
    let recommendation = "Normal irrigation";
    let reason = "Balanced conditions.";

    if (rm >= 5 || rc >= 70) {
      intensity = "low";
      recommendation = "Reduce or skip irrigation";
      reason = "High rainfall expectation may cover water needs.";
    } else if (rc >= 40) {
      intensity = "low";
      recommendation = "Light irrigation (if needed)";
      reason = "Rain likely — avoid overwatering.";
    } else if (rc <= 10 && tmax >= 34) {
      intensity = "high";
      recommendation = "Increase irrigation slightly";
      reason = "Hot day + low rain chance increases water demand.";
    }

    if (irrigationMethod === "drip" && intensity === "high") recommendation += " (longer drip duration)";
    if (irrigationMethod === "flood" && intensity !== "low") recommendation += " (avoid standing water)";

    return { date: d.date, recommendation, reason, intensity };
  });

  const todayTasks: string[] = [];
  todayTasks.push(`Confirm crop stage: ${stage}. Update if changed.`);
  todayTasks.push("Observe leaves for spots, curling, yellowing.");
  if (rainChance >= 40) todayTasks.push("Avoid overwatering today due to rain chances.");
  if (lastBad) todayTasks.push("Do a follow-up scan in 24–48 hours to track progression.");

  const nextScanDueAt = computeNextScanDue(nowISO, scanPlanDaysPerWeek);

  const summary =
    `Crop: ${cropName}. Stage: ${stage}. ` +
    `Today rain chance: ${Math.round(rainChance)}%, rain: ${rainMm.toFixed(1)}mm. ` +
    `Top risk: ${risks[0]?.name} (${String(risks[0]?.risk).toUpperCase()}).`;

  return { todayTasks, irrigationNext7Days, diseaseRisks: risks, summary, nextScanDueAt };
}

function clampPct(x: number) {
  const v = Number(x);
  const pct = v <= 1 ? v * 100 : v;
  return Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
}
function num0(x: any) {
  const v = Number(x);
  return Number.isFinite(v) ? v : 0;
}
function computeNextScanDue(nowISO: string, daysPerWeek: number) {
  const gap = daysPerWeek >= 4 ? 1 : 2;
  const d = new Date(nowISO);
  d.setDate(d.getDate() + gap);
  return d.toISOString();
}
export type SoilInputs = {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
};

type Level = "Low" | "Medium" | "High";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelForNPK(value: number): Level {
  if (value < 40) return "Low";
  if (value < 80) return "Medium";
  return "High";
}

function phStatus(ph: number) {
  if (ph < 6.0) return { label: "Acidic", color: "text-yellow-700" };
  if (ph <= 7.5) return { label: "Neutral (Best)", color: "text-green-700" };
  return { label: "Alkaline", color: "text-yellow-700" };
}

function scoreFromLevels(n: Level, p: Level, k: Level) {
  const map: Record<Level, number> = { Low: 20, Medium: 70, High: 90 };
  return Math.round((map[n] + map[p] + map[k]) / 3);
}

function phScore(ph: number) {
  if (ph >= 6.0 && ph <= 7.5) return 100;
  if (ph >= 5.5 && ph < 6.0) return 75;
  if (ph > 7.5 && ph <= 8.0) return 75;
  return 50;
}

function rainfallScore(r: number) {
  // generic: too low or too high reduces suitability (crop-specific later)
  if (r < 30) return 55;
  if (r <= 200) return 90;
  return 70;
}

// simple crop preference ranges (MVP). Add more as needed.
const cropProfiles: Record<
  string,
  {
    ideal: { N: [number, number]; P: [number, number]; K: [number, number]; ph: [number, number] };
    fertilizers: { name: string; why: string; query: string }[];
    organic: { name: string; why: string; query: string }[];
    pesticides: { name: string; why: string; query: string }[]; // general protective recommendations
  }
> = {
  rice: {
    ideal: { N: [60, 120], P: [30, 90], K: [40, 120], ph: [5.5, 7.5] },
    fertilizers: [
      { name: "Urea", why: "Improves Nitrogen (growth, green leaves).", query: "Urea fertilizer for rice" },
      { name: "DAP / SSP", why: "Improves Phosphorus (root, early growth).", query: "DAP SSP fertilizer for rice" },
      { name: "MOP (Potash)", why: "Improves Potassium (strength, disease tolerance).", query: "MOP potash fertilizer rice" },
    ],
    organic: [
      { name: "FYM / Compost", why: "Improves soil structure + microbial life.", query: "farmyard manure compost for rice" },
      { name: "Neem Cake", why: "Organic N source + reduces soil pests.", query: "neem cake organic fertilizer" },
    ],
    pesticides: [
      { name: "Trichoderma (bio-fungicide)", why: "Prevents root fungal issues (safe bio option).", query: "Trichoderma bio fungicide" },
    ],
  },

  wheat: {
    ideal: { N: [50, 110], P: [25, 80], K: [40, 120], ph: [6.0, 7.8] },
    fertilizers: [
      { name: "Urea", why: "Nitrogen for tillering and yield.", query: "urea fertilizer wheat" },
      { name: "DAP / SSP", why: "Phosphorus for root development.", query: "DAP fertilizer wheat" },
      { name: "MOP (Potash)", why: "Strengthens stalk + stress tolerance.", query: "MOP potash wheat" },
    ],
    organic: [
      { name: "Vermicompost", why: "Improves fertility + water retention.", query: "vermicompost for wheat" },
      { name: "Green manure", why: "Adds organic matter + N naturally.", query: "green manure crops" },
    ],
    pesticides: [
      { name: "Seed treatment (Carbendazim/Trichoderma)", why: "Reduces seed-borne fungal risk.", query: "wheat seed treatment Trichoderma" },
    ],
  },
};

function inRange(v: number, [a, b]: [number, number]) {
  return v >= a && v <= b;
}

function deficiencyNotes(input: SoilInputs, cropKey: string) {
  const profile = cropProfiles[cropKey];
  if (!profile) {
    return {
      reasons: ["Crop profile not available. Showing generic soil improvement tips."],
      actions: genericActions(input),
      links: genericLinks(input),
    };
  }

  const reasons: string[] = [];
  const actions: { type: "fertilizer" | "organic" | "ph"; text: string }[] = [];
  const links: { label: string; url: string }[] = [];

  // N
  if (input.N < profile.ideal.N[0]) {
    reasons.push("Nitrogen is lower than ideal.");
    actions.push({ type: "fertilizer", text: "Add Nitrogen source (Urea / compost / neem cake) in recommended dose." });
  } else if (input.N > profile.ideal.N[1]) {
    reasons.push("Nitrogen is higher than ideal (risk of excessive vegetative growth).");
  }

  // P
  if (input.P < profile.ideal.P[0]) {
    reasons.push("Phosphorus is lower than ideal (roots may be weak).");
    actions.push({ type: "fertilizer", text: "Add Phosphorus source (DAP/SSP) to improve roots." });
  } else if (input.P > profile.ideal.P[1]) {
    reasons.push("Phosphorus is higher than ideal.");
  }

  // K
  if (input.K < profile.ideal.K[0]) {
    reasons.push("Potassium is lower than ideal (stress tolerance may reduce).");
    actions.push({ type: "fertilizer", text: "Add Potash (MOP) to improve crop strength and disease tolerance." });
  } else if (input.K > profile.ideal.K[1]) {
    reasons.push("Potassium is higher than ideal.");
  }

  // pH
  if (!inRange(input.ph, profile.ideal.ph)) {
    if (input.ph < profile.ideal.ph[0]) {
      reasons.push("Soil is too acidic for this crop.");
      actions.push({ type: "ph", text: "Use lime (agricultural lime) to raise pH gradually." });
    } else {
      reasons.push("Soil is too alkaline for this crop.");
      actions.push({ type: "ph", text: "Use gypsum + organic matter to improve pH/structure." });
    }
  }

  // Default if no reasons
  if (reasons.length === 0) reasons.push("Soil is already close to ideal ranges for this crop.");

  // Links (search links; you can later replace with your own market page)
  const addLink = (label: string, query: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    links.push({ label, url });
  };

  for (const f of profile.fertilizers) addLink(f.name, f.query);
  for (const o of profile.organic) addLink(o.name, o.query);
  for (const p of profile.pesticides) addLink(p.name, p.query);

  return { reasons, actions, links };
}

function genericActions(input: SoilInputs) {
  const actions: { type: "fertilizer" | "organic" | "ph"; text: string }[] = [];

  if (input.N < 40) actions.push({ type: "fertilizer", text: "Nitrogen seems low — add compost/FYM + Nitrogen fertilizer carefully." });
  if (input.P < 25) actions.push({ type: "fertilizer", text: "Phosphorus seems low — add SSP/DAP." });
  if (input.K < 40) actions.push({ type: "fertilizer", text: "Potassium seems low — add MOP (potash)." });

  if (input.ph < 6.0) actions.push({ type: "ph", text: "Soil is acidic — use agricultural lime gradually." });
  if (input.ph > 7.5) actions.push({ type: "ph", text: "Soil is alkaline — add gypsum + organic matter." });

  actions.push({ type: "organic", text: "Add compost/vermicompost regularly to improve soil health." });

  return actions;
}

function genericLinks(input: SoilInputs) {
  const links: { label: string; url: string }[] = [];
  const add = (label: string, q: string) => links.push({ label, url: `https://www.google.com/search?q=${encodeURIComponent(q)}` });

  add("Vermicompost", "vermicompost organic fertilizer");
  add("Compost / FYM", "farmyard manure compost");
  add("Neem Cake", "neem cake organic fertilizer");
  add("Agricultural Lime", "agricultural lime for acidic soil");
  add("Gypsum", "gypsum for alkaline soil");

  return links;
}

export function buildSoilReport(input: SoilInputs) {
  const nLevel = levelForNPK(input.N);
  const pLevel = levelForNPK(input.P);
  const kLevel = levelForNPK(input.K);

  const npkScore = scoreFromLevels(nLevel, pLevel, kLevel);
  const pHscore = phScore(input.ph);
  const rainScore = rainfallScore(input.rainfall);

  const overall = Math.round((npkScore * 0.55 + pHscore * 0.25 + rainScore * 0.20));

  return {
    overallScore: clamp(overall, 0, 100),
    npkScore,
    phScore: pHscore,
    rainfallScore: rainScore,
    levels: {
      N: nLevel,
      P: pLevel,
      K: kLevel,
    },
    ph: phStatus(input.ph),
  };
}

/**
 * Build crop cards with suitability % + reasons + improvements
 */
export function buildCropSuitability(
  input: SoilInputs,
  crops: string[],
  confidences: number[]
) {
  const out = crops.map((c, idx) => {
    const conf = typeof confidences?.[idx] === "number" ? confidences[idx] : undefined;
    const suitability = conf != null ? Math.round(conf * 100) : 0;

    const cropKey = c.toLowerCase().trim();
    const details = deficiencyNotes(input, cropKey);

    return {
      name: c,
      suitability,
      whyNot100: details.reasons,
      improvements: details.actions,
      links: details.links,
    };
  });

  return out.sort((a, b) => b.suitability - a.suitability);
}
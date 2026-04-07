import type { SoilInputs } from "./soilAnalysis";

type Range = [number, number];

type CropProfile = {
  name: string;
  ideal: {
    N: Range;
    P: Range;
    K: Range;
    ph: Range;
    temperature: Range;
    humidity: Range;
    rainfall: Range;
  };
};

const CROP_PROFILES: CropProfile[] = [
  {
    name: "Rice",
    ideal: {
      N: [60, 120],
      P: [30, 90],
      K: [40, 120],
      ph: [5.5, 7.5],
      temperature: [22, 34],
      humidity: [70, 95],
      rainfall: [120, 300],
    },
  },
  {
    name: "Wheat",
    ideal: {
      N: [50, 110],
      P: [25, 80],
      K: [40, 120],
      ph: [6.0, 7.8],
      temperature: [12, 26],
      humidity: [45, 70],
      rainfall: [40, 120],
    },
  },
  {
    name: "Maize",
    ideal: {
      N: [55, 120],
      P: [25, 85],
      K: [35, 110],
      ph: [5.8, 7.4],
      temperature: [18, 32],
      humidity: [50, 80],
      rainfall: [60, 180],
    },
  },
  {
    name: "Cotton",
    ideal: {
      N: [45, 100],
      P: [20, 70],
      K: [40, 110],
      ph: [5.8, 8.0],
      temperature: [21, 35],
      humidity: [45, 70],
      rainfall: [50, 140],
    },
  },
  {
    name: "Sugarcane",
    ideal: {
      N: [80, 160],
      P: [30, 90],
      K: [60, 160],
      ph: [6.0, 7.8],
      temperature: [20, 36],
      humidity: [55, 85],
      rainfall: [100, 250],
    },
  },
  {
    name: "Chickpea",
    ideal: {
      N: [20, 60],
      P: [25, 75],
      K: [25, 80],
      ph: [6.0, 8.0],
      temperature: [16, 30],
      humidity: [35, 65],
      rainfall: [30, 90],
    },
  },
  {
    name: "Groundnut",
    ideal: {
      N: [20, 70],
      P: [20, 70],
      K: [25, 80],
      ph: [5.8, 7.2],
      temperature: [22, 32],
      humidity: [50, 75],
      rainfall: [50, 130],
    },
  },
  {
    name: "Millets",
    ideal: {
      N: [20, 65],
      P: [15, 60],
      K: [20, 70],
      ph: [5.5, 7.8],
      temperature: [20, 34],
      humidity: [35, 70],
      rainfall: [25, 90],
    },
  },
];

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreRange(value: number, [min, max]: Range) {
  const span = Math.max(max - min, 1);

  if (value >= min && value <= max) return 1;

  const distance = value < min ? min - value : value - max;
  const tolerance = span * 0.65 + 1;
  return Math.max(0.05, 1 - distance / tolerance);
}

function clampScore(score: number) {
  return Math.max(0.05, Math.min(0.98, score));
}

export function recommendCropsLocally(input: SoilInputs, limit = 5) {
  const ranked = CROP_PROFILES.map((profile) => {
    const nutrientScore = average([
      scoreRange(input.N, profile.ideal.N),
      scoreRange(input.P, profile.ideal.P),
      scoreRange(input.K, profile.ideal.K),
    ]);

    const climateScore = average([
      scoreRange(input.temperature, profile.ideal.temperature),
      scoreRange(input.humidity, profile.ideal.humidity),
      scoreRange(input.rainfall, profile.ideal.rainfall),
    ]);

    const score =
      nutrientScore * 0.45 +
      scoreRange(input.ph, profile.ideal.ph) * 0.15 +
      climateScore * 0.4;

    return {
      name: profile.name,
      confidence: Number(clampScore(score).toFixed(3)),
    };
  }).sort((left, right) => right.confidence - left.confidence);

  const top = ranked.slice(0, limit);

  return {
    crops: top.map((crop) => crop.name),
    confidences: top.map((crop) => crop.confidence),
  };
}

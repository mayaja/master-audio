import type { EQBand } from "@/mastering/types/audio";
import type { PlatformId } from "@/mastering/types/mastering";

export type Preset = {
  name: string;
  outputComp: number;
  tonalTarget: [number, number, number, number, number, number, number, number, number, number];
  tone: {
    low: number;
    mid: number;
    high: number;
  };
  eq: number[];
  comp: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
  limiter: {
    drive: number;
    ceiling: number;
    lookahead: number;
    release: number;
  };
};

export type PresetPlatformOverride = {
  outputComp?: number;
  tonalTarget?: Preset["tonalTarget"];
  tone?: Partial<Preset["tone"]>;
  eq?: number[];
  comp?: Partial<Preset["comp"]>;
  limiter?: Partial<Preset["limiter"]>;
};

export type PresetPlatformDefaults = Record<PlatformId, Partial<Record<string, PresetPlatformOverride>>>;

export const presets: Preset[] = [
  {
    name: "Flat",
    tonalTarget: [0.9, 0.86, 0.76, 0.64, 0.54, 0.48, 0.42, 0.34, 0.26, 0.18],
    outputComp: 0,
    tone: { low: 0, mid: 0, high: 0 },
    eq: [0, 0, 0, 0, 0, 0, 0],
    comp: { threshold: -16, ratio: 2, attack: 0.02, release: 0.2 },
    limiter: { drive: 2, ceiling: -1, lookahead: 5, release: 0.08 },
  },
  {
    name: "Pop - Bright",
    tonalTarget: [0.9, 0.86, 0.74, 0.62, 0.56, 0.58, 0.54, 0.48, 0.42, 0.3],
    outputComp: -1,
    tone: { low: 1.5, mid: -0.5, high: 2 },
    eq: [1.5, 1, -0.5, -0.5, 1, 2, 2],
    comp: { threshold: -18, ratio: 2.5, attack: 0.01, release: 0.12 },
    limiter: { drive: 4.2, ceiling: -2, lookahead: 12, release: 0.12 },
  },
  {
    name: "Pop - Warm",
    tonalTarget: [0.92, 0.88, 0.78, 0.66, 0.58, 0.56, 0.48, 0.42, 0.34, 0.24],
    outputComp: -1,
    tone: { low: 2, mid: 0.5, high: 0.5 },
    eq: [2, 1.25, 0.5, 0.5, 0.5, 0.5, 0],
    comp: { threshold: -18, ratio: 2.3, attack: 0.015, release: 0.15 },
    limiter: { drive: 4, ceiling: -2, lookahead: 12, release: 0.12 },
  },
  {
    name: "Rock - Modern",
    tonalTarget: [0.84, 0.82, 0.76, 0.72, 0.66, 0.62, 0.58, 0.48, 0.34, 0.22],
    outputComp: -1,
    tone: { low: 2.5, mid: 2, high: 1 },
    eq: [2.5, 2, 1, 0, 2, 1, 1],
    comp: { threshold: -20, ratio: 3, attack: 0.015, release: 0.18 },
    limiter: { drive: 5.2, ceiling: -2.2, lookahead: 14, release: 0.14 },
  },
  {
    name: "Rock - Vintage",
    tonalTarget: [0.88, 0.85, 0.79, 0.74, 0.68, 0.6, 0.5, 0.4, 0.28, 0.18],
    outputComp: -1,
    tone: { low: 2, mid: 1.5, high: 0 },
    eq: [2, 1.5, 1, 0.5, 1.5, 0.5, 0],
    comp: { threshold: -18, ratio: 2.4, attack: 0.02, release: 0.22 },
    limiter: { drive: 4.8, ceiling: -1, lookahead: 5, release: 0.08 },
  },
  {
    name: "Jazz - Smooth",
    tonalTarget: [0.84, 0.8, 0.74, 0.66, 0.6, 0.56, 0.48, 0.38, 0.28, 0.18],
    outputComp: 0.5,
    tone: { low: 1.5, mid: 1, high: -0.5 },
    eq: [1.5, 1, 1, 0, 0, -0.5, -1],
    comp: { threshold: -13, ratio: 1.6, attack: 0.04, release: 0.35 },
    limiter: { drive: 3, ceiling: -1.4, lookahead: 8, release: 0.12 },
  },
  {
    name: "Jazz - Live",
    tonalTarget: [0.82, 0.78, 0.72, 0.66, 0.62, 0.58, 0.5, 0.42, 0.32, 0.22],
    outputComp: 1,
    tone: { low: 1, mid: 1.2, high: 0 },
    eq: [1, 1, 1.2, 0.8, 0.8, 0, 0],
    comp: { threshold: -13, ratio: 1.7, attack: 0.035, release: 0.32 },
    limiter: { drive: 2.7, ceiling: -1.4, lookahead: 8, release: 0.13 },
  },
  {
    name: "Reggae - Roots",
    tonalTarget: [0.98, 0.95, 0.86, 0.72, 0.58, 0.48, 0.4, 0.3, 0.22, 0.14],
    outputComp: -3,
    tone: { low: 2, mid: -1, high: -1 },
    eq: [2, 1, -1, -1, -1, -1, -1.5],
    comp: { threshold: -20, ratio: 2.5, attack: 0.025, release: 0.35 },
    limiter: { drive: 4.2, ceiling: -2, lookahead: 10, release: 0.12 },
  },
  {
    name: "Reggae - Modern",
    tonalTarget: [0.96, 0.93, 0.84, 0.7, 0.56, 0.5, 0.44, 0.36, 0.28, 0.2],
    outputComp: -2,
    tone: { low: 2.2, mid: -0.5, high: 0 },
    eq: [2.2, 1.2, -0.5, -0.5, 0, 0, 0],
    comp: { threshold: -19, ratio: 2.4, attack: 0.02, release: 0.26 },
    limiter: { drive: 4.2, ceiling: -1.8, lookahead: 10, release: 0.12 },
  },
  {
    name: "Dangdut - Classic",
    tonalTarget: [0.96, 0.92, 0.82, 0.68, 0.58, 0.6, 0.56, 0.5, 0.44, 0.32],
    outputComp: -1.5,
    tone: { low: 3, mid: 0, high: 3 },
    eq: [3, 1.5, 0, 0, 1.5, 2.5, 3],
    comp: { threshold: -18, ratio: 2.5, attack: 0.01, release: 0.12 },
    limiter: { drive: 5.1, ceiling: -1.8, lookahead: 10, release: 0.09 },
  },
  {
    name: "Dangdut - Koplo",
    tonalTarget: [0.99, 0.95, 0.84, 0.68, 0.58, 0.62, 0.6, 0.54, 0.46, 0.34],
    outputComp: -3,
    tone: { low: 3.5, mid: 0.2, high: 3.2 },
    eq: [3.5, 2, 0.2, 0.2, 1.8, 2.8, 3.2],
    comp: { threshold: -20, ratio: 2.8, attack: 0.009, release: 0.1 },
    limiter: { drive: 5.8, ceiling: -1.8, lookahead: 10, release: 0.09 },
  },
  {
    name: "EDM - Club",
    tonalTarget: [1, 0.96, 0.86, 0.68, 0.56, 0.58, 0.62, 0.56, 0.46, 0.34],
    outputComp: -3,
    tone: { low: 3.2, mid: -0.8, high: 2.6 },
    eq: [3.2, 2, -0.8, -0.8, 0.5, 2.2, 2.6],
    comp: { threshold: -22, ratio: 3.2, attack: 0.008, release: 0.11 },
    limiter: { drive: 7.5, ceiling: -1, lookahead: 5, release: 0.045 },
  },
  {
    name: "Hip Hop - Trap",
    tonalTarget: [1, 0.97, 0.9, 0.74, 0.6, 0.54, 0.48, 0.42, 0.34, 0.24],
    outputComp: -3,
    tone: { low: 3, mid: -0.4, high: 1 },
    eq: [3, 1.8, -0.4, -0.4, 0.4, 1, 1],
    comp: { threshold: -19.5, ratio: 2.6, attack: 0.018, release: 0.2 },
    limiter: { drive: 5.5, ceiling: -2, lookahead: 12, release: 0.12 },
  },
  {
    name: "Country - Classic",
    tonalTarget: [0.86, 0.82, 0.76, 0.7, 0.64, 0.6, 0.54, 0.46, 0.36, 0.24],
    outputComp: 0,
    tone: { low: 0.8, mid: 1.2, high: 0.6 },
    eq: [0.8, 0.8, 1.2, 1, 1, 0.6, 0.4],
    comp: { threshold: -15, ratio: 1.9, attack: 0.028, release: 0.24 },
    limiter: { drive: 3.2, ceiling: -1.6, lookahead: 9, release: 0.1 },
  },
  {
    name: "Acoustic - Folk",
    tonalTarget: [0.8, 0.76, 0.7, 0.64, 0.62, 0.6, 0.54, 0.46, 0.36, 0.24],
    outputComp: 1,
    tone: { low: 0.5, mid: 1.2, high: 0.8 },
    eq: [0.5, 0.5, 1.2, 1.2, 1, 0.8, 0.8],
    comp: { threshold: -14, ratio: 1.7, attack: 0.03, release: 0.28 },
    limiter: { drive: 2.8, ceiling: -1, lookahead: 5, release: 0.12 },
  },
  {
    name: "Ballad - Vocal",
    tonalTarget: [0.82, 0.78, 0.72, 0.66, 0.64, 0.64, 0.56, 0.5, 0.4, 0.28],
    outputComp: -0.5,
    tone: { low: 0.8, mid: 1.4, high: 1 },
    eq: [0.8, 0.8, 1.4, 1.4, 1.2, 1, 1],
    comp: { threshold: -16.5, ratio: 2.1, attack: 0.015, release: 0.2 },
    limiter: { drive: 3.4, ceiling: -2, lookahead: 14, release: 0.12 },
  },
];

export const defaultBands: EQBand[] = [
  { freq: 60, gain: 0, Q: 0.7 },
  { freq: 120, gain: 0, Q: 1 },
  { freq: 250, gain: 0, Q: 1 },
  { freq: 500, gain: 0, Q: 1 },
  { freq: 1000, gain: 0, Q: 1 },
  { freq: 4000, gain: 0, Q: 1 },
  { freq: 10000, gain: 0, Q: 0.7 },
];

export const ACTIVE_PRESET_KEY = "oma-active-preset-v1";

export const presetPlatformDefaults: PresetPlatformDefaults = {
  spotify: {
    "Pop - Bright": {
      limiter: { ceiling: -2, lookahead: 12, release: 0.12 },
    },
    "Pop - Warm": {
      limiter: { ceiling: -2, lookahead: 12, release: 0.12 },
    },
    "Rock - Modern": {
      limiter: { ceiling: -2.2, lookahead: 14, release: 0.14 },
    },
    "Jazz - Smooth": {
      outputComp: -0.1,
      limiter: { drive: 2.4, ceiling: -2, lookahead: 12, release: 0.16 },
    },
    "Jazz - Live": {
      outputComp: -0.2,
      limiter: { drive: 1.9, ceiling: -2, lookahead: 14, release: 0.2 },
    },
    "Reggae - Roots": {
      outputComp: -2,
      comp: { threshold: -20.5, ratio: 2.6, attack: 0.022, release: 0.32 },
      limiter: { drive: 4.8, ceiling: -2, lookahead: 12, release: 0.14 },
    },
    "Hip Hop - Trap": {
      outputComp: -1.8,
      comp: { threshold: -19.6, ratio: 2.4, attack: 0.024, release: 0.26 },
      limiter: { drive: 5.2, ceiling: -2.8, lookahead: 24, release: 0.18 },
    },
  },
  youtube: {
    "Pop - Bright": {
      outputComp: -0.8,
      limiter: { ceiling: -1.6, drive: 4.4 },
    },
    "Pop - Warm": {
      outputComp: -0.8,
      limiter: { ceiling: -1.6, drive: 4.2 },
    },
    "Rock - Modern": {
      outputComp: -1,
      limiter: { drive: 4.9, ceiling: -2.3, lookahead: 16, release: 0.16 },
    },
    "Jazz - Smooth": {
      outputComp: -0.2,
      limiter: { drive: 2.6, ceiling: -2.1, lookahead: 14, release: 0.16 },
    },
    "Jazz - Live": {
      outputComp: -0.4,
      limiter: { drive: 2.3, ceiling: -2.3, lookahead: 16, release: 0.18 },
    },
  },
  "apple-music": {
    "Pop - Bright": {
      outputComp: -1.1,
      comp: { threshold: -18.8, ratio: 2.5, attack: 0.011, release: 0.15 },
      limiter: { ceiling: -2.8, drive: 4, lookahead: 16, release: 0.16 },
    },
    "Pop - Warm": {
      outputComp: -1.05,
      comp: { threshold: -20.5, ratio: 2.95, attack: 0.0115, release: 0.15 },
      limiter: { ceiling: -2.4, drive: 3.85, lookahead: 18, release: 0.17 },
    },
    "Rock - Modern": {
      outputComp: -1.8,
      comp: { threshold: -19.6, ratio: 2.8, attack: 0.02, release: 0.19 },
      limiter: { ceiling: -2.8, drive: 4, lookahead: 20, release: 0.17 },
    },
    "Rock - Vintage": {
      outputComp: -1.7,
      comp: { threshold: -18.6, ratio: 2.5, attack: 0.022, release: 0.24 },
      limiter: { ceiling: -2.8, drive: 3.8, lookahead: 18, release: 0.16 },
    },
    "Jazz - Smooth": {
      outputComp: -1.3,
      comp: { threshold: -14, ratio: 1.7, attack: 0.04, release: 0.36 },
      limiter: { ceiling: -2.8, drive: 1.9, lookahead: 16, release: 0.22 },
    },
    "Jazz - Live": {
      outputComp: -1.5,
      comp: { threshold: -13.8, ratio: 1.8, attack: 0.038, release: 0.34 },
      limiter: { ceiling: -2.8, drive: 2.1, lookahead: 16, release: 0.2 },
    },
    "Dangdut - Classic": {
      outputComp: -2.3,
      comp: { threshold: -17.8, ratio: 2.2, attack: 0.014, release: 0.16 },
      limiter: { ceiling: -2.8, drive: 3.8, lookahead: 16, release: 0.14 },
    },
    "Dangdut - Koplo": {
      outputComp: -2.8,
      comp: { threshold: -19.4, ratio: 2.6, attack: 0.011, release: 0.12 },
      limiter: { ceiling: -2.8, drive: 5.1, lookahead: 16, release: 0.12 },
    },
    "Country - Classic": {
      outputComp: -0.9,
      comp: { threshold: -14.8, ratio: 1.8, attack: 0.03, release: 0.26 },
      limiter: { ceiling: -2.5, drive: 2.7, lookahead: 14, release: 0.16 },
    },
    "Acoustic - Folk": {
      outputComp: -0.4,
      comp: { threshold: -14.2, ratio: 1.4, attack: 0.045, release: 0.38 },
      limiter: { ceiling: -2.5, drive: 1.6, lookahead: 14, release: 0.24 },
    },
  },
};

const platformTonalOffsets: Record<PlatformId, Preset["tonalTarget"]> = {
  spotify: [0, 0, 0, 0, 0, 0, 0.005, 0.005, 0.01, 0.01],
  youtube: [0.005, 0.005, 0, 0, 0, 0.005, 0.01, 0.01, 0.015, 0.015],
  "apple-music": [-0.015, -0.015, -0.01, -0.005, 0, 0.005, 0.005, 0.01, 0.01, 0.01],
};

function clamp01(value: number) {
  return Math.max(0.08, Math.min(1, value));
}

function alignTonalTargetWithPreset(preset: Preset): Preset {
  const lowEq = ((preset.eq[0] ?? 0) + (preset.eq[1] ?? 0)) * 0.5;
  const lowMidEq = preset.eq[2] ?? 0;
  const midEq = ((preset.eq[3] ?? 0) + (preset.eq[4] ?? 0)) * 0.5;
  const presenceEq = preset.eq[5] ?? 0;
  const highEq = preset.eq[6] ?? 0;

  const derived = [
    clamp01(0.9 + lowEq * 0.035 + preset.tone.low * 0.012),
    clamp01(0.84 + lowEq * 0.032 + preset.tone.low * 0.01),
    clamp01(0.76 + lowEq * 0.028 + preset.tone.low * 0.008),
    clamp01(0.66 + lowMidEq * 0.03 + preset.tone.mid * 0.008),
    clamp01(0.58 + midEq * 0.028 + preset.tone.mid * 0.012),
    clamp01(0.52 + midEq * 0.024 + preset.tone.mid * 0.012),
    clamp01(0.46 + presenceEq * 0.03 + preset.tone.high * 0.01),
    clamp01(0.4 + presenceEq * 0.026 + preset.tone.high * 0.012),
    clamp01(0.32 + highEq * 0.032 + preset.tone.high * 0.016),
    clamp01(0.22 + highEq * 0.028 + preset.tone.high * 0.014),
  ];

  const alignedTonalTarget = derived.map((value, index) => {
    const existing = preset.tonalTarget[index] ?? value;
    return clamp01(existing * 0.35 + value * 0.65);
  }) as Preset["tonalTarget"];

  return {
    ...preset,
    tonalTarget: alignedTonalTarget,
  };
}

function applyPlatformTonalOffset(tonalTarget: Preset["tonalTarget"], profileId: PlatformId): Preset["tonalTarget"] {
  const offset = platformTonalOffsets[profileId] ?? platformTonalOffsets.spotify;

  return tonalTarget.map((value, index) => clamp01(value + (offset[index] ?? 0))) as Preset["tonalTarget"];
}

function resolvePlatformTonalTarget(basePreset: Preset, profileId: PlatformId): Preset["tonalTarget"] {
  const override = presetPlatformDefaults[profileId]?.[basePreset.name];

  if (override?.tonalTarget) {
    return applyPlatformTonalOffset(override.tonalTarget, profileId);
  }

  const tonalInput: Preset = {
    ...basePreset,
    tone: {
      ...basePreset.tone,
      ...override?.tone,
    },
    eq: override?.eq ?? basePreset.eq,
  };

  const aligned = alignTonalTargetWithPreset(tonalInput).tonalTarget;
  return applyPlatformTonalOffset(aligned, profileId);
}

export function resolvePresetForProfile(basePreset: Preset, profileId: PlatformId): Preset {
  const override = presetPlatformDefaults[profileId]?.[basePreset.name];
  const platformTonalTarget = resolvePlatformTonalTarget(basePreset, profileId);

  if (!override) {
    return {
      ...alignTonalTargetWithPreset(basePreset),
      tonalTarget: platformTonalTarget,
    };
  }

  return {
    ...alignTonalTargetWithPreset({
    ...basePreset,
    outputComp: override.outputComp ?? basePreset.outputComp,
    tonalTarget: override.tonalTarget ?? basePreset.tonalTarget,
    tone: {
      ...basePreset.tone,
      ...override.tone,
    },
    eq: override.eq ?? basePreset.eq,
    comp: {
      ...basePreset.comp,
      ...override.comp,
    },
    limiter: {
      ...basePreset.limiter,
      ...override.limiter,
    },
    }),
    tonalTarget: platformTonalTarget,
  };
}

export const presetDescriptions: Record<string, string> = {
  Flat: "Neutral and safe as a manual starting point.",
  "Pop - Bright": "More open top-end with forward vocals.",
  "Pop - Warm": "Fuller low-mid body with smoother highs.",
  "Rock - Modern": "High punch, firm mids, and contemporary energy.",
  "Rock - Vintage": "Strong midbody with smoother treble.",
  "Jazz - Smooth": "Soft transients with a looser dynamic space.",
  "Jazz - Live": "Natural live tone with detailed mid articulation.",
  "Reggae - Roots": "Dominant low-end with calmer highs.",
  "Reggae - Modern": "Strong sub weight with modern clarity.",
  "Dangdut - Classic": "Balanced lows and highs for classic dangdut tone.",
  "Dangdut - Koplo": "High low/high energy for koplo groove.",
  "EDM - Club": "Loud, punchy, and bright for club systems.",
  "Hip Hop - Trap": "Deep sub with clear vocal presence.",
  "Country - Classic": "Natural, warm, and focused on vocal and guitar articulation.",
  "Acoustic - Folk": "Natural and open, with minimal aggressive coloration.",
  "Ballad - Vocal": "Vocal-focused with stable warm body.",
};

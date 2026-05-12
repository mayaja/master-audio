import type { MasteringTargetProfile } from "@/mastering/types/mastering";
import type { TonalZones } from "@/mastering/utils/analyzeFullTrackTonal";

type AdaptiveBasePreset = {
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
  outputComp: number;
};

type AdaptiveMetrics = {
  integrated: number;
  shortTerm: number;
  truePeak: number;
  crest: number;
  correlation: number;
};

type AdaptiveInput = {
  basePreset: AdaptiveBasePreset;
  tonalTarget: number[];
  profile: MasteringTargetProfile;
  metrics: AdaptiveMetrics;
  frequencyData?: Uint8Array;
  sampleRate?: number;
  fftSize?: number;
  tonalZones?: TonalZones;
};

type AdaptiveSummary = {
  lowDelta: number;
  midDelta: number;
  highDelta: number;
  loudnessGap: number;
};

type AdaptiveResult = {
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
  outputComp: number;
  summary: AdaptiveSummary;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function freqToBin(freq: number, sampleRate: number, fftSize: number) {
  const nyquist = sampleRate / 2;
  const ratio = clamp(freq / nyquist, 0, 1);
  return Math.floor(ratio * (fftSize / 2));
}

function avg(data: Uint8Array, start: number, end: number) {
  const safeStart = clamp(start, 0, data.length - 1);
  const safeEnd = clamp(end, safeStart + 1, data.length);
  let sum = 0;

  for (let i = safeStart; i < safeEnd; i++) {
    sum += data[i];
  }

  return sum / Math.max(safeEnd - safeStart, 1) / 255;
}

function analyzeZones(data: Uint8Array, sampleRate: number, fftSize: number) {
  return {
    sub: avg(data, freqToBin(20, sampleRate, fftSize), freqToBin(60, sampleRate, fftSize)),
    bass: avg(data, freqToBin(60, sampleRate, fftSize), freqToBin(250, sampleRate, fftSize)),
    lowMid: avg(data, freqToBin(250, sampleRate, fftSize), freqToBin(500, sampleRate, fftSize)),
    mids: avg(data, freqToBin(500, sampleRate, fftSize), freqToBin(2000, sampleRate, fftSize)),
    presence: avg(data, freqToBin(2000, sampleRate, fftSize), freqToBin(6000, sampleRate, fftSize)),
    highs: avg(data, freqToBin(6000, sampleRate, fftSize), freqToBin(20000, sampleRate, fftSize)),
  };
}

function targetZones(tonalTarget: number[]) {
  return {
    sub: tonalTarget[0] ?? 0.6,
    bass: ((tonalTarget[1] ?? 0.6) + (tonalTarget[2] ?? 0.6)) * 0.5,
    lowMid: tonalTarget[3] ?? 0.5,
    mids: ((tonalTarget[4] ?? 0.5) + (tonalTarget[5] ?? 0.5)) * 0.5,
    presence: ((tonalTarget[6] ?? 0.4) + (tonalTarget[7] ?? 0.4)) * 0.5,
    highs: ((tonalTarget[8] ?? 0.3) + (tonalTarget[9] ?? 0.3)) * 0.5,
  };
}

export function buildAdaptivePreset(input: AdaptiveInput): AdaptiveResult {
  const { basePreset, tonalTarget, profile, metrics, frequencyData, sampleRate, fftSize, tonalZones } = input;

  const zones = tonalZones
    ? tonalZones
    : analyzeZones(
        frequencyData ?? new Uint8Array(0),
        sampleRate ?? 48000,
        fftSize ?? 2048
      );
  const targets = targetZones(tonalTarget);

  const subDelta = zones.sub - targets.sub;
  const bassDelta = zones.bass - targets.bass;
  const lowMidDelta = zones.lowMid - targets.lowMid;
  const midDelta = zones.mids - targets.mids;
  const presenceDelta = zones.presence - targets.presence;
  const highDelta = zones.highs - targets.highs;

  const lowAdjust = clamp(-((subDelta * 0.65 + bassDelta * 0.35) * 10), -3.5, 3.5);
  const midAdjust = clamp(-((lowMidDelta * 0.45 + midDelta * 0.55) * 8), -3, 3);
  const highAdjust = clamp(-((presenceDelta * 0.6 + highDelta * 0.4) * 9), -3.5, 3.5);

  const nextEq = [
    clamp((basePreset.eq[0] ?? 0) + lowAdjust, -6, 6),
    clamp((basePreset.eq[1] ?? 0) + lowAdjust * 0.75, -6, 6),
    clamp((basePreset.eq[2] ?? 0) + midAdjust * 0.8, -6, 6),
    clamp((basePreset.eq[3] ?? 0) + midAdjust * 0.9, -6, 6),
    clamp((basePreset.eq[4] ?? 0) + midAdjust, -6, 6),
    clamp((basePreset.eq[5] ?? 0) + highAdjust * 0.9, -6, 6),
    clamp((basePreset.eq[6] ?? 0) + highAdjust, -6, 6),
  ];

  const loudnessGap = profile.targetIntegratedLufs - metrics.integrated;
  const loudnessPush = clamp(loudnessGap * 0.6, -2.5, 2.5);

  const crestGap = metrics.crest - profile.minCrestDb;
  const crestCompAdjust = clamp(crestGap * 0.15, -0.6, 0.6);
  const crestDriveAdjust = clamp(crestGap * 0.25, -1.2, 1.2);

  const truePeakHeadroom = profile.maxTruePeakDbtp - metrics.truePeak;
  const nearPeakCeiling = truePeakHeadroom <= 0.6;
  const peakGuardFactor = nearPeakCeiling ? clamp(truePeakHeadroom / 0.6, 0.25, 1) : 1;

  const correlationPenalty = metrics.correlation < profile.minCorrelation ? -0.6 : 0;

  const nextComp = {
    threshold: clamp(basePreset.comp.threshold - loudnessPush * 1.2, -30, -8),
    ratio: clamp(basePreset.comp.ratio + loudnessPush * 0.12 + crestCompAdjust, 1.5, 4),
    attack: clamp(basePreset.comp.attack - loudnessPush * 0.0015, 0.005, 0.04),
    release: clamp(basePreset.comp.release + loudnessPush * 0.01, 0.04, 0.4),
  };

  const truePeakOverflow = Math.max(0, metrics.truePeak - profile.maxTruePeakDbtp);
  const peakDriveReduction = truePeakOverflow * 2;
  const adaptiveCeilingTrim = clamp(truePeakOverflow * 0.6, 0, 0.8);

  const nextLimiter = {
    drive: clamp(
      basePreset.limiter.drive + (loudnessPush + crestDriveAdjust) * peakGuardFactor - peakDriveReduction,
      0,
      12
    ),
    ceiling: Math.min(basePreset.limiter.ceiling, profile.maxTruePeakDbtp - adaptiveCeilingTrim),
    lookahead: clamp(basePreset.limiter.lookahead, 2, 24),
    release: clamp(basePreset.limiter.release + loudnessPush * 0.005, 0.04, 0.22),
  };

  const nextOutputComp = clamp(
    basePreset.outputComp + loudnessPush * 0.8 * peakGuardFactor - truePeakOverflow * 1.1,
    -6,
    4
  );

  const nextTone = {
    low: clamp(basePreset.tone.low + lowAdjust, -6, 6),
    mid: clamp(basePreset.tone.mid + midAdjust, -6, 6),
    high: clamp(basePreset.tone.high + highAdjust + correlationPenalty, -6, 6),
  };

  return {
    tone: nextTone,
    eq: nextEq,
    comp: nextComp,
    limiter: nextLimiter,
    outputComp: nextOutputComp,
    summary: {
      lowDelta: lowAdjust,
      midDelta: midAdjust,
      highDelta: highAdjust,
      loudnessGap,
    },
  };
}

export type { AdaptiveInput, AdaptiveResult };
export const PLATFORM_IDS = ["spotify", "youtube", "apple-music"] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export function isPlatformId(value: string): value is PlatformId {
  return PLATFORM_IDS.includes(value as PlatformId);
}

export type MasteringTargetProfile = {
  id: PlatformId;
  name: string;
  targetIntegratedLufs: number;
  integratedTolerance: number;
  maxTruePeakDbtp: number;
  minCrestDb: number;
  minCorrelation: number;
  maxShortTermLufs: number;
};

export type ValidationStatus = "pass" | "warn" | "fail";

export type ValidationRow = {
  id: string;
  title: string;
  value: string;
  target: string;
  status: ValidationStatus;
  hint: string;
};

export const masteringProfiles: MasteringTargetProfile[] = [
  {
    id: "spotify",
    name: "Spotify",
    targetIntegratedLufs: -14,
    integratedTolerance: 1.5,
    maxTruePeakDbtp: -1,
    minCrestDb: 7,
    minCorrelation: 0,
    maxShortTermLufs: -10,
  },
  {
    id: "youtube",
    name: "YouTube",
    targetIntegratedLufs: -14,
    integratedTolerance: 2,
    maxTruePeakDbtp: -1,
    minCrestDb: 6,
    minCorrelation: -0.1,
    maxShortTermLufs: -9,
  },
  {
    id: "apple-music",
    name: "Apple Music",
    targetIntegratedLufs: -16,
    integratedTolerance: 2,
    maxTruePeakDbtp: -1,
    minCrestDb: 7,
    minCorrelation: 0,
    maxShortTermLufs: -11,
  },
];

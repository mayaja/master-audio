import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type WaveSurfer from "wavesurfer.js";
import type { Preset } from "@/mastering/data/presets";
import type { EQBand } from "@/mastering/types/audio";
import type { MasteringTargetProfile, PlatformId } from "@/mastering/types/mastering";

export type CompState = {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
};

export type LimiterState = {
  drive: number;
  ceiling: number;
  lookahead: number;
  release: number;
};

export type ValidationSummary = {
  pass: number;
  warn: number;
  fail: number;
  score: number;
};

export interface MasteringController {
  presets: Preset[];
  presetDescriptions: Record<string, string>;
  activePreset: string;
  activePresetData: Preset;
  activeProfile: MasteringTargetProfile;
  activeProfileId: PlatformId;
  adaptMode: "full" | "quick";
  adaptProgress: number;
  audioUrl: string | null;
  bands: EQBand[];
  canPlay: boolean;
  comp: CompState;
  correlation: number;
  crest: number;
  integrated: number;
  inputGain: number;
  isAdapting: boolean;
  isExportConfirmOpen: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportMessage: string;
  isPrivacyNoticeOpen: boolean;
  isScrolled: boolean;
  leftDb: number;
  limiter: LimiterState;
  loudnessState: "Too Loud" | "Too Quiet" | "On Target";
  masterMode: "safe" | "loud";
  outputGain: number;
  rightDb: number;
  shortTerm: number;
  statusNote: string;
  toneHigh: number;
  toneLow: number;
  toneMid: number;
  transportState: "playing" | "paused" | "stopped";
  truePeak: number;
  validationSummary: ValidationSummary;
  handleApplyMasterMode: (mode: "safe" | "loud") => void;
  handleApplyTarget: () => void;
  handleAutoAdapt: () => void;
  handleExport: () => Promise<void>;
  handleExportReport: () => void;
  handleLoadAudio: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleMid: (value: number) => void;
  handleHigh: (value: number) => void;
  handleLow: (value: number) => void;
  handlePause: () => void;
  handlePlay: () => Promise<void>;
  handlePresetSelect: (name: string) => void;
  handleStop: () => void;
  handleToggleAbMode: () => void;
  proceedExport: () => Promise<void>;
  acknowledgePrivacyNotice: () => void;
  setAdaptMode: Dispatch<SetStateAction<"full" | "quick">>;
  setActiveProfileId: Dispatch<SetStateAction<PlatformId>>;
  setBands: Dispatch<SetStateAction<EQBand[]>>;
  setComp: Dispatch<SetStateAction<CompState>>;
  setInputGain: Dispatch<SetStateAction<number>>;
  setIsExportConfirmOpen: Dispatch<SetStateAction<boolean>>;
  setIsPrivacyNoticeOpen: Dispatch<SetStateAction<boolean>>;
  setLimiter: Dispatch<SetStateAction<LimiterState>>;
  setOutputGain: Dispatch<SetStateAction<number>>;
  setStatusNote: Dispatch<SetStateAction<string>>;
  setWaveSurfer: Dispatch<SetStateAction<WaveSurfer | null>>;
  abMode: "original" | "processed";
}

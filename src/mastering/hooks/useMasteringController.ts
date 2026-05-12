import { useEffect, useMemo, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import { useAudioMeter } from "@/mastering/hooks/useAudioMeter";
import { useIntegratedLufs } from "@/mastering/hooks/useIntegratedLufs";
import { useTruePeak } from "@/mastering/hooks/useTruePeak";
import { useCrestFactor } from "@/mastering/hooks/useCrestFactor";
import { useLufsMeter } from "@/mastering/hooks/useLufsMeter";
import { presets, presetDescriptions } from "@/mastering/data/presets";
import { masteringProfiles } from "@/mastering/types/mastering";
import { evaluateMastering, summarizeValidation } from "@/mastering/utils/evaluateMastering";
import { checkPresetQuality } from "@/mastering/utils/checkPresetQuality";
import { useTransportController } from "@/mastering/hooks/useTransportController";
import { usePresetProcessing } from "@/mastering/hooks/usePresetProcessing";
import { useExportFlow } from "@/mastering/hooks/useExportFlow";
import type { PlatformId } from "@/mastering/types/mastering";
import { isPlatformId } from "@/mastering/types/mastering";
import type { MasteringController } from "@/mastering/types/controller";

const PRIVACY_NOTICE_KEY = "oma-privacy-notice-ack-v1";
const PRIVACY_NOTICE_TTL_MS = 30 * 60 * 1000;
const ACTIVE_PROFILE_KEY = "oma-active-profile-v1";

export function useMasteringController(): MasteringController {
  const [inputGain, setInputGain] = useState(0);
  const [outputGain, setOutputGain] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<PlatformId>(() => {
    if (typeof window === "undefined") {
      return masteringProfiles[0].id;
    }

    const saved = window.localStorage.getItem(ACTIVE_PROFILE_KEY);

    if (saved && isPlatformId(saved) && masteringProfiles.some((profile) => profile.id === saved)) {
      return saved;
    }

    return masteringProfiles[0].id;
  });
  const [masterMode, setMasterMode] = useState<"safe" | "loud">("safe");
  const [statusNote, setStatusNote] = useState("Load audio, then choose a target platform for validation.");
  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const raw = window.localStorage.getItem(PRIVACY_NOTICE_KEY);

    if (!raw) {
      return true;
    }

    const acknowledgedAt = Number(raw);

    if (!Number.isFinite(acknowledgedAt)) {
      return true;
    }

    return Date.now() - acknowledgedAt > PRIVACY_NOTICE_TTL_MS;
  });

  const { leftDb, rightDb } = useAudioMeter();
  const integrated = useIntegratedLufs();
  const truePeak = useTruePeak();
  const crest = useCrestFactor();
  const { shortTerm } = useLufsMeter();

  const correlation = audioEngine.getStereoCorrelation();

  const activeProfile = useMemo(
    () => masteringProfiles.find((profile) => profile.id === activeProfileId) ?? masteringProfiles[0],
    [activeProfileId]
  );

  const presetProcessing = usePresetProcessing({
    integrated,
    shortTerm,
    truePeak,
    crest,
    correlation,
    activeProfile,
    setStatusNote,
  });

  const transport = useTransportController({ setStatusNote });

  const loudnessState = useMemo(() => {
    if (integrated > -10) return "Too Loud";
    if (integrated < -16) return "Too Quiet";
    return "On Target";
  }, [integrated]);

  const validationRows = useMemo(
    () => evaluateMastering(activeProfile, integrated, shortTerm, truePeak, crest, correlation),
    [activeProfile, integrated, shortTerm, truePeak, crest, correlation]
  );

  const validationSummary = useMemo(() => summarizeValidation(validationRows), [validationRows]);

  const handleApplyTarget = () => {
    const quality = checkPresetQuality(presetProcessing.activePresetData);

    if (quality.blockingIssues.length > 0) {
      setStatusNote(
        `Preset ${presetProcessing.activePresetData.name} needs to be fixed first: ${quality.blockingIssues[0]}`
      );
      return;
    }

    const nextCeiling = Math.min(activeProfile.maxTruePeakDbtp, presetProcessing.activePresetData.limiter.ceiling);
    audioEngine.setLimiterCeiling(nextCeiling);
    presetProcessing.setLimiter((previous) => ({
      ...previous,
      ceiling: nextCeiling,
    }));

    const warningText =
      quality.warnings.length > 0
        ? ` Preset note: ${quality.warnings[0]}`
        : "";

    setStatusNote(
      `Target ${activeProfile.name} applied: safety lock ceiling ${nextCeiling} dBTP (default preset remains active).${warningText}`
    );
  };

  const handleApplyMasterMode = (mode: "safe" | "loud") => {
    setMasterMode(mode);

    if (mode === "safe") {
      const ceiling = Math.min(activeProfile.maxTruePeakDbtp, -1);
      const drive = Math.max(0, presetProcessing.limiter.drive - 1.5);
      const ratio = Math.min(presetProcessing.comp.ratio, 2.2);
      const nextAttack = Math.max(presetProcessing.comp.attack, 0.02);

      presetProcessing.setComp((previous) => ({
        ...previous,
        ratio,
        attack: nextAttack,
      }));
      audioEngine.setCompRatio(ratio);
      audioEngine.setCompAttack(nextAttack);

      presetProcessing.setLimiter((previous) => ({
        ...previous,
        drive,
        ceiling,
      }));
      audioEngine.setLimiterDrive(drive);
      audioEngine.setLimiterCeiling(ceiling);

      setStatusNote("Safe Master mode active: safer dynamics and more relaxed headroom.");
      return;
    }

    const loudCeiling = Math.min(activeProfile.maxTruePeakDbtp, -1);
    const loudDrive = Math.min(12, presetProcessing.limiter.drive + 1.5);
    const loudRatio = Math.min(4, presetProcessing.comp.ratio + 0.6);
    const loudAttack = Math.min(presetProcessing.comp.attack, 0.015);

    presetProcessing.setComp((previous) => ({
      ...previous,
      ratio: loudRatio,
      attack: loudAttack,
    }));
    audioEngine.setCompRatio(loudRatio);
    audioEngine.setCompAttack(loudAttack);

    presetProcessing.setLimiter((previous) => ({
      ...previous,
      drive: loudDrive,
      ceiling: loudCeiling,
    }));
    audioEngine.setLimiterDrive(loudDrive);
    audioEngine.setLimiterCeiling(loudCeiling);

    setStatusNote("Loud Master mode active: higher loudness, check the Validation Report before export.");
  };

  const exportFlow = useExportFlow({
    canPlay: transport.canPlay,
    loadedFileName: transport.loadedFileName,
    profileName: activeProfile.name,
    masterMode,
    activePreset: presetProcessing.activePreset,
    integrated,
    shortTerm,
    truePeak,
    crest,
    correlation,
    validationRows,
    validationFailCount: validationSummary.fail,
    validationSummary,
    setStatusNote,
  });

  const acknowledgePrivacyNotice = () => {
    window.localStorage.setItem(PRIVACY_NOTICE_KEY, String(Date.now()));
    setIsPrivacyNoticeOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isPrivacyNoticeOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPrivacyNoticeOpen]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
  }, [activeProfileId]);

  return {
    presets,
    presetDescriptions,
    activePreset: presetProcessing.activePreset,
    activePresetData: presetProcessing.activePresetData,
    activeProfile,
    activeProfileId,
    adaptMode: presetProcessing.adaptMode,
    adaptProgress: presetProcessing.adaptProgress,
    audioUrl: transport.audioUrl,
    bands: presetProcessing.bands,
    canPlay: transport.canPlay,
    comp: presetProcessing.comp,
    correlation,
    crest,
    integrated,
    inputGain,
    isAdapting: presetProcessing.isAdapting,
    isExportConfirmOpen: exportFlow.isExportConfirmOpen,
    isExporting: exportFlow.isExporting,
    exportProgress: exportFlow.exportProgress,
    exportMessage: exportFlow.exportMessage,
    isPrivacyNoticeOpen,
    isScrolled,
    leftDb,
    limiter: presetProcessing.limiter,
    loudnessState,
    masterMode,
    outputGain,
    rightDb,
    shortTerm,
    statusNote,
    toneHigh: presetProcessing.toneHigh,
    toneLow: presetProcessing.toneLow,
    toneMid: presetProcessing.toneMid,
    transportState: transport.transportState,
    truePeak,
    validationSummary,
    handleApplyMasterMode,
    handleApplyTarget,
    handleAutoAdapt: presetProcessing.handleAutoAdapt,
    handleExport: exportFlow.handleExport,
    handleExportReport: exportFlow.handleExportReport,
    handleLoadAudio: transport.handleLoadAudio,
    handleMid: presetProcessing.handleMid,
    handleHigh: presetProcessing.handleHigh,
    handleLow: presetProcessing.handleLow,
    handlePause: transport.handlePause,
    handlePlay: transport.handlePlay,
    handlePresetSelect: presetProcessing.handlePresetSelect,
    handleStop: transport.handleStop,
    handleToggleAbMode: transport.handleToggleAbMode,
    proceedExport: exportFlow.proceedExport,
    acknowledgePrivacyNotice,
    setAdaptMode: presetProcessing.setAdaptMode,
    setActiveProfileId,
    setBands: presetProcessing.setBands,
    setComp: presetProcessing.setComp,
    setInputGain,
    setIsExportConfirmOpen: exportFlow.setIsExportConfirmOpen,
    setIsPrivacyNoticeOpen,
    setLimiter: presetProcessing.setLimiter,
    setOutputGain,
    setStatusNote,
    setWaveSurfer: transport.setWaveSurfer,
    abMode: transport.abMode,
  };
}

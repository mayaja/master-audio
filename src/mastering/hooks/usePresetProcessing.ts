import { useEffect, useMemo, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import {
  ACTIVE_PRESET_KEY,
  defaultBands,
  presets,
  resolvePresetForProfile,
  type Preset,
} from "@/mastering/data/presets";
import type { EQBand } from "@/mastering/types/audio";
import type { MasteringTargetProfile } from "@/mastering/types/mastering";
import type { CompState, LimiterState } from "@/mastering/types/controller";
import { buildAdaptivePreset } from "@/mastering/utils/buildAdaptivePreset";
import { analyzeFullTrackTonal } from "@/mastering/utils/analyzeFullTrackTonal";

interface UsePresetProcessingParams {
  integrated: number;
  shortTerm: number;
  truePeak: number;
  crest: number;
  correlation: number;
  activeProfile: MasteringTargetProfile;
  setStatusNote: (text: string) => void;
}

export function usePresetProcessing({
  integrated,
  shortTerm,
  truePeak,
  crest,
  correlation,
  activeProfile,
  setStatusNote,
}: UsePresetProcessingParams) {
  const [toneLow, setToneLow] = useState(0);
  const [toneMid, setToneMid] = useState(0);
  const [toneHigh, setToneHigh] = useState(0);
  const [activePreset, setActivePreset] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "Flat";
    }

    const saved = window.localStorage.getItem(ACTIVE_PRESET_KEY);
    return saved && presets.some((preset) => preset.name === saved) ? saved : "Flat";
  });
  const [bands, setBands] = useState<EQBand[]>(defaultBands);
  const [comp, setComp] = useState<CompState>({ threshold: -18, ratio: 2, attack: 0.02, release: 0.2 });
  const [limiter, setLimiter] = useState<LimiterState>({ drive: 0, ceiling: -1, lookahead: 5, release: 0.05 });
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptMode, setAdaptMode] = useState<"full" | "quick">("full");
  const [adaptProgress, setAdaptProgress] = useState(0);

  const activeBasePresetData = useMemo(
    () => presets.find((preset) => preset.name === activePreset) ?? presets[0],
    [activePreset]
  );

  const activePresetData = useMemo(
    () => resolvePresetForProfile(activeBasePresetData, activeProfile.id),
    [activeBasePresetData, activeProfile.id]
  );

  const applyToneToEQ = (low: number, mid: number, high: number) => {
    setBands((previous) =>
      previous.map((band) => {
        let gain = band.gain;

        if (band.freq <= 120) {
          gain = low;
        } else if (band.freq < 4000) {
          gain = mid;
        } else {
          gain = high;
        }

        return { ...band, gain };
      })
    );
  };

  const handleLow = (value: number) => {
    setToneLow(value);
    applyToneToEQ(value, toneMid, toneHigh);
  };

  const handleMid = (value: number) => {
    setToneMid(value);
    applyToneToEQ(toneLow, value, toneHigh);
  };

  const handleHigh = (value: number) => {
    setToneHigh(value);
    applyToneToEQ(toneLow, toneMid, value);
  };

  const applyPreset = (basePreset: Preset, withStatusNote = true) => {
    const preset = resolvePresetForProfile(basePreset, activeProfile.id);

    setActivePreset(basePreset.name);

    setToneLow(preset.tone.low);
    setToneMid(preset.tone.mid);
    setToneHigh(preset.tone.high);

    const nextBands = defaultBands.map((band, index) => ({
      ...band,
      gain: preset.eq[index] ?? band.gain,
    }));

    setBands(nextBands);
    audioEngine.setEQBands(nextBands);

    setComp(preset.comp);
    audioEngine.setCompThreshold(preset.comp.threshold);
    audioEngine.setCompRatio(preset.comp.ratio);
    audioEngine.setCompAttack(preset.comp.attack);
    audioEngine.setCompRelease(preset.comp.release);

    setLimiter(preset.limiter);
    audioEngine.setLimiterDrive(preset.limiter.drive);
    audioEngine.setLimiterCeiling(preset.limiter.ceiling);
    audioEngine.setLimiterLookahead(preset.limiter.lookahead);
    audioEngine.setLimiterRelease(preset.limiter.release);

    audioEngine.setPostGain(preset.outputComp);

    if (withStatusNote) {
      setStatusNote(`Preset ${basePreset.name} applied (${activeProfile.name}).`);
    }
  };

  const handlePresetSelect = (name: string) => {
    const selected = presets.find((preset) => preset.name === name);
    if (selected) {
      applyPreset(selected);
    }
  };

  const handleAutoAdapt = () => {
    if (!audioEngine.audioBuffer) {
      setStatusNote("Load audio before using Auto Adapt.");
      return;
    }

    setIsAdapting(true);
    setAdaptProgress(0);

    const run = async () => {
      try {
        const resolvedPresetForAdapt = resolvePresetForProfile(activeBasePresetData, activeProfile.id);

        const metrics = {
          integrated,
          shortTerm,
          truePeak,
          crest,
          correlation,
        };

        let adaptive;

        if (adaptMode === "full") {
          setStatusNote("Analyzing track... 0%");

          const zones = await analyzeFullTrackTonal(audioEngine.audioBuffer!, (progress) => {
            setAdaptProgress(progress);
            setStatusNote(`Analyzing track... ${progress}%`);
          });

          adaptive = buildAdaptivePreset({
            basePreset: resolvedPresetForAdapt,
            tonalTarget: resolvedPresetForAdapt.tonalTarget,
            profile: activeProfile,
            metrics,
            tonalZones: zones,
          });
        } else {
          const data = new Uint8Array(audioEngine.analyser.frequencyBinCount);
          audioEngine.analyser.getByteFrequencyData(data);

          adaptive = buildAdaptivePreset({
            basePreset: resolvedPresetForAdapt,
            tonalTarget: resolvedPresetForAdapt.tonalTarget,
            profile: activeProfile,
            metrics,
            frequencyData: data,
            sampleRate: audioEngine.audioContext.sampleRate,
            fftSize: audioEngine.analyser.fftSize,
          });
        }

        const nextBands = defaultBands.map((band, index) => ({
          ...band,
          gain: adaptive.eq[index] ?? band.gain,
        }));

        setToneLow(adaptive.tone.low);
        setToneMid(adaptive.tone.mid);
        setToneHigh(adaptive.tone.high);

        setBands(nextBands);
        audioEngine.setEQBands(nextBands);

        setComp(adaptive.comp);
        audioEngine.setCompThreshold(adaptive.comp.threshold);
        audioEngine.setCompRatio(adaptive.comp.ratio);
        audioEngine.setCompAttack(adaptive.comp.attack);
        audioEngine.setCompRelease(adaptive.comp.release);

        setLimiter(adaptive.limiter);
        audioEngine.setLimiterDrive(adaptive.limiter.drive);
        audioEngine.setLimiterCeiling(adaptive.limiter.ceiling);
        audioEngine.setLimiterLookahead(adaptive.limiter.lookahead);
        audioEngine.setLimiterRelease(adaptive.limiter.release);

        audioEngine.setPostGain(adaptive.outputComp);

        setStatusNote(
          `Auto Adapt ${adaptMode === "full" ? "(Full Track)" : "(Quick)"} active: low ${adaptive.summary.lowDelta >= 0 ? "+" : ""}${adaptive.summary.lowDelta.toFixed(1)} dB, mid ${adaptive.summary.midDelta >= 0 ? "+" : ""}${adaptive.summary.midDelta.toFixed(1)} dB, high ${adaptive.summary.highDelta >= 0 ? "+" : ""}${adaptive.summary.highDelta.toFixed(1)} dB.`
        );
      } finally {
        setIsAdapting(false);
      }
    };

    void run();
  };

  useEffect(() => {
    audioEngine.setEQBands(bands);
  }, [bands]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_PRESET_KEY, activePreset);
  }, [activePreset]);

  useEffect(() => {
    const selected = presets.find((preset) => preset.name === activePreset);
    if (selected) {
      applyPreset(selected, false);
    }
    // Run once on startup to hydrate controls from persisted active preset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selected = presets.find((preset) => preset.name === activePreset);
    if (selected) {
      applyPreset(selected, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile.id]);

  return {
    activePreset,
    activePresetData,
    adaptMode,
    adaptProgress,
    bands,
    comp,
    isAdapting,
    limiter,
    toneHigh,
    toneLow,
    toneMid,
    handleAutoAdapt,
    handleHigh,
    handleLow,
    handleMid,
    handlePresetSelect,
    setAdaptMode,
    setBands,
    setComp,
    setLimiter,
  };
}

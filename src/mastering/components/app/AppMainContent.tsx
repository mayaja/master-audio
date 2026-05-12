import type { Dispatch, SetStateAction } from "react";
import WaveSurfer from "wavesurfer.js";
import Section from "@/mastering/components/sections/Section";
import Waveform from "@/mastering/components/waveform/Waveform";
import BarMeter from "@/mastering/components/meters/BarMeter";
import PresetPicker from "@/mastering/components/preset/PresetPicker";
import EQCurve from "@/mastering/components/analyzer/EQCurve";
import Spectrum from "@/mastering/components/analyzer/Spectrum";
import Compressor from "@/mastering/components/compressor/Compressor";
import Limiter from "@/mastering/components/limiter/Limiter";
import StereoMonitoring from "@/mastering/components/analyzer/StereoMonitoring";
import ValidationReport from "@/mastering/components/analyzer/ValidationReport";
import type { EQBand } from "@/mastering/types/audio";
import type { Preset } from "@/mastering/data/presets";
import type { MasteringTargetProfile } from "@/mastering/types/mastering";
import type { CompState, LimiterState } from "@/mastering/types/controller";

interface AppMainContentProps {
  audioUrl: string | null;
  onWaveformReady: (waveSurfer: WaveSurfer) => void;
  leftDb: number;
  rightDb: number;
  presets: Preset[];
  activePreset: string;
  presetDescriptions: Record<string, string>;
  onSelectPreset: (name: string) => void;
  bands: EQBand[];
  setBands: Dispatch<SetStateAction<EQBand[]>>;
  tonalTarget: [number, number, number, number, number, number, number, number, number, number];
  comp: CompState;
  setComp: Dispatch<SetStateAction<CompState>>;
  limiter: LimiterState;
  setLimiter: Dispatch<SetStateAction<LimiterState>>;
  activeProfile: MasteringTargetProfile;
  integrated: number;
  shortTerm: number;
  truePeak: number;
  crest: number;
  correlation: number;
  disabled?: boolean;
}

export default function AppMainContent({
  audioUrl,
  onWaveformReady,
  leftDb,
  rightDb,
  presets,
  activePreset,
  presetDescriptions,
  onSelectPreset,
  bands,
  setBands,
  tonalTarget,
  comp,
  setComp,
  limiter,
  setLimiter,
  activeProfile,
  integrated,
  shortTerm,
  truePeak,
  crest,
  correlation,
  disabled = false,
}: AppMainContentProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_170px]">
        <Section title="Waveform & Meter Bridge">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-9">
              <div className="h-40">
                <Waveform audioUrl={audioUrl} onReady={onWaveformReady} />
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="flex h-40 items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-black/40">
                <BarMeter channel="L" value={leftDb} compact />
                <BarMeter channel="R" value={rightDb} compact />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Preset">
          <PresetPicker
            presets={presets}
            activePreset={activePreset}
            presetDescriptions={presetDescriptions}
            onSelectPreset={onSelectPreset}
            disabled={disabled}
          />
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Parametric EQ (Fine Tuning)">
          <div className="h-72 rounded-2xl border border-zinc-800 bg-black/50 p-3">
            <EQCurve bands={bands} setBands={setBands} disabled={disabled} />
          </div>
        </Section>

        <Section title="Spectrum Analyzer">
          <div className="h-72 rounded-2xl border border-zinc-800 bg-black/50 p-3">
            <Spectrum tonalTarget={tonalTarget} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Compressor">
          <Compressor comp={comp} setComp={setComp} disabled={disabled} />
        </Section>

        <Section title="Limiter">
          <Limiter limiter={limiter} setLimiter={setLimiter} disabled={disabled} />
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Stereo Monitoring">
          <StereoMonitoring disabled={disabled} />
        </Section>

        <Section title="Validation Report">
          <ValidationReport
            profile={activeProfile}
            integrated={integrated}
            shortTerm={shortTerm}
            truePeak={truePeak}
            crest={crest}
            correlation={correlation}
          />
        </Section>
      </div>
    </section>
  );
}

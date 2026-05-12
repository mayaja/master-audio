import type { Dispatch, SetStateAction } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import BandSolo from "@/mastering/components/analyzer/BandSolo";
import SoloSweep from "@/mastering/components/analyzer/SoloSweep";
import Knob from "@/mastering/components/knobs/Knob";
import Section from "@/mastering/components/sections/Section";
import type { EQBand } from "@/mastering/types/audio";

interface AppLeftSidebarProps {
  inputGain: number;
  outputGain: number;
  toneLow: number;
  toneMid: number;
  toneHigh: number;
  onInputGainChange: (value: number) => void;
  onOutputGainChange: (value: number) => void;
  onLowChange: (value: number) => void;
  onMidChange: (value: number) => void;
  onHighChange: (value: number) => void;
  bands: EQBand[];
  setBands: Dispatch<SetStateAction<EQBand[]>>;
  disabled?: boolean;
}

export default function AppLeftSidebar({
  inputGain,
  outputGain,
  toneLow,
  toneMid,
  toneHigh,
  onInputGainChange,
  onOutputGainChange,
  onLowChange,
  onMidChange,
  onHighChange,
  bands,
  setBands,
  disabled = false,
}: AppLeftSidebarProps) {
  return (
    <aside className="flex flex-col gap-6">
      <Section title="Input / Output">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex h-36 items-center justify-center">
            <Knob
              label="Input"
              value={inputGain}
              min={-24}
              max={24}
              unit="dB"
              bipolar
              disabled={disabled}
              onChange={(value) => {
                onInputGainChange(value);
                audioEngine.setInputGain(value);
              }}
            />
          </div>

          <div className="flex h-36 items-center justify-center">
            <Knob
              label="Output"
              value={outputGain}
              min={-24}
              max={24}
              unit="dB"
              bipolar
              disabled={disabled}
              onChange={(value) => {
                onOutputGainChange(value);
                audioEngine.setOutputGain(value);
              }}
            />
          </div>
        </div>
      </Section>

      <Section title="Tone Control">
        <div className="grid grid-cols-3 gap-3">
          <Knob label="Low" value={toneLow} min={-12} max={12} unit="dB" bipolar disabled={disabled} onChange={onLowChange} />
          <Knob label="Mid" value={toneMid} min={-12} max={12} unit="dB" bipolar disabled={disabled} onChange={onMidChange} />
          <Knob label="High" value={toneHigh} min={-12} max={12} unit="dB" bipolar disabled={disabled} onChange={onHighChange} />
        </div>
      </Section>

      <Section title="Band Solo">
        <BandSolo disabled={disabled} />
      </Section>

      <Section title="Solo Sweep">
        <SoloSweep bands={bands} setBands={setBands} disabled={disabled} />
      </Section>
    </aside>
  );
}

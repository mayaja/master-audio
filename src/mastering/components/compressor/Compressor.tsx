import { useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import HoverInfo from "@/mastering/components/ui/HoverInfo";
import { useCompressorMeter } from "@/mastering/hooks/useCompressorMeter";
import Knob from "@/mastering/components/knobs/Knob";
import { Power } from "lucide-react";
import type { CompState } from "@/mastering/types/controller";

interface Props {
    comp: CompState;
    setComp: React.Dispatch<React.SetStateAction<CompState>>;
    disabled?: boolean;
}

export default function Compressor({ comp, setComp, disabled = false }: Props) {
    const [enabled, setEnabled] = useState(true);

    const gr = useCompressorMeter();

    return (
        <div className="flex flex-col gap-6">

            {/* STATUS */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <div>
                    <p className="text-sm font-semibold text-white">
                        Compressor Status
                    </p>

                    <p className="text-xs text-zinc-500">
                        Multiband Compression Enabled
                    </p>
                </div>

                <HoverInfo text="Enable or disable the compressor.">
                    <button
                        disabled={disabled}
                        onClick={() => {
                            if (disabled) return;
                            const next = !enabled;
                            setEnabled(next);
                            audioEngine.setCompressorEnabled(next);
                        }}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${enabled
                                ? "bg-emerald-500 text-black"
                                : "bg-zinc-700 text-white"
                            }`}
                    >
                        <Power size={16} />
                        {enabled ? "ON" : "OFF"}
                    </button>
                </HoverInfo>
            </div>

            {/* KNOBS */}
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">

                <Knob
                    label="Threshold"
                    value={comp.threshold}
                    min={-60}
                    max={0}
                    unit="dB"
                    bipolar
                    disabled={disabled}
                    onChange={(v) => {
                        setComp((prev) => ({ ...prev, threshold: v }));
                        audioEngine.setCompThreshold(v);
                    }}
                />

                <Knob
                    label="Ratio"
                    value={comp.ratio}
                    min={1}
                    max={20}
                    unit=":1"
                    disabled={disabled}
                    onChange={(v) => {
                        setComp((prev) => ({ ...prev, ratio: v }));
                        audioEngine.setCompRatio(v);
                    }}
                />

                <Knob
                    label="Attack"
                    value={comp.attack}
                    min={0}
                    max={0.5}
                    unit="s"
                    step={0.005}
                    disabled={disabled}
                    onChange={(v) => {
                        setComp((prev) => ({ ...prev, attack: v }));
                        audioEngine.setCompAttack(v);
                    }}
                />

                <Knob
                    label="Release"
                    value={comp.release}
                    min={0}
                    max={1}
                    unit="s"
                    step={0.01}
                    disabled={disabled}
                    onChange={(v) => {
                        setComp((prev) => ({ ...prev, release: v }));
                        audioEngine.setCompRelease(v);
                    }}
                />

                {/* GR METER */}
                

                <div className="flex flex-col items-center justify-center gap-2">
                    <div className="relative h-20 w-6 overflow-hidden rounded-full bg-zinc-800">

                        {/* scale marker */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-[1px] w-full bg-zinc-600 opacity-50" />
                        </div>

                        {/* GR fill */}
                        <div
                            className="absolute bottom-0 w-full bg-red-500"
                            style={{
                                height: `${Math.min((gr / 24) * 100, 100)}%`,
                            }}
                        />
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-zinc-400">GR</p>
                        <p className="text-xs text-zinc-400 font-mono text-white">
                            -{gr.toFixed(1)} dB
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

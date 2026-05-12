import { useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import HoverInfo from "@/mastering/components/ui/HoverInfo";
import { useLimiterMeter } from "@/mastering/hooks/useLimiterMeter";
import Knob from "@/mastering/components/knobs/Knob";
import { Power } from "lucide-react";
import type { LimiterState } from "@/mastering/types/controller";

interface Props {
    limiter: LimiterState;
    setLimiter: React.Dispatch<React.SetStateAction<LimiterState>>;
    disabled?: boolean;
}

export default function Limiter({ limiter, setLimiter, disabled = false }: Props) {
    const [enabled, setEnabled] = useState(true);

    const gr = useLimiterMeter();

    return (
        <div className="flex flex-col gap-6">
            {/* STATUS */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <div>
                    <p className="text-sm font-semibold text-white">
                        Limiter Status
                    </p>

                    <p className="text-xs text-zinc-500">
                        Final Peak Control
                    </p>
                </div>

                <HoverInfo text="Enable or disable the limiter.">
                    <button
                        disabled={disabled}
                        onClick={() => {
                            if (disabled) return;
                            const next = !enabled;
                            setEnabled(next);
                            audioEngine.setLimiterEnabled(next);
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

            {/* CONTROLS */}
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">

                <Knob
                    label="Drive"
                    value={limiter.drive}
                    min={0}
                    max={24}
                    unit="dB"
                    bipolar
                    disabled={disabled}
                    onChange={(v) => {
                        setLimiter((prev) => ({ ...prev, drive: v }));
                        audioEngine.setLimiterDrive(v);
                    }}
                />
                <Knob
                    label="Ceiling"
                    value={limiter.ceiling}
                    min={-10}
                    max={0}
                    unit="dB"
                    bipolar
                    disabled={disabled}
                    onChange={(v) => {
                        setLimiter((prev) => ({ ...prev, ceiling: v }));
                        audioEngine.setLimiterCeiling(v);
                    }}
                />

                <Knob
                    label="Lookahead"
                    value={limiter.lookahead}
                    min={1}
                    max={10}
                    unit="ms"
                    disabled={disabled}
                    onChange={(v) => {
                        setLimiter(prev => ({ ...prev, lookahead: v }));
                        audioEngine.setLimiterLookahead(v);
                    }}
                />

                <Knob
                    label="Release"
                    value={limiter.release}
                    min={0.01}
                    max={0.2}
                    unit="s"
                    step={0.005}
                    disabled={disabled}
                    onChange={(v) => {
                        setLimiter((prev) => ({ ...prev, release: v }));
                        audioEngine.setLimiterRelease(v);
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
                                height: `${Math.min((gr / 12) * 100, 100)}%`,
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

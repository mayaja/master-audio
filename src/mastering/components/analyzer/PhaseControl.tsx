import { useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import { usePhaseMonitor } from "@/mastering/hooks/usePhaseMonitor";
import HoverInfo from "@/mastering/components/ui/HoverInfo";

interface PhaseControlProps {
    disabled?: boolean;
}

export default function PhaseControl({ disabled = false }: PhaseControlProps) {
    const [mono, setMono] = useState(false);
    const { warning } = usePhaseMonitor();

    const color =
        warning === "good"
            ? "bg-emerald-500"
            : warning === "risky"
                ? "bg-yellow-400"
                : "bg-red-500";

    const label =
        warning === "good"
            ? "Safe"
            : warning === "risky"
                ? "Check"
                : "Phase Issue";

    return (
        <div className="flex flex-col gap-4">

            {/* MONO TOGGLE */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black/40 p-3">
                <p className="text-xs text-zinc-400">Mono Compatibility</p>

                <HoverInfo text="Toggle MONO/STEREO monitoring to check phase compatibility.">
                    <button
                        disabled={disabled}
                        onClick={() => {
                            if (disabled) return;
                            const next = !mono;
                            setMono(next);
                            audioEngine.setMonoMode(next);
                        }}
                        className={`px-3 py-1 text-xs rounded-md font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${mono
                                ? "bg-emerald-500 text-black"
                                : "bg-zinc-700 text-white"
                            }`}
                    >
                        {mono ? "MONO" : "STEREO"}
                    </button>
                </HoverInfo>
            </div>

            {/* PHASE WARNING */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">Phase</p>

                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${color}`} />
                    <span className="text-xs text-white">{label}</span>
                </div>
            </div>

        </div>
    );
}

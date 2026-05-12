import { useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import HoverInfo from "@/mastering/components/ui/HoverInfo";
import Knob from "@/mastering/components/knobs/Knob";
import type { EQBand } from "@/mastering/types/audio";
import { Power } from "lucide-react";

// ===== LOG SCALE =====
function normToFreq(v: number) {
    const min = Math.log10(20);
    const max = Math.log10(20000);
    return Math.pow(10, min + (max - min) * v);
}

type Props = {
    bands: EQBand[];
    setBands: React.Dispatch<React.SetStateAction<EQBand[]>>;
    disabled?: boolean;
};

export default function SoloSweep({ bands, setBands, disabled = false }: Props) {
    const [enabled, setEnabled] = useState(false);
    const [freqNorm, setFreqNorm] = useState(0.5);
    const [q, setQ] = useState(5);

    const [targetBand, setTargetBand] = useState(3); // default mid band
    const [gain, setGain] = useState(-6); // default cut

    const freq = normToFreq(freqNorm);

    // ===== APPLY TO EQ =====
    const applyToEQ = () => {
        if (disabled) return;

        setBands((prev) => {
            const next = [...prev];

            next[targetBand] = {
                ...next[targetBand],
                freq,
                gain,
                Q: q,
            };

            return next;
        });

        // Keep the audio engine in sync immediately.
        audioEngine.setEQBands(
            bands.map((b, i) =>
                i === targetBand
                    ? { ...b, freq, gain, Q: q }
                    : b
            )
        );
    };

    return (
        <div className="flex flex-col gap-4">

            {/* ===== TOGGLE ===== */}
            {/* STATUS */}
            <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <div>
                    <p className="text-sm font-semibold text-white">
                        Sweep Status
                    </p>
                </div>

                <HoverInfo text="Enable or disable sweep mode to find frequency resonances.">
                    <button
                        disabled={disabled}
                        onClick={() => {
                            if (disabled) return;
                            const next = !enabled;
                            setEnabled(next);
                            audioEngine.setSoloEnabled(next);

                            if (next) {
                                audioEngine.setSoloSweep(freq);
                                audioEngine.setSoloQ(q);
                            }
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
            <div className="grid grid-cols-3 gap-2">
                <div className="flex justify-center">
                    <Knob
                        label="Freq"
                        value={freqNorm}
                        min={0}
                        max={1}
                        unit=""
                        step={0.001}
                        disabled={disabled}
                        onChange={(v) => {
                            setFreqNorm(v);
                            audioEngine.setSoloSweep(normToFreq(v));
                        }}
                    />
                </div>

                <div className="flex justify-center">
                    <Knob
                        label="Q"
                        value={q}
                        min={0.5}
                        max={20}
                        step={0.1}
                        disabled={disabled}
                        onChange={(v) => {
                            setQ(v);
                            audioEngine.setSoloQ(v);
                        }}
                    />
                </div>

                <div className="flex justify-center">
                    <Knob
                        label="Gain"
                        value={gain}
                        min={-12}
                        max={12}
                        step={0.5}
                        bipolar
                        disabled={disabled}
                        onChange={(v) => setGain(v)}
                    />
                </div>
            </div>

            {/* LABEL */}
            <p className="text-xs text-center text-zinc-400">
                {freq < 1000
                    ? `${Math.round(freq)} Hz`
                    : `${(freq / 1000).toFixed(2)} kHz`}
            </p>

            {/* TARGET BAND */}
            <div className="grid grid-cols-7 gap-1">
                {bands.map((_, i) => (
                    <HoverInfo key={i} text={`Select EQ band B${i + 1} as the target for the sweep result.`} className="w-full">
                        <button
                            disabled={disabled}
                            onClick={() => setTargetBand(i)}
                            className={`w-full text-[10px] py-1 rounded disabled:cursor-not-allowed disabled:opacity-50 ${targetBand === i
                                    ? "bg-emerald-500 text-black"
                                    : "bg-zinc-800 text-white"
                                }`}
                        >
                            B{i + 1}
                        </button>
                    </HoverInfo>
                ))}
            </div>

            {/* APPLY */}
            <HoverInfo text="Apply the sweep result to the selected EQ band." className="w-full">
                <button
                    disabled={disabled}
                    onClick={applyToEQ}
                    className="w-full py-2 text-xs rounded-md bg-blue-500 text-white font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Apply to EQ
                </button>
            </HoverInfo>

        </div>
    );
}

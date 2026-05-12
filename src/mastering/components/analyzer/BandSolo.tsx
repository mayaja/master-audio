import { useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import HoverInfo from "@/mastering/components/ui/HoverInfo";

interface BandSoloProps {
    disabled?: boolean;
}

export default function BandSolo({ disabled = false }: BandSoloProps) {
    const [active, setActive] = useState<null | string>(null);
    const bands = ["low", "mid", "high"] as const;

    const handle = (band: "low" | "mid" | "high") => {
        if (disabled) return;

        if (active === band) {
            setActive(null);
            audioEngine.setSoloEnabled(false);
            return;
        }

        setActive(band);
        audioEngine.setSoloBand(band);
        audioEngine.setSoloEnabled(true);
    };

    return (
        <div className="h-8 grid grid-cols-3 gap-2 w-full">

            {bands.map((b) => (
                <HoverInfo key={b} text={`Solo the ${b.toUpperCase()} band to monitor ${b} frequencies.`} className="w-full">
                    <button
                        disabled={disabled}
                        onClick={() => handle(b)}
                        className={`w-full py-1 text-xs rounded-md transition disabled:cursor-not-allowed disabled:opacity-50 ${active === b
                                ? "bg-emerald-500 text-black"
                                : "bg-zinc-800 text-white"
                            }`}
                    >
                        {b.toUpperCase()}
                    </button>
                </HoverInfo>
            ))}
        </div>
    );
}

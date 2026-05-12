import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import { useCrestFactor } from "@/mastering/hooks/useCrestFactor";
import { useLufsMeter } from "@/mastering/hooks/useLufsMeter";
import { useMasterCheck } from "@/mastering/hooks/useMasterCheck";

export default function MasterCheck() {

    const crest =
        useCrestFactor();

    const {
        shortTerm,
    } = useLufsMeter();

    const correlation =
        audioEngine.getStereoCorrelation();

    const peakDb =
        audioEngine.getPeakDb();

    const warnings =
        useMasterCheck({
            crest,
            shortTerm,
            correlation,
            peakDb,
        });

    return (
        <div className="
            flex flex-col
            h-[220px]
            rounded-2xl
            border border-zinc-800
            bg-black/40
            p-4
        ">

            {/* HEADER */}
            <div className="
                mb-4
                flex items-center
                justify-between
            ">

                <div>

                    <p className="
                        text-xs
                        uppercase
                        tracking-widest
                        text-zinc-500
                    ">
                        Master Check
                    </p>

                    <p className="
                        mt-1
                        text-sm
                        text-zinc-400
                    ">
                        Realtime Master Analysis
                    </p>

                </div>

                <div className="
                    h-2
                    w-2
                    rounded-full
                    bg-emerald-400
                    animate-pulse
                " />

            </div>

            {/* WARNINGS */}
            <div className="
                flex-1
                space-y-2
                overflow-y-auto
                pr-1
            ">

                {warnings.map(
                    (w, i) => {

                        const color =
                            w.severity === "good"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : w.severity === "warn"
                                    ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                                    : "border-red-500/30 bg-red-500/10 text-red-300";

                        return (
                            <div
                                key={i}
                                className={`
                                    h-[58px]
                                    rounded-xl
                                    border
                                    px-3
                                    py-2
                                    text-sm
                                    font-medium
                                    overflow-hidden
                                    ${color}
                                `}
                            >
                                {w.severity === "good" && "✓ "}
                                {w.severity === "warn" && "⚠ "}
                                {w.severity === "bad" && "✕ "}

                                {w.text}
                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}
import { useTonalGuidance } from "@/mastering/hooks/useTonalGuidance";

export default function TonalGuidance({
    tonalTarget,
}: {
    tonalTarget: number[];
}) {

    const warnings =
        useTonalGuidance(
            tonalTarget
        );

    return (
        <div className="
            flex flex-col
            h-[220px]
            rounded-2xl
            border border-zinc-800
            bg-black/40
            p-4
        ">

            <div className="mb-4">

                <p className="
                    text-xs
                    uppercase
                    tracking-widest
                    text-zinc-500
                ">
                    Tonal Guidance
                </p>

                <p className="
                    mt-1
                    text-sm
                    text-zinc-400
                ">
                    Realtime tonal interpretation
                </p>

            </div>

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
                                : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

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
                                {w.severity === "good"
                                    ? "✓ "
                                    : "⚠ "}

                                {w.text}
                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}
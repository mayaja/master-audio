import { useStereoWidth } from "@/mastering/hooks/useStereoWidth";

export default function StereoWidth() {
    const { width } = useStereoWidth();

    const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;

    // Most mastered material sits in a relatively narrow width range.
    // Keep UI scaled to practical values so "normal" does not look too mono.
    const visualMax = 1.2;
    const normalTarget = 0.35;
    const clamped = Math.min(safeWidth, visualMax);
    const percent = (clamped / visualMax) * 100;
    const normalMarkerPercent = (normalTarget / visualMax) * 100;

    const color =
        safeWidth < 0.12
            ? "bg-zinc-500"        // mono
            : safeWidth < 0.55
                ? "bg-emerald-400"     // normal
                : safeWidth < 0.9
                    ? "bg-yellow-400"      // wide
                    : "bg-red-500";        // too wide

    return (
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-black/40 p-3 gap-3">

            {/* LABEL */}
            <div className="flex justify-between text-xs text-zinc-400">
                <span>Stereo Width</span>
                <span className="font-mono text-white">
                    {safeWidth.toFixed(2)}
                </span>
            </div>

            {/* BAR */}
            <div className="relative h-3 w-full rounded bg-zinc-800 overflow-hidden">
                <div
                    className={`h-full ${color}`}
                    style={{ width: `${percent}%` }}
                />

                {/* marker normal */}
                <div
                    className="absolute top-0 h-full w-[1px] bg-zinc-600"
                    style={{ left: `${normalMarkerPercent}%` }}
                />
            </div>

            {/* SCALE */}
            <div className="relative h-4 text-[10px] text-zinc-500">
                <span className="absolute left-0">Mono</span>
                <span
                    className="absolute -translate-x-1/2 whitespace-nowrap"
                    style={{ left: `${normalMarkerPercent}%` }}
                >
                    Normal
                </span>
                <span className="absolute right-0">Wide</span>
            </div>

        </div>
    );
}

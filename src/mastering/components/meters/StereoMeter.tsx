import { useStereoMeter } from "@/mastering/hooks/useStereoMeter";

export default function StereoMeter() {
    const { correlation, clipping } = useStereoMeter();

    const percent = (correlation + 1) / 2 * 100;

    return (
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-black/40 p-3 gap-4">

            {/* CORRELATION */}
            <div>
                <p className="text-xs text-zinc-400 mb-1">
                    Stereo Correlation
                </p>

                <div className="relative h-3 w-full rounded bg-zinc-800">
                    <div
                        className="absolute top-0 h-full bg-emerald-400"
                        style={{ width: `${percent}%` }}
                    />

                    {/* center line */}
                    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-zinc-600" />
                </div>

                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                    <span>-1</span>
                    <span>0</span>
                    <span>+1</span>
                </div>
            </div>

            {/* CLIP */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">Clip</p>

                <div
                    className={`h-3 w-3 rounded-full ${clipping ? "bg-red-500" : "bg-zinc-700"
                        }`}
                />
            </div>
        </div>
    );
}
import { useCrestFactor } from "@/mastering/hooks/useCrestFactor";

export default function CrestFactor() {

    const crest =
        useCrestFactor();

    let status =
        "BALANCED";

    let color =
        "text-emerald-400";

    if (crest < 5) {
        status = "OVER LIMITED";
        color = "text-red-400";
    }
    else if (crest < 8) {
        status = "LOUD";
        color = "text-yellow-400";
    }
    else if (crest > 14) {
        status = "VERY DYNAMIC";
        color = "text-cyan-400";
    }

    return (
        <div className="
            rounded-2xl
            border border-zinc-800
            bg-black/40
            p-4
        ">

            <div className="
                flex items-center
                justify-between
            ">

                <div>

                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                        Crest Factor
                    </p>

                    <p className="mt-1 text-sm font-black text-red-400">
                        {crest.toFixed(1)}
                        <span className="
                            ml-1
                            text-sm
                            text-zinc-500
                        ">
                            dB
                        </span>
                    </p>

                </div>

                <div
                    className={`
                        text-sm
                        font-bold
                        ${color}
                    `}
                >
                    {status}
                </div>

            </div>

        </div>
    );
}
import { useEffect, useState } from "react";

export default function BarMeter({
    channel,
    value,
    compact = false,
}: {
    channel: string;
    value: number;
    compact?: boolean;
}) {

    // =====================================================
    // SIZE
    // =====================================================

    const container =
        compact
            ? "w-10 p-1 gap-1"
            : "w-20 p-4 gap-3";

    const barHeight =
        compact
            ? "h-20"
            : "h-52";

    const barWidth =
        compact
            ? "w-4"
            : "w-8";

    const textSize =
        compact
            ? "text-[9px]"
            : "text-xs";

    // =====================================================
    // PEAK HOLD
    // =====================================================

    const [peakValue, setPeakValue] =
        useState(value);

    useEffect(() => {

        setPeakValue((prev) => {

            // naik cepat
            if (value > prev) {
                return value;
            }

            // turun perlahan
            return prev - 0.25;
        });

    }, [value]);

    // =====================================================
    // NORMALIZE
    // =====================================================

    const meterPercent =
        Math.max(
            5,
            ((value + 60) / 60) * 100
        );

    const peakPercent =
        Math.max(
            5,
            ((peakValue + 60) / 60) * 100
        );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div
            className={`
                flex flex-col items-center
                rounded-2xl
                border border-zinc-800
                bg-zinc-950
                ${container}
            `}
        >

            {/* LABEL */}
            <p className="text-xs text-white">
                {channel}
            </p>

            {/* BAR */}
            <div
                className={`
                    relative
                    ${barHeight}
                    ${barWidth}
                    overflow-hidden
                    rounded-full
                    bg-zinc-800
                `}
            >

                {/* MAIN BAR (ORIGINAL) */}
                <div
                    style={{
                        height: `${meterPercent}%`,
                    }}
                    className="
                        absolute
                        bottom-0
                        left-0
                        w-full
                        rounded-full
                        bg-gradient-to-t
                        from-emerald-500
                        via-yellow-400
                        to-red-500
                    "
                />

                {/* PEAK HOLD LINE */}
                <div
                    style={{
                        bottom: `${peakPercent}%`,
                    }}
                    className="
                        absolute
                        left-0
                        w-full
                        h-[2px]
                        bg-white
                        z-20
                    "
                />

            </div>

            {/* VALUE */}
            <p
                className={`
                    ${textSize}
                    text-zinc-400
                    font-mono
                    tabular-nums
                `}
            >
                {value.toFixed(1)} dB
            </p>

        </div>
    );
}
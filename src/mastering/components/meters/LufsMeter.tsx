import { useEffect, useRef, useState } from "react";
import { useLufsMeter } from "@/mastering/hooks/useLufsMeter";
import { useVisualClock } from "@/mastering/hooks/useVisualClock";

export default function LufsMeter() {

    const {
        momentary,
        shortTerm,
    } = useLufsMeter();

    // =====================================================
    // HISTORY
    // =====================================================

    const [history, setHistory] =
        useState<number[]>([]);

    const lastPushRef =
        useRef(0);

    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    // =====================================================
    // NORMALIZE
    // =====================================================

    const normalize = (v: number) => {
        return Math.min(
            Math.max((v + 60) / 60, 0),
            1
        );
    };

    const tick = useVisualClock(24);

    // =====================================================
    // STORE HISTORY
    // =====================================================

    useEffect(() => {

        const now = performance.now();

        // throttle update
        if (now - lastPushRef.current < 60) {
            return;
        }

        lastPushRef.current = now;

        setHistory((prev) => {

            const next = [
                ...prev,
                shortTerm,
            ];

            if (next.length > 120) {
                next.shift();
            }

            return next;
        });

    }, [tick]);

    // =====================================================
    // DRAW HISTORY
    // =====================================================

    useEffect(() => {

        const canvas =
            canvasRef.current;

        if (!canvas) return;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) return;

        const rect =
            canvas.getBoundingClientRect();

        const dpr =
            window.devicePixelRatio || 1;

        canvas.width =
            rect.width * dpr;

        canvas.height =
            rect.height * dpr;

        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );

        const width = rect.width;
        const height = rect.height;

        // =====================================================
        // BG
        // =====================================================

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        ctx.fillStyle = "#050505";

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        // =====================================================
        // GRID
        // =====================================================

        ctx.strokeStyle =
            "rgba(255,255,255,0.05)";

        ctx.lineWidth = 1;

        const grid = [
            -6,
            -10,
            -14,
            -18,
            -24,
        ];

        grid.forEach((db) => {

            const normalized =
                (db + 30) / 30;

            const y =
                height -
                normalized * height;

            ctx.beginPath();

            ctx.moveTo(0, y);

            ctx.lineTo(width, y);

            ctx.stroke();

            ctx.fillStyle =
                "rgba(255,255,255,0.3)";

            ctx.font =
                "10px monospace";

            ctx.fillText(
                `${db}`,
                6,
                y - 4
            );
        });

        // =====================================================
        // TARGET LINE (-14 LUFS)
        // =====================================================

        const target =
            (-14 + 30) / 30;

        const targetY =
            height -
            target * height;

        ctx.beginPath();

        ctx.moveTo(0, targetY);

        ctx.lineTo(width, targetY);

        ctx.strokeStyle =
            "rgba(255,220,80,0.45)";

        ctx.lineWidth = 1;

        ctx.setLineDash([4, 4]);

        ctx.stroke();

        ctx.setLineDash([]);

        // =====================================================
        // HISTORY GRAPH
        // =====================================================

        if (history.length < 2)
            return;

        // glow
        ctx.beginPath();

        history.forEach((v, i) => {

            const x =
                (i / 119) * width;

            const normalized =
                (v + 30) / 30;

            const y =
                height -
                normalized * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.strokeStyle =
            "rgba(34,197,94,0.25)";

        ctx.lineWidth = 8;

        ctx.shadowBlur = 14;

        ctx.shadowColor =
            "#22c55e";

        ctx.stroke();

        // main line
        ctx.beginPath();

        history.forEach((v, i) => {

            const x =
                (i / 119) * width;

            const normalized =
                (v + 30) / 30;

            const y =
                height -
                normalized * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.shadowBlur = 0;

        ctx.strokeStyle =
            "#22c55e";

        ctx.lineWidth = 2;

        ctx.stroke();

    }, [history]);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="flex flex-col gap-4">

            {/* MOMENTARY */}
            <div className="flex items-center gap-4">

                <p className="w-24 text-xs text-zinc-400">
                    Momentary
                </p>

                <div className="relative h-4 flex-1 rounded bg-zinc-800">

                    <div
                        className="
                            h-full
                            rounded
                            bg-emerald-400
                        "
                        style={{
                            width: `${normalize(momentary) * 100}%`,
                        }}
                    />

                </div>

                <p className="
                    w-16
                    text-right
                    text-xs
                    text-white
                    font-mono
                ">
                    {momentary.toFixed(1)}
                </p>

            </div>

            {/* SHORT TERM */}
            <div className="flex items-center gap-4">

                <p className="w-24 text-xs text-zinc-400">
                    Short-term
                </p>

                <div className="relative h-4 flex-1 rounded bg-zinc-800">

                    <div
                        className="
                            h-full
                            rounded
                            bg-cyan-400
                        "
                        style={{
                            width: `${normalize(shortTerm) * 100}%`,
                        }}
                    />

                </div>

                <p className="
                    w-16
                    text-right
                    text-xs
                    text-white
                    font-mono
                ">
                    {shortTerm.toFixed(1)}
                </p>

            </div>

            {/* HISTORY */}
            <div className="
                rounded-2xl
                border border-zinc-800
                bg-black/50
                p-2
            ">

                <div className="
                    mb-2
                    flex items-center
                    justify-between
                ">

                    <p className="
                        text-xs
                        uppercase
                        tracking-widest
                        text-zinc-500
                    ">
                        Loudness History
                    </p>

                    <p className="
                        text-[10px]
                        text-yellow-400
                        font-mono
                    ">
                        TARGET -14 LUFS
                    </p>

                </div>

                <canvas
                    ref={canvasRef}
                    className="
                        h-32
                        w-full
                        rounded-xl
                    "
                />

            </div>

        </div>
    );
}
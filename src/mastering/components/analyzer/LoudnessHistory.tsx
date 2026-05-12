import { useEffect, useRef, useState } from "react";

type Props = {
    value: number;
};

export default function LoudnessHistory({
    value,
}: Props) {

    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const [history, setHistory] =
        useState<number[]>([]);

    // =====================================================
    // HISTORY BUFFER
    // =====================================================

    useEffect(() => {

        const interval =
            setInterval(() => {

                setHistory((prev) => {

                    const next = [
                        ...prev,
                        value,
                    ];

                    // limit buffer
                    if (next.length > 128) {
                        next.shift();
                    }

                    return next;
                });

            }, 120);

        return () =>
            clearInterval(interval);

    }, [value]);

    // =====================================================
    // DRAW
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

        const lines = [
            -6,
            -10,
            -14,
            -18,
            -24,
        ];

        lines.forEach((db) => {

            const y =
                ((db + 30) / 30) *
                height;

            ctx.beginPath();

            ctx.moveTo(0, y);

            ctx.lineTo(width, y);

            ctx.stroke();

            ctx.fillStyle =
                "rgba(255,255,255,0.35)";

            ctx.font =
                "10px monospace";

            ctx.fillText(
                `${db}`,
                6,
                y - 4
            );
        });

        // =====================================================
        // GRAPH
        // =====================================================

        if (history.length < 2)
            return;

        ctx.beginPath();

        history.forEach((v, i) => {

            const x =
                (i / 127) * width;

            // map LUFS
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

        // glow
        ctx.strokeStyle =
            "rgba(34,197,94,0.25)";

        ctx.lineWidth = 8;

        ctx.shadowBlur = 16;

        ctx.shadowColor =
            "#22c55e";

        ctx.stroke();

        // main line
        ctx.beginPath();

        history.forEach((v, i) => {

            const x =
                (i / 127) * width;

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
        <canvas
            ref={canvasRef}
            className="
                h-40
                w-full
                rounded-2xl
            "
        />
    );
}
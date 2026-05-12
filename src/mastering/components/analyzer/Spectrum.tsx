import { useEffect, useRef } from "react";
import { useSpectrum } from "@/mastering/hooks/useSpectrum";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import { useVisualClock } from "@/mastering/hooks/useVisualClock";

// =====================================================
// FREQUENCY MARKERS
// =====================================================

const FREQ_MARKS = [
    20,
    50,
    100,
    200,
    500,
    1000,
    2000,
    5000,
    10000,
    20000,
];


export default function Spectrum({tonalTarget,}: {tonalTarget: number[];}) {

    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const tick =
        useVisualClock(30);

    const data =
        useSpectrum();

    // =====================================================
    // PEAK HOLD BUFFER
    // =====================================================

    const peakRef =
        useRef<number[]>([]);

    // =====================================================
    // DRAW
    // =====================================================

    useEffect(() => {
        try {

        const canvas =
            canvasRef.current;

        if (!canvas) return;

        if (data.length === 0) return;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) return;

        // =====================================================
        // DPI
        // =====================================================

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

        const width =
            Math.floor(rect.width);

        const height =
            Math.floor(rect.height);

        if (!width || !height)
            return;

        // =====================================================
        // BACKGROUND + TRAIL
        // =====================================================

        const bg =
            ctx.createLinearGradient(
                0,
                0,
                0,
                height
            );

        bg.addColorStop(
            0,
            "rgba(12,22,35,0.34)"
        );

        bg.addColorStop(
            1,
            "rgba(5,10,18,0.62)"
        );

        ctx.fillStyle = bg;

        ctx.fillRect(
            0,
            0,
            width,
            height
        );

        // =====================================================
        // FREQUENCY RANGE
        // =====================================================

        const minFreq = 20;

        const maxFreq =
            audioEngine
                .audioContext
                .sampleRate / 2;

        const logMin =
            Math.log10(minFreq);

        const logMax =
            Math.log10(maxFreq);

        // =====================================================
        // INIT PEAK BUFFER
        // =====================================================

        if (
            peakRef.current.length !== width
        ) {

            peakRef.current =
                Array.from(
                    { length: width },
                    () => 0
                );
        }

        // =====================================================
        // GRID
        // =====================================================

        ctx.strokeStyle =
            "rgba(160,190,220,0.13)";

        ctx.lineWidth = 1;

        ctx.fillStyle =
            "rgba(196,220,244,0.65)";

        ctx.font =
            "10px sans-serif";

        for (let i = 1; i < 5; i++) {

            const y =
                (i / 5) * height;

            ctx.beginPath();

            ctx.moveTo(0, y);

            ctx.lineTo(width, y);

            ctx.strokeStyle =
                "rgba(120,150,180,0.09)";

            ctx.stroke();
        }

        FREQ_MARKS.forEach((freq) => {

            const norm =
                (
                    Math.log10(freq) -
                    logMin
                ) /
                (
                    logMax -
                    logMin
                );

            const x =
                norm * width;

            ctx.beginPath();

            ctx.moveTo(x, 0);

            ctx.lineTo(x, height);

            ctx.stroke();

            const label =
                freq >= 1000
                    ? `${freq / 1000}k`
                    : `${freq}`;
        });

        // =====================================================
        // TONAL TARGET OVERLAY
        // =====================================================

        ctx.beginPath();

        FREQ_MARKS.forEach(
            (freq, i) => {

                const normX =
                    (
                        Math.log10(freq) -
                        logMin
                    ) /
                    (
                        logMax -
                        logMin
                    );

                const x =
                    normX * width;

                const y =
                    height -
                    tonalTarget[i] *
                    height;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        );

        // close shape
        ctx.lineTo(width, height);

        ctx.lineTo(0, height);

        ctx.closePath();

        // fill
        ctx.fillStyle =
            "rgba(70,170,255,0.12)";

        ctx.fill();

        // outline
        ctx.strokeStyle =
            "rgba(120,215,255,0.55)";

        ctx.lineWidth = 2;

        ctx.stroke();

        // =====================================================
        // LIVE SPECTRUM
        // =====================================================

        let prev = 0;

        const barGradient =
            ctx.createLinearGradient(
                0,
                0,
                0,
                height
            );

        barGradient.addColorStop(
            0,
            "#7dd3fc"
        );

        barGradient.addColorStop(
            0.45,
            "#2ee6d6"
        );

        barGradient.addColorStop(
            0.75,
            "#72f17f"
        );

        barGradient.addColorStop(
            1,
            "#f8b84e"
        );

        ctx.fillStyle =
            barGradient;

        ctx.beginPath();

        for (
            let x = 0;
            x < width;
            x++
        ) {

            // ======================================
            // LOG FREQUENCY
            // ======================================

            const freq =
                Math.pow(
                    10,
                    logMin +
                    (x / width) *
                    (
                        logMax -
                        logMin
                    )
                );

            // ======================================
            // FFT INTERPOLATION
            // ======================================

            const exactIndex =
                (
                    freq /
                    maxFreq
                ) *
                data.length;

            const i0 =
                Math.max(
                    0,
                    Math.min(
                        data.length - 1,
                        Math.floor(
                            exactIndex
                        )
                    )
                );

            const i1 =
                Math.min(
                    i0 + 1,
                    data.length - 1
                );

            const frac =
                exactIndex - i0;

            const value =
                data[i0] *
                (1 - frac) +
                data[i1] *
                frac;

            // ======================================
            // SMOOTHING
            // ======================================

            const smooth =
                prev * 0.7 +
                value * 0.3;

            prev = smooth;

            const percent =
                smooth / 255;

            const barHeight =
                height * percent;

            const topY =
                height - barHeight;

            if (x === 0) {
                ctx.moveTo(x, topY);
            } else {
                ctx.lineTo(x, topY);
            }

            ctx.fillRect(
                x,
                topY,
                1,
                barHeight
            );

            // ======================================
            // PEAK HOLD
            // ======================================

            const peak =
                Math.max(
                    smooth,
                    peakRef.current[x] * 0.95
                );

            peakRef.current[x] =
                peak;

            const peakHeight =
                height *
                (peak / 255);

            ctx.fillStyle =
                "rgba(255,240,200,0.95)";

            ctx.fillRect(
                x,
                height - peakHeight,
                1,
                2
            );

            ctx.fillStyle =
                barGradient;
        }

        ctx.strokeStyle =
            "rgba(144,238,255,0.92)";

        ctx.lineWidth = 1.7;

        ctx.shadowBlur = 10;

        ctx.shadowColor =
            "rgba(110,230,255,0.65)";

        ctx.stroke();

        ctx.shadowBlur = 0;

        // Draw X labels last so they stay visible above spectrum bars.
        FREQ_MARKS.forEach((freq) => {

            const norm =
                (
                    Math.log10(freq) -
                    logMin
                ) /
                (
                    logMax -
                    logMin
                );

            const x =
                norm * width;

            const label =
                freq >= 1000
                    ? `${freq / 1000}k`
                    : `${freq}`;

            ctx.fillStyle =
                "rgba(8,14,24,0.82)";

            const textWidth =
                ctx.measureText(label).width;

            ctx.fillRect(
                x + 2,
                height - 16,
                textWidth + 4,
                12
            );

            ctx.fillStyle =
                "rgba(210,232,252,0.88)";

            ctx.fillText(
                label,
                x + 4,
                height - 6
            );
        });

        } catch {
            // Prevent canvas drawing errors from crashing the whole UI tree.
        }

    }, [tick]);

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <canvas
            ref={canvasRef}
            className="
                h-full
                w-full
            "
        />
    );
}
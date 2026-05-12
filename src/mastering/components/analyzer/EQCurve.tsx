import { useEffect, useRef, useState } from "react";
import type { EQBand } from "@/mastering/types/audio";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

type Props = {
    bands: EQBand[];
    setBands: React.Dispatch<React.SetStateAction<EQBand[]>>;
    disabled?: boolean;
};

export default function EQCurve({
    bands,
    setBands,
    disabled = false,
}: Props) {

    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const [dragIndex, setDragIndex] =
        useState<number | null>(null);

    const [hoverIndex, setHoverIndex] =
        useState<number | null>(null);

    // =====================================================
    // DRAW
    // =====================================================

    useEffect(() => {

        let raf = 0;

        const draw = () => {

            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const rect =
                canvas.getBoundingClientRect();

            const dpr =
                window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const width = rect.width;
            const height = rect.height;

            ctx.clearRect(0, 0, width, height);

            // =====================================================
            // SCALE
            // =====================================================

            const minFreq = 20;
            const maxFreq = 20000;

            const logMin = Math.log10(minFreq);
            const logMax = Math.log10(maxFreq);

            // =====================================================
            // BACKGROUND
            // =====================================================

            const bg =
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    height
                );

            bg.addColorStop(0, "#050505");
            bg.addColorStop(1, "#000000");

            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, width, height);

            // =====================================================
            // GRID
            // =====================================================

            ctx.strokeStyle =
                "rgba(255,255,255,0.06)";

            ctx.lineWidth = 1;

            ctx.fillStyle =
                "rgba(255,255,255,0.45)";

            ctx.font = "10px monospace";

            // dB lines
            const dbLevels = [-12, -6, 0, 6, 12];

            dbLevels.forEach((db) => {

                const y =
                    height / 2 - db * 4;

                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();

                ctx.fillText(
                    `${db > 0 ? "+" : ""}${db}`,
                    6,
                    y - 4
                );
            });

            // freq lines
            const freqMarks = [
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

            freqMarks.forEach((freq) => {

                const norm =
                    (Math.log10(freq) - logMin) /
                    (logMax - logMin);

                const x = norm * width;

                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();

                const label =
                    freq >= 1000
                        ? `${freq / 1000}k`
                        : `${freq}`;

                ctx.fillText(
                    label,
                    x + 4,
                    height - 8
                );
            });

            // =====================================================
            // SPECTRUM OVERLAY
            // =====================================================

            const analyser =
                audioEngine.analyser;

            const fft =
                new Float32Array(
                    analyser.frequencyBinCount
                );

            analyser.getFloatFrequencyData(fft);

            ctx.beginPath();

            for (
                let i = 0;
                i < fft.length;
                i++
            ) {

                const freq =
                    (i / fft.length) *
                    (audioEngine.audioContext.sampleRate / 2);

                if (freq < 20) continue;

                const normX =
                    (Math.log10(freq) - logMin) /
                    (logMax - logMin);

                const x =
                    normX * width;

                // normalize dB
                const db =
                    fft[i];

                const normalized =
                    (db + 100) / 100;

                const y =
                    height -
                    normalized * height * 0.9;

                if (i === 0)
                    ctx.moveTo(x, y);
                else
                    ctx.lineTo(x, y);
            }

            // fill
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            const spectrumGradient =
                ctx.createLinearGradient(
                    0,
                    0,
                    0,
                    height
                );

            spectrumGradient.addColorStop(
                0,
                "rgba(34,197,94,0.30)"
            );

            spectrumGradient.addColorStop(
                1,
                "rgba(34,197,94,0.02)"
            );

            ctx.fillStyle =
                spectrumGradient;

            ctx.fill();

            // line
            ctx.beginPath();

            for (
                let i = 0;
                i < fft.length;
                i++
            ) {

                const freq =
                    (i / fft.length) *
                    (audioEngine.audioContext.sampleRate / 2);

                if (freq < 20) continue;

                const normX =
                    (Math.log10(freq) - logMin) /
                    (logMax - logMin);

                const x =
                    normX * width;

                const db =
                    fft[i];

                const normalized =
                    (db + 100) / 100;

                const y =
                    height -
                    normalized * height * 0.9;

                if (i === 0)
                    ctx.moveTo(x, y);
                else
                    ctx.lineTo(x, y);
            }

            ctx.strokeStyle =
                "rgba(132,255,180,0.35)";

            ctx.lineWidth = 1;

            ctx.stroke();

            // =====================================================
            // EQ CURVE
            // =====================================================

            const points: {
                x: number;
                y: number;
            }[] = [];

            for (
                let x = 0;
                x < width;
                x++
            ) {

                const freq =
                    Math.pow(
                        10,
                        logMin +
                        (x / width) *
                        (logMax - logMin)
                    );

                let totalGain = 0;

                bands.forEach((band) => {

                    const distance =
                        Math.log2(
                            freq / band.freq
                        );

                    const influence =
                        Math.exp(
                            -distance *
                            distance *
                            band.Q
                        );

                    totalGain +=
                        band.gain * influence;
                });

                const y =
                    height / 2 - totalGain * 4;

                points.push({ x, y });
            }

            // glow
            ctx.beginPath();

            points.forEach((p, i) => {
                if (i === 0)
                    ctx.moveTo(p.x, p.y);
                else
                    ctx.lineTo(p.x, p.y);
            });

            ctx.strokeStyle =
                "rgba(34,197,94,0.25)";

            ctx.lineWidth = 10;

            ctx.shadowBlur = 20;
            ctx.shadowColor = "#22c55e";

            ctx.stroke();

            // main curve
            ctx.beginPath();

            points.forEach((p, i) => {
                if (i === 0)
                    ctx.moveTo(p.x, p.y);
                else
                    ctx.lineTo(p.x, p.y);
            });

            ctx.strokeStyle =
                "#22c55e";

            ctx.lineWidth = 2;

            ctx.shadowBlur = 0;

            ctx.stroke();

            // =====================================================
            // NODES
            // =====================================================

            bands.forEach((band, i) => {

                const norm =
                    (Math.log10(band.freq) - logMin) /
                    (logMax - logMin);

                const x =
                    norm * width;

                const y =
                    height / 2 -
                    band.gain * 4;

                const active =
                    i === dragIndex ||
                    i === hoverIndex;

                // glow
                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    active ? 14 : 10,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    active
                        ? "rgba(34,197,94,0.25)"
                        : "rgba(255,255,255,0.08)";

                ctx.fill();

                // node
                ctx.beginPath();

                ctx.arc(
                    x,
                    y,
                    active ? 7 : 6,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    active
                        ? "#22c55e"
                        : "#ffffff";

                ctx.fill();

                // tooltip
                if (active) {

                    const label =
                        `${Math.round(band.freq)} Hz\n${band.gain.toFixed(1)} dB`;

                    ctx.fillStyle =
                        "rgba(0,0,0,0.9)";

                    ctx.fillRect(
                        x - 34,
                        y - 48,
                        68,
                        34
                    );

                    ctx.strokeStyle =
                        "rgba(34,197,94,0.4)";

                    ctx.strokeRect(
                        x - 34,
                        y - 48,
                        68,
                        34
                    );

                    ctx.fillStyle =
                        "#ffffff";

                    ctx.font =
                        "10px monospace";

                    const lines =
                        label.split("\n");

                    ctx.fillText(
                        lines[0],
                        x - 28,
                        y - 32
                    );

                    ctx.fillText(
                        lines[1],
                        x - 28,
                        y - 18
                    );
                }
            });

            raf =
                requestAnimationFrame(draw);
        };

        draw();

        return () =>
            cancelAnimationFrame(raf);

    }, [
        bands,
        dragIndex,
        hoverIndex
    ]);

    // =====================================================
    // HELPERS
    // =====================================================

    const getMousePos = (
        e: React.MouseEvent
    ) => {

        const rect =
            canvasRef.current!
                .getBoundingClientRect();

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            width: rect.width,
            height: rect.height,
        };
    };

    const getBandPosition = (
        band: EQBand,
        width: number,
        height: number
    ) => {

        const minFreq = 20;
        const maxFreq = 20000;

        const logMin =
            Math.log10(minFreq);

        const logMax =
            Math.log10(maxFreq);

        const norm =
            (Math.log10(band.freq) - logMin) /
            (logMax - logMin);

        return {
            x: norm * width,
            y:
                height / 2 -
                band.gain * 4,
        };
    };

    // =====================================================
    // MOUSE DOWN
    // =====================================================

    const handleMouseDown = (
        e: React.MouseEvent
    ) => {
        if (disabled) return;

        const {
            x,
            y,
            width,
            height
        } = getMousePos(e);

        bands.forEach((band, i) => {

            const pos =
                getBandPosition(
                    band,
                    width,
                    height
                );

            const dist =
                Math.hypot(
                    pos.x - x,
                    pos.y - y
                );

            if (dist < 12) {
                setDragIndex(i);
            }
        });
    };

    // =====================================================
    // MOUSE MOVE
    // =====================================================

    const handleMouseMove = (
        e: React.MouseEvent
    ) => {
        if (disabled) {
            setHoverIndex(null);
            setDragIndex(null);
            return;
        }

        const {
            x,
            y,
            width,
            height
        } = getMousePos(e);

        // hover
        let hovered:
            number | null = null;

        bands.forEach((band, i) => {

            const pos =
                getBandPosition(
                    band,
                    width,
                    height
                );

            const dist =
                Math.hypot(
                    pos.x - x,
                    pos.y - y
                );

            if (dist < 12) {
                hovered = i;
            }
        });

        setHoverIndex(hovered);

        // drag
        if (dragIndex === null)
            return;

        const gain =
            (height / 2 - y) / 4;

        setBands((prev) => {

            const next = [...prev];

            next[dragIndex] = {
                ...next[dragIndex],
                gain: Math.max(
                    -12,
                    Math.min(12, gain)
                ),
            };

            return next;
        });
    };

    // =====================================================
    // RELEASE
    // =====================================================

    const handleMouseUp = () => {
        setDragIndex(null);
    };

    return (
        <canvas
            ref={canvasRef}
            aria-disabled={disabled}
            className={`w-full h-full rounded-2xl ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
}

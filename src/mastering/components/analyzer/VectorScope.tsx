import { useEffect, useRef } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export default function VectorScope() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf = 0;

        const draw = () => {
            const { dataL, dataR, size } = audioEngine.getStereoFrame();

            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const width = rect.width;
            const height = rect.height;

            const centerX = width / 2;
            const centerY = height / 2;

            // ===== FADE (TRAIL DECAY) =====
            ctx.fillStyle = "rgba(0,0,0,0.08)";
            ctx.fillRect(0, 0, width, height);

            // ===== ADDITIVE GLOW MODE =====
            ctx.globalCompositeOperation = "lighter";

            for (let i = 0; i < size; i++) {
                const L = dataL[i];
                const R = dataR[i];

                const x = centerX + L * centerX;
                const y = centerY - R * centerY;

                // intensity berdasarkan amplitude
                const amp = Math.abs(L) + Math.abs(R);

                // glow radius
                const sizePx = 1 + amp * 2;

                ctx.fillStyle = "rgba(34,197,94,0.25)";
                ctx.beginPath();
                ctx.arc(x, y, sizePx, 0, Math.PI * 2);
                ctx.fill();
            }

            // reset blending biar tidak ganggu draw berikutnya
            ctx.globalCompositeOperation = "source-over";

            raf = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="h-46 rounded-2xl border border-zinc-800 bg-black/50 p-3">
            <p className="text-xs text-zinc-400">Stereo Scope</p>
            <canvas
                ref={canvasRef}
                className="w-full h-full rounded-xl bg-black"
            />
        </div>
    );
}
import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useTruePeak() {
    const [truePeak, setTruePeak] = useState(-60);

    useEffect(() => {
        const analyser = audioEngine.analyser;

        const buffer = new Float32Array(analyser.fftSize);

        let raf: number;

        const update = () => {
            analyser.getFloatTimeDomainData(buffer);

            let max = 0;

            // ===== BASIC PEAK =====
            for (let i = 0; i < buffer.length; i++) {
                const v = Math.abs(buffer[i]);
                if (v > max) max = v;
            }

            // ===== SIMPLE OVERSAMPLING (linear interp) =====
            for (let i = 0; i < buffer.length - 1; i++) {
                const a = buffer[i];
                const b = buffer[i + 1];

                // 4x oversample
                for (let t = 0.25; t < 1; t += 0.25) {
                    const interp = a + (b - a) * t;
                    const v = Math.abs(interp);
                    if (v > max) max = v;
                }
            }

            const db = 20 * Math.log10(max + 1e-8);

            setTruePeak(db);

            raf = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(raf);
    }, []);

    return truePeak;
}
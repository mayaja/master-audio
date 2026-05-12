import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useLufsMeter() {
    const [momentary, setMomentary] = useState(-60);
    const [shortTerm, setShortTerm] = useState(-60);

    useEffect(() => {
        const analyser = audioEngine.kwAnalyser;

        const buffer = new Float32Array(analyser.fftSize);
        const history: Array<{ t: number; v: number }> = [];

        let raf: number;

        const update = () => {
            const now = performance.now();

            analyser.getFloatTimeDomainData(buffer);

            let sum = 0;
            for (let i = 0; i < buffer.length; i++) {
                sum += buffer[i] * buffer[i];
            }

            const rms = Math.sqrt(sum / buffer.length);
            const lufs = 20 * Math.log10(rms + 1e-8) - 0.691;

            history.push({ t: now, v: lufs });

            while (history.length > 0 && now - history[0].t > 3000) {
                history.shift();
            }

            const momentaryWindow = history.filter((entry) => now - entry.t <= 400);
            const shortWindow = history;

            const getAvg = (items: Array<{ t: number; v: number }>) => {
                if (items.length === 0) {
                    return -60;
                }

                const total = items.reduce((acc, item) => acc + item.v, 0);
                return total / items.length;
            };

            setMomentary(Math.max(-60, getAvg(momentaryWindow)));
            setShortTerm(Math.max(-60, getAvg(shortWindow)));

            raf = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(raf);
    }, []);

    return { momentary, shortTerm };
}
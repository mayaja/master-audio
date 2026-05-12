import { useEffect, useRef, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useIntegratedLufs() {
    const [integrated, setIntegrated] = useState(-60);

    const energiesRef = useRef<number[]>([]);

    useEffect(() => {
        const analyser = audioEngine.kwAnalyser;

        const buffer = new Float32Array(analyser.fftSize);

        let raf: number;

        const update = () => {
            analyser.getFloatTimeDomainData(buffer);

            let sum = 0;
            for (let i = 0; i < buffer.length; i++) {
                const v = buffer[i];
                sum += v * v;
            }

            const rms = Math.sqrt(sum / buffer.length);
            const lufsBlock = 20 * Math.log10(rms + 1e-8) - 0.691;

            if (lufsBlock > -70) {
                energiesRef.current.push(rms * rms);

                const energies = energiesRef.current;
                const avgEnergy = energies.reduce((acc, value) => acc + value, 0) / energies.length;
                const integratedRaw = 10 * Math.log10(avgEnergy + 1e-12) - 0.691;

                const gated = energies.filter((energy) => {
                    const blockLufs = 10 * Math.log10(energy + 1e-12) - 0.691;
                    return blockLufs >= integratedRaw - 10;
                });

                const gatedEnergy = gated.length > 0
                    ? gated.reduce((acc, value) => acc + value, 0) / gated.length
                    : avgEnergy;

                const integratedValue = 10 * Math.log10(gatedEnergy + 1e-12) - 0.691;

                setIntegrated(Math.max(-60, integratedValue));
            }

            raf = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(raf);
    }, []);

    return integrated;
}
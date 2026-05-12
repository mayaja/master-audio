import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import { analyzeTonalBalance } from "@/mastering/utils/analyzeTonalBalance";

export function useTonalGuidance(
    tonalTarget: number[],
) {

    const [warnings, setWarnings] =
        useState<
            {
                text: string;
                severity:
                "good" |
                "warn";
            }[]
        >([]);

    useEffect(() => {

        let raf = 0;

        const analyser =
            audioEngine.analyser;

        const data =
            new Uint8Array(
                analyser.frequencyBinCount
            );

        const loop = () => {

            analyser
                .getByteFrequencyData(data);

            const result =
                analyzeTonalBalance(
                    data,
                    tonalTarget,
                );

            setWarnings(result);

            raf =
                requestAnimationFrame(loop);
        };

        loop();

        return () =>
            cancelAnimationFrame(raf);

    }, [tonalTarget]);

    return warnings;
}
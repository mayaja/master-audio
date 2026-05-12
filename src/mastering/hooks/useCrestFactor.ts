import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";
import { useVisualClock } from "./useVisualClock";

export function useCrestFactor() {

    const [value, setValue] = useState(0);
    const tick = useVisualClock(45);

    useEffect(() => {

        // let raf = 0;

        // const loop = () => {

        //     setValue((prev) => {

        //         const next =
        //             audioEngine.getCrestFactor();

        //         // attack/release smoothing
        //         return prev * 0.85 + next * 0.15;
        //     });

        //     raf =
        //         requestAnimationFrame(loop);
        // };

        // loop();

        // return () =>
        //     cancelAnimationFrame(raf);

        setValue((prev) => {

            const next =
                audioEngine.getCrestFactor();

            return prev * 0.65 + next * 0.35;
        });

    }, [tick]);

    return value;
}
import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useStereoMeter() {
    const [correlation, setCorrelation] = useState(0);
    const [clipping, setClipping] = useState(false);

    useEffect(() => {
        let raf = 0;

        const update = () => {
            setCorrelation(audioEngine.getStereoCorrelation());
            setClipping(audioEngine.getIsClipping());
            raf = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(raf);
    }, []);

    return { correlation, clipping };
}
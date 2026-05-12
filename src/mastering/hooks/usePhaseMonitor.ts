import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function usePhaseMonitor() {
    const [warning, setWarning] = useState<"good" | "risky" | "bad">("good");

    useEffect(() => {
        let raf = 0;

        const update = () => {
            setWarning(audioEngine.getPhaseWarning());
            raf = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(raf);
    }, []);

    return { warning };
}
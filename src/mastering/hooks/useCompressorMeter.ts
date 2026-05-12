import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useCompressorMeter() {
    const [gr, setGr] = useState(0);

    useEffect(() => {
        let raf: number;

        const update = () => {
            const comp = audioEngine.compressor;

            // approximate GR (tidak ada API langsung)
            const reduction = comp.reduction || 0;

            setGr(-reduction); // positive value

            raf = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(raf);
    }, []);

    return gr;
}
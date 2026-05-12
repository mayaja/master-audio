import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useSpectrum() {
    const [data, setData] = useState<Uint8Array>(
        new Uint8Array(0)
    );

    useEffect(() => {
        const analyser = audioEngine.analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let raf: number;

        const update = () => {
            analyser.getByteFrequencyData(dataArray);
            setData(new Uint8Array(dataArray)); // copy
            raf = requestAnimationFrame(update);
        };

        update();

        return () => cancelAnimationFrame(raf);
    }, []);

    return data;
}
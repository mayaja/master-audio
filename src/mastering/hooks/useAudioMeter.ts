import { useEffect, useState } from "react";
import { audioEngine } from "@/mastering/audio/engine/audioEngine";

export function useAudioMeter() {
    const [leftDb, setLeftDb] =
        useState(-60);

    const [rightDb, setRightDb] =
        useState(-60);

    useEffect(() => {
        let animationFrame: number;

        const updateMeters = () => {
            const next =
                audioEngine.getStereoRmsDb();

            setLeftDb(next.leftDb);
            setRightDb(next.rightDb);

            animationFrame =
                requestAnimationFrame(
                    updateMeters
                );
        };

        updateMeters();

        return () => {
            cancelAnimationFrame(
                animationFrame
            );
        };
    }, []);

    return {
        leftDb,
        rightDb,
    };
}
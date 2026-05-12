import { useEffect, useState } from "react";

export function useVisualClock(
    fps = 30
) {

    const [tick, setTick] =
        useState(0);

    useEffect(() => {

        let frame = 0;

        let last =
            performance.now();

        let raf = 0;

        const interval =
            1000 / fps;

        const loop = (
            now: number
        ) => {

            if (
                now - last >= interval
            ) {

                frame++;

                setTick(frame);

                last = now;
            }

            raf =
                requestAnimationFrame(
                    loop
                );
        };

        raf =
            requestAnimationFrame(
                loop
            );

        return () =>
            cancelAnimationFrame(
                raf
            );

    }, [fps]);

    return tick;
}
import { useEffect, useRef, useState } from "react";

type Warning = {
    text: string;
    severity: "good" | "warn" | "bad";
};

type Input = {
    crest: number;
    shortTerm: number;
    correlation: number;
    peakDb: number;
};

export function useMasterCheck({
    crest,
    shortTerm,
    correlation,
    peakDb,
}: Input) {

    const [warnings, setWarnings] =
        useState<Warning[]>([]);

    // hold timer
    const holdRef =
        useRef<number>(0);

    useEffect(() => {

        const next: Warning[] = [];

        // =====================================
        // CREST FACTOR
        // =====================================

        if (crest < 5) {

            next.push({
                text:
                    "Over-limited dynamics",
                severity: "bad",
            });

        } else if (crest < 7) {

            next.push({
                text:
                    "Very aggressive limiting",
                severity: "warn",
            });
        }

        // =====================================
        // LOUDNESS
        // =====================================

        // hysteresis:
        // warn in at -9
        // clear only below -10

        if (shortTerm > -7) {

            next.push({
                text:
                    "Extremely loud master",
                severity: "bad",
            });

        } else if (shortTerm > -9) {

            next.push({
                text:
                    "Very loud streaming level",
                severity: "warn",
            });
        }

        // =====================================
        // STEREO
        // =====================================

        if (correlation < -0.1) {

            next.push({
                text:
                    "Mono compatibility risk",
                severity: "bad",
            });

        } else if (correlation < 0.15) {

            next.push({
                text:
                    "Wide stereo image",
                severity: "warn",
            });
        }

        // =====================================
        // TRUE PEAK
        // =====================================

        // hysteresis:
        // warn above -1
        // clear below -1.5

        if (peakDb > -1) {

            next.push({
                text:
                    "True peak near clipping",
                severity: "warn",
            });
        }

        // =====================================
        // HOLD LOGIC
        // =====================================

        const hasProblem =
            next.some(
                (w) => w.severity !== "good"
            );

        const now =
            performance.now();

        // update immediately if warning exists
        if (hasProblem) {

            holdRef.current = now;

            setWarnings(next);

            return;
        }

        // keep previous warning
        // for 1.5 sec

        const holdTime =
            1500;

        if (
            now - holdRef.current <
            holdTime
        ) {
            return;
        }

        // finally clear to healthy

        setWarnings([
            {
                text:
                    "Master looks healthy",
                severity: "good",
            },
        ]);

    }, [
        crest,
        shortTerm,
        correlation,
        peakDb,
    ]);

    return warnings;
}
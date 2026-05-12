import { audioEngine } from "@/mastering/audio/engine/audioEngine";

type Result = {
    text: string;
    severity: "good" | "warn";
    score: number;
};

function freqToBin(
    freq: number,
    sampleRate: number,
    fftSize: number,
) {

    return Math.floor(
        (freq / (sampleRate / 2)) *
        (fftSize / 2)
    );
}

export function analyzeTonalBalance(
    data: Uint8Array,
    tonalTarget: number[],
) {

    const avg = (
        start: number,
        end: number,
    ) => {

        let sum = 0;

        for (let i = start; i < end; i++) {
            sum += data[i];
        }

        return sum / (end - start);
    };

    // =====================================================
    // REAL ANALYSER VALUES
    // =====================================================

    const sampleRate =
        audioEngine
            .audioContext
            .sampleRate;

    const fftSize =
        audioEngine
            .analyser
            .fftSize;

    // =====================================================
    // REAL FREQUENCY MAPPING
    // =====================================================

    const zones = {

        sub:
            avg(
                freqToBin(
                    20,
                    sampleRate,
                    fftSize
                ),
                freqToBin(
                    60,
                    sampleRate,
                    fftSize
                )
            ) / 255,

        bass:
            avg(
                freqToBin(
                    60,
                    sampleRate,
                    fftSize
                ),
                freqToBin(
                    250,
                    sampleRate,
                    fftSize
                )
            ) / 255,

        lowMid:
            avg(
                freqToBin(
                    250,
                    sampleRate,
                    fftSize
                ),
                freqToBin(
                    500,
                    sampleRate,
                    fftSize
                )
            ) / 255,

        mids:
            avg(
                freqToBin(
                    500,
                    sampleRate,
                    fftSize
                ),
                freqToBin(
                    2000,
                    sampleRate,
                    fftSize
                )
            ) / 255,

        presence:
            avg(
                freqToBin(
                    2000,
                    sampleRate,
                    fftSize
                ),
                freqToBin(
                    6000,
                    sampleRate,
                    fftSize
                )
            ) / 255,

        highs:
            avg(
                freqToBin(
                    6000,
                    sampleRate,
                    fftSize
                ),
                freqToBin(
                    20000,
                    sampleRate,
                    fftSize
                )
            ) / 255,
    };

    // =====================================================
    // TARGET MAPPING
    // =====================================================

    const targets = {

        sub:
            tonalTarget[0],

        bass:
            (
                tonalTarget[1] +
                tonalTarget[2]
            ) * 0.5,

        lowMid:
            tonalTarget[3],

        mids:
            (
                tonalTarget[4] +
                tonalTarget[5]
            ) * 0.5,

        presence:
            (
                tonalTarget[6] +
                tonalTarget[7]
            ) * 0.5,

        highs:
            (
                tonalTarget[8] +
                tonalTarget[9]
            ) * 0.5,
    };

    const warnings: Result[] = [];

    // =====================================================
    // DELTA THRESHOLD
    // =====================================================

    const over = 0.12;
    const under = -0.12;

    // =====================================================
    // SUB
    // =====================================================

    const subDelta =
        zones.sub - targets.sub;

    if (subDelta > over) {

        warnings.push({
            text:
                "Excessive sub bass",
            severity: "warn",
            score: Math.abs(subDelta),
        });
    }

    // =====================================================
    // BASS
    // =====================================================

    const bassDelta =
        zones.bass - targets.bass;

    if (bassDelta > over) {

        warnings.push({
            text:
                "Heavy bass energy",
            severity: "warn",
            score: Math.abs(bassDelta),
        });

    } else if (bassDelta < under) {

        warnings.push({
            text:
                "Thin bass balance",
            severity: "warn",
            score: Math.abs(bassDelta),
        });
    }

    // =====================================================
    // LOW MID
    // =====================================================

    const lowMidDelta =
        zones.lowMid -
        targets.lowMid;

    if (lowMidDelta > over) {

        warnings.push({
            text:
                "Low-mid muddiness",
            severity: "warn",
            score: Math.abs(lowMidDelta),
        });

    } else if (lowMidDelta < under) {

        warnings.push({
            text:
                "Scooped low mids",
            severity: "warn",
            score: Math.abs(lowMidDelta),
        });
    }

    // =====================================================
    // PRESENCE
    // =====================================================

    const presenceDelta =
        zones.presence -
        targets.presence;

    if (presenceDelta > over) {

        warnings.push({
            text:
                "Aggressive upper mids",
            severity: "warn",
            score: Math.abs(presenceDelta),
        });

    } else if (
        presenceDelta < under
    ) {

        warnings.push({
            text:
                "Weak vocal presence",
            severity: "warn",
            score: Math.abs(presenceDelta),
        });
    }

    // =====================================================
    // HIGHS
    // =====================================================

    const highsDelta =
        zones.highs -
        targets.highs;

    if (highsDelta > over) {

        warnings.push({
            text:
                "Harsh high-end",
            severity: "warn",
            score: Math.abs(highsDelta),
        });

    } else if (highsDelta < under) {

        warnings.push({
            text:
                "Dark top-end",
            severity: "warn",
            score: Math.abs(highsDelta),
        });
    }

    // =====================================================
    // HEALTHY
    // =====================================================

    if (warnings.length === 0) {

        warnings.push({
            text:
                "Balanced tonal profile",
            severity: "good",
            score: 0,
        });
    }

    // =====================================================
    // PRIORITY SORT
    // =====================================================

    warnings.sort(
        (a, b) =>
            b.score - a.score
    );

    // =====================================================
    // LIMIT UI OVERLOAD
    // =====================================================

    return warnings.slice(0, 2);
}

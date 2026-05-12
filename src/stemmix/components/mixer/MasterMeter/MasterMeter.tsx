import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    mixerEngine,
} from '@/stemmix/features/audio/mixer'

import {
    useAudioStore,
} from '@/stemmix/stores/useAudioStore'

export default function MasterMeter() {
    const [
        integratedLufs,
        setIntegratedLufs,
    ] = useState<number | null>(null)

    const [
        peakDb,
        setPeakDb,
    ] = useState<number | null>(null)

    const isPlaying =
        useAudioStore(
            (state) => state.isPlaying,
        )

    const isSeparating =
        useAudioStore(
            (state) => state.isSeparating,
        )

    const leftRef =
        useRef<HTMLDivElement | null>(
            null,
        )

    const rightRef =
        useRef<HTMLDivElement | null>(
            null,
        )

    useEffect(() => {
        if (!isPlaying || isSeparating) {
            if (leftRef.current) {
                leftRef.current.style.transform =
                    'scaleY(0.04)'
            }

            if (rightRef.current) {
                rightRef.current.style.transform =
                    'scaleY(0.04)'
            }

            return
        }

        let frame = 0
        let lastUpdate = 0

        let leftSmooth = 0
        let rightSmooth = 0

        let leftPeak = 0
        let rightPeak = 0

        function update(time: number) {
            if (time - lastUpdate < 33) {
                frame =
                    requestAnimationFrame(
                        update,
                    )

                return
            }

            lastUpdate = time

            const meter =
                mixerEngine.getMasterMeterLevel()

            setIntegratedLufs(
                meter.integratedLufs,
            )

            setPeakDb(
                Number.isFinite(meter.peakDb)
                    ? meter.peakDb
                    : null,
            )

            // LEFT
            if (meter.left > leftSmooth) {
                leftSmooth +=
                    (meter.left -
                        leftSmooth) *
                    0.45
            } else {
                leftSmooth +=
                    (meter.left -
                        leftSmooth) *
                    0.08
            }

            // RIGHT
            if (
                meter.right >
                rightSmooth
            ) {
                rightSmooth +=
                    (meter.right -
                        rightSmooth) *
                    0.45
            } else {
                rightSmooth +=
                    (meter.right -
                        rightSmooth) *
                    0.08
            }

            leftPeak = Math.max(
                leftPeak * 0.96,
                leftSmooth,
            )

            rightPeak = Math.max(
                rightPeak * 0.96,
                rightSmooth,
            )

            if (leftRef.current) {
                leftRef.current.style.transform =
                    `scaleY(${Math.max(
                        0.04,
                        leftPeak,
                    )})`
            }

            if (rightRef.current) {
                rightRef.current.style.transform =
                    `scaleY(${Math.max(
                        0.04,
                        rightPeak,
                    )})`
            }

            frame =
                requestAnimationFrame(
                    update,
                )
        }

        frame =
            requestAnimationFrame(
                update,
            )

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [isPlaying, isSeparating])

    const visibleIntegratedLufs =
        isPlaying && !isSeparating
            ? integratedLufs
            : null

    const visiblePeakDb =
        isPlaying && !isSeparating
            ? peakDb
            : null

    const formattedLufs =
        visibleIntegratedLufs === null
            ? '--'
            : visibleIntegratedLufs.toFixed(1)

    const formattedPeak =
        visiblePeakDb === null
            ? '-- dB'
            : `${Math.min(
                0,
                visiblePeakDb,
            ).toFixed(1)} dB`

    return (
        <div className="relative flex flex-col overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-[#111827] via-[#0d1320] to-[#090d18] p-3 shadow-[0_10px_35px_rgba(0,0,0,0.45)]">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.06),transparent_50%)]" />

            {/* Header */}
            <div className="relative mb-3 flex items-center justify-between">
                <div className="flex h-8 items-center rounded-lg border border-emerald-500/10 bg-emerald-500/10 px-2 text-[9px] font-bold tracking-[0.16em] text-emerald-300">
                    MASTER
                </div>
            </div>

            <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse" />

                <span className="text-[8px] uppercase tracking-[0.16em] text-zinc-600">
                    Live
                </span>
            </div>
            {/* Meter */}
            <div className="relative flex flex-1 items-end justify-center gap-3">


                {/* LEFT */}
                <div className="relative flex h-[240px] w-[12px] items-end overflow-hidden rounded-full border border-white/[0.05] bg-black/40 p-[1px]">

                    <div
                        ref={leftRef}
                        className="w-full origin-bottom rounded-full bg-gradient-to-t from-emerald-400 via-yellow-300 to-red-500 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                        style={{
                            height: '100%',
                            transform:
                                'scaleY(0.04)',
                        }}
                    />
                </div>

                {/* RIGHT */}
                <div className="relative flex h-[240px] w-[12px] items-end overflow-hidden rounded-full border border-white/[0.05] bg-black/40 p-[1px]">

                    <div
                        ref={rightRef}
                        className="w-full origin-bottom rounded-full bg-gradient-to-t from-emerald-400 via-yellow-300 to-red-500 shadow-[0_0_16px_rgba(16,185,129,0.35)]"
                        style={{
                            height: '100%',
                            transform:
                                'scaleY(0.04)',
                        }}
                    />
                </div>

            </div>

            {/* LUFS */}
            <div className="relative mt-4 text-center">
                <div className="text-[18px] font-bold tracking-tight text-white">
                    {formattedLufs}
                </div>

                <div className="mt-1 text-[8px] uppercase tracking-[0.18em] text-zinc-600">
                    Integrated LUFS
                </div>
            </div>

            {/* Footer */}
            <div className="relative mt-3 border-t border-white/[0.04] pt-3">
                <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.18em] text-zinc-600">
                    <span>Peak</span>
                    <span>{formattedPeak}</span>
                </div>
            </div>
        </div>
    )
}

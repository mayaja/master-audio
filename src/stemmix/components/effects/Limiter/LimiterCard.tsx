import {
    useEffect,
    useState,
} from 'react'

import Tooltip from '@/stemmix/components/ui/Tooltip'
import { mixerEngine } from '@/stemmix/features/audio/mixer'
import {
    useAudioStore,
    type MasterLimiter,
} from '@/stemmix/stores/useAudioStore'

const defaultLimiter: MasterLimiter = {
    drive: 0,
    threshold: -1,
    ceiling: -1,
    release: 0.1,
}

const controls: Array<{
    key: keyof MasterLimiter
    label: string
    min: number
    max: number
    step: number
    format: (value: number) => string
    tooltip: string
}> = [
    {
        key: 'drive',
        label: 'Drive',
        min: 0,
        max: 18,
        step: 0.5,
        format: (value) => `+${value.toFixed(1)} dB`,
        tooltip: 'Pushes level into the limiter for a louder mix.',
    },
    {
        key: 'threshold',
        label: 'Threshold',
        min: -24,
        max: 0,
        step: 0.5,
        format: (value) => `${value.toFixed(1)} dB`,
        tooltip: 'The level where the limiter starts controlling master peaks.',
    },
    {
        key: 'ceiling',
        label: 'Ceiling',
        min: -6,
        max: 0,
        step: 0.1,
        format: (value) => `${value.toFixed(1)} dB`,
        tooltip: 'The maximum output level to keep the master from clipping.',
    },
    {
        key: 'release',
        label: 'Release',
        min: 0.03,
        max: 1,
        step: 0.01,
        format: (value) => `${Math.round(value * 1000)} ms`,
        tooltip: 'How quickly the limiter releases gain reduction after peaks pass.',
    },
]

function valueToRotation(
    value: number,
    min: number,
    max: number,
) {
    const normalized =
        (value - min) / (max - min)

    return -135 + normalized * 270
}

export default function LimiterCard() {
    const limiter =
        useAudioStore(
            (state) => state.masterLimiter,
        )

    const setMasterLimiter =
        useAudioStore(
            (state) => state.setMasterLimiter,
        )

    const isSeparated =
        useAudioStore(
            (state) => state.isSeparated,
        )

    const isPlaying =
        useAudioStore(
            (state) => state.isPlaying,
        )

    const [
        reduction,
        setReduction,
    ] = useState(0)

    const controlsDisabled =
        !isSeparated

    function applyLimiter(
        nextLimiter: MasterLimiter,
    ) {
        setMasterLimiter(nextLimiter)

        mixerEngine.setLimiter(nextLimiter)
    }

    function handleControlChange(
        key: keyof MasterLimiter,
        value: number,
    ) {
        if (controlsDisabled) return

        applyLimiter({
            ...limiter,
            [key]: value,
        })
    }

    function handleReset() {
        if (controlsDisabled) return

        applyLimiter(defaultLimiter)
    }

    useEffect(() => {
        if (!isPlaying) {
            return
        }

        let frame = 0
        let lastUpdate = 0

        function update(time: number) {
            if (time - lastUpdate >= 80) {
                lastUpdate = time

                setReduction(
                    mixerEngine.getLimiterReduction(),
                )
            }

            frame =
                requestAnimationFrame(update)
        }

        frame =
            requestAnimationFrame(update)

        return () => {
            cancelAnimationFrame(frame)
        }
    }, [isPlaying])

    const displayedReduction =
        isPlaying
            ? reduction
            : 0

    const reductionWidth =
        Math.min(
            100,
            (displayedReduction / 18) * 100,
        )

    return (
        <div className="rounded-[18px] border border-white/[0.06] bg-gradient-to-b from-[#101726] to-[#0a0f1a] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
            <div className="mb-5">
                <h3 className="text-lg font-semibold text-white">
                    Limiter
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                    Master peak control & output safety
                </p>
            </div>

            <div className="mb-4 rounded-xl border border-white/[0.04] bg-black/20 p-3">
                <div className="mb-3 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    <span>Gain Reduction</span>
                    <span className="text-cyan-200">
                        -{displayedReduction.toFixed(1)} dB
                    </span>
                </div>

                <div className="relative h-3 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                        className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-red-400 via-amber-300 to-cyan-300"
                        style={{
                            width: `${reductionWidth}%`,
                        }}
                    />
                </div>
            </div>

            <div
                className={[
                    'flex items-stretch gap-3 overflow-visible transition-opacity',
                    controlsDisabled
                        ? 'opacity-55'
                        : '',
                ].join(' ')}
            >
                {controls.map((control) => (
                    <Tooltip
                        key={control.key}
                        content={control.tooltip}
                        className="flex min-w-[86px] flex-1"
                    >
                    <label className="flex w-full flex-col items-center rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                        <div className="relative flex h-[58px] w-[58px] items-center justify-center">
                            <input
                                type="range"
                                min={control.min}
                                max={control.max}
                                step={control.step}
                                value={limiter[control.key]}
                                disabled={controlsDisabled}
                                onChange={(event) =>
                                    handleControlChange(
                                        control.key,
                                        Number(
                                            event.target.value,
                                        ),
                                    )
                                }
                                className="absolute inset-0 z-20 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                            />

                            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)]" />

                            <div className="absolute inset-0 rounded-full border border-white/[0.08]" />

                            <div className="relative flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/[0.06] bg-gradient-to-b from-[#1a2333] via-[#111827] to-[#070b14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_6px_16px_rgba(0,0,0,0.5)]">
                                <div className="absolute inset-x-2 top-[5px] h-[9px] rounded-full bg-white/[0.04] blur-[2px]" />

                                <div className="absolute h-[4px] w-[4px] rounded-full bg-white/[0.14]" />

                                <div
                                    className="absolute bottom-1/2 left-1/2 h-[17px] w-[2.5px] origin-bottom rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.5)]"
                                    style={{
                                        transform: `
                                            translateX(-50%)
                                            rotate(${valueToRotation(
                                            limiter[
                                            control.key
                                            ],
                                            control.min,
                                            control.max,
                                        )}deg)
                                        `,
                                    }}
                                />
                            </div>

                            <div className="pointer-events-none absolute top-[1px] h-[5px] w-[1px] rounded-full bg-white/30" />
                        </div>

                        <div className="mt-3 text-center leading-none">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                {control.label}
                            </div>

                            <div className="mt-1.5 text-[10px] font-semibold tabular-nums text-cyan-200">
                                {control.format(
                                    limiter[
                                    control.key
                                    ],
                                )}
                            </div>
                        </div>
                    </label>
                    </Tooltip>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
                <span className="text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    {isSeparated
                        ? 'Master Limiter'
                        : 'Available after split stems'}
                </span>

                <Tooltip
                    content="Reset the master limiter to the safe default settings."
                >
                    <button
                        onClick={handleReset}
                        disabled={controlsDisabled}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400 transition-all hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Reset
                    </button>
                </Tooltip>
            </div>
        </div>
    )
}

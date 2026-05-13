import { getStemsForMode } from '@/stemmix/data/stems'
import Tooltip from '@/stemmix/components/ui/Tooltip'
import { mixerEngine } from '@/stemmix/features/audio/mixer'
import {
    useAudioStore,
    type TrackReverb,
} from '@/stemmix/stores/useAudioStore'

const defaultReverb: TrackReverb = {
    mix: 0,
    decay: 2.4,
    size: 0.65,
    damping: 0.48,
    preDelay: 0.022,
    width: 0.88,
}

const controls: Array<{
    key: keyof TrackReverb
    label: string
    min: number
    max: number
    step: number
    format: (value: number) => string
    tooltip: string
}> = [
    {
        key: 'mix',
        label: 'Mix',
        min: 0,
        max: 1,
        step: 0.01,
        format: (value) => `${Math.round(value * 100)}%`,
        tooltip: 'The amount of reverb signal blended into the selected stem.',
    },
    {
        key: 'decay',
        label: 'Decay',
        min: 0.2,
        max: 8,
        step: 0.1,
        format: (value) => `${value.toFixed(1)} s`,
        tooltip: 'How long the reverb tail lasts before fading out.',
    },
    {
        key: 'size',
        label: 'Size',
        min: 0,
        max: 1,
        step: 0.01,
        format: (value) => `${Math.round(value * 100)}%`,
        tooltip: 'The size of the virtual reverb space.',
    },
    {
        key: 'damping',
        label: 'Damping',
        min: 0,
        max: 1,
        step: 0.01,
        format: (value) => `${Math.round(value * 100)}%`,
        tooltip: 'Reduces high frequencies in the reverb tail for a softer sound.',
    },
    {
        key: 'preDelay',
        label: 'PreDelay',
        min: 0,
        max: 0.12,
        step: 0.001,
        format: (value) => `${Math.round(value * 1000)} ms`,
        tooltip: 'A short delay before the reverb starts after the dry signal.',
    },
    {
        key: 'width',
        label: 'Width',
        min: 0,
        max: 1,
        step: 0.01,
        format: (value) => `${Math.round(value * 100)}%`,
        tooltip: 'The stereo width of the reverb on the selected stem.',
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

export default function ReverbCard() {
    const selectedTrackId =
        useAudioStore(
            (state) =>
                state.selectedReverbTrackId,
        )
    const stemMode =
        useAudioStore(
            (state) => state.stemMode,
        )
    const visibleStems =
        getStemsForMode(stemMode)

    const reverb =
        useAudioStore(
            (state) =>
                state.trackReverb[
                selectedTrackId
                ] ?? defaultReverb,
        )

    const isSeparated =
        useAudioStore(
            (state) => state.isSeparated,
        )

    const setSelectedReverbTrackId =
        useAudioStore(
            (state) =>
                state.setSelectedReverbTrackId,
        )

    const setTrackReverb =
        useAudioStore(
            (state) => state.setTrackReverb,
        )

    const selectedStem =
        visibleStems.find(
            (stem) => stem.id === selectedTrackId,
        ) ?? visibleStems[0]

    const controlsDisabled =
        !isSeparated

    function applyReverb(
        nextReverb: TrackReverb,
    ) {
        setTrackReverb(
            selectedTrackId,
            nextReverb,
        )

        mixerEngine.setReverb(
            selectedTrackId,
            nextReverb,
        )
    }

    function handleControlChange(
        key: keyof TrackReverb,
        value: number,
    ) {
        if (controlsDisabled) return

        applyReverb({
            ...reverb,
            [key]: value,
        })
    }

    function handleReset() {
        if (controlsDisabled) return

        applyReverb(defaultReverb)
    }

    return (
        <div className="rounded-[18px] border border-white/[0.06] bg-gradient-to-b from-[#101726] to-[#0a0f1a] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
            <div className="mb-5">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                        Reverb
                    </h3>

                    <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                        {selectedStem.name}
                    </span>
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                    Add space to the selected stem.
                </p>
            </div>

            <div className="mb-4 flex items-center gap-1.5 overflow-visible">
                {visibleStems.map((stem) => {
                    const active =
                        stem.id === selectedTrackId

                    return (
                        <Tooltip
                            key={stem.id}
                            content={`Select ${stem.name} as the reverb target.`}
                            className="flex min-w-[58px] flex-1"
                        >
                            <button
                                disabled={controlsDisabled}
                                onClick={() =>
                                    setSelectedReverbTrackId(
                                        stem.id,
                                    )
                                }
                                className={[
                                    'w-full rounded-lg border px-2 py-2 text-[10px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40',
                                    active
                                        ? `border-white/[0.12] bg-gradient-to-br ${stem.color} text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]`
                                        : 'border-white/[0.05] bg-white/[0.025] text-zinc-500 hover:border-white/[0.1] hover:text-zinc-200',
                                ].join(' ')}
                            >
                                {stem.short}
                            </button>
                        </Tooltip>
                    )
                })}
            </div>

            <div
                className={[
                    'grid grid-cols-3 gap-3 overflow-visible transition-opacity',
                    controlsDisabled
                        ? 'opacity-55'
                        : '',
                ].join(' ')}
            >
                {controls.map((control) => (
                    <Tooltip
                        key={control.key}
                        content={control.tooltip}
                        className="block min-w-0"
                    >
                    <label className="flex w-full flex-col items-center rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                        <div className="relative flex h-[58px] w-[58px] items-center justify-center">
                            <input
                                type="range"
                                min={control.min}
                                max={control.max}
                                step={control.step}
                                value={reverb[control.key]}
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
                                            reverb[
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
                                    reverb[
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
                        ? 'Stem Reverb'
                        : 'Available after split stems'}
                </span>

                <Tooltip
                    content="Reset this stem reverb to the default settings."
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

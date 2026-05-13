import Tooltip from '@/stemmix/components/ui/Tooltip'
import { mixerEngine } from '@/stemmix/features/audio/mixer'
import {
    useAudioStore,
    type TrackEq,
} from '@/stemmix/stores/useAudioStore'
import { getStemsForMode } from '@/stemmix/data/stems'

const EQ_MIN = -12
const EQ_MAX = 12

const bands: Array<{
    key: keyof TrackEq
    label: string
    frequency: string
    color: string
}> = [
    {
        key: 'low',
        label: 'Low',
        frequency: '120 Hz',
        color: 'bg-sky-400',
    },
    {
        key: 'mid',
        label: 'Mid',
        frequency: '1 kHz',
        color: 'bg-violet-400',
    },
    {
        key: 'high',
        label: 'High',
        frequency: '8 kHz',
        color: 'bg-amber-300',
    },
]

function clampGain(value: number) {
    return Math.min(
        EQ_MAX,
        Math.max(
            EQ_MIN,
            value,
        ),
    )
}

function gainToY(value: number) {
    const normalized =
        (clampGain(value) - EQ_MIN) /
        (EQ_MAX - EQ_MIN)

    return 92 - normalized * 74
}

export default function EQCard() {
    const selectedTrackId =
        useAudioStore(
            (state) => state.selectedEqTrackId,
        )
    const stemMode =
        useAudioStore(
            (state) => state.stemMode,
        )
    const visibleStems =
        getStemsForMode(stemMode)

    const eq =
        useAudioStore(
            (state) =>
                state.trackEq[selectedTrackId] ?? {
                    low: 0,
                    mid: 0,
                    high: 0,
                },
        )

    const setSelectedEqTrackId =
        useAudioStore(
            (state) => state.setSelectedEqTrackId,
        )

    const setTrackEq =
        useAudioStore(
            (state) => state.setTrackEq,
        )

    const isSeparated =
        useAudioStore(
            (state) => state.isSeparated,
        )

    const selectedStem =
        visibleStems.find(
            (stem) => stem.id === selectedTrackId,
        ) ?? visibleStems[0]

    const controlsDisabled =
        !isSeparated

    const curvePath = [
        `M 0 ${gainToY(eq.low)}`,
        `C 42 ${gainToY(eq.low)}, 58 ${gainToY(eq.mid)}, 100 ${gainToY(eq.mid)}`,
        `C 142 ${gainToY(eq.mid)}, 158 ${gainToY(eq.high)}, 200 ${gainToY(eq.high)}`,
    ].join(' ')

    function handleBandChange(
        band: keyof TrackEq,
        value: number,
    ) {
        if (controlsDisabled) return

        const nextEq = {
            ...eq,
            [band]: clampGain(value),
        }

        setTrackEq(
            selectedTrackId,
            {
                [band]: nextEq[band],
            },
        )

        mixerEngine.setEq(
            selectedTrackId,
            nextEq,
        )
    }

    function handleReset() {
        if (controlsDisabled) return

        const flatEq = {
            low: 0,
            mid: 0,
            high: 0,
        }

        setTrackEq(
            selectedTrackId,
            flatEq,
        )

        mixerEngine.setEq(
            selectedTrackId,
            flatEq,
        )
    }

    return (
        <div className="flex h-full flex-col rounded-[18px] border border-white/[0.06] bg-gradient-to-b from-[#101726] to-[#0a0f1a] p-4 shadow-[0_10px_35px_rgba(0,0,0,0.35)]">
            <div className="mb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">
                            Equalizer
                        </h3>

                        <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-zinc-500">
                            {selectedStem.name}
                        </span>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                        Select a stem, then shape its tone.
                    </p>
                </div>
            </div>

            <div className="mb-4 flex items-center gap-1.5 overflow-visible">
                {visibleStems.map((stem) => {
                    const active =
                        stem.id === selectedTrackId

                    return (
                        <Tooltip
                            key={stem.id}
                            content={`Select ${stem.name} as the equalizer target.`}
                            className="flex min-w-[58px] flex-1"
                        >
                            <button
                                disabled={controlsDisabled}
                                onClick={() =>
                                    setSelectedEqTrackId(
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

            <div className="h-[150px] rounded-xl border border-white/[0.04] bg-black/20 p-3">
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:22px_22px]">
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.06]" />

                    <svg
                        viewBox="0 0 200 110"
                        className="absolute inset-0 h-full w-full"
                        fill="none"
                        preserveAspectRatio="none"
                    >
                        <path
                            d={curvePath}
                            stroke="url(#eqGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />

                        {bands.map((band, index) => (
                            <circle
                                key={band.key}
                                cx={index * 100}
                                cy={gainToY(eq[band.key])}
                                r="4.5"
                                fill="white"
                                className="drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]"
                            />
                        ))}

                        <defs>
                            <linearGradient
                                id="eqGradient"
                                x1="0"
                                y1="0"
                                x2="200"
                                y2="0"
                            >
                                <stop stopColor="#38bdf8" />
                                <stop offset="0.5" stopColor="#a78bfa" />
                                <stop offset="1" stopColor="#facc15" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="absolute bottom-1 left-3 right-3 flex justify-between text-[8px] uppercase tracking-[0.18em] text-zinc-600">
                        <span>Low</span>
                        <span>Mid</span>
                        <span>High</span>
                    </div>
                </div>
            </div>

            <div
                className={[
                    'mt-4 grid grid-cols-3 gap-3 transition-opacity',
                    !controlsDisabled
                        ? ''
                        : 'opacity-55',
                ].join(' ')}
            >
                {bands.map((band) => (
                    <Tooltip
                        key={band.key}
                        content={`${band.label} adjusts gain around ${band.frequency} on the selected stem.`}
                        className="block"
                    >
                    <label className="block rounded-xl border border-white/[0.05] bg-white/[0.025] p-3">
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                                <div className="text-[11px] font-semibold text-white">
                                    {band.label}
                                </div>

                                <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-zinc-600">
                                    {band.frequency}
                                </div>
                            </div>

                            <div className="text-[11px] font-semibold tabular-nums text-cyan-200">
                                {eq[band.key] > 0
                                    ? '+'
                                    : ''}
                                {eq[band.key].toFixed(1)}
                                dB
                            </div>
                        </div>

                        <input
                            type="range"
                            min={EQ_MIN}
                            max={EQ_MAX}
                            step={0.5}
                            value={eq[band.key]}
                            disabled={controlsDisabled}
                            onChange={(event) =>
                                handleBandChange(
                                    band.key,
                                    Number(
                                        event.target.value,
                                    ),
                                )
                            }
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/[0.08] accent-cyan-300 disabled:cursor-not-allowed"
                        />

                        <div className="mt-2 flex items-center justify-between">
                            <span
                                className={[
                                    'h-1.5 w-1.5 rounded-full',
                                    band.color,
                                ].join(' ')}
                            />

                            <span className="text-[8px] uppercase tracking-[0.14em] text-zinc-600">
                                Direct
                            </span>
                        </div>
                    </label>
                    </Tooltip>
                ))}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-white/[0.04] pt-3">
                <span className="text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    {isSeparated
                        ? 'Stem EQ'
                        : 'Available after split stems'}
                </span>

                <Tooltip
                    content="Reset all EQ bands on this stem to 0 dB."
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

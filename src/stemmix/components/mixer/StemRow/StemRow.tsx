import {
    useMemo,
} from 'react'

import Toggle from '@/stemmix/components/ui/Toggle'
import HorizontalSlider from '@/stemmix/components/ui/HorizontalSlider'
import Knob from '@/stemmix/components/ui/Knob'
import Tooltip from '@/stemmix/components/ui/Tooltip'

import {
    mixerEngine,
} from '@/stemmix/features/audio/mixer'

import {
    useAudioStore,
} from '@/stemmix/stores/useAudioStore'

type Props = {
    stem: {
        id: string
        name: string
        short: string
        color: string
    }

    compact?: boolean
}

const VISIBLE_WAVEFORM_BARS = 180
const COMPACT_VISIBLE_WAVEFORM_BARS = 72

export default function StemRow({
    stem,
    compact = false,
}: Props) {
    const track =
        useAudioStore((state) =>
            state.tracks.find(
                (track) => track.id === stem.id,
            ),
        )

    const hasAudioBuffer =
        useAudioStore(
            (state) => Boolean(state.audioBuffer),
        )

    const waveform =
        useAudioStore(
            (state) =>
                state.waveforms[
                stem.id as keyof typeof state.waveforms
                ] || [],
        )

    const duration =
        useAudioStore(
            (state) => state.duration,
        )

    const currentTime =
        useAudioStore(
            (state) => state.currentTime,
        )

    const isSeparated =
        useAudioStore(
            (state) => state.isSeparated,
        )

    const isSeparating =
        useAudioStore(
            (state) => state.isSeparating,
        )

    const setTrackVolume =
        useAudioStore(
            (state) => state.setTrackVolume,
        )

    const setTrackPan =
        useAudioStore(
            (state) => state.setTrackPan,
        )

    const toggleMute =
        useAudioStore(
            (state) => state.toggleMute,
        )

    const toggleSolo =
        useAudioStore(
            (state) => state.toggleSolo,
        )

    const toggleFx =
        useAudioStore(
            (state) => state.toggleFx,
        )

    const visibleWaveform =
        useMemo(() => {
            const visibleBars = compact
                ? COMPACT_VISIBLE_WAVEFORM_BARS
                : VISIBLE_WAVEFORM_BARS

            if (waveform.length === 0) {
                return Array.from(
                    { length: visibleBars },
                    (_, index) => {
                        const wave =
                            Math.sin(index * 0.55) *
                            0.18
                        const pulse =
                            Math.sin(index * 0.17) *
                            0.12

                        return Math.max(
                            0.08,
                            0.24 + wave + pulse,
                        )
                    },
                )
            }

            if (waveform.length <= visibleBars) {
                return waveform
            }

            const samplesPerBar =
                waveform.length / visibleBars

            return Array.from(
                { length: visibleBars },
                (_, index) => {
                    const start = Math.floor(
                        index * samplesPerBar,
                    )
                    const end = Math.min(
                        waveform.length,
                        Math.max(
                            start + 1,
                            Math.floor(
                                (index + 1) *
                                samplesPerBar,
                            ),
                        ),
                    )

                    let peak = 0

                    for (let i = start; i < end; i++) {
                        if (waveform[i] > peak) {
                            peak = waveform[i]
                        }
                    }

                    return peak
                },
            )
        }, [
            compact,
            waveform,
        ])

    const waveformBars =
        useMemo(
            () =>
                visibleWaveform.map((height, index) => (
                    <div
                        key={index}
                        className="relative flex min-w-0 flex-1 items-center justify-center"
                    >
                        <div
                            className={`rounded-full bg-gradient-to-t ${stem.color}`}
                            style={{
                                width: '100%',
                                maxWidth: compact
                                    ? '4px'
                                    : '3px',
                                height: `${Math.max(
                                    6,
                                    Math.round(
                                        height * 54,
                                    ),
                                )}px`,
                                opacity: 0.55,
                            }}
                        />
                    </div>
                )),
            [
                compact,
                stem.color,
                visibleWaveform,
            ],
        )

    const disabled =
        !hasAudioBuffer || !isSeparated

    const rowClassName = compact
        ? 'group relative flex items-center gap-2 overflow-visible rounded-[14px] border border-white/[0.06] bg-gradient-to-r from-[#0b1120] to-[#090d18] px-2.5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.24)]'
        : 'group relative flex items-center gap-3 overflow-visible rounded-[16px] border border-white/[0.06] bg-gradient-to-r from-[#0b1120] to-[#090d18] px-3 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.28)]'

    const waveClassName = compact
        ? 'relative flex h-[56px] flex-1 items-center gap-[2px] overflow-hidden rounded-xl border border-white/[0.04] bg-gradient-to-b from-[#050816] to-black/60 px-3'
        : 'relative flex h-[74px] flex-1 items-center gap-[2px] overflow-hidden rounded-2xl border border-white/[0.04] bg-gradient-to-b from-[#050816] to-black/60 px-4'

    function handleFx(
        enabled: boolean,
    ) {
        toggleFx(stem.id)

        mixerEngine.setFxEnabled(
            stem.id,
            enabled,
        )
    }

    function syncMixerState() {
        const tracks =
            useAudioStore.getState().tracks

        const hasSolo =
            tracks.some(
                (track) => track.solo,
            )

        tracks.forEach((track) => {
            let gain = track.volume

            // SOLO MODE
            if (hasSolo) {
                gain = track.solo
                    ? track.volume
                    : 0
            }

            // NORMAL MUTE
            else if (track.mute) {
                gain = 0
            }

            mixerEngine.setVolume(
                track.id,
                gain,
            )
        })
    }

    function handleVolume(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const value = Number(e.target.value)

        setTrackVolume(stem.id, value)

        setTimeout(() => {
            syncMixerState()
        }, 0)
    }

    function handlePan(
        value: number,
    ) {
        setTrackPan(stem.id, value)

        mixerEngine.setPan(
            stem.id,
            value,
        )
    }

    function handleMute() {
        toggleMute(stem.id)

        setTimeout(() => {
            syncMixerState()
        }, 0)
    }

    function handleSolo() {
        toggleSolo(stem.id)

        setTimeout(() => {
            syncMixerState()
        }, 0)
    }

    const playheadProgress =
        isSeparated &&
            !isSeparating &&
            duration > 0
            ? Math.min(
                currentTime / duration,
                1,
            )
            : 0


    if (!track) return null

    return (
        <div className={rowClassName}>

            {/* Glow */}
            <div
                className={`absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b ${stem.color} opacity-80`}
            />

            {/* Badge */}
            <div
                className={[
                    `relative flex shrink-0 items-center justify-center bg-gradient-to-br ${stem.color} shadow-[0_0_18px_rgba(255,255,255,0.08)]`,
                    compact
                        ? 'h-9 w-9 rounded-xl'
                        : 'h-11 w-11 rounded-2xl',
                ].join(' ')}
            >
                <div
                    className={[
                        'absolute inset-[1px] bg-black/20',
                        compact
                            ? 'rounded-xl'
                            : 'rounded-2xl',
                    ].join(' ')}
                />

                <span className="relative text-[9px] font-bold tracking-[0.18em] text-white">
                    {stem.short}
                </span>
            </div>

            {/* Info */}
            <div className="w-[76px] shrink-0">
                <h3 className="text-[12px] font-semibold text-white">
                    {stem.name}
                </h3>

                {!compact && (
                    <div className="mt-2 flex gap-1.5">
                    <Tooltip
                        content={`Solo ${stem.name}; only soloed stems will be heard.`}
                    >
                        <button
                            onClick={handleSolo}
                            disabled={disabled}
                            className={[
                                'rounded-md border px-1.5 py-[3px] text-[9px] font-semibold transition-all',

                                disabled
                                    ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-700'
                                    : track.solo
                                        ? 'border-yellow-400/40 bg-yellow-400 text-black shadow-[0_0_14px_rgba(250,204,21,0.35)]'
                                        : 'border-white/[0.04] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]',
                            ].join(' ')}
                        >
                            S
                        </button>
                    </Tooltip>

                    <Tooltip
                        content={`Mute ${stem.name}; this stem will not be heard or exported.`}
                    >
                        <button
                            onClick={handleMute}
                            disabled={disabled}
                            className={[
                                'rounded-md border px-1.5 py-[3px] text-[9px] font-semibold transition-all',

                                disabled
                                    ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-700'
                                    : track.mute
                                        ? 'border-red-400/40 bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.35)]'
                                        : 'border-white/[0.04] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06]',
                            ].join(' ')}
                        >
                            M
                        </button>
                    </Tooltip>
                    </div>
                )}
            </div>

            {/* Wave */}
            <div className={waveClassName}>

                {/* Inner glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_70%)]" />

                {/* Center line */}
                <div className="absolute left-0 right-0 top-1/2 h-px bg-white/[0.03]" />

                {/* Playback progress */}
                <div
                    className="pointer-events-none absolute inset-y-2 z-20 w-[14px] rounded-full bg-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.18)] transition-all duration-75"
                    style={{
                        left: `calc(${playheadProgress * 100}% - 7px)`,
                    }}
                >
                    <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/70" />
                </div>

                {waveformBars}

                {/* Shine overlay */}
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06),transparent_35%,transparent)]" />
            </div>

            {!compact && (
                <>
                    {/* Volume */}
                    <div className="w-[100px]">
                        <HorizontalSlider
                            value={track.volume}
                            onChange={handleVolume}
                            disabled={disabled}
                            tooltip={`Adjust ${stem.name} volume in the mix.`}
                        />
                    </div>

                    {/* Pan */}
                    <div className="scale-[0.9]">
                        <Knob
                            label="PAN"
                            value={track.pan}
                            onChange={handlePan}
                            disabled={disabled}
                            tooltip={`Move ${stem.name} left or right in the stereo field.`}
                        />
                    </div>

                    {/* FX */}
                    <Toggle
                        disabled={disabled}
                        enabled={track.fxEnabled}
                        onChange={handleFx}
                        tooltip={`Toggle legacy FX routing for ${stem.name}.`}
                    />
                </>
            )}
        </div>
    )
}

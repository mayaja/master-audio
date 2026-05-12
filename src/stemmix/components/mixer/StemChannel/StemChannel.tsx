import {
    useEffect,
    useRef,
} from 'react'

import Knob from '@/stemmix/components/ui/Knob'
import Tooltip from '@/stemmix/components/ui/Tooltip'
import VerticalSlider from '@/stemmix/components/ui/VerticalSlider'

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
}

export default function StemChannel({
    stem,
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

    const isSeparated =
        useAudioStore(
            (state) => state.isSeparated,
        )

    const isPlaying =
        useAudioStore(
            (state) => state.isPlaying,
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

    const meterRef =
        useRef<HTMLDivElement | null>(
            null,
        )

    const disabled =
        !hasAudioBuffer || !isSeparated

    const meterEnabled =
        isSeparated && isPlaying && !isSeparating

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

    function handleVolume(value: number) {
        setTrackVolume(
            stem.id,
            value,
        )

        setTimeout(() => {
            syncMixerState()
        }, 0)
    }

    function handlePan(
        value: number,
    ) {
        setTrackPan(
            stem.id,
            value,
        )

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

    useEffect(() => {
        if (!isPlaying || isSeparating) {
            if (meterRef.current) {
                meterRef.current.style.transform =
                    'scaleY(0.02)'

                meterRef.current.style.filter =
                    'brightness(1)'
            }

            return
        }

        let frame = 0
        let lastUpdate = 0

        let smoothLevel = 0
        let peakLevel = 0

        function update(time: number) {
            if (time - lastUpdate < 33) {
                frame =
                    requestAnimationFrame(
                        update,
                    )

                return
            }

            lastUpdate = time

            const target =
                isSeparated
                    ? mixerEngine.getMeterLevel(
                        stem.id,
                    )
                    : 0

            // FAST ATTACK
            if (target > smoothLevel) {
                smoothLevel +=
                    (target - smoothLevel) * 0.45
            }

            // SLOW RELEASE
            else {
                smoothLevel +=
                    (target - smoothLevel) * 0.08
            }

            // PEAK HOLD
            peakLevel = Math.max(
                peakLevel * 0.96,
                smoothLevel,
            )

            const finalLevel = Math.max(
                0.02,
                peakLevel,
            )

            if (meterRef.current) {
                meterRef.current.style.transform =
                    `scaleY(${finalLevel})`

                meterRef.current.style.filter =
                    finalLevel > 0.9
                        ? 'brightness(1.25)'
                        : 'brightness(1)'
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
    }, [
        stem.id,
        isSeparated,
        isPlaying,
        isSeparating,
    ])

    if (!track) return null

    return (
        <div className="relative flex flex-col items-center overflow-visible rounded-[20px] border border-white/10 bg-gradient-to-b from-[#111827] via-[#0d1320] to-[#090d18] px-3 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.45)]">

            {/* Top Metallic Line */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Header */}
            <div className="mb-3 flex w-full items-center justify-between">

                {/* Badge */}
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stem.color} text-[10px] font-bold tracking-[0.18em] text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]`}
                >
                    {stem.short}
                </div>

                {/* Power */}
                <Tooltip
                    content={`${track.mute ? 'Enable' : 'Disable'} ${stem.name} output.`}
                    side="left"
                >
                    <button
                        onClick={handleMute}
                        disabled={disabled}
                        className={[
                            'flex h-7 w-7 items-center justify-center rounded-full border text-[10px] transition-all',

                            disabled
                                ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-700'
                                : track.mute
                                    ? 'border-red-400/40 bg-red-500/20 text-red-300 shadow-[0_0_14px_rgba(239,68,68,0.2)]'
                                    : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]',
                        ].join(' ')}
                        aria-label={
                            track.mute
                                ? `Enable ${stem.name}`
                                : `Mute ${stem.name}`
                        }
                    >
                        ⏻
                    </button>
                </Tooltip>
            </div>

            {/* Solo / Mute */}
            <div className="mb-4 flex gap-1.5">

                <Tooltip
                    content={`Solo ${stem.name}; only soloed stems will be heard.`}
                >
                    <button
                        onClick={handleSolo}
                        disabled={disabled}
                        className={[
                            'rounded-md border px-2 py-[4px] text-[10px] font-semibold transition-all',

                            disabled
                                ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-700'
                                : track.solo
                                    ? 'border-yellow-400/40 bg-yellow-400 text-black shadow-[0_0_14px_rgba(250,204,21,0.35)]'
                                    : 'border-white/10 bg-[#151b28] text-zinc-300 hover:bg-[#1b2233]',
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
                            'rounded-md border px-2 py-[4px] text-[10px] font-semibold transition-all',

                            disabled
                                ? 'cursor-not-allowed border-white/[0.04] bg-white/[0.02] text-zinc-700'
                                : track.mute
                                    ? 'border-red-400/40 bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.35)]'
                                    : 'border-white/10 bg-[#151b28] text-zinc-300 hover:bg-[#1b2233]',
                        ].join(' ')}
                    >
                        M
                    </button>
                </Tooltip>
            </div>

            {/* Meter + Fader */}
            <div className="mb-3 flex h-[210px] items-center justify-center gap-2.5">

                {/* Meter Lane */}
                <div className="relative flex h-[200px] w-[10px] items-end overflow-hidden rounded-full border border-white/[0.05] bg-[#070b14] p-[1px]">

                    {/* Meter glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.05),transparent_60%)]" />

                    {/* Meter fill */}
                    <div
                        ref={meterRef}
                        className={`w-full origin-bottom rounded-full bg-gradient-to-t ${stem.color} shadow-[0_0_12px_rgba(255,255,255,0.18)] transition-opacity duration-300 ${meterEnabled
                            ? 'opacity-100'
                            : 'opacity-30'
                            }`}
                        style={{
                            height: '100%',
                            transform: 'scaleY(0.02)',
                        }}
                    />
                </div>
                {/* Fader */}
                <VerticalSlider
                    value={track.volume}
                    onChange={handleVolume}
                    disabled={disabled}
                    color={stem.color}
                    tooltip={`Adjust ${stem.name} volume in the mix.`}
                />
            </div>

            {/* Stereo Labels 
            <div className="-mt-1 flex items-center gap-6 text-[9px] text-zinc-600">
                <span>L</span>
                <span>R</span>
            </div>
            */}

            {/* Pan */}
            <div className="mt-1 scale-[0.88]">
                <Knob
                    label="PAN"
                    value={track.pan}
                    onChange={handlePan}
                    disabled={disabled}
                    tooltip={`Move ${stem.name} left or right in the stereo field.`}
                />
            </div>
        </div>
    )
}

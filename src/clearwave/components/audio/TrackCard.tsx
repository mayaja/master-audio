import {
    Play,
    Pause,
    Download,
    Loader2,
    SlidersHorizontal,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import WaveSurfer from "wavesurfer.js";

import type {
    AudioTrack,
} from "@/clearwave/types/audio";

import { cleanAudioWithFFmpeg } from "@/clearwave/lib/ffmpegCleaner";

interface Props {
    track: AudioTrack;

    onUpdate: (
        trackId: string,
        updates: Partial<AudioTrack>
    ) => void;
}

export default function TrackCard({
    track,
    onUpdate,
}: Props) {
    const waveformRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const waveSurferRef =
        useRef<WaveSurfer | null>(
            null
        );

    const [
        isPlaying,
        setIsPlaying,
    ] = useState(false);

    const [
        activeVersion,
        setActiveVersion,
    ] = useState<
        "original" | "cleaned"
    >("original");

    useEffect(() => {
        if (
            !waveformRef.current
        )
            return;

        const audioUrl =
            activeVersion ===
                "cleaned" &&
            track.cleanedUrl
                ? track.cleanedUrl
                : track.originalUrl;

        if (
            waveSurferRef.current
        ) {
            waveSurferRef.current.destroy();
        }

        const ws =
            WaveSurfer.create({
                container:
                    waveformRef.current,

                waveColor:
                    "#334155",

                progressColor:
                    "#8b5cf6",

                cursorColor:
                    "#a78bfa",

                height: 48,

                barWidth: 2,

                barGap: 1,

                barRadius: 999,

                normalize: true,
            });

        ws.load(audioUrl).catch(
            (error) => {
                if (
                    error?.name !==
                    "AbortError"
                ) {
                    console.error(
                        error
                    );
                }
            }
        );

        ws.on(
            "play",
            () =>
                setIsPlaying(
                    true
                )
        );

        ws.on(
            "pause",
            () =>
                setIsPlaying(
                    false
                )
        );

        ws.on(
            "finish",
            () =>
                setIsPlaying(
                    false
                )
        );

        waveSurferRef.current =
            ws;

        return () => {
            ws.destroy();
        };
    }, [
        activeVersion,
        track.originalUrl,
        track.cleanedUrl,
    ]);

    const togglePlay =
        () => {
            waveSurferRef.current?.playPause();
        };

    const handleClean =
        async () => {
            if (
                track.status ===
                "processing"
            )
                return;

            try {
                onUpdate(
                    track.id,
                    {
                        status:
                            "processing",

                        progress: 0,
                    }
                );

                const cleanedUrl =
                    await cleanAudioWithFFmpeg(
                        track.file,
                        track.intensity,
                        (
                            progress
                        ) => {
                            onUpdate(
                                track.id,
                                {
                                    progress,
                                }
                            );
                        }
                    );

                onUpdate(
                    track.id,
                    {
                        cleanedUrl,

                        progress: 100,

                        status:
                            "done",
                    }
                );

                setActiveVersion(
                    "cleaned"
                );
            } catch (
                error
            ) {
                console.error(
                    error
                );

                onUpdate(
                    track.id,
                    {
                        status:
                            "error",
                    }
                );
            }
        };

    return (
        <div
            className="
                glass
                border border-white/10
                rounded-2xl
                px-4 py-3
                flex items-center
                gap-4
            "
        >
            <button
                onClick={togglePlay}
                className="
                    w-11 h-11
                    rounded-full
                    border border-white/10
                    flex items-center
                    justify-center
                    hover:bg-white/5
                    transition-all
                    shrink-0
                "
            >
                {isPlaying ? (
                    <Pause
                        size={18}
                    />
                ) : (
                    <Play
                        size={18}
                    />
                )}
            </button>

            <div className="w-[220px] shrink-0 min-w-0">
                <div className="font-semibold truncate">
                    {track.file.name}
                </div>

                <div
                    className="
                        text-sm
                        text-slate-400
                        mt-1
                    "
                >
                    {track.status}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div
                    ref={waveformRef}
                />
            </div>

            <div className="shrink-0">
                <select
                    value={track.preset}
                    onChange={(
                        e
                    ) => {
                        const preset =
                            e.target
                                .value as
                                | "voice"
                                | "podcast"
                                | "meeting"
                                | "strong";

                        const intensityMap = {
                            voice: 35,
                            podcast: 55,
                            meeting: 75,
                            strong: 95,
                        };

                        onUpdate(
                            track.id,
                            {
                                preset,

                                intensity:
                                    intensityMap[
                                        preset
                                    ],
                            }
                        );
                    }}
                    className="
                        h-11
                        px-4
                        rounded-xl
                        bg-white/5
                        border border-white/10
                        outline-none
                    "
                >
                    <option value="voice">
                        Voice
                    </option>

                    <option value="podcast">
                        Podcast
                    </option>

                    <option value="meeting">
                        Meeting
                    </option>

                    <option value="strong">
                        Strong
                    </option>
                </select>
            </div>

            <button
                onClick={() =>
                    setActiveVersion(
                        activeVersion ===
                            "original"
                            ? "cleaned"
                            : "original"
                    )
                }
                disabled={
                    !track.cleanedUrl
                }
                className="
                    w-11 h-11
                    rounded-xl
                    border border-white/10
                    flex items-center
                    justify-center
                    hover:bg-white/5
                    transition-all
                    disabled:opacity-40
                    shrink-0
                "
            >
                <SlidersHorizontal
                    size={18}
                />
            </button>

            <div className="w-[140px] shrink-0">
                <div
                    className={`
                        text-sm
                        font-semibold

                        ${
                            track.status ===
                            "done"
                                ? "text-emerald-400"
                                : track.status ===
                                  "processing"
                                ? "text-cyan-400"
                                : "text-slate-400"
                        }
                    `}
                >
                    {track.status}
                </div>

                <div
                    className="
                        h-1.5
                        rounded-full
                        bg-white/5
                        overflow-hidden
                        mt-2
                    "
                >
                    <div
                        className="
                            h-full
                            bg-cyan-400
                        "
                        style={{
                            width: `${track.progress}%`,
                        }}
                    />
                </div>
            </div>

            {track.status ===
            "processing" ? (
                <button
                    disabled
                    className="
                        h-11
                        px-5
                        rounded-xl
                        bg-cyan-500
                        text-black
                        font-semibold
                        flex items-center
                        gap-2
                        shrink-0
                    "
                >
                    <Loader2
                        size={16}
                        className="animate-spin"
                    />

                    Processing
                </button>
            ) : (
                <button
                    onClick={handleClean}
                    className="
                        h-11
                        px-5
                        rounded-xl
                        bg-cyan-500
                        hover:bg-cyan-400
                        transition-all
                        text-black
                        font-semibold
                        shrink-0
                    "
                >
                    Clean
                </button>
            )}

            {track.cleanedUrl && (
                <a
                    href={
                        track.cleanedUrl
                    }
                    download={`${track.file.name}-cleaned.wav`}
                    className="
                        w-11 h-11
                        rounded-xl
                        border border-white/10
                        flex items-center
                        justify-center
                        hover:bg-white/5
                        transition-all
                        shrink-0
                    "
                >
                    <Download
                        size={18}
                    />
                </a>
            )}
        </div>
    );
}
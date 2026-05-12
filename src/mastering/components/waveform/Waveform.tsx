import { useEffect, useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";


interface Props {
    audioUrl: string | null;

    onReady?: (
        waveSurfer: WaveSurfer
    ) => void;
}

export default function Waveform({
    audioUrl,
    onReady,
}: Props) {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const waveSurferRef =
        useRef<WaveSurfer | null>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const formatTime = (seconds: number) => {
        const safe = Number.isFinite(seconds)
            ? Math.max(0, seconds)
            : 0;

        const mins = Math.floor(safe / 60);
        const secs = Math.floor(safe % 60);

        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;

        if (waveSurferRef.current) {
            waveSurferRef.current.destroy();
        }

        waveSurferRef.current =
            WaveSurfer.create({
                container: containerRef.current,

                waveColor: "#334155",
                progressColor: "#22c55e",
                cursorColor: "rgba(255,255,255,0.9)",
                cursorWidth: 2,

                barWidth: 2,
                barGap: 1,

                splitChannels: [
                    {
                        waveColor: "#60a5fa",
                        progressColor: "#93c5fd",
                        height: 58,
                    },
                    {
                        waveColor: "#f472b6",
                        progressColor: "#f9a8d4",
                        height: 58,
                    },
                ],

                height: 120,

                normalize: true,
            });

        waveSurferRef.current.on("ready", (d) => {
            setDuration(d);
            setCurrentTime(0);
        });

        waveSurferRef.current.on("timeupdate", (time) => {
            setCurrentTime(time);
        });

        if (onReady) {
            onReady(waveSurferRef.current);
        }

        if (audioUrl) {
            waveSurferRef.current.load(audioUrl);
        }

        return () => {
            waveSurferRef.current?.destroy();
        };
    }, [audioUrl]);

    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#03060d]">
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-zinc-700/70 bg-zinc-900/80 px-3 py-1 text-[10px]">
                <div className="flex items-center gap-2">
                    <span className="rounded bg-sky-500/20 px-2 py-[2px] font-semibold text-sky-300">L</span>
                    <span className="rounded bg-pink-500/20 px-2 py-[2px] font-semibold text-pink-300">R</span>
                </div>

                <div className="font-mono text-zinc-200">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                <span className="rounded bg-emerald-500/20 px-2 py-[2px] font-semibold text-emerald-300">
                    Stereo
                </span>
            </div>

            <div className="pointer-events-none absolute inset-x-2 bottom-2 top-8 z-0 grid grid-rows-2 gap-2">
                <div
                    className="rounded-lg border border-sky-400/25"
                    style={{
                        background: "linear-gradient(180deg, rgba(56,189,248,0.08) 0%, rgba(2,6,23,0.35) 100%)",
                    }}
                />

                <div
                    className="rounded-lg border border-pink-400/25"
                    style={{
                        background: "linear-gradient(180deg, rgba(236,72,153,0.08) 0%, rgba(2,6,23,0.35) 100%)",
                    }}
                />
            </div>

            <div
                ref={containerRef}
                className="absolute inset-x-2 bottom-2 top-8 z-10"
            />
        </div>
    );
}
import {
    useEffect,
    useRef,
} from "react";

import { useAudioStore } from "@/clearwave/store/audioStore";

export default function AudioAnalyzer() {
    const canvasRef =
        useRef<HTMLCanvasElement | null>(
            null
        );

    const animationRef =
        useRef<number>(0);

    const audioContextRef =
        useRef<AudioContext | null>(
            null
        );

    const analyserRef =
        useRef<AnalyserNode | null>(
            null
        );

    const sourceRef =
        useRef<MediaElementAudioSourceNode | null>(
            null
        );

    const wavesurfer =
        useAudioStore(
            (state) =>
                state.wavesurfer
        );

    useEffect(() => {
        if (!wavesurfer) return;

        const media =
            wavesurfer.getMediaElement();

        if (!media) return;

        const canvas =
            canvasRef.current;

        if (!canvas) return;

        const ctx =
            canvas.getContext("2d");

        if (!ctx) return;

        /*
         * AUDIO CONTEXT
         */
        const audioContext =
            new AudioContext();

        audioContextRef.current =
            audioContext;

        /*
         * ANALYSER
         */
        const analyser =
            audioContext.createAnalyser();

        analyser.fftSize = 256;

        analyserRef.current =
            analyser;

        /*
         * MEDIA SOURCE
         */
        const source =
            audioContext.createMediaElementSource(
                media
            );

        sourceRef.current =
            source;

        source.connect(analyser);

        analyser.connect(
            audioContext.destination
        );

        const bufferLength =
            analyser.frequencyBinCount;

        const dataArray =
            new Uint8Array(
                bufferLength
            );

        /*
         * RENDER LOOP
         */
        const render = () => {
            analyser.getByteFrequencyData(
                dataArray
            );

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            const barWidth =
                canvas.width /
                bufferLength;

            for (
                let i = 0;
                i < bufferLength;
                i++
            ) {
                const value =
                    dataArray[i];

                const height =
                    (value / 255) *
                    canvas.height;

                const x =
                    i * barWidth;

                const y =
                    canvas.height -
                    height;

                const gradient =
                    ctx.createLinearGradient(
                        0,
                        y,
                        0,
                        canvas.height
                    );

                gradient.addColorStop(
                    0,
                    "#22d3ee"
                );

                gradient.addColorStop(
                    1,
                    "#7c3aed"
                );

                ctx.fillStyle =
                    gradient;

                ctx.beginPath();

                ctx.roundRect(
                    x,
                    y,
                    barWidth - 2,
                    height,
                    999
                );

                ctx.fill();
            }

            animationRef.current =
                requestAnimationFrame(
                    render
                );
        };

        render();

        return () => {
            cancelAnimationFrame(
                animationRef.current
            );

            source.disconnect();

            analyser.disconnect();

            audioContext.close();
        };
    }, [wavesurfer]);

    return (
        <div className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">
                    Real Spectrum
                </h3>

                <div className="text-cyan-300 text-sm">
                    FFT Live
                </div>
            </div>

            <canvas
                ref={canvasRef}
                width={700}
                height={220}
                className="
          w-full
          h-[220px]
          mt-6
        "
            />
        </div>
    );
}
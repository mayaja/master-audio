import { create } from "zustand";

import type {
    AudioState,
    AudioTrack,
} from "@/clearwave/types/audio";

export const useAudioStore =
    create<AudioState>(
        (set) => ({
            /*
             * TRACKS
             */
            tracks:
                [] as AudioTrack[],

            setTracks: (
                tracks
            ) =>
                set({
                    tracks,
                }),

            /*
             * GLOBAL UI
             */
            isPlaying: false,

            isProcessing: false,

            progress: 0,

            selectedVersion:
                "original",

            wavesurfer: null,

            isFFmpegLoading: false,

            /*
             * GLOBAL UI ACTIONS
             */
            setPlaying: (
                state
            ) =>
                set({
                    isPlaying:
                        state,
                }),

            setProcessing: (
                state
            ) =>
                set({
                    isProcessing:
                        state,
                }),

            setProgress: (
                value
            ) =>
                set({
                    progress:
                        value,
                }),

            setSelectedVersion:
                (
                    version
                ) =>
                    set({
                        selectedVersion:
                            version,
                    }),

            setWaveSurfer: (
                ws
            ) =>
                set({
                    wavesurfer:
                        ws,
                }),

            setFFmpegLoading:
                (
                    value
                ) =>
                    set({
                        isFFmpegLoading:
                            value,
                    }),
        })
    );
import { create } from "zustand";

interface AudioState {
    isPlaying: boolean;

    inputGain: number;
    outputGain: number;

    setIsPlaying: (
        playing: boolean
    ) => void;

    setInputGain: (
        value: number
    ) => void;

    setOutputGain: (
        value: number
    ) => void;
}

export const useAudioStore =
    create<AudioState>((set) => ({
        isPlaying: false,

        inputGain: 0,
        outputGain: 0,

        setIsPlaying: (playing) =>
            set({
                isPlaying: playing,
            }),

        setInputGain: (value) =>
            set({
                inputGain: value,
            }),

        setOutputGain: (value) =>
            set({
                outputGain: value,
            }),
    }));
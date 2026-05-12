export interface AudioTrack {
    id: string;

    file: File;

    originalUrl: string;

    cleanedUrl?: string;

    status:
        | "idle"
        | "processing"
        | "done"
        | "error";

    progress: number;

    preset:
        | "voice"
        | "podcast"
        | "meeting"
        | "strong";

    intensity: number;
}

export interface AudioState {
    /*
     * TRACKS
     */
    tracks: AudioTrack[];

    setTracks: (
        tracks: AudioTrack[]
    ) => void;

    /*
     * GLOBAL UI
     */
    isPlaying: boolean;

    isProcessing: boolean;

    progress: number;

    selectedVersion:
        | "original"
        | "cleaned";

    wavesurfer: any;

    isFFmpegLoading: boolean;

    /*
     * GLOBAL UI ACTIONS
     */
    setPlaying: (
        state: boolean
    ) => void;

    setProcessing: (
        state: boolean
    ) => void;

    setProgress: (
        value: number
    ) => void;

    setSelectedVersion: (
        version:
            | "original"
            | "cleaned"
    ) => void;

    setWaveSurfer: (
        ws: any
    ) => void;

    setFFmpegLoading: (
        value: boolean
    ) => void;
}
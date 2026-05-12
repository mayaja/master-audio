import { create } from 'zustand'

export type Track = {
    id: string
    name: string

    volume: number
    pan: number

    mute: boolean
    solo: boolean
    fxEnabled: boolean
}

export type TrackEq = {
    low: number
    mid: number
    high: number
}

export type TrackCompressor = {
    threshold: number
    ratio: number
    attack: number
    release: number
    makeup: number
}

export type MasterLimiter = {
    drive: number
    threshold: number
    ceiling: number
    release: number
}

export type TrackReverb = {
    mix: number
    decay: number
    size: number
    damping: number
    preDelay: number
    width: number
}

type AudioStore = {
    audioFile: File | null
    audioBuffer: AudioBuffer | null

    isPlaying: boolean

    currentTime: number
    duration: number

    tracks: Track[]

    selectedEqTrackId: string

    selectedCompressorTrackId: string

    selectedReverbTrackId: string

    trackEq: Record<string, TrackEq>

    trackCompressor: Record<string, TrackCompressor>

    trackReverb: Record<string, TrackReverb>

    masterLimiter: MasterLimiter

    stemBuffers: {
        vocals: AudioBuffer | null
        drums: AudioBuffer | null
        bass: AudioBuffer | null
        other: AudioBuffer | null
    }

    waveforms: {
        vocals: number[]
        drums: number[]
        bass: number[]
        other: number[]
    }

    isSeparated: boolean

    isSeparating: boolean
    separationProgress: number
    separationStatus: string

    toggleFx: (id: string) => void

    setTrackFxEnabled: (
        id: string,
        enabled: boolean,
    ) => void

    setSelectedEqTrackId: (
        id: string,
    ) => void

    setSelectedCompressorTrackId: (
        id: string,
    ) => void

    setSelectedReverbTrackId: (
        id: string,
    ) => void

    setTrackEq: (
        id: string,
        eq: Partial<TrackEq>,
    ) => void

    setTrackCompressor: (
        id: string,
        compressor: Partial<TrackCompressor>,
    ) => void

    setTrackReverb: (
        id: string,
        reverb: Partial<TrackReverb>,
    ) => void

    setMasterLimiter: (
        limiter: Partial<MasterLimiter>,
    ) => void

    setAudioFile: (file: File | null) => void
    setAudioBuffer: (
        buffer: AudioBuffer | null,
    ) => void

    setIsPlaying: (
        playing: boolean,
    ) => void

    setCurrentTime: (
        time: number,
    ) => void

    setDuration: (
        duration: number,
    ) => void

    setTrackVolume: (
        id: string,
        volume: number,
    ) => void

    setTrackPan: (
        id: string,
        pan: number,
    ) => void

    toggleMute: (id: string) => void

    toggleSolo: (id: string) => void

    setStemBuffers: (
        stems: {
            vocals: AudioBuffer | null
            drums: AudioBuffer | null
            bass: AudioBuffer | null
            other: AudioBuffer | null
        },
    ) => void

    setWaveforms: (
        waveforms: {
            vocals: number[]
            drums: number[]
            bass: number[]
            other: number[]
        },
    ) => void

    setIsSeparated: (
        separated: boolean,
    ) => void

    setSeparating: (
        value: boolean,
    ) => void

    setSeparationProgress: (
        value: number,
    ) => void

    setSeparationStatus: (
        value: string,
    ) => void
}

const defaultTracks: Track[] = [
    {
        id: 'vocals',
        name: 'Vocals',
        volume: 1,
        pan: 0,
        mute: false,
        solo: false,
        fxEnabled: false,
    },

    {
        id: 'drums',
        name: 'Drums',
        volume: 1,
        pan: 0,
        mute: false,
        solo: false,
        fxEnabled: false,
    },

    {
        id: 'bass',
        name: 'Bass',
        volume: 1,
        pan: 0,
        mute: false,
        solo: false,
        fxEnabled: false,
    },

    {
        id: 'other',
        name: 'Other',
        volume: 1,
        pan: 0,
        mute: false,
        solo: false,
        fxEnabled: false,
    },
]

const defaultTrackEq: Record<string, TrackEq> = {
    vocals: {
        low: 0,
        mid: 0,
        high: 0,
    },
    drums: {
        low: 0,
        mid: 0,
        high: 0,
    },
    bass: {
        low: 0,
        mid: 0,
        high: 0,
    },
    other: {
        low: 0,
        mid: 0,
        high: 0,
    },
}

const defaultCompressor: TrackCompressor = {
    threshold: 0,
    ratio: 1,
    attack: 0.01,
    release: 0.25,
    makeup: 0,
}

const defaultTrackCompressor: Record<string, TrackCompressor> = {
    vocals: defaultCompressor,
    drums: defaultCompressor,
    bass: defaultCompressor,
    other: defaultCompressor,
}

const defaultReverb: TrackReverb = {
    mix: 0,
    decay: 2.4,
    size: 0.65,
    damping: 0.48,
    preDelay: 0.022,
    width: 0.88,
}

const defaultTrackReverb: Record<string, TrackReverb> = {
    vocals: defaultReverb,
    drums: defaultReverb,
    bass: defaultReverb,
    other: defaultReverb,
}

const defaultMasterLimiter: MasterLimiter = {
    drive: 0,
    threshold: -1,
    ceiling: -1,
    release: 0.1,
}

export const useAudioStore =
    create<AudioStore>((set) => ({
        isSeparated: false,
        audioFile: null,
        audioBuffer: null,

        isPlaying: false,

        currentTime: 0,
        duration: 0,

        tracks: defaultTracks,

        selectedEqTrackId: 'vocals',

        selectedCompressorTrackId: 'vocals',

        selectedReverbTrackId: 'vocals',

        trackEq: defaultTrackEq,

        trackCompressor: defaultTrackCompressor,

        trackReverb: defaultTrackReverb,

        masterLimiter: defaultMasterLimiter,

        isSeparating: false,

        separationProgress: 0,

        separationStatus:
            'Preparing AI model...',

        toggleFx: (id) =>
            set((state) => ({
                tracks: state.tracks.map(
                    (track) =>
                        track.id === id
                            ? {
                                ...track,
                                fxEnabled:
                                    !track.fxEnabled,
                            }
                            : track,
                ),
            })),

        setTrackFxEnabled: (
            id,
            enabled,
        ) =>
            set((state) => ({
                tracks: state.tracks.map(
                    (track) =>
                        track.id === id
                            ? {
                                ...track,
                                fxEnabled:
                                    enabled,
                            }
                            : track,
                ),
            })),

        setSelectedEqTrackId: (id) =>
            set({
                selectedEqTrackId: id,
            }),

        setSelectedCompressorTrackId: (id) =>
            set({
                selectedCompressorTrackId: id,
            }),

        setSelectedReverbTrackId: (id) =>
            set({
                selectedReverbTrackId: id,
            }),

        setTrackEq: (id, eq) =>
            set((state) => ({
                trackEq: {
                    ...state.trackEq,
                    [id]: {
                        ...(state.trackEq[id] ?? {
                            low: 0,
                            mid: 0,
                            high: 0,
                        }),
                        ...eq,
                    },
                },
            })),

        setTrackCompressor: (
            id,
            compressor,
        ) =>
            set((state) => ({
                trackCompressor: {
                    ...state.trackCompressor,
                    [id]: {
                        ...(state.trackCompressor[id] ??
                            defaultCompressor),
                        ...compressor,
                    },
                },
            })),

        setTrackReverb: (id, reverb) =>
            set((state) => ({
                trackReverb: {
                    ...state.trackReverb,
                    [id]: {
                        ...(state.trackReverb[id] ??
                            defaultReverb),
                        ...reverb,
                    },
                },
            })),

        setMasterLimiter: (limiter) =>
            set((state) => ({
                masterLimiter: {
                    ...state.masterLimiter,
                    ...limiter,
                },
            })),

        setSeparating: (value) =>
            set({
                isSeparating: value,
            }),

        setSeparationProgress: (value) =>
            set({
                separationProgress: value,
            }),

        setSeparationStatus: (value) =>
            set({
                separationStatus: value,
            }),
        setIsSeparated: (separated) =>
            set({
                isSeparated: separated,
            }),
        stemBuffers: {
            vocals: null,
            drums: null,
            bass: null,
            other: null,
        },

        waveforms: {
            vocals: [],
            drums: [],
            bass: [],
            other: [],
        },

        setStemBuffers: (stems) =>
            set({
                stemBuffers: stems,
            }),

        setWaveforms: (waveforms) =>
            set({
                waveforms,
            }),

        setAudioFile: (file) =>
            set({
                audioFile: file,
            }),

        setAudioBuffer: (buffer) =>
            set({
                audioBuffer: buffer,
            }),

        setIsPlaying: (playing) =>
            set({
                isPlaying: playing,
            }),

        setCurrentTime: (time) =>
            set({
                currentTime: time,
            }),

        setDuration: (duration) =>
            set({
                duration,
            }),

        setTrackVolume: (
            id,
            volume,
        ) =>
            set((state) => ({
                tracks: state.tracks.map(
                    (track) =>
                        track.id === id
                            ? {
                                ...track,
                                volume,
                            }
                            : track,
                ),
            })),

        setTrackPan: (
            id,
            pan,
        ) =>
            set((state) => ({
                tracks: state.tracks.map(
                    (track) =>
                        track.id === id
                            ? {
                                ...track,
                                pan,
                            }
                            : track,
                ),
            })),

        toggleMute: (id) =>
            set((state) => ({
                tracks: state.tracks.map(
                    (track) =>
                        track.id === id
                            ? {
                                ...track,
                                mute: !track.mute,
                            }
                            : track,
                ),
            })),

        toggleSolo: (id) =>
            set((state) => ({
                tracks: state.tracks.map(
                    (track) =>
                        track.id === id
                            ? {
                                ...track,
                                solo: !track.solo,
                            }
                            : track,
                ),
            })),
    }))

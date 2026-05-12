declare module 'demucs-web' {
    export type DemucsProgress = {
        progress: number
        currentSegment: number
        totalSegments: number
    }

    export type DemucsStem = {
        left: Float32Array<ArrayBuffer>
        right: Float32Array<ArrayBuffer>
    }

    export type DemucsStems = {
        vocals: DemucsStem
        drums: DemucsStem
        bass: DemucsStem
        other: DemucsStem
    }

    export type DemucsProcessorOptions = {
        ort: unknown
        modelPath: string
        sessionOptions?: {
            executionProviders?: string[]
            graphOptimizationLevel?:
            | 'disabled'
            | 'basic'
            | 'extended'
            | 'all'
        }
        onProgress?: (
            progress: DemucsProgress,
        ) => void
        onLog?: (...args: unknown[]) => void
    }

    export const CONSTANTS: unknown
    export const fft: unknown
    export const ifft: unknown
    export const stft: unknown
    export const istft: unknown
    export const getHannWindow: unknown
    export const prepareModelInput: unknown
    export const reflectPad: unknown
    export const standaloneSpec: unknown
    export const standaloneMask: unknown

    export class DemucsProcessor {
        constructor(
            options: DemucsProcessorOptions,
        )

        loadModel(): Promise<void>

        separate(
            leftChannel: Float32Array<ArrayBuffer>,
            rightChannel: Float32Array<ArrayBuffer>,
        ): Promise<DemucsStems>
    }
}

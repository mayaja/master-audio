declare module "@jitsi/rnnoise-wasm" {
    interface RNNoiseModule {
        HEAPF32: Float32Array;

        _malloc(
            size: number
        ): number;

        _free(
            ptr: number
        ): void;

        _rnnoise_create(): number;

        _rnnoise_destroy(
            state: number
        ): void;

        _rnnoise_process_frame(
            state: number,
            input: number,
            output: number
        ): number;
    }

    export default function rnnoiseModule(): Promise<RNNoiseModule>;
}
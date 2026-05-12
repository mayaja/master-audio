import * as Demucs from 'demucs-web'
import * as ort from 'onnxruntime-web'
import ortWasmJsepUrl from 'onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm?url'

ort.env.wasm.wasmPaths = {
    wasm: ortWasmJsepUrl,
}

ort.env.wasm.numThreads =
    crossOriginIsolated
        ? Math.min(
            4,
            navigator.hardwareConcurrency || 4,
        )
        : 1

type DemucsProgress = {
    progress: number
    currentSegment: number
    totalSegments: number
}

type SeparateMessage = {
    type: 'SEPARATE'
    leftChannel: Float32Array<ArrayBuffer>
    rightChannel: Float32Array<ArrayBuffer>
}

function clampProgress(value: number) {
    return Math.min(
        100,
        Math.max(
            0,
            value,
        ),
    )
}

function getStatusForProgress(progress: number) {
    if (progress < 15)
        return 'Loading AI model...'

    if (progress < 30)
        return 'Analyzing frequencies...'

    if (progress < 50)
        return 'Separating vocals...'

    if (progress < 70)
        return 'Extracting drums...'

    if (progress < 88)
        return 'Recovering harmonic layers...'

    return 'Finalizing stems...'
}

function postProgress(
    progress: number,
    message: string,
    segment?: Pick<
        DemucsProgress,
        'currentSegment' | 'totalSegments'
    >,
) {
    self.postMessage({
        type: 'progress',
        progress: clampProgress(progress),
        message,
        ...segment,
    })
}

const processor =
    new Demucs.DemucsProcessor({
        ort,

        modelPath:
            '/models/htdemucs_embedded.onnx',

        sessionOptions: {
            executionProviders: [
                'webgpu',
                'wasm',
            ],
            graphOptimizationLevel: 'all',
        },

        onProgress: (progress: DemucsProgress) => {
            const normalized =
                clampProgress(
                    progress.progress * 100,
                )

            postProgress(
                normalized,
                getStatusForProgress(normalized),
                {
                    currentSegment:
                        progress.currentSegment,
                    totalSegments:
                        progress.totalSegments,
                },
            )
        },

        onLog: () => {},
    })

let loaded = false

self.onmessage = async (
    event: MessageEvent<SeparateMessage>,
) => {
    const {
        type,
        leftChannel,
        rightChannel,
    } = event.data

    try {
        if (type !== 'SEPARATE')
            return

        postProgress(
            4,
            'Preparing AI engine...',
        )

        if (!loaded) {
            postProgress(
                10,
                'Loading Demucs model...',
            )

            await processor.loadModel()

            loaded = true
        }

        postProgress(
            18,
            'Preparing audio buffers...',
        )

        const result =
            await processor.separate(
                leftChannel,
                rightChannel,
            )

        postProgress(
            100,
            'Stem separation completed',
        )

        self.postMessage({
            type: 'SEPARATION_SUCCESS',
            stems: result,
        })
    } catch (err) {
        console.error(err)

        self.postMessage({
            type: 'SEPARATION_ERROR',
            error: String(err),
        })
    }
}

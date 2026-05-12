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

console.info('[StemMix Worker] Runtime environment', {
    crossOriginIsolated,
    hardwareConcurrency:
        navigator.hardwareConcurrency,
    wasmThreads:
        ort.env.wasm.numThreads,
    hasWebGPU:
        typeof navigator !== 'undefined' &&
        Boolean(navigator.gpu),
    wasmPath:
        ortWasmJsepUrl,
    modelPath:
        '/models/htdemucs_embedded.onnx',
})

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

            console.time('[StemMix Worker] Demucs model load')
            console.info('[StemMix Worker] Loading Demucs model', {
                modelPath:
                    '/models/htdemucs_embedded.onnx',
                executionProviders: [
                    'webgpu',
                    'wasm',
                ],
                graphOptimizationLevel:
                    'all',
                wasmThreads:
                    ort.env.wasm.numThreads,
            })

            await processor.loadModel()

            console.timeEnd('[StemMix Worker] Demucs model load')
            console.info('[StemMix Worker] Demucs model loaded successfully')

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

        console.info('[StemMix Worker] Separation completed')

        postProgress(
            100,
            'Stem separation completed',
        )

        self.postMessage({
            type: 'SEPARATION_SUCCESS',
            stems: result,
        })
    } catch (err) {
        console.error('[StemMix Worker] Separation failed', err)

        self.postMessage({
            type: 'SEPARATION_ERROR',
            error: String(err),
        })
    }
}

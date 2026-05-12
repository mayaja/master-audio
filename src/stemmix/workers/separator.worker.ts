import * as Demucs from 'demucs-web'
import * as ort from 'onnxruntime-web'
import ortWasmJsepMjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs?url'
import ortWasmJsepUrl from 'onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm?url'

ort.env.wasm.wasmPaths = {
    mjs: ortWasmJsepMjsUrl,
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
    wasmMjsPath:
        ortWasmJsepMjsUrl,
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

type EngineMode = 'fast-webgpu' | 'stable-wasm'

const MODEL_PATH = '/models/htdemucs_embedded.onnx'
const FAST_MODEL_LOAD_TIMEOUT_MS =
    import.meta.env.PROD
        ? 45_000
        : 0

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

function createProcessor(
    mode: EngineMode,
) {
    const executionProviders =
        mode === 'fast-webgpu'
            ? [
                'webgpu',
                'wasm',
            ]
            : [
                'wasm',
            ]

    return new Demucs.DemucsProcessor({
        ort,

        modelPath: MODEL_PATH,

        sessionOptions: {
            executionProviders,
            graphOptimizationLevel:
                mode === 'fast-webgpu'
                    ? 'all'
                    : 'basic',
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
}

async function withOptionalTimeout<T>(
    task: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
) {
    if (!timeoutMs)
        return task

    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const timeout =
        new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
                () => reject(
                    new Error(timeoutMessage),
                ),
                timeoutMs,
            )
        })

    try {
        return await Promise.race([
            task,
            timeout,
        ])
    } finally {
        if (timeoutId)
            clearTimeout(timeoutId)
    }
}

let processor = createProcessor('fast-webgpu')
let loadedMode: EngineMode | null = null

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
                modelPath: MODEL_PATH,
                executionProviders: [
                    'webgpu',
                    'wasm',
                ],
                graphOptimizationLevel:
                    'all',
                wasmThreads:
                    ort.env.wasm.numThreads,
            })

            try {
                await withOptionalTimeout(
                    processor.loadModel(),
                    FAST_MODEL_LOAD_TIMEOUT_MS,
                    'Fast WebGPU model loading timed out.',
                )

                loadedMode = 'fast-webgpu'
            } catch (err) {
                if (!import.meta.env.PROD)
                    throw err

                console.warn(
                    '[StemMix Worker] Fast WebGPU engine did not finish loading, retrying with stable WASM.',
                    err,
                )

                postProgress(
                    12,
                    'Fast engine unavailable, switching to stable WASM...',
                )

                processor = createProcessor('stable-wasm')

                console.info('[StemMix Worker] Loading Demucs model with stable WASM', {
                    modelPath: MODEL_PATH,
                    executionProviders: [
                        'wasm',
                    ],
                    graphOptimizationLevel:
                        'basic',
                    wasmThreads:
                        ort.env.wasm.numThreads,
                })

                await processor.loadModel()

                loadedMode = 'stable-wasm'
            }

            console.timeEnd('[StemMix Worker] Demucs model load')
            console.info('[StemMix Worker] Demucs model loaded successfully', {
                mode: loadedMode,
            })

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

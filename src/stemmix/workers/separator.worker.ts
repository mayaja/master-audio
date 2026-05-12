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

const DEFAULT_LOCAL_MODEL_PATH = '/models/htdemucs_embedded.onnx'
const MODEL_PATH =
    import.meta.env.VITE_DEMUCS_MODEL_URL?.trim() ||
    DEFAULT_LOCAL_MODEL_PATH
const MIN_MODEL_BYTES = 100_000_000

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

async function ensureModelAvailable() {
    const headResponse = await fetch(
        MODEL_PATH,
        {
            method: 'HEAD',
            cache: 'no-store',
        },
    ).catch(() => null)

    if (headResponse?.ok) {
        const contentLength =
            Number(
                headResponse.headers.get('content-length') ?? 0,
            )

        if (
            contentLength > 0 &&
            contentLength < MIN_MODEL_BYTES
        ) {
            throw new Error(
                `Demucs model at ${MODEL_PATH} looks incomplete (${contentLength} bytes). Re-upload or re-download the model asset.`,
            )
        }

        return
    }

    const rangeResponse = await fetch(
        MODEL_PATH,
        {
            method: 'GET',
            cache: 'no-store',
            headers: {
                Range: 'bytes=0-1023',
            },
        },
    ).catch(() => null)

    await rangeResponse?.body?.cancel()

    if (!rangeResponse?.ok) {
        const status =
            headResponse?.status ??
            rangeResponse?.status ??
            'network error'

        throw new Error(
            `Demucs model is not available at ${MODEL_PATH}. Server returned ${status}. Make sure the model URL is reachable and supports browser requests.`,
        )
    }
}

const processor =
    new Demucs.DemucsProcessor({
        ort,

        modelPath: MODEL_PATH,

        sessionOptions: {
            executionProviders: [
                'wasm',
            ],
            graphOptimizationLevel: 'all',
        },

        onProgress: (progress: DemucsProgress) => {
            const normalized =
                clampProgress(
                    55 + progress.progress * 44,
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
                48,
                'Checking Demucs model asset...',
            )

            await ensureModelAvailable()

            postProgress(
                50,
                'Loading Demucs model. This can take longer on the first production run...',
            )

            await processor.loadModel()

            loaded = true
        }

        postProgress(
            55,
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

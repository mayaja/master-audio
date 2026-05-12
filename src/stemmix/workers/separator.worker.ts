import * as Demucs from 'demucs-web'
import * as ort from 'onnxruntime-web'
import ortWasmJsepUrl from 'onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm?url'

ort.env.wasm.wasmPaths = {
    wasm: ortWasmJsepUrl,
}

ort.env.wasm.numThreads = 1

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
const MODEL_LOAD_TIMEOUT_MS = 180_000

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

async function withTimeout<T>(
    task: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const timeout =
        new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
                () => {
                    reject(
                        new Error(timeoutMessage),
                    )
                },
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

const processor =
    new Demucs.DemucsProcessor({
        ort,

        modelPath: MODEL_PATH,

        sessionOptions: {
            executionProviders: [
                'wasm',
            ],
            graphOptimizationLevel: 'basic',
        },

        onDownloadProgress: (
            loadedSize: number,
            totalSize: number,
        ) => {
            if (!totalSize)
                return

            const downloadProgress =
                Math.min(
                    loadedSize / totalSize,
                    1,
                )

            postProgress(
                50 + downloadProgress * 20,
                `Loading Demucs model... ${Math.round(downloadProgress * 100)}%`,
            )
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
                'Loading Demucs model...',
            )

            await withTimeout(
                processor.loadModel(),
                MODEL_LOAD_TIMEOUT_MS,
                'Demucs model loading timed out. Please refresh the page and try a shorter audio file or a desktop Chrome/Edge browser.',
            )

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

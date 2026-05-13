import Button from '@/stemmix/components/ui/Button'
import Tooltip from '@/stemmix/components/ui/Tooltip'
import { mixerEngine } from '@/stemmix/features/audio/mixer'
import {
    getExportFileName,
    hasCompleteStemSet,
    renderStemMix,
} from '@/stemmix/features/audio/exportMix'
import {
    generateWaveform,
} from '@/stemmix/utils/waveform'
import {
    getStemsForMode,
    stemModeOptions,
    type StemMode,
} from '@/stemmix/data/stems'

import {
    useRef,
    useEffect,
    useState,
} from 'react'

import { useAudioStore } from '@/stemmix/stores/useAudioStore'

import { audioEngine } from '@/stemmix/features/audio/engine'

// Pastikan separatorWorker di-import dari tempat inisialisasinya
import { separatorWorker } from '@/stemmix/features/separations/worker'

import { useAnimationFrame } from '@/stemmix/hooks/useAnimationFrame'

import {
    Download,
    Home,
    Pause,
    Play,
    Scissors,
    SkipBack,
    SkipForward,
    Upload,
} from 'lucide-react'

type StemKey =
    | 'vocals'
    | 'instrumental'
    | 'drums'
    | 'bass'
    | 'other'

type WorkerStemData = {
    left: Float32Array
    right: Float32Array
}

type SeparationWorkerMessage = {
    type: string
    stems?: Partial<
        Record<StemKey, WorkerStemData>
    >
    progress?: number
    status?: string
    message?: string
    error?: string
}

/**
 * Helper untuk membuat AudioBuffer dari data channel kiri dan kanan.
 * Dipindahkan ke luar komponen agar tidak di-recreate setiap render.
 */
function createStemBuffer(
    leftInput: Float32Array,
    rightInput: Float32Array,
    sampleRate: number
) {
    const context = audioEngine.getContext()
    if (!context) return null

    // Gunakan buffer asli tanpa cloning berlebih jika memungkinkan
    // Namun tetap pastikan kita tidak merusak data asli sebelum normalisasi
    const left = new Float32Array(leftInput)
    const right = new Float32Array(rightInput)

    // Normalisasi agar volume stem konsisten
    let peak = 0
    for (let i = 0; i < left.length; i++) {
        const absL = Math.abs(left[i])
        const absR = Math.abs(right[i])
        if (absL > peak) peak = absL
        if (absR > peak) peak = absR
    }

    // Normalisasi audio ke 0.98 agar tidak pecah tapi tetap keras
    if (peak > 0 && peak < 0.98) {
        for (let i = 0; i < left.length; i++) {
            left[i] = (left[i] / peak) * 0.98
            right[i] = (right[i] / peak) * 0.98
        }
    }

    // PENTING: Gunakan sampleRate dari file asli (audioBuffer), bukan context.sampleRate
    // agar durasi dan visual sinkron
    const buffer = context.createBuffer(2, left.length, sampleRate)
    buffer.copyToChannel(left, 0)
    buffer.copyToChannel(right, 1)
    return buffer
}

export default function Header() {
    const fileInputRef =
        useRef<HTMLInputElement>(null)
    const {
        isSeparating,
        audioFile,
        audioBuffer,

        isPlaying,

        currentTime,
        duration,
        stemMode,

        setAudioFile,
        setAudioBuffer,
        setStemMode,

        setIsPlaying,
        setCurrentTime,
        setDuration,
        setStemBuffers,
        setWaveforms,
        setIsSeparated,
        isSeparated,
        stemBuffers,
        // Tambahkan setter yang dibutuhkan di sini agar tersedia di scope komponen
        setSeparating,
        setSeparationProgress,
        setSeparationStatus,
    } = useAudioStore()
    const [
        isExporting,
        setIsExporting,
    ] = useState(false)
    const [
        exportProgress,
        setExportProgress,
    ] = useState(0)
    const [
        exportStatus,
        setExportStatus,
    ] = useState('Preparing export...')

    const isSafariBrowser =
        typeof navigator !== 'undefined' &&
        /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(
            navigator.userAgent,
        )

    // async function handleSeparate() {
    //     if (!audioBuffer) return

    //     setIsSeparating(true)

    //     const leftChannel =
    //         new Float32Array(
    //             audioBuffer.getChannelData(0),
    //         )

    //     const rightChannel =
    //         audioBuffer.numberOfChannels > 1
    //             ? new Float32Array(
    //                 audioBuffer.getChannelData(1),
    //             )
    //             : new Float32Array(
    //                 audioBuffer.getChannelData(0),
    //             )

    //     separatorWorker.postMessage({
    //         type: 'SEPARATE',

    //         leftChannel,
    //         rightChannel,
    //     })
    // }

    async function handleSeparate() {
        if (!audioBuffer) return
        if (isSafariBrowser) {
            console.warn(
                '[StemMix UI] Stem splitting is disabled in Safari because Safari may reload the tab during Demucs processing due to memory or energy limits.',
            )
            return
        }

        if (stemMode === '2stem') {
            mixerEngine.stopAll()
            setIsPlaying(false)
        }

        // UI LOCK
        setSeparating(true)

        setSeparationProgress(0)

        setSeparationStatus(
            'Preparing audio buffer...',
        )

        // Small delay for smoother UX
        await new Promise((resolve) =>
            setTimeout(resolve, 250),
        )

        const leftChannel =
            new Float32Array(
                audioBuffer.getChannelData(0),
            )

        setSeparationProgress(12)

        setSeparationStatus(
            'Extracting left channel...',
        )

        const rightChannel =
            audioBuffer.numberOfChannels > 1
                ? new Float32Array(
                    audioBuffer.getChannelData(
                        1,
                    ),
                )
                : new Float32Array(
                    audioBuffer.getChannelData(
                        0,
                    ),
                )

        setSeparationProgress(35)

        setSeparationStatus(
            'Analyzing frequency spectrum...',
        )

        // Small delay for analysis phase simulation
        await new Promise((resolve) =>
            setTimeout(resolve, 400),
        )

        setSeparationProgress(45)
        setSeparationStatus(
            'Initializing AI models...',
        )

        // Gunakan Transferable Objects untuk performa lebih baik (menghindari cloning data)
        separatorWorker.postMessage(
            {
                type: 'SEPARATE',
                stemMode,
                leftChannel,
                rightChannel,
            },
            [leftChannel.buffer, rightChannel.buffer]
        )
    }

    async function handleUpload(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        const input = e.currentTarget
        const file = input.files?.[0]

        input.value = ''

        if (!file) return

        // FULL RESET
        audioEngine.reset()

        setIsPlaying(false)

        setCurrentTime(0)

        setDuration(0)

        setAudioBuffer(null)

        setIsSeparated(false)

        setStemBuffers({
            vocals: null,
            instrumental: null,
            drums: null,
            bass: null,
            other: null,
        })

        setWaveforms({
            vocals: [],
            instrumental: [],
            drums: [],
            bass: [],
            other: [],
        })

        setAudioFile(file)

        try {
            const buffer =
                await audioEngine.decodeFile(file)

            setAudioBuffer(buffer)

            const context =
                audioEngine.getContext()

            if (context) {
                mixerEngine.init(context)

                const state =
                    useAudioStore.getState()

                state.tracks.forEach((track) => {
                        mixerEngine.createTrack(
                            track.id,
                        )

                        mixerEngine.setFxEnabled(
                            track.id,
                            track.fxEnabled,
                        )

                        mixerEngine.setEq(
                            track.id,
                            state.trackEq[track.id] ?? {
                                low: 0,
                                mid: 0,
                                high: 0,
                            },
                        )

                        mixerEngine.setCompressor(
                            track.id,
                            state.trackCompressor[
                            track.id
                            ] ?? {
                                threshold: 0,
                                ratio: 1,
                                attack: 0.01,
                                release: 0.25,
                                makeup: 0,
                            },
                        )

                        mixerEngine.setReverb(
                            track.id,
                            state.trackReverb[
                            track.id
                            ] ?? {
                                mix: 0,
                                decay: 2.4,
                                size: 0.65,
                                damping: 0.48,
                                preDelay: 0.022,
                                width: 0.88,
                            },
                        )
                    })

                mixerEngine.setLimiter(
                    state.masterLimiter,
                )
            }

            setDuration(buffer.duration)

            setCurrentTime(0)
        } catch (err) {
            console.error('[StemMix UI] Failed to process uploaded audio', err)
        }
    }

    function startPlayback(startAt: number) {
        if (!audioBuffer) return

        const tracks =
            useAudioStore.getState().tracks
        const activeStemIds =
            getStemsForMode(
                useAudioStore.getState().stemMode,
            ).map((stem) => stem.id)

        const {
            stemBuffers,
        } = useAudioStore.getState()

        // tracks.forEach((track) => {
        //     const stem =
        //         stemBuffers[
        //         track.id as keyof typeof stemBuffers
        //         ]

        //     mixerEngine.playTrack(
        //         track.id,
        //         stem || audioBuffer,
        //     )
        // })

        const hasSeparated =
            Object.values(
                stemBuffers,
            ).some(Boolean)

        const safeStartAt = Math.min(
            Math.max(
                startAt,
                0,
            ),
            Math.max(
                audioBuffer.duration - 0.001,
                0,
            ),
        )

        // AFTER SEPARATION
        if (hasSeparated) {
            tracks
                .filter((track) =>
                    activeStemIds.includes(track.id),
                )
                .forEach((track) => {
                const stem =
                    stemBuffers[
                    track.id as keyof typeof stemBuffers
                    ]

                mixerEngine.playTrack(
                    track.id,
                    stem,
                    safeStartAt,
                )
            })
        }

        // BEFORE SEPARATION
        else {
            mixerEngine.playTrack(
                'other',
                audioBuffer,
                safeStartAt,
            )
        }

        setCurrentTime(safeStartAt)

        setIsPlaying(true)
    }

    function handlePlayPause() {
        if (!audioBuffer) return

        if (isPlaying) {
            mixerEngine.stopAll()

            setIsPlaying(false)

            return
        }

        startPlayback(currentTime)
    }

    function handleSeek(
        e: React.ChangeEvent<HTMLInputElement>,
    ) {
        if (!audioBuffer) return

        const nextTime = Number(e.target.value)

        seekTo(nextTime)
    }

    function seekTo(nextTime: number) {
        if (!audioBuffer) return

        const safeTime = Math.min(
            Math.max(
                nextTime,
                0,
            ),
            Math.max(
                audioBuffer.duration - 0.001,
                0,
            ),
        )

        setCurrentTime(safeTime)

        if (!isPlaying) return

        mixerEngine.stopAll()

        startPlayback(safeTime)
    }

    function handleSkip(seconds: number) {
        seekTo(currentTime + seconds)
    }

    async function handleExport() {
        if (
            !audioFile ||
            !audioBuffer ||
            !isSeparated ||
            isExporting
        ) {
            return
        }

        const state =
            useAudioStore.getState()

        if (!hasCompleteStemSet(state.stemBuffers, state.stemMode)) {
            setIsExporting(true)
            setExportProgress(0)
            setExportStatus(
                'Export unavailable. Please split stems again.',
            )

            window.setTimeout(() => {
                setIsExporting(false)
                setExportStatus(
                    'Preparing export...',
                )
            }, 1800)

            return
        }

        try {
            setIsExporting(true)
            setExportProgress(4)
            setExportStatus(
                'Collecting current mixer settings...',
            )

            await new Promise<void>((resolve) => {
                requestAnimationFrame(() =>
                    resolve(),
                )
            })

            const blob = await renderStemMix({
                audioBuffer,
                stemBuffers: state.stemBuffers,
                stemMode: state.stemMode,
                tracks: state.tracks,
                trackEq: state.trackEq,
                trackCompressor:
                    state.trackCompressor,
                trackReverb: state.trackReverb,
                masterLimiter:
                    state.masterLimiter,
                onProgress: (
                    progress,
                    status,
                ) => {
                    setExportProgress(progress)
                    setExportStatus(status)
                },
            })

            const url =
                URL.createObjectURL(blob)
            const link =
                document.createElement('a')

            link.href = url
            link.download = getExportFileName(
                audioFile.name,
            )
            link.style.display = 'none'

            document.body.appendChild(link)
            link.click()
            link.remove()

            setExportProgress(100)
            setExportStatus(
                'WAV download started.',
            )

            window.setTimeout(() => {
                URL.revokeObjectURL(url)
            }, 1500)

            window.setTimeout(() => {
                setIsExporting(false)
                setExportProgress(0)
                setExportStatus(
                    'Preparing export...',
                )
            }, 900)
        } catch (error) {
            console.error(error)

            setExportStatus(
                'Export failed. Please try again.',
            )

            window.setTimeout(() => {
                setIsExporting(false)
                setExportProgress(0)
            }, 1800)
        }
    }

    useAnimationFrame(() => {
        if (!mixerEngine.getIsPlaying())
            return

        const time =
            mixerEngine.getCurrentTime()

        if (
            audioBuffer &&
            time >= audioBuffer.duration
        ) {
            mixerEngine.stopAll()

            setIsPlaying(false)

            setCurrentTime(0)

            return
        }

        setCurrentTime(time)
    })

    const progress =
        duration > 0
            ? Math.min(
                (currentTime / duration) * 100,
                100,
            )
            : 0

    function formatTime(time: number) {
        const mins = Math.floor(time / 60)

        const secs = Math.floor(time % 60)

        return `${mins
            .toString()
            .padStart(2, '0')}:${secs
                .toString()
                .padStart(2, '0')}`
    }

    useEffect(() => {
        separatorWorker.onmessage = async (
            event: MessageEvent<SeparationWorkerMessage>,
        ) => {
            const { type, stems, progress, status, message, error } =
                event.data

            // Tangani update progress dari worker
            if (type === 'progress' || type === 'PROGRESS') {
                const calculatedProgress = progress !== undefined
                    ? Math.floor(
                        Math.min(
                            100,
                            Math.max(
                                0,
                                progress,
                            ),
                        ),
                    )
                    : undefined

                if (calculatedProgress !== undefined) setSeparationProgress(calculatedProgress)
                const nextStatus = status ?? message
                if (nextStatus) setSeparationStatus(nextStatus)
                return
            }

            if (
                type === 'SEPARATION_SUCCESS'
            ) {
                console.info('[StemMix UI] Separation success received from worker')

                if (!audioBuffer) return

                // Mapping stems secara dinamis untuk menghindari kesalahan penulisan key
                const activeStemMode =
                    useAudioStore.getState().stemMode

                if (activeStemMode === '2stem') {
                    mixerEngine.stopAll()
                    setIsPlaying(false)
                }

                const stemKeys =
                    getStemsForMode(activeStemMode).map(
                        (stem) => stem.id as StemKey,
                    )
                const newBuffers: Record<StemKey, AudioBuffer | null> = {
                    vocals: null,
                    instrumental: null,
                    drums: null,
                    bass: null,
                    other: null,
                }
                const newWaveforms: Record<StemKey, number[]> = {
                    vocals: [],
                    instrumental: [],
                    drums: [],
                    bass: [],
                    other: [],
                }

                stemKeys.forEach(key => {
                    const data = stems?.[key]
                    if (data) {
                        // 1. Hitung jumlah sampel yang dibutuhkan untuk durasi yang sama pada 44.1kHz
                        const targetLength = Math.floor(audioBuffer.duration * 44100)
                        
                        // 2. Siapkan array dengan panjang yang tepat (mencegah masalah 3/4 durasi)
                        const finalLeft = new Float32Array(targetLength)
                        const finalRight = new Float32Array(targetLength)
                        
                        // 3. Salin data dari AI (jika AI lebih pendek, sisanya otomatis sunyi/zero-padded)
                        finalLeft.set(data.left.slice(0, targetLength))
                        finalRight.set(data.right.slice(0, targetLength))

                        const buffer = createStemBuffer(finalLeft, finalRight, 44100)
                        newBuffers[key] = buffer
                        
                        // 4. Gunakan resolusi lebih tinggi (3000) agar tidak terlihat titik-titik
                        newWaveforms[key] = buffer ? generateWaveform(buffer, 3000) : []
                    }
                })

                setStemBuffers(newBuffers)
                // Cukup panggil sekali dengan object hasil mapping di atas
                setWaveforms(newWaveforms)

                setIsSeparated(true)

                setSeparating(false)
            }

            if (
                type === 'SEPARATION_ERROR'
            ) {
                console.error(
                    '[StemMix UI] Separation error received from worker',
                    error ?? message,
                )

                setSeparating(false)
            }
        }

        // Cleanup listener saat komponen unmount
        return () => {
            separatorWorker.onmessage = null
        }
    }, [
        audioBuffer, // Penting: Agar closure di onmessage diperbarui saat audioBuffer terisi
        setStemBuffers,
        setWaveforms,
        setIsSeparated,
        setSeparating,
        setSeparationProgress,
        setSeparationStatus,
        stemMode,
    ])

    const canExport =
        Boolean(audioBuffer) &&
        isSeparated &&
        hasCompleteStemSet(stemBuffers, stemMode) &&
        !isSeparating &&
        !isExporting

    return (
        <>
        <header className="sticky inset-x-0 top-0 z-[999] border-b border-white/[0.08] bg-[#05070d]/94 shadow-[0_22px_55px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
            <div className="mx-auto flex max-w-[1850px] flex-col gap-3 px-5 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex min-w-[360px] items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_18px_45px_-28px_rgba(34,211,238,0.8)]">
                            <img src="/logo.svg" alt="" className="h-10 w-10" />
                        </div>

                        <div className="min-w-0">
                            <div className="text-[20px] font-black tracking-tight text-white">
                                Master Audio
                            </div>

                            <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                                <span
                                    className={[
                                        'h-2 w-2 rounded-full',
                                        audioBuffer
                                            ? 'bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.75)]'
                                            : 'bg-zinc-600',
                                    ].join(' ')}
                                />
                                <span>
                                    StemMix Studio
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[15px] font-medium text-zinc-100">
                                {audioFile
                                    ? audioFile.name
                                    : 'Drop in an audio file'}
                                    &nbsp;&nbsp;&nbsp;
                                    <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                                    {audioBuffer
                                        ? `${Math.floor(duration)}s `
                                        : '--'}
                                </span>
                                <span className="h-1 w-3 rounded-full bg-zinc-700" />
                                <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                                    {audioBuffer
                                        ? `${audioBuffer.sampleRate} Hz`
                                        : '-- Hz'}
                                </span>
                            </div>
                            {/*         
                            <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-zinc-600">
                                <span>
                                    {audioBuffer
                                        ? `${Math.floor(duration)}s`
                                        : '--'}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                                <span>
                                    {audioBuffer
                                        ? `${audioBuffer.sampleRate} Hz`
                                        : '-- Hz'}
                                </span>
                            </div>
                            */}
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onClick={(event) => {
                            event.currentTarget.value = ''
                        }}
                        onChange={handleUpload}
                    />

                    <div className="flex items-center gap-2">
                        <Tooltip
                            content="Return to the Master Audio landing page."
                            side="bottom"
                        >
                            <a
                                href="/"
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-300 transition-all duration-200 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-cyan-100"
                                aria-label="Back to home"
                            >
                                <Home size={15} />
                                Home
                            </a>
                        </Tooltip>

                        <Tooltip
                            content="Upload the audio source you want to split into stems."
                            side="bottom"
                        >
                            <Button
                                disabled={isSeparating || isExporting}
                                onClick={() => {
                                    if (isSeparating || isExporting) return

                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = ''
                                        fileInputRef.current.click()
                                    }
                                }}
                                className={[
                                    'inline-flex h-11 items-center gap-2 rounded-xl px-4',
                                    isSeparating || isExporting
                                        ? 'cursor-not-allowed opacity-45'
                                        : '',
                                ].join(' ')}
                            >
                                <Upload size={15} />
                                Upload
                            </Button>
                        </Tooltip>

                        <Tooltip
                            content="Render the final mix to a WAV file using the current controls."
                            side="bottom"
                        >
                            <Button
                                onClick={handleExport}
                                disabled={!canExport}
                                className={[
                                    'inline-flex h-11 items-center gap-2 rounded-xl px-4',
                                    !canExport
                                        ? 'cursor-not-allowed opacity-45'
                                        : 'border-emerald-300/15 bg-emerald-300/10 text-emerald-100 hover:border-emerald-300/25 hover:bg-emerald-300/15',
                                ].join(' ')}
                            >
                                <Download size={15} />
                                {isExporting
                                    ? 'Exporting'
                                    : 'Export'}
                            </Button>
                        </Tooltip>

                        <Tooltip
                            content="Choose the separation mode. 2 Channel keeps vocals and merges drums, bass, and other into instrumental; 4 Channel keeps all stems separate. Changing this resets the current stem split."
                            side="bottom"
                        >
                            <label className="relative flex h-11 items-center rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 transition-all hover:border-cyan-300/20 hover:bg-cyan-300/[0.06]">
                                <span className="mr-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                    Mode
                                </span>

                                <select
                                    value={stemMode}
                                    disabled={!audioBuffer || isSeparating}
                                    onChange={(event) => {
                                        const nextMode =
                                            event.currentTarget.value as StemMode

                                        if (nextMode === stemMode) return

                                        mixerEngine.stopAll()
                                        setIsPlaying(false)
                                        setCurrentTime(0)
                                        setStemMode(nextMode)
                                    }}
                                    className="h-full cursor-pointer appearance-none bg-transparent pr-7 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100 outline-none disabled:cursor-not-allowed disabled:opacity-45"
                                    aria-label="Stem separation mode"
                                >
                                    {stemModeOptions.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                            className="bg-[#0b1020] text-zinc-100"
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <span className="pointer-events-none absolute right-3 text-[10px] text-zinc-500">
                                    ▾
                                </span>
                            </label>
                        </Tooltip>

                        <Tooltip
                            content={isSafariBrowser
                                ? 'Stem splitting is disabled in Safari because Safari may reload the tab during heavy local AI processing. Please use Chrome or Edge.'
                                : stemMode === '2stem'
                                    ? 'Split with Demucs, then keep vocals and merge drums, bass, and other into instrumental.'
                                    : 'Split the audio into vocals, drums, bass, and other stems.'}
                            side="bottom"
                        >
                            <Button
                                onClick={handleSeparate}
                                disabled={!audioBuffer || isSeparating || isSafariBrowser}
                                className={[
                                    'inline-flex h-11 items-center gap-2 rounded-xl px-4',
                                    !audioBuffer || isSeparating || isSafariBrowser
                                        ? 'cursor-not-allowed opacity-45'
                                        : 'border-cyan-300/15 bg-cyan-300/10 text-cyan-100 hover:border-cyan-300/25 hover:bg-cyan-300/15',
                                ].join(' ')}
                            >
                                <Scissors size={15} />
                                {isSeparating
                                    ? 'Separating'
                                    : 'Split Stems'}
                            </Button>
                        </Tooltip>
                    </div>
                </div>

                {isSafariBrowser && (
                    <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] px-4 py-3 text-[12px] leading-relaxed text-amber-100">
                        Safari may automatically reload tabs during heavy
                        browser-based AI stem splitting. For StemMix, please
                        use Chrome or Edge for safer processing.
                    </div>
                )}

                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#090d18]/95 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="flex items-center gap-2">
                        <Tooltip
                            content="Jump 5 seconds backward from the current playback position."
                        >
                            <button
                                onClick={() =>
                                    handleSkip(-5)
                                }
                                disabled={!audioBuffer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-500 transition-all hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Back 5 seconds"
                            >
                                <SkipBack size={16} />
                            </button>
                        </Tooltip>

                        <Tooltip
                            content={isPlaying
                                ? 'Pause playback.'
                                : 'Play the audio from the current time position.'}
                        >
                            <button
                                onClick={handlePlayPause}
                                disabled={!audioBuffer}
                                className={[
                                    'flex h-12 w-12 items-center justify-center rounded-full border transition-all',
                                    audioBuffer
                                        ? 'border-cyan-300/25 bg-cyan-300 text-black shadow-[0_0_30px_rgba(34,211,238,0.28)] hover:bg-cyan-200'
                                        : 'cursor-not-allowed border-white/[0.06] bg-zinc-800 text-zinc-500',
                                ].join(' ')}
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying
                                    ? <Pause size={18} fill="currentColor" />
                                    : <Play size={18} fill="currentColor" className="ml-0.5" />}
                            </button>
                        </Tooltip>

                        <Tooltip
                            content="Jump 5 seconds forward from the current playback position."
                        >
                            <button
                                onClick={() =>
                                    handleSkip(5)
                                }
                                disabled={!audioBuffer}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-500 transition-all hover:border-white/[0.12] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Forward 5 seconds"
                            >
                                <SkipForward size={16} />
                            </button>
                        </Tooltip>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Tooltip
                            content="Drag to seek to a specific time in the audio."
                            className="block flex-1"
                        >
                        <div className="relative h-8">
                            <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>

                            <div
                                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow-[0_0_18px_rgba(255,255,255,0.28)]"
                                style={{
                                    left: `${progress}%`,
                                }}
                            />

                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                step={0.01}
                                value={currentTime}
                                disabled={!audioBuffer}
                                onChange={handleSeek}
                                aria-label="Seek playback position"
                                className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
                            />
                        </div>
                        </Tooltip>

                        <div className="min-w-[112px] text-right text-[12px] font-medium tabular-nums tracking-[0.08em] text-zinc-400">
                            {formatTime(currentTime)} /{' '}
                            {formatTime(duration)}
                        </div>
                    </div>
                </div>
            </div>
        </header>
        {isExporting && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/72 backdrop-blur-xl">
                <div className="relative w-[460px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-b from-[#111827] via-[#0d1320] to-[#090d18] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                    <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.18),transparent_72%)]" />

                    <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10">
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-emerald-300" />

                        <Download
                            size={24}
                            className="text-emerald-200"
                        />
                    </div>

                    <div className="relative mt-6 text-center">
                        <h2 className="text-[24px] font-black tracking-tight text-white">
                            Exporting Final Mix
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            Rendering stems with current volume, pan, EQ,
                            compressor, reverb, and limiter settings into a
                            release-safe WAV file.
                        </p>
                    </div>

                    <div className="relative mt-8">
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-400">
                            <span>
                                {exportStatus}
                            </span>

                            <span>
                                {Math.round(
                                    exportProgress,
                                )}
                                %
                            </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-400 shadow-[0_0_24px_rgba(52,211,153,0.42)] transition-[width] duration-300 ease-out"
                                style={{
                                    width: `${exportProgress}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-[11px] tracking-[0.14em] text-zinc-500">
                        <div className="h-[5px] w-[5px] animate-pulse rounded-full bg-emerald-300" />
                        DOWNLOAD WILL START AUTOMATICALLY
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

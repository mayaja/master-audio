import type {
    MasterLimiter,
    Track,
    TrackCompressor,
    TrackEq,
    TrackReverb,
} from '@/stemmix/stores/useAudioStore'

type StemBuffers = {
    vocals: AudioBuffer | null
    drums: AudioBuffer | null
    bass: AudioBuffer | null
    other: AudioBuffer | null
}

const requiredStemIds: Array<keyof StemBuffers> = [
    'vocals',
    'drums',
    'bass',
    'other',
]

type ExportMixOptions = {
    audioBuffer: AudioBuffer
    stemBuffers: StemBuffers
    tracks: Track[]
    trackEq: Record<string, TrackEq>
    trackCompressor: Record<string, TrackCompressor>
    trackReverb: Record<string, TrackReverb>
    masterLimiter: MasterLimiter
    onProgress?: (
        progress: number,
        status: string,
    ) => void
}

const defaultEq: TrackEq = {
    low: 0,
    mid: 0,
    high: 0,
}

const defaultCompressor: TrackCompressor = {
    threshold: 0,
    ratio: 1,
    attack: 0.01,
    release: 0.25,
    makeup: 0,
}

const defaultReverb: TrackReverb = {
    mix: 0,
    decay: 2.4,
    size: 0.65,
    damping: 0.48,
    preDelay: 0.022,
    width: 0.88,
}

function dbToGain(value: number) {
    return Math.pow(10, value / 20)
}

function clamp(
    value: number,
    min: number,
    max: number,
) {
    return Math.min(
        max,
        Math.max(
            min,
            value,
        ),
    )
}

function getDampingFrequency(value: number) {
    const damping = clamp(
        value,
        0,
        1,
    )

    return 12000 - damping * 9500
}

function createReverbImpulse(
    context: BaseAudioContext,
    decay: number,
    size: number,
) {
    const length = Math.max(
        1,
        Math.floor(
            context.sampleRate *
            Math.max(
                0.1,
                decay,
            ),
        ),
    )

    const impulse = context.createBuffer(
        2,
        length,
        context.sampleRate,
    )

    const roomSize = clamp(
        size,
        0,
        1,
    )

    for (let channel = 0; channel < 2; channel++) {
        const data =
            impulse.getChannelData(channel)

        for (let i = 0; i < length; i++) {
            const progress = i / length

            const envelope = Math.pow(
                1 - progress,
                1.6 - roomSize * 0.7,
            )

            data[i] =
                (Math.random() * 2 - 1) *
                envelope *
                (0.55 + roomSize * 0.45)
        }
    }

    return impulse
}

function writeString(
    view: DataView,
    offset: number,
    value: string,
) {
    for (let i = 0; i < value.length; i++) {
        view.setUint8(
            offset + i,
            value.charCodeAt(i),
        )
    }
}

export function encodeWav(buffer: AudioBuffer) {
    const numberOfChannels = 2
    const length = buffer.length
    const bytesPerSample = 2
    const blockAlign =
        numberOfChannels * bytesPerSample
    const byteRate =
        buffer.sampleRate * blockAlign
    const dataSize = length * blockAlign
    const wavBuffer = new ArrayBuffer(
        44 + dataSize,
    )
    const view = new DataView(wavBuffer)
    const left = buffer.getChannelData(0)
    const right =
        buffer.numberOfChannels > 1
            ? buffer.getChannelData(1)
            : left

    writeString(
        view,
        0,
        'RIFF',
    )
    view.setUint32(
        4,
        36 + dataSize,
        true,
    )
    writeString(
        view,
        8,
        'WAVE',
    )
    writeString(
        view,
        12,
        'fmt ',
    )
    view.setUint32(
        16,
        16,
        true,
    )
    view.setUint16(
        20,
        1,
        true,
    )
    view.setUint16(
        22,
        numberOfChannels,
        true,
    )
    view.setUint32(
        24,
        buffer.sampleRate,
        true,
    )
    view.setUint32(
        28,
        byteRate,
        true,
    )
    view.setUint16(
        32,
        blockAlign,
        true,
    )
    view.setUint16(
        34,
        bytesPerSample * 8,
        true,
    )
    writeString(
        view,
        36,
        'data',
    )
    view.setUint32(
        40,
        dataSize,
        true,
    )

    let offset = 44

    for (let i = 0; i < length; i++) {
        const leftSample = clamp(
            left[i],
            -1,
            1,
        )
        const rightSample = clamp(
            right[i],
            -1,
            1,
        )

        view.setInt16(
            offset,
            leftSample < 0
                ? leftSample * 0x8000
                : leftSample * 0x7fff,
            true,
        )
        offset += 2

        view.setInt16(
            offset,
            rightSample < 0
                ? rightSample * 0x8000
                : rightSample * 0x7fff,
            true,
        )
        offset += 2
    }

    return new Blob(
        [wavBuffer],
        {
            type: 'audio/wav',
        },
    )
}

export async function renderStemMix({
    audioBuffer,
    stemBuffers,
    tracks,
    trackEq,
    trackCompressor,
    trackReverb,
    masterLimiter,
    onProgress,
}: ExportMixOptions) {
    if (!hasCompleteStemSet(stemBuffers)) {
        throw new Error(
            'Cannot export before all stems are ready.',
        )
    }

    onProgress?.(
        10,
        'Preparing offline mixer...',
    )

    const duration = Math.max(
        audioBuffer.duration,
        ...Object.values(stemBuffers)
            .filter(Boolean)
            .map((buffer) => buffer!.duration),
    )
    const sampleRate = audioBuffer.sampleRate
    const context = new OfflineAudioContext(
        2,
        Math.max(
            1,
            Math.ceil(duration * sampleRate),
        ),
        sampleRate,
    )
    const hasSolo = tracks.some(
        (track) => track.solo,
    )
    const masterGain = context.createGain()
    const limiterInput = context.createGain()
    const limiter =
        context.createDynamicsCompressor()
    const limiterOutput = context.createGain()

    limiterInput.gain.value = dbToGain(
        masterLimiter.drive,
    )
    limiter.threshold.value =
        masterLimiter.threshold
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.003
    limiter.release.value =
        masterLimiter.release
    limiterOutput.gain.value = dbToGain(
        masterLimiter.ceiling,
    )

    masterGain.connect(limiterInput)
    limiterInput.connect(limiter)
    limiter.connect(limiterOutput)
    limiterOutput.connect(context.destination)

    tracks.forEach((track, index) => {
        const stem =
            stemBuffers[
            track.id as keyof StemBuffers
            ]

        if (!stem) return

        const eq =
            trackEq[track.id] ?? defaultEq
        const compressor =
            trackCompressor[track.id] ??
            defaultCompressor
        const reverb =
            trackReverb[track.id] ??
            defaultReverb
        const source =
            context.createBufferSource()
        const eqLow = context.createBiquadFilter()
        const eqMid = context.createBiquadFilter()
        const eqHigh = context.createBiquadFilter()
        const compressorNode =
            context.createDynamicsCompressor()
        const compressorMakeup =
            context.createGain()
        const reverbDry = context.createGain()
        const reverbWet = context.createGain()
        const reverbPreDelay =
            context.createDelay(0.2)
        const reverbConvolver =
            context.createConvolver()
        const reverbDamping =
            context.createBiquadFilter()
        const reverbWidth =
            context.createStereoPanner()
        const trackGain = context.createGain()
        const pan = context.createStereoPanner()
        const mix = clamp(
            reverb.mix,
            0,
            1,
        )

        let effectiveGain = track.volume

        if (hasSolo) {
            effectiveGain = track.solo
                ? track.volume
                : 0
        } else if (track.mute) {
            effectiveGain = 0
        }

        source.buffer = stem

        eqLow.type = 'lowshelf'
        eqLow.frequency.value = 120
        eqLow.gain.value = eq.low

        eqMid.type = 'peaking'
        eqMid.frequency.value = 1000
        eqMid.Q.value = 1
        eqMid.gain.value = eq.mid

        eqHigh.type = 'highshelf'
        eqHigh.frequency.value = 8000
        eqHigh.gain.value = eq.high

        compressorNode.threshold.value =
            compressor.threshold
        compressorNode.knee.value = 0
        compressorNode.ratio.value =
            compressor.ratio
        compressorNode.attack.value =
            compressor.attack
        compressorNode.release.value =
            compressor.release
        compressorMakeup.gain.value = dbToGain(
            compressor.makeup,
        )

        reverbDry.gain.value = 1 - mix * 0.55
        reverbWet.gain.value = mix
        reverbPreDelay.delayTime.value =
            reverb.preDelay
        reverbConvolver.buffer =
            createReverbImpulse(
                context,
                reverb.decay,
                reverb.size,
            )
        reverbDamping.type = 'lowpass'
        reverbDamping.frequency.value =
            getDampingFrequency(
                reverb.damping,
            )
        reverbWidth.pan.value =
            (reverb.width - 0.5) * 0.35

        trackGain.gain.value = effectiveGain
        pan.pan.value = track.pan

        source.connect(eqLow)
        eqLow.connect(eqMid)
        eqMid.connect(eqHigh)
        eqHigh.connect(compressorNode)
        compressorNode.connect(compressorMakeup)
        compressorMakeup.connect(reverbDry)
        compressorMakeup.connect(reverbPreDelay)
        reverbPreDelay.connect(reverbConvolver)
        reverbConvolver.connect(reverbDamping)
        reverbDamping.connect(reverbWet)
        reverbWet.connect(reverbWidth)
        reverbDry.connect(trackGain)
        reverbWidth.connect(trackGain)
        trackGain.connect(pan)
        pan.connect(masterGain)

        source.start(0)

        onProgress?.(
            18 + Math.round(index * 8),
            `Rendering ${track.name} chain...`,
        )
    })

    onProgress?.(
        62,
        'Rendering final stereo mix...',
    )

    const rendered =
        await context.startRendering()

    onProgress?.(
        86,
        'Encoding WAV file...',
    )

    const blob = encodeWav(rendered)

    onProgress?.(
        96,
        'Preparing download...',
    )

    return blob
}

export function getExportFileName(
    fileName: string,
) {
    const dotIndex = fileName.lastIndexOf('.')

    if (dotIndex <= 0) {
        return `${fileName}-stemmix.wav`
    }

    const baseName = fileName.slice(
        0,
        dotIndex,
    )

    return `${baseName}-stemmix.wav`
}

export function hasCompleteStemSet(
    stemBuffers: StemBuffers,
) {
    return requiredStemIds.every(
        (id) => stemBuffers[id],
    )
}

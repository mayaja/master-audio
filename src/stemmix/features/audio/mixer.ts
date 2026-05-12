type TrackNodes = {
    source: AudioBufferSourceNode | null

    gain: GainNode

    pan: StereoPannerNode

    eqLow: BiquadFilterNode

    eqMid: BiquadFilterNode

    eqHigh: BiquadFilterNode

    compressor: DynamicsCompressorNode

    compressorMakeup: GainNode

    reverbDry: GainNode

    reverbWet: GainNode

    reverbPreDelay: DelayNode

    reverbConvolver: ConvolverNode

    reverbDamping: BiquadFilterNode

    reverbWidth: StereoPannerNode

    fxEnabled: boolean

    analyser: AnalyserNode

    meterData: Uint8Array<ArrayBuffer>
}

type MeterCache = {
    value: number
    updatedAt: number
}

type MasterMeterCache = {
    left: number
    right: number
    peakDb: number
    integratedLufs: number | null
    updatedAt: number
}

const METER_INTERVAL_MS = 50

class MixerEngine {
    private context: AudioContext | null =
        null

    private tracks =
        new Map<string, TrackNodes>()

    private masterGain: GainNode | null =
        null

    private limiterInput: GainNode | null =
        null

    private limiter: DynamicsCompressorNode | null =
        null

    private limiterOutput: GainNode | null =
        null

    private startedAt = 0

    private isPlaying = false

    private meterLevels =
        new Map<string, number>()

    private meterCache =
        new Map<string, MeterCache>()

    private masterMeterCache: MasterMeterCache = {
        left: 0,
        right: 0,
        peakDb: -Infinity,
        integratedLufs: null,
        updatedAt: 0,
    }

    private integratedLoudnessSum = 0

    private integratedLoudnessFrames = 0

    private masterPeak = 0

    private masterLeftData: Float32Array<ArrayBuffer> | null =
        null

    private masterRightData: Float32Array<ArrayBuffer> | null =
        null

    masterLeftAnalyser?: AnalyserNode

    masterRightAnalyser?: AnalyserNode

    async init(context: AudioContext) {
        this.stopAll()

        this.tracks.clear()

        this.context = context

        this.masterGain =
            context.createGain()

        this.limiterInput =
            context.createGain()

        this.limiter =
            context.createDynamicsCompressor()

        this.limiterOutput =
            context.createGain()

        this.limiterInput.gain.value = 1

        this.limiter.threshold.value = -1

        this.limiter.knee.value = 0

        this.limiter.ratio.value = 20

        this.limiter.attack.value = 0.003

        this.limiter.release.value = 0.1

        this.limiterOutput.gain.value =
            Math.pow(
                10,
                -1 / 20,
            )

        // MASTER ANALYSER
        const splitter =
            context.createChannelSplitter(2)

        this.masterLeftAnalyser =
            context.createAnalyser()

        this.masterRightAnalyser =
            context.createAnalyser()

        this.masterLeftAnalyser.fftSize =
            512

        this.masterRightAnalyser.fftSize =
            512

        this.masterLeftAnalyser.smoothingTimeConstant =
            0.88

        this.masterRightAnalyser.smoothingTimeConstant =
            0.88

        this.masterLeftData =
            new Float32Array(
                this.masterLeftAnalyser.fftSize,
            ) as Float32Array<ArrayBuffer>

        this.masterRightData =
            new Float32Array(
                this.masterRightAnalyser.fftSize,
            ) as Float32Array<ArrayBuffer>

        this.meterCache.clear()

        this.masterMeterCache = {
            left: 0,
            right: 0,
            peakDb: -Infinity,
            integratedLufs: null,
            updatedAt: 0,
        }

        this.resetMasterStats()

        this.masterGain.connect(
            this.limiterInput,
        )

        this.limiterInput.connect(
            this.limiter,
        )

        this.limiter.connect(
            this.limiterOutput,
        )

        this.limiterOutput.connect(splitter)

        splitter.connect(
            this.masterLeftAnalyser,
            0,
        )

        splitter.connect(
            this.masterRightAnalyser,
            1,
        )

        this.limiterOutput.connect(
            context.destination,
        )
    }

    createTrack(id: string) {
        if (!this.context) return

        if (this.tracks.has(id)) return

        const gain =
            this.context.createGain()

        const analyser =
            this.context.createAnalyser()

        analyser.fftSize = 128

        analyser.smoothingTimeConstant =
            0.85

        const pan =
            this.context.createStereoPanner()

        const eqLow =
            this.context.createBiquadFilter()

        const eqMid =
            this.context.createBiquadFilter()

        const eqHigh =
            this.context.createBiquadFilter()

        const compressor =
            this.context.createDynamicsCompressor()

        const compressorMakeup =
            this.context.createGain()

        const reverbDry =
            this.context.createGain()

        const reverbWet =
            this.context.createGain()

        const reverbPreDelay =
            this.context.createDelay(0.2)

        const reverbConvolver =
            this.context.createConvolver()

        const reverbDamping =
            this.context.createBiquadFilter()

        const reverbWidth =
            this.context.createStereoPanner()

        eqLow.type = 'lowshelf'

        eqLow.frequency.value = 120

        eqLow.gain.value = 0

        eqMid.type = 'peaking'

        eqMid.frequency.value = 1000

        eqMid.Q.value = 1

        eqMid.gain.value = 0

        eqHigh.type = 'highshelf'

        eqHigh.frequency.value = 8000

        eqHigh.gain.value = 0

        compressor.threshold.value = 0

        compressor.knee.value = 0

        compressor.ratio.value = 1

        compressor.attack.value = 0.01

        compressor.release.value = 0.25

        compressorMakeup.gain.value = 1

        reverbDry.gain.value = 1

        reverbWet.gain.value = 0

        reverbPreDelay.delayTime.value = 0.022

        reverbConvolver.buffer =
            this.createReverbImpulse(
                2.4,
                0.65,
            )

        reverbDamping.type = 'lowpass'

        reverbDamping.frequency.value =
            this.getDampingFrequency(0.48)

        reverbWidth.pan.value = 0.15

        eqLow.connect(eqMid)

        eqMid.connect(eqHigh)

        eqHigh.connect(compressor)

        compressor.connect(compressorMakeup)

        compressorMakeup.connect(reverbDry)

        compressorMakeup.connect(reverbPreDelay)

        reverbPreDelay.connect(reverbConvolver)

        reverbConvolver.connect(reverbDamping)

        reverbDamping.connect(reverbWet)

        reverbWet.connect(reverbWidth)

        reverbDry.connect(gain)

        reverbWidth.connect(gain)

        gain.connect(analyser)

        analyser.connect(pan)

        pan.connect(this.masterGain!)

        this.tracks.set(id, {
            source: null,
            gain,
            pan,
            eqLow,
            eqMid,
            eqHigh,
            compressor,
            compressorMakeup,
            reverbDry,
            reverbWet,
            reverbPreDelay,
            reverbConvolver,
            reverbDamping,
            reverbWidth,
            fxEnabled: false,
            analyser,
            meterData: new Uint8Array(
                analyser.frequencyBinCount,
            ) as Uint8Array<ArrayBuffer>,
        })
    }

    playTrack(
        id: string,
        buffer: AudioBuffer | null,
        offset = 0,
    ) {
        if (!buffer) return

        if (!this.context) return

        const track =
            this.tracks.get(id)

        if (!track) return

        if (track.source) {
            try {
                track.source.stop()

                track.source.disconnect()
            } catch {
                // The source may already be stopped or disconnected.
            }
        }

        const source =
            this.context.createBufferSource()

        source.buffer = buffer

        const startOffset = Math.min(
            Math.max(
                offset,
                0,
            ),
            Math.max(
                buffer.duration - 0.001,
                0,
            ),
        )

        this.connectSourceToTrack(
            source,
            track,
        )

        source.start(0, startOffset)

        source.onended = () => {
            if (track.source !== source) {
                return
            }

            track.source = null

            const hasActive =
                Array.from(
                    this.tracks.values(),
                ).some(
                    (t) => t.source !== null,
                )

            if (!hasActive) {
                this.isPlaying = false

                this.startedAt = 0
            }
        }

        track.source = source

        this.isPlaying = true

        if (!this.startedAt) {
            this.resetMasterStats()

            this.startedAt =
                this.context.currentTime -
                startOffset
        }
    }

    stopAll() {
        this.tracks.forEach((track) => {
            try {
                track.source?.stop()

                track.source?.disconnect()
            } catch {
                // The source may already be stopped or disconnected.
            }

            track.source = null
        })

        this.isPlaying = false

        this.startedAt = 0

        this.resetMasterStats()
    }

    applyMixState(
        id: string,
        options: {
            volume: number
            mute: boolean
            solo: boolean
            hasSolo: boolean
        },
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        let gain = options.volume

        // SOLO MODE
        if (options.hasSolo) {
            gain = options.solo
                ? options.volume
                : 0
        }

        // NORMAL MUTE
        else if (options.mute) {
            gain = 0
        }

        track.gain.gain.value = gain
    }

    getCurrentTime() {
        if (
            !this.context ||
            !this.isPlaying
        ) {
            return 0
        }

        return (
            this.context.currentTime -
            this.startedAt
        )
    }

    getIsPlaying() {
        return this.isPlaying
    }

    setVolume(
        id: string,
        volume: number,
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        track.gain.gain.value = volume
    }

    setPan(
        id: string,
        value: number,
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        track.pan.pan.value = value
    }

    setFxEnabled(
        id: string,
        enabled: boolean,
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        track.fxEnabled = enabled

        if (!track.source) return

        try {
            track.source.disconnect()
        } catch {
            // The source may already be disconnected.
        }

        this.connectSourceToTrack(
            track.source,
            track,
        )
    }

    setEq(
        id: string,
        eq: {
            low: number
            mid: number
            high: number
        },
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        track.eqLow.gain.value = eq.low

        track.eqMid.gain.value = eq.mid

        track.eqHigh.gain.value = eq.high
    }

    setCompressor(
        id: string,
        compressor: {
            threshold: number
            ratio: number
            attack: number
            release: number
            makeup: number
        },
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        track.compressor.threshold.value =
            compressor.threshold

        track.compressor.ratio.value =
            compressor.ratio

        track.compressor.attack.value =
            compressor.attack

        track.compressor.release.value =
            compressor.release

        track.compressorMakeup.gain.value =
            Math.pow(
                10,
                compressor.makeup / 20,
            )
    }

    setReverb(
        id: string,
        reverb: {
            mix: number
            decay: number
            size: number
            damping: number
            preDelay: number
            width: number
        },
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        const mix = Math.min(
            1,
            Math.max(
                0,
                reverb.mix,
            ),
        )

        track.reverbDry.gain.value = 1 - mix * 0.55

        track.reverbWet.gain.value = mix

        track.reverbPreDelay.delayTime.value =
            reverb.preDelay

        track.reverbDamping.frequency.value =
            this.getDampingFrequency(
                reverb.damping,
            )

        track.reverbWidth.pan.value =
            (reverb.width - 0.5) * 0.35

        track.reverbConvolver.buffer =
            this.createReverbImpulse(
                reverb.decay,
                reverb.size,
            )
    }

    setLimiter(settings: {
        drive: number
        threshold: number
        ceiling: number
        release: number
    }) {
        if (
            !this.limiter ||
            !this.limiterInput ||
            !this.limiterOutput
        ) {
            return
        }

        this.limiterInput.gain.value =
            Math.pow(
                10,
                settings.drive / 20,
            )

        this.limiter.threshold.value =
            settings.threshold

        this.limiter.ratio.value = 20

        this.limiter.knee.value = 0

        this.limiter.attack.value = 0.003

        this.limiter.release.value =
            settings.release

        this.limiterOutput.gain.value =
            Math.pow(
                10,
                settings.ceiling / 20,
            )
    }

    getLimiterReduction() {
        return Math.abs(
            this.limiter?.reduction ?? 0,
        )
    }

    getMasterMeterLevel() {
        const now = performance.now()

        if (
            now - this.masterMeterCache.updatedAt <
            METER_INTERVAL_MS
        ) {
            return {
                left: this.masterMeterCache.left,
                right: this.masterMeterCache.right,
                peakDb: this.masterMeterCache.peakDb,
                integratedLufs:
                    this.masterMeterCache
                        .integratedLufs,
            }
        }

        if (
            !this.masterLeftAnalyser ||
            !this.masterRightAnalyser ||
            !this.masterLeftData ||
            !this.masterRightData
        ) {
            return {
                left: 0,
                right: 0,
                peakDb: -Infinity,
                integratedLufs: null,
            }
        }

        function analyzeChannel(
            analyser: AnalyserNode,
            buffer: Float32Array<ArrayBuffer>,
        ) {
            analyser.getFloatTimeDomainData(
                buffer,
            )

            let sumSquares = 0
            let peak = 0

            for (
                let i = 0;
                i < buffer.length;
                i++
            ) {
                const sample = buffer[i]
                const absSample = Math.abs(sample)

                sumSquares += sample * sample

                if (absSample > peak) {
                    peak = absSample
                }
            }

            const rms = Math.sqrt(
                sumSquares / buffer.length,
            )

            const level =
                Math.pow(
                    rms * 3.4,
                    0.82,
                )

            return {
                level: Math.min(level, 1),
                peak,
                meanSquare:
                    sumSquares / buffer.length,
            }
        }

        const leftAnalysis = analyzeChannel(
            this.masterLeftAnalyser,
            this.masterLeftData,
        )

        const rightAnalysis = analyzeChannel(
            this.masterRightAnalyser,
            this.masterRightData,
        )

        const blockPeak = Math.max(
            leftAnalysis.peak,
            rightAnalysis.peak,
        )

        this.masterPeak = Math.max(
            this.masterPeak,
            blockPeak,
        )

        const blockMeanSquare =
            (leftAnalysis.meanSquare +
                rightAnalysis.meanSquare) /
            2

        if (blockMeanSquare > 0) {
            this.integratedLoudnessSum +=
                blockMeanSquare

            this.integratedLoudnessFrames += 1
        }

        const integratedMeanSquare =
            this.integratedLoudnessFrames > 0
                ? this.integratedLoudnessSum /
                this.integratedLoudnessFrames
                : 0

        const integratedLufs =
            integratedMeanSquare > 0
                ? -0.691 +
                10 *
                Math.log10(
                    integratedMeanSquare,
                )
                : null

        const peakDb =
            this.masterPeak > 0
                ? 20 *
                Math.log10(
                    this.masterPeak,
                )
                : -Infinity

        this.masterMeterCache = {
            left: leftAnalysis.level,
            right: rightAnalysis.level,
            peakDb,
            integratedLufs,
            updatedAt: now,
        }

        return {
            left: leftAnalysis.level,
            right: rightAnalysis.level,
            peakDb,
            integratedLufs,
        }
    }

    resetMasterStats() {
        this.integratedLoudnessSum = 0

        this.integratedLoudnessFrames = 0

        this.masterPeak = 0

        this.masterMeterCache = {
            left: 0,
            right: 0,
            peakDb: -Infinity,
            integratedLufs: null,
            updatedAt: 0,
        }
    }

    getMeterLevel(id: string) {
        const now = performance.now()

        const cached =
            this.meterCache.get(id)

        if (
            cached &&
            now - cached.updatedAt <
            METER_INTERVAL_MS
        ) {
            return cached.value
        }

        const track =
            this.tracks.get(id)

        if (!track) return 0

        track.analyser.getByteFrequencyData(
            track.meterData,
        )

        let peak = 0
        let energy = 0

        // HYBRID ANALYSIS
        for (
            let i = 0;
                i < track.meterData.length;
                i++
        ) {
            const normalized =
                track.meterData[i] / 255

            // weighted spectral energy
            energy +=
                normalized * normalized

            // transient peak
            if (normalized > peak) {
                peak = normalized
            }
        }

        // RMS-ish body
        const rms = Math.sqrt(
            energy / track.meterData.length,
        )

        // HYBRID:
        // 70% RMS
        // 30% transient peak
        let level =
            rms * 0.7 +
            peak * 0.3

        // MUSICAL CURVE
        level = Math.pow(level, 0.72)

        // VISUAL BOOST
        level *= 1.18

        level = Math.min(level, 1)

        const previous =
            this.meterLevels.get(id) || 0

        // FAST ATTACK
        // SLOW RELEASE
        const smoothed =
            level > previous
                ? previous * 0.18 +
                level * 0.82
                : previous * 0.90 +
                level * 0.10

        this.meterLevels.set(
            id,
            smoothed,
        )

        this.meterCache.set(
            id,
            {
                value: smoothed,
                updatedAt: now,
            },
        )

        return smoothed
    }

    setMute(
        id: string,
        mute: boolean,
    ) {
        const track =
            this.tracks.get(id)

        if (!track) return

        track.gain.gain.value = mute
            ? 0
            : 1
    }

    private createReverbImpulse(
        decay: number,
        size: number,
    ) {
        const context = this.context

        if (!context) return null

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

        const impulse =
            context.createBuffer(
                2,
                length,
                context.sampleRate,
            )

        const roomSize = Math.min(
            1,
            Math.max(
                0,
                size,
            ),
        )

        for (let channel = 0; channel < 2; channel++) {
            const data =
                impulse.getChannelData(channel)

            for (let i = 0; i < length; i++) {
                const progress = i / length

                const envelope =
                    Math.pow(
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

    private getDampingFrequency(value: number) {
        const damping = Math.min(
            1,
            Math.max(
                0,
                value,
            ),
        )

        return 12000 - damping * 9500
    }

    private connectSourceToTrack(
        source: AudioBufferSourceNode,
        track: TrackNodes,
    ) {
        source.connect(track.eqLow)
    }
}

export const mixerEngine =
    new MixerEngine()

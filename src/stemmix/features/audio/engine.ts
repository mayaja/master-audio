class AudioEngine {
    private static readonly sampleRate = 44100

    private context: AudioContext | null = null

    private source: AudioBufferSourceNode | null =
        null

    private gainNode: GainNode | null = null

    private startTime = 0
    private pausedAt = 0

    private isPlaying = false

    async init() {
        if (!this.context) {
            this.context = new AudioContext({
                sampleRate:
                    AudioEngine.sampleRate,
            })

            this.gainNode =
                this.context.createGain()

            this.gainNode.connect(
                this.context.destination,
            )
        }

        if (this.context.state === 'suspended') {
            await this.context.resume()
        }
    }

    async decodeFile(file: File) {
        await this.init()

        const arrayBuffer =
            await file.arrayBuffer()

        return await this.context!.decodeAudioData(
            arrayBuffer,
        )
    }

    play(
        buffer: AudioBuffer,
        onEnded?: () => void,
    ) {
        if (!this.context || !this.gainNode) return

        this.stop()

        this.source =
            this.context.createBufferSource()

        this.source.buffer = buffer

        this.source.connect(this.gainNode)

        this.startTime =
            this.context.currentTime - this.pausedAt

        this.source.start(0, this.pausedAt)

        this.isPlaying = true

        this.source.onended = () => {
            // IMPORTANT:
            // ignore if manually stopped
            if (!this.isPlaying) return

            this.isPlaying = false

            this.pausedAt = 0

            onEnded?.()
        }
    }

    pause() {
        if (!this.context || !this.source) return

        this.pausedAt =
            this.context.currentTime - this.startTime

        this.isPlaying = false

        this.source.stop()
    }

    stop() {
        try {
            this.source?.stop()
        } catch {
            // The source may already be stopped by the audio graph.
        }

        this.source = null

        this.isPlaying = false
    }

    reset() {
        this.stop()

        this.pausedAt = 0

        this.startTime = 0
    }

    getContext() {
        return this.context
    }

    getCurrentTime() {
        if (!this.context) return 0

        if (!this.isPlaying) {
            return this.pausedAt
        }

        return (
            this.context.currentTime -
            this.startTime
        )
    }

    getIsPlaying() {
        return this.isPlaying
    }
}

export const audioEngine =
    new AudioEngine()

import type { EQBand } from "@/mastering/types/audio";

export class AudioEngine {

    // =========================================================
    // CORE AUDIO
    // =========================================================

    audioContext: AudioContext;

    source: AudioBufferSourceNode | null = null;
    audioBuffer: AudioBuffer | null = null;

    // =========================================================
    // MAIN GAIN STAGES
    // =========================================================

    // input trim
    inputGain: GainNode;

    // pre-EQ/output trim
    outputGain: GainNode;

    // final master
    masterGain: GainNode;

    // dry/wet A/B
    dryGain: GainNode;
    wetGain: GainNode;

    // final post processor gain
    postGain: GainNode;

    // =========================================================
    // ANALYSER
    // =========================================================

    analyser: AnalyserNode;

    // stereo analysis
    splitter: ChannelSplitterNode;
    analyserL: AnalyserNode;
    analyserR: AnalyserNode;

    originalBassGain: GainNode;
    monoBassFilter: BiquadFilterNode;
    monoBassMerger: ChannelMergerNode;
    monoBassGain: GainNode;

    stereoHighpass: BiquadFilterNode;

    monoBassEnabled = false;

    // =========================================================
    // EQ
    // =========================================================

    eqFilters: BiquadFilterNode[] = [];

    // =========================================================
    // COMPRESSOR
    // =========================================================

    compressor: DynamicsCompressorNode;

    // processed path
    compGain: GainNode;

    // bypass path
    compBypassGain: GainNode;

    // merged output
    compOutput: GainNode;

    // =========================================================
    // LIMITER
    // =========================================================

    limiter: DynamicsCompressorNode;

    // limiter input drive
    limiterInputGain: GainNode;

    // processed path
    limiterGain: GainNode;

    // bypass path
    limiterBypassGain: GainNode;

    // merged output
    limitOutput: GainNode;

    // lookahead
    lookaheadDelay: DelayNode;

    // limiter ceiling memory
    private limiterCeiling = -1;

    // desired post gain from preset/output compensation
    private targetPostGain = 1;

    // =========================================================
    // K-WEIGHTING (LUFS)
    // =========================================================

    kwHighpass: BiquadFilterNode;
    kwHighshelf: BiquadFilterNode;
    kwAnalyser: AnalyserNode;

    // =========================================================
    // SOLO / SWEEP
    // =========================================================

    soloFilter: BiquadFilterNode;
    soloGain: GainNode;

    soloEnabled = false;

    // =========================================================
    // PLAYBACK STATE
    // =========================================================

    isPlaying = false;
    isPaused = false;

    startTime = 0;
    pauseOffset = 0;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    constructor() {

        this.audioContext = new AudioContext();

        // ===== MAIN GAIN =====
        this.inputGain = this.audioContext.createGain();
        this.outputGain = this.audioContext.createGain();
        this.masterGain = this.audioContext.createGain();

        this.dryGain = this.audioContext.createGain();
        this.wetGain = this.audioContext.createGain();

        this.postGain = this.audioContext.createGain();

        // ===== ANALYSER =====
        this.analyser = this.audioContext.createAnalyser();

        this.splitter = this.audioContext.createChannelSplitter(2);

        this.analyserL = this.audioContext.createAnalyser();
        this.analyserR = this.audioContext.createAnalyser();

        this.analyserL.fftSize = 2048;
        this.analyserR.fftSize = 2048;

        // ===== K WEIGHTING =====
        this.kwHighpass = this.audioContext.createBiquadFilter();
        this.kwHighpass.type = "highpass";
        this.kwHighpass.frequency.value = 60;

        this.kwHighshelf = this.audioContext.createBiquadFilter();
        this.kwHighshelf.type = "highshelf";
        this.kwHighshelf.frequency.value = 4000;
        this.kwHighshelf.gain.value = 4;

        this.kwAnalyser = this.audioContext.createAnalyser();
        this.kwAnalyser.fftSize = 2048;

        // =====================================================
        // COMPRESSOR
        // =====================================================

        this.compressor = this.audioContext.createDynamicsCompressor();

        this.compGain = this.audioContext.createGain();
        this.compBypassGain = this.audioContext.createGain();

        this.compOutput = this.audioContext.createGain();

        // =====================================================
        // LIMITER
        // =====================================================

        this.limiter = this.audioContext.createDynamicsCompressor();

        this.limiterInputGain = this.audioContext.createGain();

        this.limiterGain = this.audioContext.createGain();
        this.limiterBypassGain = this.audioContext.createGain();

        this.limitOutput = this.audioContext.createGain();

        this.lookaheadDelay = this.audioContext.createDelay(1.0);

        // =====================================================
        // SOLO SWEEP
        // =====================================================

        this.soloFilter = this.audioContext.createBiquadFilter();

        this.soloGain = this.audioContext.createGain();
        this.soloGain.gain.value = 0;

        this.originalBassGain = this.audioContext.createGain();

        this.originalBassGain.gain.value = 1;

        this.monoBassFilter = this.audioContext.createBiquadFilter();

        this.monoBassFilter.type = "lowpass";

        this.monoBassFilter.frequency.value = 120;

        this.stereoHighpass = this.audioContext.createBiquadFilter();

        this.stereoHighpass.type = "highpass";

        this.stereoHighpass.frequency.value = 120;

        this.monoBassMerger = this.audioContext.createChannelMerger(2);

        this.monoBassGain = this.audioContext.createGain();

        // =====================================================
        // SETUP
        // =====================================================

        this.setupEQ();
        this.setupRouting();
        this.setupDefaults();

        this.startTruePeakGuard();
    }

    // =========================================================
    // EQ SETUP
    // =========================================================

    setupEQ() {

        const freqs = [
            60,
            120,
            250,
            500,
            1000,
            4000,
            10000,
        ];

        this.eqFilters = freqs.map((freq, i) => {

            const f = this.audioContext.createBiquadFilter();

            f.frequency.value = freq;
            f.gain.value = 0;

            if (i === 0) {
                f.type = "lowshelf";
                f.Q.value = 0.7;
            }

            else if (i === freqs.length - 1) {
                f.type = "highshelf";
                f.Q.value = 0.7;
            }

            else {
                f.type = "peaking";
                f.Q.value = 1;
            }

            return f;
        });
    }

    // =========================================================
    // ROUTING
    // =========================================================

    setupRouting() {

        // =====================================================
        // INPUT SPLIT
        // =====================================================

        // original signal
        this.inputGain.connect(this.dryGain);

        // processed signal
        this.inputGain.connect(this.outputGain);

        // =====================================================
        // EQ CHAIN
        // =====================================================

        this.outputGain.connect(this.eqFilters[0]);

        for (let i = 0; i < this.eqFilters.length - 1; i++) {
            this.eqFilters[i].connect(this.eqFilters[i + 1]);
        }

        const lastEQ = this.eqFilters[this.eqFilters.length - 1];

        // =====================================================
        // COMPRESSOR TRUE BYPASS
        // =====================================================

        // processed path
        lastEQ.connect(this.compressor);
        this.compressor.connect(this.compGain);

        // bypass path
        lastEQ.connect(this.compBypassGain);

        // merge both path
        this.compGain.connect(this.compOutput);
        this.compBypassGain.connect(this.compOutput);

        // =====================================================
        // LIMITER TRUE BYPASS
        // =====================================================

        // limiter processed path
        this.compOutput.connect(this.limiterInputGain);

        this.limiterInputGain.connect(this.lookaheadDelay);
        this.lookaheadDelay.connect(this.limiter);

        this.limiter.connect(this.limiterGain);

        // limiter bypass path
        this.compOutput.connect(this.limiterBypassGain);

        // merge both
        this.limiterGain.connect(this.limitOutput);
        this.limiterBypassGain.connect(this.limitOutput);

        // =====================================================
        // FINAL PROCESS OUTPUT
        // =====================================================

        this.limitOutput.connect(this.postGain);

        // processed signal
        this.postGain.connect(this.wetGain);

        // =====================================================
        // MERGE DRY/WET
        // =====================================================

        this.dryGain.connect(this.masterGain);
        this.wetGain.connect(this.masterGain);

        // =====================================================
        // ANALYSER
        // =====================================================

        this.masterGain.connect(this.analyser);

        // stereo split
        this.masterGain.connect(this.splitter);

        this.splitter.connect(this.analyserL, 0);
        this.splitter.connect(this.analyserR, 1);

        // =====================================================
        // LUFS K-WEIGHTING
        // =====================================================

        this.masterGain.connect(this.kwHighpass);

        this.kwHighpass.connect(this.kwHighshelf);
        this.kwHighshelf.connect(this.kwAnalyser);

        // =====================================================
        // SOLO MONITOR PATH
        // =====================================================

        this.masterGain.connect(this.soloFilter);

        this.soloFilter.connect(this.soloGain);
        this.soloGain.connect(this.audioContext.destination);

        // =====================================================
        // MAIN OUTPUT
        // =====================================================

        this.masterGain.connect(this.audioContext.destination);

        // // =========================================================
        // // MONO BASS SPLIT
        // // =========================================================

        // // LOW
        // this.masterGain.connect(this.monoBassFilter);

        // // ORIGINAL LOW
        // this.monoBassFilter.connect(this.originalBassGain);

        // // this.originalBassGain.connect(this.audioContext.destination);

        // // MONO LOW
        // this.monoBassFilter.connect(this.monoBassGain);

        // this.monoBassGain.connect(this.monoBassMerger, 0, 0);

        // this.monoBassGain.connect(this.monoBassMerger, 0, 1);

        // this.monoBassMerger.connect(this.audioContext.destination);
    }

    // =========================================================
    // DEFAULTS
    // =========================================================

    setupDefaults() {

        // gain defaults
        this.inputGain.gain.value = 1;
        this.outputGain.gain.value = 1;

        this.postGain.gain.value = 1;
        this.targetPostGain = 1;
        this.masterGain.gain.value = 1;

        // processed ON
        this.dryGain.gain.value = 0;
        this.wetGain.gain.value = 1;

        // analyser
        this.analyser.fftSize = 4096;
        this.analyser.smoothingTimeConstant = 0.7;

        // =====================================================
        // COMPRESSOR
        // =====================================================

        this.compressor.threshold.value = -24;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.01;
        this.compressor.release.value = 0.2;

        // compressor ON
        this.compGain.gain.value = 1;
        this.compBypassGain.gain.value = 0;

        // =====================================================
        // LIMITER
        // =====================================================

        this.limiter.threshold.value = -1;
        this.limiter.ratio.value = 20;

        this.limiter.attack.value = 0.001;
        this.limiter.release.value = 0.08;

        this.limiter.knee.value = 10;

        // limiter ON
        this.limiterGain.gain.value = 1;
        this.limiterBypassGain.gain.value = 0;

        // lookahead
        this.lookaheadDelay.delayTime.value = 0.005;
    }

    // =========================================================
    // AUDIO LOAD
    // =========================================================

    async loadAudio(file: File) {

        const arrayBuffer = await file.arrayBuffer();

        this.audioBuffer =
            await this.audioContext.decodeAudioData(arrayBuffer);
    }

    // =========================================================
    // CREATE SOURCE
    // =========================================================

    createSource(): AudioBufferSourceNode | null {

        if (!this.audioBuffer) return null;

        const source =
            this.audioContext.createBufferSource();

        source.buffer = this.audioBuffer;

        source.connect(this.inputGain);

        return source;
    }

    // =========================================================
    // PLAY
    // =========================================================

    async play() {

        if (!this.audioBuffer || this.isPlaying) return;

        if (this.audioContext.state === "suspended") {
            await this.audioContext.resume();
        }

        this.source = this.createSource();

        if (!this.source) return;

        this.startTime =
            this.audioContext.currentTime - this.pauseOffset;

        this.source.start(0, this.pauseOffset);

        this.isPlaying = true;
        this.isPaused = false;

        this.source.onended = () => {

            if (!this.isPaused) {
                this.pauseOffset = 0;
            }

            this.isPlaying = false;
        };
    }

    // =========================================================
    // PAUSE
    // =========================================================

    pause() {

        if (!this.source || !this.isPlaying) return;

        this.isPaused = true;

        this.pauseOffset =
            this.audioContext.currentTime - this.startTime;

        this.source.stop();

        this.isPlaying = false;
    }

    // =========================================================
    // STOP
    // =========================================================

    stop() {

        if (!this.source) return;

        this.source.stop();

        this.pauseOffset = 0;

        this.isPlaying = false;
        this.isPaused = false;
    }

    // =========================================================
    // TRUE PEAK GUARD
    // =========================================================

    startTruePeakGuard() {

        const analyser = this.analyser;

        const buffer =
            new Float32Array(analyser.fftSize);

        const check = () => {

            analyser.getFloatTimeDomainData(buffer);

            let max = 0;

            for (let i = 0; i < buffer.length - 1; i++) {

                const a = buffer[i];
                const b = buffer[i + 1];

                max = Math.max(max, Math.abs(a));

                // simple oversampling
                for (let t = 0.25; t < 1; t += 0.25) {

                    const interp = a + (b - a) * t;

                    max = Math.max(
                        max,
                        Math.abs(interp)
                    );
                }
            }

            const db =
                20 * Math.log10(max + 1e-8);

            // Start protection slightly below the configured ceiling
            // so transient spikes are caught before crossing validation limit.
            const safetyCeiling = this.limiterCeiling - 0.2;

            // peak above ceiling
            if (db > safetyCeiling) {

                const diff =
                    db - safetyCeiling;

                const reductionFactor =
                    Math.pow(10, -diff / 20);

                const guardedGain =
                    this.targetPostGain * reductionFactor;

                this.postGain.gain.setTargetAtTime(
                    guardedGain,
                    this.audioContext.currentTime,
                    0.008
                );
            }

            // recovery
            else {

                this.postGain.gain.setTargetAtTime(
                    this.targetPostGain,
                    this.audioContext.currentTime,
                    0.12
                );
            }

            requestAnimationFrame(check);
        };

        check();
    }

    // =========================================================
    // STEREO CORRELATION
    // =========================================================

    getStereoCorrelation() {

        const size = this.analyserL.fftSize;

        const dataL = new Float32Array(size);
        const dataR = new Float32Array(size);

        this.analyserL.getFloatTimeDomainData(dataL);
        this.analyserR.getFloatTimeDomainData(dataR);

        let sumLR = 0;
        let sumL2 = 0;
        let sumR2 = 0;

        for (let i = 0; i < size; i++) {

            const L = dataL[i];
            const R = dataR[i];

            sumLR += L * R;
            sumL2 += L * L;
            sumR2 += R * R;
        }

        const denom =
            Math.sqrt(sumL2 * sumR2);

        if (denom === 0) return 0;

        return sumLR / denom;
    }

    // =========================================================
    // CLIP DETECT
    // =========================================================

    getIsClipping() {

        const size = this.analyserL.fftSize;

        const dataL = new Float32Array(size);
        const dataR = new Float32Array(size);

        this.analyserL.getFloatTimeDomainData(dataL);
        this.analyserR.getFloatTimeDomainData(dataR);

        for (let i = 0; i < size; i++) {

            if (
                Math.abs(dataL[i]) >= 1 ||
                Math.abs(dataR[i]) >= 1
            ) {
                return true;
            }
        }

        return false;
    }

    // =========================================================
    // STEREO FRAME
    // =========================================================

    getStereoFrame() {

        const size = 1024;

        const dataL = new Float32Array(size);
        const dataR = new Float32Array(size);

        this.analyserL.getFloatTimeDomainData(dataL);
        this.analyserR.getFloatTimeDomainData(dataR);

        return { dataL, dataR, size };
    }

    // =========================================================
    // MID / SIDE + WIDTH
    // =========================================================

    getMidSideWidth() {

        const size = this.analyserL.fftSize;

        const dataL = new Float32Array(size);
        const dataR = new Float32Array(size);

        this.analyserL.getFloatTimeDomainData(dataL);
        this.analyserR.getFloatTimeDomainData(dataR);

        let sumM2 = 0;
        let sumS2 = 0;

        for (let i = 0; i < size; i++) {

            const L = dataL[i];
            const R = dataR[i];

            // MID
            const M = (L + R) * 0.5;

            // SIDE
            const S = (L - R) * 0.5;

            sumM2 += M * M;
            sumS2 += S * S;
        }

        const rmsM =
            Math.sqrt(sumM2 / size);

        const rmsS =
            Math.sqrt(sumS2 / size);

        // stereo width ratio
        const width =
            rmsM > 1e-6
                ? rmsS / rmsM
                : 0;

        return {
            mid: rmsM,
            side: rmsS,
            width,
        };
    }

    // =========================
    // CREST FACTOR
    // =========================

    getCrestFactor() {

        const size =
            this.analyserL.fftSize;

        const dataL =
            new Float32Array(size);

        const dataR =
            new Float32Array(size);

        this.analyserL
            .getFloatTimeDomainData(dataL);

        this.analyserR
            .getFloatTimeDomainData(dataR);

        let peak = 0;
        let sum = 0;

        for (let i = 0; i < size; i++) {

            const mono =
                (dataL[i] + dataR[i]) * 0.5;

            peak = Math.max(
                peak,
                Math.abs(mono)
            );

            sum += mono * mono;
        }

        // RMS
        const rms =
            Math.sqrt(sum / size);

        // avoid zero
        if (rms < 1e-8)
            return 0;

        const peakDb =
            20 * Math.log10(
                peak + 1e-8
            );

        const rmsDb =
            20 * Math.log10(
                rms + 1e-8
            );

        // crest factor
        return peakDb - rmsDb;
    }

    // =========================
    // PEAK DB
    // =========================

    getPeakDb() {

        const size =
            this.analyserL.fftSize;

        const dataL =
            new Float32Array(size);

        const dataR =
            new Float32Array(size);

        this.analyserL
            .getFloatTimeDomainData(dataL);

        this.analyserR
            .getFloatTimeDomainData(dataR);

        let peak = 0;

        for (let i = 0; i < size; i++) {

            peak = Math.max(
                peak,
                Math.abs(dataL[i]),
                Math.abs(dataR[i])
            );
        }

        return 20 * Math.log10(
            peak + 1e-8
        );
    }

    // =========================================================
    // PHASE WARNING
    // =========================================================

    getPhaseWarning() {

        const corr =
            this.getStereoCorrelation();

        if (corr < -0.2) {
            return "bad";
        }

        if (corr < 0.2) {
            return "risky";
        }

        return "good";
    }

    // =========================================================
    // MONO COMPATIBILITY
    // =========================================================

    private isMonoMode = false;

    setMonoMode(enabled: boolean) {

        this.isMonoMode = enabled;

        if (enabled) {

            // force mono
            this.masterGain.channelCount = 1;
            this.masterGain.channelCountMode = "explicit";
        }

        else {

            // restore stereo
            this.masterGain.channelCount = 2;
            this.masterGain.channelCountMode = "max";
        }
    }

    // =========================================================
    // MONO BASS
    // =========================================================

    setMonoBassEnabled(enabled: boolean) {

        const now =
            this.audioContext.currentTime;

        this.monoBassEnabled = enabled;

        if (enabled) {

            // mono low ON
            this.monoBassGain.gain
                .setTargetAtTime(
                    1,
                    now,
                    0.01
                );

            // stereo low OFF
            this.originalBassGain.gain
                .setTargetAtTime(
                    0,
                    now,
                    0.01
                );

        } else {

            // mono low OFF
            this.monoBassGain.gain
                .setTargetAtTime(
                    0,
                    now,
                    0.01
                );

            // stereo low ON
            this.originalBassGain.gain
                .setTargetAtTime(
                    1,
                    now,
                    0.01
                );
        }
    }

    // =========================================================
    // EQ CONTROL
    // =========================================================

    setEQBands(bands: EQBand[]) {

        bands.forEach((band, i) => {

            const f = this.eqFilters[i];

            if (!f) return;

            f.frequency.setTargetAtTime(
                band.freq,
                this.audioContext.currentTime,
                0.01
            );

            f.gain.setTargetAtTime(
                band.gain,
                this.audioContext.currentTime,
                0.01
            );

            f.Q.setTargetAtTime(
                band.Q,
                this.audioContext.currentTime,
                0.01
            );
        });
    }

    // =========================================================
    // COMPRESSOR CONTROL
    // =========================================================

    setCompressorEnabled(enabled: boolean) {

        const now = this.audioContext.currentTime;

        if (enabled) {

            // compressor path ON
            this.compGain.gain.setTargetAtTime(
                1,
                now,
                0.01
            );

            // bypass OFF
            this.compBypassGain.gain.setTargetAtTime(
                0,
                now,
                0.01
            );
        }

        else {

            // compressor OFF
            this.compGain.gain.setTargetAtTime(
                0,
                now,
                0.01
            );

            // bypass ON
            this.compBypassGain.gain.setTargetAtTime(
                1,
                now,
                0.01
            );
        }
    }

    setCompThreshold(v: number) {
        this.compressor.threshold.setTargetAtTime(
            v,
            this.audioContext.currentTime,
            0.01
        );
    }

    setCompRatio(v: number) {
        this.compressor.ratio.setTargetAtTime(
            v,
            this.audioContext.currentTime,
            0.01
        );
    }

    setCompAttack(v: number) {
        this.compressor.attack.setTargetAtTime(
            v,
            this.audioContext.currentTime,
            0.01
        );
    }

    setCompRelease(v: number) {
        this.compressor.release.setTargetAtTime(
            v,
            this.audioContext.currentTime,
            0.01
        );
    }

    // =========================================================
    // LIMITER CONTROL
    // =========================================================

    setLimiterEnabled(enabled: boolean) {

        const now = this.audioContext.currentTime;

        if (enabled) {

            // limiter path ON
            this.limiterGain.gain.setTargetAtTime(
                1,
                now,
                0.01
            );

            // bypass OFF
            this.limiterBypassGain.gain.setTargetAtTime(
                0,
                now,
                0.01
            );
        }

        else {

            // limiter OFF
            this.limiterGain.gain.setTargetAtTime(
                0,
                now,
                0.01
            );

            // bypass ON
            this.limiterBypassGain.gain.setTargetAtTime(
                1,
                now,
                0.01
            );
        }
    }

    setLimiterDrive(db: number) {

        const linear =
            Math.pow(10, db / 20);

        this.limiterInputGain.gain.setTargetAtTime(
            linear,
            this.audioContext.currentTime,
            0.01
        );
    }

    setLimiterCeiling(db: number) {

        this.limiterCeiling = db;

        this.limiter.threshold.setTargetAtTime(
            db,
            this.audioContext.currentTime,
            0.01
        );
    }

    setLimiterRelease(v: number) {

        this.limiter.release.setTargetAtTime(
            v,
            this.audioContext.currentTime,
            0.01
        );
    }

    setLimiterLookahead(ms: number) {

        this.lookaheadDelay.delayTime.setTargetAtTime(
            ms / 1000,
            this.audioContext.currentTime,
            0.01
        );
    }

    // =========================================================
    // QUICK SOLO BAND
    // =========================================================

    setSoloBand(type: "low" | "mid" | "high") {

        const f = this.soloFilter;

        // LOW
        if (type === "low") {

            f.type = "lowpass";

            // bass region
            f.frequency.setTargetAtTime(
                250,
                this.audioContext.currentTime,
                0.01
            );

            f.Q.setTargetAtTime(
                0.7,
                this.audioContext.currentTime,
                0.01
            );
        }

        // MID
        if (type === "mid") {

            f.type = "bandpass";

            // vocal / body region
            f.frequency.setTargetAtTime(
                1200,
                this.audioContext.currentTime,
                0.01
            );

            f.Q.setTargetAtTime(
                0.8,
                this.audioContext.currentTime,
                0.01
            );
        }

        // HIGH
        if (type === "high") {

            f.type = "highpass";

            // air / brightness
            f.frequency.setTargetAtTime(
                3500,
                this.audioContext.currentTime,
                0.01
            );

            f.Q.setTargetAtTime(
                0.7,
                this.audioContext.currentTime,
                0.01
            );
        }
    }
    // =========================================================
    // SOLO SWEEP
    // =========================================================

    setSoloEnabled(enabled: boolean) {

        this.soloEnabled = enabled;

        const now =
            this.audioContext.currentTime;

        if (enabled) {

            this.soloGain.gain.setTargetAtTime(
                1.2,
                now,
                0.01
            );
        }

        else {

            this.soloGain.gain.setTargetAtTime(
                0,
                now,
                0.01
            );
        }
    }

    setSoloSweep(freq: number) {

        const f = this.soloFilter;

        f.type = "bandpass";

        f.frequency.setTargetAtTime(
            freq,
            this.audioContext.currentTime,
            0.01
        );

        if (!f.Q.value) {
            f.Q.value = 5;
        }
    }

    setSoloQ(q: number) {

        this.soloFilter.Q.setTargetAtTime(
            q,
            this.audioContext.currentTime,
            0.01
        );
    }

    // =========================================================
    // INPUT / OUTPUT GAIN
    // =========================================================

    setInputGain(db: number) {

        const linear =
            Math.pow(10, db / 20);

        this.inputGain.gain.setTargetAtTime(
            linear,
            this.audioContext.currentTime,
            0.01
        );
    }

    setOutputGain(db: number) {

        const linear =
            Math.pow(10, db / 20);

        this.outputGain.gain.setTargetAtTime(
            linear,
            this.audioContext.currentTime,
            0.01
        );
    }

    // =========================================================
    // POST GAIN
    // =========================================================

    setPostGain(db: number) {

        const linear =
            Math.pow(10, db / 20);

        this.targetPostGain = linear;

        this.postGain.gain.setTargetAtTime(
            linear,
            this.audioContext.currentTime,
            0.05
        );
    }

    // =========================================================
    // A/B MODE
    // =========================================================

    setABMode(mode: "original" | "processed") {

        const now =
            this.audioContext.currentTime;

        if (mode === "original") {

            this.dryGain.gain.setTargetAtTime(
                1,
                now,
                0.01
            );

            this.wetGain.gain.setTargetAtTime(
                0,
                now,
                0.01
            );
        }

        else {

            this.dryGain.gain.setTargetAtTime(
                0,
                now,
                0.01
            );

            this.wetGain.gain.setTargetAtTime(
                1,
                now,
                0.01
            );
        }
    }

    // =========================================================
    // STEREO RMS DB
    // =========================================================

    getStereoRmsDb() {

        const size = this.analyserL.fftSize;

        const dataL = new Float32Array(size);
        const dataR = new Float32Array(size);

        this.analyserL.getFloatTimeDomainData(dataL);
        this.analyserR.getFloatTimeDomainData(dataR);

        let sumL = 0;
        let sumR = 0;

        for (let i = 0; i < size; i++) {
            sumL += dataL[i] * dataL[i];
            sumR += dataR[i] * dataR[i];
        }

        const rmsL = Math.sqrt(sumL / size);
        const rmsR = Math.sqrt(sumR / size);

        const leftDb = 20 * Math.log10(rmsL + 1e-8);
        const rightDb = 20 * Math.log10(rmsR + 1e-8);

        return {
            leftDb: Number.isFinite(leftDb) ? leftDb : -60,
            rightDb: Number.isFinite(rightDb) ? rightDb : -60,
        };
    }

    // =========================================================
    // EXPORT
    // =========================================================

    async exportProcessedWav() {

        if (!this.audioBuffer) {
            throw new Error("No audio loaded");
        }

        const offline = new OfflineAudioContext(
            this.audioBuffer.numberOfChannels,
            this.audioBuffer.length,
            this.audioBuffer.sampleRate
        );

        const source = offline.createBufferSource();
        source.buffer = this.audioBuffer;

        const input = offline.createGain();
        input.gain.value = this.inputGain.gain.value;

        const output = offline.createGain();
        output.gain.value = this.outputGain.gain.value;

        const eqFilters = this.eqFilters.map((liveFilter) => {
            const f = offline.createBiquadFilter();
            f.type = liveFilter.type;
            f.frequency.value = liveFilter.frequency.value;
            f.Q.value = liveFilter.Q.value;
            f.gain.value = liveFilter.gain.value;
            return f;
        });

        const compressor = offline.createDynamicsCompressor();
        compressor.threshold.value = this.compressor.threshold.value;
        compressor.ratio.value = this.compressor.ratio.value;
        compressor.attack.value = this.compressor.attack.value;
        compressor.release.value = this.compressor.release.value;
        compressor.knee.value = this.compressor.knee.value;

        const limiterInput = offline.createGain();
        limiterInput.gain.value = this.limiterInputGain.gain.value;

        const lookahead = offline.createDelay(1.0);
        lookahead.delayTime.value = this.lookaheadDelay.delayTime.value;

        const limiter = offline.createDynamicsCompressor();
        limiter.threshold.value = this.limiter.threshold.value;
        limiter.ratio.value = this.limiter.ratio.value;
        limiter.attack.value = this.limiter.attack.value;
        limiter.release.value = this.limiter.release.value;
        limiter.knee.value = this.limiter.knee.value;

        const post = offline.createGain();
        post.gain.value = this.postGain.gain.value;

        source.connect(input);
        input.connect(output);

        output.connect(eqFilters[0]);
        for (let i = 0; i < eqFilters.length - 1; i++) {
            eqFilters[i].connect(eqFilters[i + 1]);
        }

        eqFilters[eqFilters.length - 1].connect(compressor);
        compressor.connect(limiterInput);
        limiterInput.connect(lookahead);
        lookahead.connect(limiter);
        limiter.connect(post);
        post.connect(offline.destination);

        source.start();

        const rendered = await offline.startRendering();

        return this.encodeWav(rendered);
    }

    private encodeWav(buffer: AudioBuffer) {

        const channels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const length = buffer.length;
        const bytesPerSample = 2;
        const blockAlign = channels * bytesPerSample;
        const dataSize = length * blockAlign;

        const wav = new ArrayBuffer(44 + dataSize);
        const view = new DataView(wav);

        let offset = 0;

        const writeString = (text: string) => {
            for (let i = 0; i < text.length; i++) {
                view.setUint8(offset++, text.charCodeAt(i));
            }
        };

        writeString("RIFF");
        view.setUint32(offset, 36 + dataSize, true);
        offset += 4;
        writeString("WAVE");
        writeString("fmt ");
        view.setUint32(offset, 16, true);
        offset += 4;
        view.setUint16(offset, 1, true);
        offset += 2;
        view.setUint16(offset, channels, true);
        offset += 2;
        view.setUint32(offset, sampleRate, true);
        offset += 4;
        view.setUint32(offset, sampleRate * blockAlign, true);
        offset += 4;
        view.setUint16(offset, blockAlign, true);
        offset += 2;
        view.setUint16(offset, 16, true);
        offset += 2;
        writeString("data");
        view.setUint32(offset, dataSize, true);
        offset += 4;

        const channelData = Array.from(
            { length: channels },
            (_, channel) => buffer.getChannelData(channel)
        );

        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < channels; channel++) {
                const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
                const intSample = sample < 0
                    ? sample * 0x8000
                    : sample * 0x7fff;

                view.setInt16(offset, intSample, true);
                offset += 2;
            }
        }

        return new Blob([wav], { type: "audio/wav" });
    }

    // =========================================================
    // TIME
    // =========================================================

    getCurrentTime() {

        if (!this.isPlaying) {
            return this.pauseOffset;
        }

        return (
            this.audioContext.currentTime -
            this.startTime
        );
    }
}

export const audioEngine = new AudioEngine();
// import type { EQBand } from "@/mastering/types/audio";

// export class AudioEngine {

//     audioContext: AudioContext;

//     source: AudioBufferSourceNode | null = null;
//     audioBuffer: AudioBuffer | null = null;

//     inputGain: GainNode;
//     outputGain: GainNode;
//     masterGain: GainNode;

//     dryGain: GainNode;
//     wetGain: GainNode;
//     postGain: GainNode;

//     analyser: AnalyserNode;

//     // EQ (7 band)
//     eqFilters: BiquadFilterNode[] = [];

//     // Compressor
//     compressor: DynamicsCompressorNode;
//     compGain: GainNode;
//     compBypassGain: GainNode;

//     limiter: DynamicsCompressorNode;
//     limiterGain: GainNode;
//     limiterBypassGain: GainNode;
//     limiterInputGain: GainNode;

//     lookaheadDelay: DelayNode;

//     kwHighpass: BiquadFilterNode;
//     kwHighshelf: BiquadFilterNode;
//     kwAnalyser: AnalyserNode;

//     private limiterCeiling = -1;

//     splitter: ChannelSplitterNode;
//     analyserL: AnalyserNode;
//     analyserR: AnalyserNode;

//     soloFilter: BiquadFilterNode;
//     soloGain: GainNode;
//     soloEnabled = false;

//     isPlaying = false;
//     isPaused = false;

//     startTime = 0;
//     pauseOffset = 0;

//     constructor() {
//         this.audioContext = new AudioContext();

//         this.inputGain = this.audioContext.createGain();
//         this.outputGain = this.audioContext.createGain();
//         this.masterGain = this.audioContext.createGain();

//         this.dryGain = this.audioContext.createGain();
//         this.wetGain = this.audioContext.createGain();
//         this.postGain = this.audioContext.createGain();

//         this.analyser = this.audioContext.createAnalyser();

//         // K-weighting chain (metering only)
//         this.kwHighpass = this.audioContext.createBiquadFilter();
//         this.kwHighpass.type = "highpass";
//         this.kwHighpass.frequency.value = 60; // approx HP

//         this.kwHighshelf = this.audioContext.createBiquadFilter();
//         this.kwHighshelf.type = "highshelf";
//         this.kwHighshelf.frequency.value = 4000;
//         this.kwHighshelf.gain.value = 4; // approx +4 dB

//         this.kwAnalyser = this.audioContext.createAnalyser();
//         this.kwAnalyser.fftSize = 2048;

//         // compressor
//         this.compressor = this.audioContext.createDynamicsCompressor();
//         this.compGain = this.audioContext.createGain();
//         this.compBypassGain = this.audioContext.createGain();

//         this.limiter = this.audioContext.createDynamicsCompressor();
//         this.limiterGain = this.audioContext.createGain();
//         this.limiterBypassGain = this.audioContext.createGain();
//         this.limiterInputGain = this.audioContext.createGain();

//         this.lookaheadDelay = this.audioContext.createDelay(1.0);

//         this.splitter = this.audioContext.createChannelSplitter(2);

//         this.analyserL = this.audioContext.createAnalyser();
//         this.analyserR = this.audioContext.createAnalyser();

//         this.analyserL.fftSize = 2048;
//         this.analyserR.fftSize = 2048;

//         this.soloFilter = this.audioContext.createBiquadFilter();
//         this.soloGain = this.audioContext.createGain();

//         this.soloGain.gain.value = 0; // default off

//         this.setupEQ();
//         this.setupRouting();
//         this.setupDefaults();

//         this.startTruePeakGuard();
//     }

//     // =========================
//     // EQ SETUP
//     // =========================

//     setupEQ() {
//         const freqs = [60, 120, 250, 500, 1000, 4000, 10000];

//         this.eqFilters = freqs.map((freq, i) => {
//             const f = this.audioContext.createBiquadFilter();

//             f.frequency.value = freq;
//             f.gain.value = 0;

//             if (i === 0) {
//                 f.type = "lowshelf";
//                 f.Q.value = 0.7;
//             } else if (i === freqs.length - 1) {
//                 f.type = "highshelf";
//                 f.Q.value = 0.7;
//             } else {
//                 f.type = "peaking";
//                 f.Q.value = 1;
//             }

//             return f;
//         });
//     }

//     // =========================
//     // ROUTING (FINAL STABLE)
//     // =========================

//     // setupRouting() {
//     //     // SPLIT
//     //     this.inputGain.connect(this.dryGain);
//     //     this.inputGain.connect(this.outputGain);

//     //     // ===== EQ CHAIN =====
//     //     this.outputGain.connect(this.eqFilters[0]);

//     //     for (let i = 0; i < this.eqFilters.length - 1; i++) {
//     //         this.eqFilters[i].connect(this.eqFilters[i + 1]);
//     //     }

//     //     const lastEQ = this.eqFilters[this.eqFilters.length - 1];

//     //     // ===== COMP PARALLEL (STABLE BYPASS) =====
//     //     lastEQ.connect(this.compressor);
//     //     lastEQ.connect(this.compBypassGain);

//     //     this.compressor.connect(this.compGain);

//     //     // ===== LIMITER (ALWAYS ACTIVE STAGE) =====

//     //     // all paths enter the limiter
//     //     this.compGain.connect(this.limiter);
//     //     this.compBypassGain.connect(this.limiter);

//     //     // limiter output
//     //     this.limiter.connect(this.limiterGain);

//     //     // limiter bypass (optional)
//     //     this.compGain.connect(this.limiterBypassGain);
//     //     this.compBypassGain.connect(this.limiterBypassGain);

//     //     // merge limiter
//     //     this.limiterGain.connect(this.postGain);
//     //     this.limiterBypassGain.connect(this.postGain);

//     //     this.postGain.connect(this.wetGain);

//     //     // ===== MERGE =====
//     //     this.dryGain.connect(this.masterGain);
//     //     this.wetGain.connect(this.masterGain);

//     //     // ANALYSER
//     //     this.masterGain.connect(this.analyser);

//     //     // OUTPUT
//     //     this.masterGain.connect(this.audioContext.destination);
//     // }
//     setupRouting() {
//         // ===== SPLIT (DRY / WET) =====
//         this.inputGain.connect(this.dryGain);
//         this.inputGain.connect(this.outputGain);

//         // ===== EQ CHAIN =====
//         this.outputGain.connect(this.eqFilters[0]);

//         for (let i = 0; i < this.eqFilters.length - 1; i++) {
//             this.eqFilters[i].connect(this.eqFilters[i + 1]);
//         }

//         const lastEQ = this.eqFilters[this.eqFilters.length - 1];

//         // ===== COMP PARALLEL =====
//         lastEQ.connect(this.compressor);
//         lastEQ.connect(this.compBypassGain);

//         this.compressor.connect(this.compGain);

//         // ===== MERGE COMP → SINGLE PATH =====
//         this.compGain.connect(this.limiterInputGain);
//         this.compBypassGain.connect(this.limiterInputGain);

//         // ===== LOOKAHEAD =====
//         this.limiterInputGain.connect(this.lookaheadDelay);

//         // ===== LIMITER =====
//         this.lookaheadDelay.connect(this.limiter);

//         // ===== OUTPUT GAIN =====
//         this.limiter.connect(this.postGain);

//         // ===== TO WET =====
//         this.postGain.connect(this.wetGain);

//         // ===== MERGE DRY/WET =====
//         this.dryGain.connect(this.masterGain);
//         this.wetGain.connect(this.masterGain);

//         // ===== ANALYSER (MONO) =====
//         this.masterGain.connect(this.analyser);

//         // ===== TRUE STEREO SPLIT =====
//         this.masterGain.connect(this.splitter);
//         this.splitter.connect(this.analyserL, 0);
//         this.splitter.connect(this.analyserR, 1);

//         // ===== K-WEIGHTING =====
//         this.masterGain.connect(this.kwHighpass);
//         this.kwHighpass.connect(this.kwHighshelf);
//         this.kwHighshelf.connect(this.kwAnalyser);

//         // ===== 🎧 BAND SOLO (PARALLEL MONITOR PATH) =====
//         this.masterGain.connect(this.soloFilter);
//         this.soloFilter.connect(this.soloGain);
//         this.soloGain.connect(this.audioContext.destination);

//         // ===== MAIN OUTPUT =====
//         this.masterGain.connect(this.audioContext.destination);
//     }

//     // =========================
//     // DEFAULTS
//     // =========================

//     setupDefaults() {
//         this.inputGain.gain.value = 1;
//         this.outputGain.gain.value = 1;
//         this.postGain.gain.value = 1;

//         this.dryGain.gain.value = 0;
//         this.wetGain.gain.value = 1;

//         this.analyser.fftSize = 4096;
//         this.analyser.smoothingTimeConstant = 0.7;

//         // compressor defaults
//         this.compressor.threshold.value = -24;
//         this.compressor.ratio.value = 4;
//         this.compressor.attack.value = 0.01;
//         this.compressor.release.value = 0.2;

//         // compressor ON by default
//         this.compGain.gain.value = 1;
//         this.compBypassGain.gain.value = 0;

//         // LIMITER SETTINGS
//         this.limiter.threshold.value = -1;   // ceiling
//         this.limiter.ratio.value = 20;       // hard limiting
//         this.limiter.attack.value = 0.001;
//         this.limiter.release.value = 0.08;
//         this.limiter.knee.value = 10;

//         // default ON
//         this.limiterGain.gain.value = 1;
//         this.limiterBypassGain.gain.value = 0;

//         this.lookaheadDelay.delayTime.value = 0.005; // 5 ms
//     }

//     // =========================
//     // AUDIO LOAD
//     // =========================

//     async loadAudio(file: File) {
//         const arrayBuffer = await file.arrayBuffer();
//         this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
//     }

//     createSource(): AudioBufferSourceNode | null {
//         if (!this.audioBuffer) return null;

//         const source = this.audioContext.createBufferSource();
//         source.buffer = this.audioBuffer;

//         source.connect(this.inputGain);

//         return source;
//     }

//     async play() {
//         if (!this.audioBuffer || this.isPlaying) return;

//         if (this.audioContext.state === "suspended") {
//             await this.audioContext.resume();
//         }

//         this.source = this.createSource();
//         if (!this.source) return;

//         this.startTime = this.audioContext.currentTime - this.pauseOffset;
//         this.source.start(0, this.pauseOffset);

//         this.isPlaying = true;
//         this.isPaused = false;

//         this.source.onended = () => {
//             if (!this.isPaused) this.pauseOffset = 0;
//             this.isPlaying = false;
//         };
//     }

//     pause() {
//         if (!this.source || !this.isPlaying) return;

//         this.isPaused = true;
//         this.pauseOffset = this.audioContext.currentTime - this.startTime;

//         this.source.stop();
//         this.isPlaying = false;
//     }

//     stop() {
//         if (!this.source) return;

//         this.source.stop();
//         this.pauseOffset = 0;
//         this.isPlaying = false;
//         this.isPaused = false;
//     }

//     startTruePeakGuard() {
//         const analyser = this.analyser;
//         const buffer = new Float32Array(analyser.fftSize);

//         const check = () => {
//             analyser.getFloatTimeDomainData(buffer);

//             let max = 0;

//             for (let i = 0; i < buffer.length - 1; i++) {
//                 const a = buffer[i];
//                 const b = buffer[i + 1];

//                 // sample peak
//                 max = Math.max(max, Math.abs(a));

//                 // 4x oversample
//                 for (let t = 0.25; t < 1; t += 0.25) {
//                     const interp = a + (b - a) * t;
//                     max = Math.max(max, Math.abs(interp));
//                 }
//             }

//             const db = 20 * Math.log10(max + 1e-8);

//             // 🔥 clamp kalau lewat ceiling
//             if (db > this.limiterCeiling) {
//                 const diff = db - this.limiterCeiling;

//                 const reduction = Math.pow(10, -diff / 20);

//                 this.postGain.gain.setTargetAtTime(
//                     this.postGain.gain.value * reduction,
//                     this.audioContext.currentTime,
//                     0.01
//                 );
//             }

//             requestAnimationFrame(check);
//         };

//         check();
//     }

//     getStereoCorrelation() {
//         const size = this.analyserL.fftSize;

//         const dataL = new Float32Array(size);
//         const dataR = new Float32Array(size);

//         this.analyserL.getFloatTimeDomainData(dataL);
//         this.analyserR.getFloatTimeDomainData(dataR);

//         let sumLR = 0;
//         let sumL2 = 0;
//         let sumR2 = 0;

//         for (let i = 0; i < size; i++) {
//             const L = dataL[i];
//             const R = dataR[i];

//             sumLR += L * R;
//             sumL2 += L * L;
//             sumR2 += R * R;
//         }

//         const denom = Math.sqrt(sumL2 * sumR2);
//         if (denom === 0) return 0;

//         return sumLR / denom;
//     }

//     getIsClipping() {
//         const size = this.analyserL.fftSize;

//         const dataL = new Float32Array(size);
//         const dataR = new Float32Array(size);

//         this.analyserL.getFloatTimeDomainData(dataL);
//         this.analyserR.getFloatTimeDomainData(dataR);

//         for (let i = 0; i < size; i++) {
//             if (Math.abs(dataL[i]) >= 1 || Math.abs(dataR[i]) >= 1) {
//                 return true;
//             }
//         }

//         return false;
//     }

//     getStereoFrame() {
//         const size = 1024; // kecil supaya ringan

//         const dataL = new Float32Array(size);
//         const dataR = new Float32Array(size);

//         this.analyserL.getFloatTimeDomainData(dataL);
//         this.analyserR.getFloatTimeDomainData(dataR);

//         return { dataL, dataR, size };
//     }

//     // =========================
//     // MID / SIDE + WIDTH
//     // =========================

//     getMidSideWidth() {
//         const size = this.analyserL.fftSize;

//         const dataL = new Float32Array(size);
//         const dataR = new Float32Array(size);

//         this.analyserL.getFloatTimeDomainData(dataL);
//         this.analyserR.getFloatTimeDomainData(dataR);

//         let sumM2 = 0;
//         let sumS2 = 0;

//         for (let i = 0; i < size; i++) {
//             const L = dataL[i];
//             const R = dataR[i];

//             const M = (L + R) * 0.5;
//             const S = (L - R) * 0.5;

//             sumM2 += M * M;
//             sumS2 += S * S;
//         }

//         const rmsM = Math.sqrt(sumM2 / size);
//         const rmsS = Math.sqrt(sumS2 / size);

//         // width ratio (0 → mono, 1 → balanced, >1 → very wide)
//         const width = rmsM > 1e-6 ? rmsS / rmsM : 0;

//         return {
//             mid: rmsM,
//             side: rmsS,
//             width, // can be >1
//         };
//     }

//     // =========================
//     // MONO COMPAT + PHASE WARNING
//     // =========================

//     private isMonoMode = false;

//     setMonoMode(enabled: boolean) {
//         const now = this.audioContext.currentTime;

//         this.isMonoMode = enabled;

//         if (enabled) {
//             // collapse stereo → mono (via equal L/R mix)
//             this.masterGain.channelCount = 1;
//             this.masterGain.channelCountMode = "explicit";
//         } else {
//             this.masterGain.channelCount = 2;
//             this.masterGain.channelCountMode = "max";
//         }
//     }

//     getPhaseWarning() {
//         const corr = this.getStereoCorrelation();

//         if (corr < -0.2) return "bad";      // phase problem
//         if (corr < 0.2) return "risky";     // borderline
//         return "good";                      // safe
//     }

//     setSoloEnabled(enabled: boolean) {
//         const now = this.audioContext.currentTime;

//         this.soloEnabled = enabled;

//         if (enabled) {
//             // lower the main signal slightly, do not mute it
//             this.masterGain.gain.setTargetAtTime(0.15, now, 0.01);

//             // raise solo level
//             this.soloGain.gain.setTargetAtTime(1.5, now, 0.01);
//         } else {
//             this.masterGain.gain.setTargetAtTime(1, now, 0.01);
//             this.soloGain.gain.setTargetAtTime(0, now, 0.01);
//         }
//     }

//     setSoloBand(type: "low" | "mid" | "high") {
//         const f = this.soloFilter;

//         if (type === "low") {
//             f.type = "lowpass";
//             f.frequency.value = 250; // do not set it too low
//         }

//         if (type === "mid") {
//             f.type = "bandpass";
//             f.frequency.value = 1000;
//             f.Q.value = 0.7; // keep it from getting too narrow
//         }

//         if (type === "high") {
//             f.type = "highpass";
//             f.frequency.value = 3000;
//         }
//     }

//     // =========================
//     // SOLO SWEEP
//     // =========================

//     setSoloSweep(freq: number) {
//         const f = this.soloFilter;

//         f.type = "bandpass";
//         f.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.01);

//         // Q menentukan lebar band (semakin besar → semakin sempit)
//         if (!f.Q.value) f.Q.value = 5;
//     }

//     setSoloQ(q: number) {
//         this.soloFilter.Q.setTargetAtTime(q, this.audioContext.currentTime, 0.01);
//     }

//     // =========================
//     // EQ CONTROL
//     // =========================

//     setEQBands(bands: EQBand[]) {
//         bands.forEach((band, i) => {
//             const f = this.eqFilters[i];
//             if (!f) return;

//             f.frequency.setTargetAtTime(band.freq, this.audioContext.currentTime, 0.01);
//             f.gain.setTargetAtTime(band.gain, this.audioContext.currentTime, 0.01);
//             f.Q.setTargetAtTime(band.Q, this.audioContext.currentTime, 0.01);
//         });
//     }

//     // =========================
//     // EQ INJECTION (HELPER)
//     // =========================
//     applyEQBand(index: number, freq: number, gain: number, Q: number) {
//         const f = this.eqFilters[index];
//         if (!f) return;

//         const now = this.audioContext.currentTime;

//         f.frequency.setTargetAtTime(freq, now, 0.01);
//         f.gain.setTargetAtTime(gain, now, 0.01);
//         f.Q.setTargetAtTime(Q, now, 0.01);
//     }

//     // =========================
//     // COMPRESSOR CONTROL
//     // =========================

//     setCompressorEnabled(enabled: boolean) {
//         const now = this.audioContext.currentTime;

//         if (enabled) {
//             this.compGain.gain.setTargetAtTime(1, now, 0.01);
//             this.compBypassGain.gain.setTargetAtTime(0, now, 0.01);
//         } else {
//             this.compGain.gain.setTargetAtTime(0, now, 0.01);
//             this.compBypassGain.gain.setTargetAtTime(1, now, 0.01);
//         }
//     }

//     setCompThreshold(v: number) {
//         this.compressor.threshold.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
//     }

//     setCompRatio(v: number) {
//         this.compressor.ratio.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
//     }

//     setCompAttack(v: number) {
//         this.compressor.attack.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
//     }

//     setCompRelease(v: number) {
//         this.compressor.release.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
//     }

//     setLimiterEnabled(enabled: boolean) {
//         const now = this.audioContext.currentTime;

//         if (enabled) {
//             this.limiterGain.gain.setTargetAtTime(1, now, 0.01);
//             this.limiterBypassGain.gain.setTargetAtTime(0, now, 0.01);
//         } else {
//             this.limiterGain.gain.setTargetAtTime(0, now, 0.01);
//             this.limiterBypassGain.gain.setTargetAtTime(1, now, 0.01);
//         }
//     }

//     setLimiterDrive(db: number) {
//         const linear = Math.pow(10, db / 20);

//         this.limiterInputGain.gain.setTargetAtTime(
//             linear,
//             this.audioContext.currentTime,
//             0.01
//         );
//     }
//     setLimiterCeiling(db: number) {
//         this.limiterCeiling = db;
//         this.setLimiterThreshold(db);
//     }
//     setLimiterThreshold(v: number) {
//         this.limiter.threshold.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
//     }

//     setLimiterRelease(v: number) {
//         this.limiter.release.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
//     }

//     setLimiterLookahead(ms: number) {
//         this.lookaheadDelay.delayTime.setTargetAtTime(
//             ms / 1000,
//             this.audioContext.currentTime,
//             0.01
//         );
//     }

//     // =========================
//     // GAIN CONTROL
//     // =========================

//     setInputGain(db: number) {
//         const linear = Math.pow(10, db / 20);
//         this.inputGain.gain.setTargetAtTime(linear, this.audioContext.currentTime, 0.01);
//     }

//     setOutputGain(db: number) {
//         const linear = Math.pow(10, db / 20);
//         this.outputGain.gain.setTargetAtTime(linear, this.audioContext.currentTime, 0.01);
//     }

//     setPostGain(db: number) {
//         const linear = Math.pow(10, db / 20);
//         this.postGain.gain.setTargetAtTime(linear, this.audioContext.currentTime, 0.01);
//     }

//     // =========================
//     // A/B SWITCH
//     // =========================

//     setABMode(mode: "original" | "processed") {
//         const now = this.audioContext.currentTime;

//         if (mode === "original") {
//             this.dryGain.gain.setTargetAtTime(1, now, 0.01);
//             this.wetGain.gain.setTargetAtTime(0, now, 0.01);
//         } else {
//             this.dryGain.gain.setTargetAtTime(0, now, 0.01);
//             this.wetGain.gain.setTargetAtTime(1, now, 0.01);
//         }
//     }

//     setOutputGainDb(db: number) {
//         const linear = Math.pow(10, db / 20);

//         this.masterGain.gain.setTargetAtTime(
//             linear,
//             this.audioContext.currentTime,
//             0.05
//         );
//     }

//     // =========================
//     // TIME
//     // =========================

//     getCurrentTime() {
//         if (!this.isPlaying) return this.pauseOffset;

//         return this.audioContext.currentTime - this.startTime;
//     }
// }

// export const audioEngine = new AudioEngine();

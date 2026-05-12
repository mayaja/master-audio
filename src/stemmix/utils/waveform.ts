export function generateWaveform(audioBuffer: AudioBuffer, numPoints: number = 3000): number[] {
    if (!audioBuffer || audioBuffer.numberOfChannels === 0) {
        return [];
    }

    const channels = Array.from(
        { length: audioBuffer.numberOfChannels },
        (_, index) => audioBuffer.getChannelData(index),
    )
    const numSamples = audioBuffer.length;
    const waveform: number[] = [];
    
    // Menggunakan floating point untuk akurasi posisi sampel yang lebih baik
    const samplesPerPoint = numSamples / numPoints;
    let maxOverallValue = 0;

    for (let i = 0; i < numPoints; i++) {
        let peakInChunk = 0;
        let sumSquares = 0;
        let samplesMeasured = 0;
        const startSample = Math.floor(i * samplesPerPoint);
        const endSample = Math.min(
            numSamples,
            Math.max(
                startSample + 1,
                Math.floor((i + 1) * samplesPerPoint),
            ),
        );

        for (let j = startSample; j < endSample; j++) {
            for (const channelData of channels) {
                const sample = Math.abs(channelData[j] ?? 0);
                if (sample > peakInChunk) {
                    peakInChunk = sample;
                }

                sumSquares += sample * sample;
                samplesMeasured += 1;
            }
        }
        
        const rms = samplesMeasured > 0
            ? Math.sqrt(sumSquares / samplesMeasured)
            : 0;

        // Blend peak dan RMS agar transient tetap terlihat, tapi bentuk track tidak jadi datar.
        const visualValue =
            Math.sqrt((peakInChunk * 0.65) + (rms * 0.35));
        
        waveform.push(visualValue);
        if (visualValue > maxOverallValue) {
            maxOverallValue = visualValue;
        }
    }

    if (maxOverallValue > 0) {
        return waveform.map(value => value / maxOverallValue);
    }
    return waveform; // Kembalikan apa adanya jika tidak ada suara
}

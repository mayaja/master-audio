export type TonalZones = {
  sub: number;
  bass: number;
  lowMid: number;
  mids: number;
  presence: number;
  highs: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type BandName = keyof TonalZones;

const bandOrder: BandName[] = ["sub", "bass", "lowMid", "mids", "presence", "highs"];

function getBand(freq: number): BandName | null {
  if (freq >= 20 && freq < 60) return "sub";
  if (freq >= 60 && freq < 250) return "bass";
  if (freq >= 250 && freq < 500) return "lowMid";
  if (freq >= 500 && freq < 2000) return "mids";
  if (freq >= 2000 && freq < 6000) return "presence";
  if (freq >= 6000 && freq <= 20000) return "highs";
  return null;
}

function createHann(size: number) {
  const w = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return w;
}

export async function analyzeFullTrackTonal(
  buffer: AudioBuffer,
  onProgress?: (progress: number) => void
): Promise<TonalZones> {
  const frameSize = 512;
  const hop = 256;
  const maxFrames = 140;

  const channels = Math.max(1, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const nyquistBins = frameSize / 2;

  const window = createHann(frameSize);
  const channelData = Array.from({ length: channels }, (_, i) => buffer.getChannelData(i));

  const totalFrames = Math.max(1, Math.floor((Math.max(length - frameSize, 0)) / hop) + 1);
  const frameStep = Math.max(1, Math.floor(totalFrames / maxFrames));

  const sums: TonalZones = {
    sub: 0,
    bass: 0,
    lowMid: 0,
    mids: 0,
    presence: 0,
    highs: 0,
  };

  const counts: TonalZones = {
    sub: 0,
    bass: 0,
    lowMid: 0,
    mids: 0,
    presence: 0,
    highs: 0,
  };

  const frame = new Float32Array(frameSize);

  let processed = 0;
  const selectedFrames = Math.max(1, Math.ceil(totalFrames / frameStep));

  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += frameStep) {
    const start = frameIndex * hop;

    for (let n = 0; n < frameSize; n++) {
      const sampleIndex = start + n;

      if (sampleIndex >= length) {
        frame[n] = 0;
        continue;
      }

      let mono = 0;
      for (let ch = 0; ch < channels; ch++) {
        mono += channelData[ch][sampleIndex] ?? 0;
      }

      mono /= channels;
      frame[n] = mono * window[n];
    }

    for (let k = 1; k < nyquistBins; k++) {
      let re = 0;
      let im = 0;

      for (let n = 0; n < frameSize; n++) {
        const angle = (2 * Math.PI * k * n) / frameSize;
        re += frame[n] * Math.cos(angle);
        im -= frame[n] * Math.sin(angle);
      }

      const mag = Math.sqrt(re * re + im * im);
      const freq = (k * sampleRate) / frameSize;
      const band = getBand(freq);

      if (!band) continue;

      sums[band] += mag;
      counts[band] += 1;
    }

    processed += 1;

    if (onProgress) {
      const progress = clamp(Math.round((processed / selectedFrames) * 100), 0, 100);
      onProgress(progress);
    }

    if (processed % 4 === 0) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  const raw: TonalZones = {
    sub: sums.sub / Math.max(counts.sub, 1),
    bass: sums.bass / Math.max(counts.bass, 1),
    lowMid: sums.lowMid / Math.max(counts.lowMid, 1),
    mids: sums.mids / Math.max(counts.mids, 1),
    presence: sums.presence / Math.max(counts.presence, 1),
    highs: sums.highs / Math.max(counts.highs, 1),
  };

  const maxBand = Math.max(...bandOrder.map((band) => raw[band]), 1e-8);

  return {
    sub: clamp(raw.sub / maxBand, 0, 1),
    bass: clamp(raw.bass / maxBand, 0, 1),
    lowMid: clamp(raw.lowMid / maxBand, 0, 1),
    mids: clamp(raw.mids / maxBand, 0, 1),
    presence: clamp(raw.presence / maxBand, 0, 1),
    highs: clamp(raw.highs / maxBand, 0, 1),
  };
}

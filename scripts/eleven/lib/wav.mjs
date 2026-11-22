/**
 * Stage 5 — PCM work that ffmpeg cannot do here.
 *
 * The ffmpeg binary Remotion ships is a reduced build: `loudnorm`, `atrim`,
 * `adelay`, `concat` and `volume` are present, but **`highpass` and
 * `silenceremove` are not**. Rather than add a system ffmpeg dependency, the
 * two missing steps are done on decoded samples, which is exact and has no
 * install story. Loudness normalisation stays in ffmpeg, where the correct
 * EBU R128 implementation lives.
 *
 * Everything here assumes 16-bit signed little-endian mono PCM, which is what
 * the decode step asks ffmpeg for.
 */

/** Parses a canonical RIFF/WAVE file into `{sampleRate, channels, samples}`. */
export const decodeWav = (buffer) => {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('не WAV: отсутствует заголовок RIFF/WAVE');
  }
  let offset = 12;
  let format = null;
  let dataStart = null;
  let dataLength = 0;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      format = {
        audioFormat: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        bitsPerSample: buffer.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      dataStart = body;
      dataLength = size;
    }
    offset = body + size + (size % 2); // chunks are word-aligned
  }
  if (!format || dataStart === null) throw new Error('в WAV нет fmt или data');
  if (format.bitsPerSample !== 16) throw new Error(`ожидается 16 бит, получено ${format.bitsPerSample}`);

  const count = Math.floor(Math.min(dataLength, buffer.length - dataStart) / 2);
  const samples = new Float32Array(count);
  for (let i = 0; i < count; i += 1) samples[i] = buffer.readInt16LE(dataStart + i * 2) / 32768;
  return {sampleRate: format.sampleRate, channels: format.channels, samples};
};

/** Writes mono 16-bit PCM back out as a canonical WAV. */
export const encodeWav = (samples, sampleRate) => {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
};

/**
 * Second-order Butterworth high-pass, applied forward only.
 *
 * 80 Hz removes rumble and room boom without touching the voice: the lowest
 * male fundamental sits around 85 Hz, so the filter is below the signal.
 */
export const highPass = (samples, sampleRate, cutoffHz = 80) => {
  const omega = (2 * Math.PI * cutoffHz) / sampleRate;
  const sn = Math.sin(omega);
  const cs = Math.cos(omega);
  const alpha = sn / Math.SQRT2; // Q = 1/sqrt(2), Butterworth

  const b0 = (1 + cs) / 2;
  const b1 = -(1 + cs);
  const b2 = (1 + cs) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * cs;
  const a2 = 1 - alpha;

  const out = new Float32Array(samples.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const x0 = samples[i];
    const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    out[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return out;
};

/**
 * Trims silence from both ends using a short-window RMS gate.
 *
 * The leading trim is reported because it shifts every timestamp in the chunk's
 * alignment — getting this wrong desynchronises every caption in the reel.
 */
export const trimSilence = (samples, sampleRate, {thresholdDb = -45, padMs = 40} = {}) => {
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.01)); // 10 ms
  const threshold = 10 ** (thresholdDb / 20);

  const loud = (start) => {
    let sum = 0;
    const end = Math.min(samples.length, start + windowSize);
    for (let i = start; i < end; i += 1) sum += samples[i] * samples[i];
    return Math.sqrt(sum / Math.max(1, end - start)) > threshold;
  };

  let first = 0;
  while (first < samples.length && !loud(first)) first += windowSize;
  let last = samples.length - windowSize;
  while (last > first && !loud(last)) last -= windowSize;

  if (first >= samples.length) return {samples: new Float32Array(0), trimmedLeadingMs: 0};

  const pad = Math.floor((padMs / 1000) * sampleRate);
  const from = Math.max(0, first - pad);
  const to = Math.min(samples.length, last + windowSize + pad);
  return {
    samples: samples.slice(from, to),
    trimmedLeadingMs: (from / sampleRate) * 1000,
  };
};

/** Concatenates chunks with a fixed silent gap, returning each chunk's offset. */
export const concatWithGaps = (chunks, sampleRate, gapMs) => {
  const gap = Math.round((gapMs / 1000) * sampleRate);
  const total = chunks.reduce((sum, c) => sum + c.length, 0) + gap * Math.max(0, chunks.length - 1);
  const out = new Float32Array(total);
  const offsetsMs = [];

  let cursor = 0;
  chunks.forEach((chunk, i) => {
    offsetsMs.push((cursor / sampleRate) * 1000);
    out.set(chunk, cursor);
    cursor += chunk.length;
    if (i < chunks.length - 1) cursor += gap;
  });
  return {samples: out, offsetsMs, durationMs: (total / sampleRate) * 1000};
};

/** Peak sample, for reporting headroom after normalisation. */
export const peakDb = (samples) => {
  let peak = 0;
  for (let i = 0; i < samples.length; i += 1) peak = Math.max(peak, Math.abs(samples[i]));
  return peak > 0 ? 20 * Math.log10(peak) : -Infinity;
};

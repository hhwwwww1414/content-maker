// Alignment can place a sentence's first word inside the pause before it. Measure where speech really starts.
import {spawnSync} from 'node:child_process';

const WINDOW_MS = 10;
const SAMPLES = (48000 * WINDOW_MS) / 1000;

export const decodeEnvelope = (file) => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], {maxBuffer: 800 * 1024 * 1024});
  if (r.status !== 0) throw Error('Cannot decode ' + file);
  const pcm = r.stdout;
  const envelope = new Float32Array(Math.floor(pcm.length / 2 / SAMPLES));
  let total = 0;
  for (let w = 0; w < envelope.length; w++) {
    let sum = 0;
    for (let s = 0; s < SAMPLES; s++) {
      const value = pcm.readInt16LE((w * SAMPLES + s) * 2) / 32768;
      sum += value * value;
    }
    total += sum;
    envelope[w] = Math.sqrt(sum / SAMPLES);
  }
  return {envelope, rms: Math.sqrt(total / (envelope.length * SAMPLES))};
};

/**
 * Moves each word to its first voiced window, searching up to the next word: a short
 * sentence-opening token can lie wholly inside the pause. Silent words and dashes stay put.
 */
export const refineOnsets = (words, {envelope, rms}, ratio = 0.12) => {
  const threshold = rms * ratio;
  const out = words.map((word) => ({...word}));
  out.forEach((word, i) => {
    if (word.silent) return;
    const next = words.slice(i + 1).find((w) => !w.silent);
    const limit = next ? next.startMs : word.endMs;
    word.startMs = Math.max(0, word.startMs);
    const from = Math.floor(word.startMs / WINDOW_MS), to = Math.ceil(limit / WINDOW_MS);
    for (let w = from; w < Math.min(to, envelope.length); w++) {
      if (envelope[w] < threshold) continue;
      const onset = w * WINDOW_MS;
      word.startMs = Math.max(word.startMs, onset);
      if (word.endMs <= word.startMs) word.endMs = Math.min(limit, word.startMs + 120);
      return;
    }
  });
  return out;
};

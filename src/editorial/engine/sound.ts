// Music is mixed against the voice: it dips while a word is spoken, recovers in the pauses, and fades at the ends.

export type DuckInput = {fps: number; words: Array<{startMs: number; endMs: number}>; base: number; duck: number; totalFrames: number; attackMs?: number; releaseMs?: number; fadeSeconds?: number};

/** Speech presence at a time (0..1): an attack before each word and a release after it. */
export const speechAt = (ms: number, words: DuckInput['words'], attackMs = 90, releaseMs = 320) => {
  let level = 0;
  for (const w of words) {
    if (w.startMs - attackMs > ms) break;
    if (ms >= w.startMs && ms <= w.endMs) return 1;
    if (ms < w.startMs) level = Math.max(level, 1 - (w.startMs - ms) / attackMs);
    else if (ms - w.endMs < releaseMs) level = Math.max(level, 1 - (ms - w.endMs) / releaseMs);
  }
  return level;
};

export const duckedVolume = (frame: number, o: DuckInput) => {
  const ms = (frame / o.fps) * 1000;
  const presence = speechAt(ms, o.words, o.attackMs, o.releaseMs);
  const fade = (o.fadeSeconds ?? 0.8) * o.fps;
  const edges = Math.min(1, frame / fade, Math.max(0, (o.totalFrames - frame) / fade));
  return o.base * (1 - o.duck * presence) * edges;
};

import type {Cue} from './types';

export type TimedWord = {text: string; norm: string; startMs: number; endMs: number};
export const normWord = (text: string) => text.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}_]/gu, '');

/** Finds a cue's time in seconds from the scene start. Unknown words throw: a silent miss would desync the reel. */
export const cueSeconds = (cue: Cue, words: TimedWord[], sceneStart: number): number => {
  if (typeof cue === 'number') return cue;
  const [word, nth] = cue.split('#');
  const prefix = normWord(word);
  const hits = words.filter((w) => w.norm.startsWith(prefix));
  const hit = hits[(nth ? Number(nth) : 1) - 1];
  if (!hit) throw new Error(`Cue "${cue}" is not spoken in this scene`);
  return hit.startMs / 1000 - sceneStart;
};

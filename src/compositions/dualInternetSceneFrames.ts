import timeline from '../generated/timeline-dual-internet.json';

type Segment = {id: string; startMs: number; endMs: number};
const segments = timeline.segments as Segment[];
const frame = (ms: number) => Math.round((ms / 1000) * timeline.fps);
const start = (id: string) => frame(segments.find((s) => s.id === id)?.startMs ?? 0);
const end = (id: string) => frame(segments.find((s) => s.id === id)?.endMs ?? 0);

export const dualInternetFrames = {
  fps: timeline.fps,
  durationInFrames: timeline.durationInFrames,
  s1a: start('s1a'),
  s1c: start('s1c'),
  s2a: start('s2a'),
  s2c: start('s2c'),
  s2d: start('s2d'),
  s3a: start('s3a'),
  s3b: start('s3b'),
  s3c: start('s3c'),
  s4a: start('s4a'),
  s4c: start('s4c'),
  s5a: start('s5a'),
  s5b: start('s5b'),
  speechEnd: end('s5b'),
} as const;

import timeline from '../generated/timeline-time-drain.json';

type Segment = {id: string; startMs: number; endMs: number};
const segments = timeline.segments as Segment[];
const frame = (ms: number) => Math.round((ms / 1000) * timeline.fps);
const start = (id: string) => frame(segments.find((segment) => segment.id === id)?.startMs ?? 0);
const end = (id: string) => frame(segments.find((segment) => segment.id === id)?.endMs ?? 0);

export const timeDrainFrames = {
  fps: timeline.fps,
  durationInFrames: timeline.durationInFrames,
  hookB: start('hook_b'),
  drain: start('drain_a'),
  drainB: start('drain_b'),
  drainC: start('drain_c'),
  cost: start('cost_a'),
  costB: start('cost_b'),
  freeze: start('freeze_a'),
  freezeB: start('freeze_b'),
  cta: start('cta_a'),
  ctaB: start('cta_b'),
  speechEnd: end('cta_b'),
} as const;


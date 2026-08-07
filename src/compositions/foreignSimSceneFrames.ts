import timeline from '../generated/timeline-foreign-sim.json';

type Segment = {id: string; startMs: number; endMs: number};
const segments = timeline.segments as Segment[];
const frame = (ms: number) => Math.round((ms / 1000) * timeline.fps);
const start = (id: string) => frame(segments.find((segment) => segment.id === id)?.startMs ?? 0);
const end = (id: string) => frame(segments.find((segment) => segment.id === id)?.endMs ?? 0);

export const foreignSimFrames = {
  fps: timeline.fps,
  durationInFrames: timeline.durationInFrames,
  hookB: start('hook_b'),
  minc: start('minc_a'),
  mincB: start('minc_b'),
  rule: start('rule_a'),
  ruleB: start('rule_b'),
  turn: start('turn_a'),
  turnB: start('turn_b'),
  cta: start('cta_a'),
  ctaB: start('cta_b'),
  speechEnd: end('cta_b'),
} as const;

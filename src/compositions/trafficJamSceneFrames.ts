import timeline from '../generated/timeline-traffic-jam.json';

type Segment = {id: string; startMs: number; endMs: number};
const segments = timeline.segments as Segment[];
const frame = (ms: number) => Math.round((ms / 1000) * timeline.fps);
const start = (id: string) => frame(segments.find((segment) => segment.id === id)?.startMs ?? 0);
const end = (id: string) => frame(segments.find((segment) => segment.id === id)?.endMs ?? 0);

export const trafficJamFrames = {
  fps: timeline.fps,
  durationInFrames: timeline.durationInFrames,
  hookA: start('hook_a'),
  hookB: start('hook_b'),
  jamA: start('jam_a'),
  jamB: start('jam_b'),
  jamC: start('jam_c'),
  heroA: start('hero_a'),
  heroB: start('hero_b'),
  flowA: start('flow_a'),
  flowB: start('flow_b'),
  ctaA: start('cta_a'),
  ctaB: start('cta_b'),
  speechEnd: end('cta_b'),
} as const;

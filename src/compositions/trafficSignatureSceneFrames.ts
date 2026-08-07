import timeline from '../generated/timeline-traffic-signature.json';

type Segment = {id: string; startMs: number; endMs: number};
const segments = timeline.segments as Segment[];
const toFrame = (ms: number) => Math.round((ms / 1000) * timeline.fps);
const start = (id: string) => toFrame(segments.find((s) => s.id === id)?.startMs ?? 0);
const end = (id: string) => toFrame(segments.find((s) => s.id === id)?.endMs ?? 0);

/**
 * Voice-driven frame beats for the compact (~10s) cut. Scene boundaries follow the
 * voiceover; individual visual beats are derived from these in the composition.
 */
export const tsFrames = {
  fps: timeline.fps,
  durationInFrames: timeline.durationInFrames,
  // Scene 1 — hook
  s1a: start('s1a'), // Трафик зашифрован
  s1b: start('s1b'), // но его узнали
  s1c: start('s1c'), // Как
  // Scene 2 — почерк + признаки
  s2a: start('s2a'), // У потока остаётся почерк
  s2b: start('s2b'), // размер и ритм
  // Scene 3 — thesis + reflection mascot reveal
  s4a: start('s4a'), // Шифрование не значит невидимость
  // Scene 4 — final
  s5a: start('s5a'), // Теперь ты знаешь
  s5b: start('s5b'), // что выдаёт зашифрованный поток
  speechEnd: end('s5b'),
} as const;

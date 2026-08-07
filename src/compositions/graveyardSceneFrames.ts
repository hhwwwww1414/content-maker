import timeline from '../generated/timeline-graveyard.json';

const toFrames = (ms: number, fps: number) => Math.max(1, Math.round((ms / 1000) * fps));
const toFramesOffset = (ms: number, fps: number) => Math.max(0, Math.round((ms / 1000) * fps));

// The hook headline and the VPN-failure cascade now get fixed, generous holds instead of
// splitting whatever the hook line's own pause happens to be: ~4s and ~3s per request, with
// the actual pause length in content JSON sized so the "died" line never starts early.
const HOOK_SCENE_FRAMES = 120;
const FAILURE_SCENE_FRAMES = 90;

type TimelineSegment = {id: string; startMs: number; durationMs: number; pauseAfterMs: number};

const byId = (id: string, segments: TimelineSegment[]): TimelineSegment => {
  const seg = segments.find((s) => s.id === id);
  if (!seg) throw new Error(`graveyardSceneFrames: missing timeline segment "${id}"`);
  return seg;
};

export const computeGraveyardSceneFrames = () => {
  const {fps, finalHoldMs, segments} = timeline as {fps: number; finalHoldMs: number; segments: TimelineSegment[]};

  const died = byId('died', segments);
  const transition = byId('transition', segments);
  const connect = byId('connect', segments);
  const benefits1 = byId('benefits1', segments);
  const benefits2 = byId('benefits2', segments);
  const benefits3 = byId('benefits3', segments);
  const cta1 = byId('cta1', segments);
  const cta2 = byId('cta2', segments);

  const benefitsSceneFrames = toFrames(
    benefits1.durationMs +
      benefits1.pauseAfterMs +
      benefits2.durationMs +
      benefits2.pauseAfterMs +
      benefits3.durationMs +
      benefits3.pauseAfterMs,
    fps,
  );
  const benefitsStarts = [benefits1, benefits2, benefits3].map((s) => toFramesOffset(s.startMs - benefits1.startMs, fps));

  const ctaSceneFrames = toFrames(cta1.durationMs + cta1.pauseAfterMs + cta2.durationMs + finalHoldMs, fps);

  const frames = [
    HOOK_SCENE_FRAMES,
    FAILURE_SCENE_FRAMES,
    toFrames(died.durationMs + died.pauseAfterMs, fps),
    toFrames(transition.durationMs + transition.pauseAfterMs, fps),
    toFrames(connect.durationMs + connect.pauseAfterMs, fps),
    benefitsSceneFrames,
    ctaSceneFrames,
  ];

  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));
  const durationInFrames = frames.reduce((a, b) => a + b, 0);

  return {fps, frames, starts, durationInFrames, benefitsStarts};
};

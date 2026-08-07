import timeline from '../generated/timeline-quest.json';

type TimelineSegment = {id: string; startMs: number; endMs: number; durationMs: number; pauseAfterMs: number};

const SCENE_IDS = ['hook', 'maze', 'trial', 'arrival', 'route', 'cta'] as const;

const toFrames = (ms: number, fps: number) => Math.max(1, Math.round((ms / 1000) * fps));

/** Groups the reel's many short voice sub-segments (e.g. "hook_a", "hook_b") back into
 * their six parent scenes, and derives each scene's real duration plus the relative
 * frame offset of every sub-segment's speech onset within that scene -- so on-screen
 * text can be timed to the actual audio instead of a flat, equally-spaced guess. */
export const computeQuestSceneFrames = () => {
  const {fps, finalHoldMs, segments} = timeline as {fps: number; finalHoldMs: number; segments: TimelineSegment[]};

  const groups = SCENE_IDS.map((id) => segments.filter((s) => s.id.startsWith(id)));

  const frames = groups.map((group, index) => {
    const first = group[0];
    const last = group[group.length - 1];
    const extra = index === groups.length - 1 ? finalHoldMs : 0;
    const durationMs = last.endMs + last.pauseAfterMs + extra - first.startMs;
    return toFrames(durationMs, fps);
  });

  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0));

  const beatFrames = groups.map((group) => group.map((seg) => Math.max(0, Math.round(((seg.startMs - group[0].startMs) / 1000) * fps))));
  const beatSpeechFrames = groups.map((group) => group.map((seg) => toFrames(seg.durationMs, fps)));

  const durationInFrames = frames.reduce((a, b) => a + b, 0);

  return {fps, frames, starts, beatFrames, beatSpeechFrames, durationInFrames, sceneIds: SCENE_IDS};
};

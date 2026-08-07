import timeline from '../generated/timeline-whitelist.json';

type TimelineSegment = {id: string; startMs: number; endMs: number; durationMs: number; pauseAfterMs: number};

/** Derives every animation anchor of the whitelist reel from the *measured* voiceover
 * timeline, so regenerating the audio automatically re-times the whole checkpoint
 * choreography: phase starts are the speech onsets of each scene's first segment. */
export const computeWhitelistFrames = () => {
  const {fps, durationInFrames, segments} = timeline as {
    fps: number;
    durationInFrames: number;
    segments: TimelineSegment[];
  };
  const toFrames = (ms: number) => Math.round((ms / 1000) * fps);
  const startOf = (id: string) => toFrames(segments.find((s) => s.id === id)?.startMs ?? 0);
  const endOf = (id: string) => toFrames(segments.find((s) => s.id === id)?.endMs ?? 0);

  return {
    fps,
    durationInFrames,
    hookB: startOf('hook_b'),
    factStart: startOf('fact_a'),
    factB: startOf('fact_b'),
    factEnd: endOf('fact_b'),
    passStart: startOf('pass_a'),
    passB: startOf('pass_b'),
    linkStart: startOf('link_a'),
    linkB: startOf('link_b'),
    ctaStart: startOf('cta_a'),
    ctaB: startOf('cta_b'),
    ctaEnd: endOf('cta_b'),
  };
};

export type WhitelistBeats = ReturnType<typeof computeWhitelistFrames>;

import {interpolate} from 'remotion';
import {CLAMP} from './brand';

/**
 * Turns a generated voice timeline into frame accessors. Every reel derives its
 * scene timing from the *real* measured audio, never from a target duration.
 */

export type VoiceTimeline = {
  fps: number;
  durationInFrames: number;
  voiceDurationMs: number;
  finalHoldMs: number;
  segments: {id: string; text: string; startMs: number; endMs: number; durationMs: number; pauseAfterMs: number}[];
};

export type CaptionPage = {text: string; startMs: number; durationMs: number};

export type Clock = {
  fps: number;
  total: number;
  /** First frame of a voice segment. */
  at: (id: string) => number;
  /** Last frame of a voice segment. */
  end: (id: string) => number;
  /** Frame where the voice track stops and the final hold begins. */
  voiceEnd: number;
  /** 0→1 entrance driven from a frame, clamped both sides. */
  rise: (frame: number, from: number, dur?: number) => number;
  /** Opacity envelope for a scene spanning two segments, with a settle ramp. */
  span: (frame: number, firstId: string, lastId: string, ramp?: number) => number;
};

export const makeClock = (timeline: VoiceTimeline): Clock => {
  const {fps} = timeline;
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
  const find = (id: string) => {
    const segment = timeline.segments.find((s) => s.id === id);
    if (!segment) throw new Error(`[clock] unknown voice segment "${id}"`);
    return segment;
  };
  const at = (id: string) => toFrame(find(id).startMs);
  const end = (id: string) => toFrame(find(id).endMs);
  return {
    fps,
    total: timeline.durationInFrames,
    at,
    end,
    voiceEnd: toFrame(timeline.voiceDurationMs),
    rise: (frame, from, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], CLAMP),
    span: (frame, firstId, lastId, ramp = 9) =>
      interpolate(
        frame,
        [at(firstId) - ramp, at(firstId) + ramp, end(lastId), end(lastId) + ramp],
        [0, 1, 1, 0],
        CLAMP,
      ),
  };
};

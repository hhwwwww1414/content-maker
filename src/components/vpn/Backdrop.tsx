import React from 'react';
import {AbsoluteFill, Loop, OffthreadVideo, interpolate, staticFile} from 'remotion';
import {night} from '../vibe/theme';
import {useMs} from '../vibe/primitives';

/**
 * The only background of the reel: one local MP4, looped for the whole
 * composition, muted, always the bottom layer.
 *
 * `OffthreadVideo` in the installed Remotion has no `loop` prop, so the official
 * `<Loop>` component drives the repetition — it restarts the child's frame
 * counter, which is deterministic in both preview and render.
 */
export const LoopingBackground: React.FC<{
  src: string;
  /** length of the source clip in frames of the *composition's* fps */
  loopFrames: number;
  overlayOpacity?: number;
}> = ({src, loopFrames, overlayOpacity = 0.42}) => (
  <AbsoluteFill>
    <Loop durationInFrames={loopFrames}>
      <OffthreadVideo
        src={staticFile(src)}
        muted
        // The clip is 720x1280; cover scales it to the 1080x1920 canvas.
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
    </Loop>

    {/* readability overlay — a touch heavier behind the text bands */}
    <AbsoluteFill style={{background: `rgba(8,10,13,${overlayOpacity})`}} />
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(180deg, rgba(8,10,13,0.42) 0%, rgba(8,10,13,0.10) 34%, ' +
          'rgba(8,10,13,0.10) 56%, rgba(8,10,13,0.46) 82%, rgba(8,10,13,0.30) 100%)',
      }}
    />
    {/* very subtle vignette, no blur — the background must keep moving */}
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.42) 100%)',
      }}
    />
  </AbsoluteFill>
);

/** Brief alarm / resolution washes. Never more than a light tint. */
export const MoodTint: React.FC<{
  alarm?: {fromMs: number; toMs: number} | null;
  calm?: {fromMs: number; toMs: number} | null;
  split?: {fromMs: number; toMs: number} | null;
}> = ({alarm, calm, split}) => {
  const ms = useMs();
  const band = (window: {fromMs: number; toMs: number} | null | undefined, peak: number) => {
    if (!window) return 0;
    const {fromMs, toMs} = window;
    const ramp = Math.min(500, (toMs - fromMs) / 3);
    return interpolate(ms, [fromMs, fromMs + ramp, toMs - ramp, toMs], [0, peak, peak, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  const alarmOpacity = band(alarm, 0.11);
  const calmOpacity = band(calm, 0.1);
  const splitOpacity = band(split, 0.11);

  return (
    <>
      {alarmOpacity > 0.002 ? (
        <AbsoluteFill style={{background: night.red, opacity: alarmOpacity, mixBlendMode: 'screen'}} />
      ) : null}
      {calmOpacity > 0.002 ? (
        <AbsoluteFill style={{background: night.mint, opacity: calmOpacity, mixBlendMode: 'screen'}} />
      ) : null}
      {splitOpacity > 0.002 ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(90deg, ${night.red} 0%, ${night.red} 42%, rgba(0,0,0,0) 50%, ${night.mint} 58%, ${night.mint} 100%)`,
            opacity: splitOpacity,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
    </>
  );
};

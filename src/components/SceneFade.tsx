import type {ReactNode} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/**
 * Wraps a scene in a soft dip-to-black at its edges instead of a hard cut, without
 * touching any timing: both neighbouring scenes fade through the same solid
 * background colour, reading as a gentle crossfade at zero sync risk.
 */
export const SceneFade: React.FC<{
  durationInFrames: number;
  fadeIn?: number;
  fadeOut?: number;
  children: ReactNode;
}> = ({durationInFrames, fadeIn = 16, fadeOut = 16, children}) => {
  const frame = useCurrentFrame();
  const inOpacity = fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const outOpacity =
    fadeOut > 0 ? interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;

  return <AbsoluteFill style={{opacity: Math.min(inOpacity, outOpacity)}}>{children}</AbsoluteFill>;
};

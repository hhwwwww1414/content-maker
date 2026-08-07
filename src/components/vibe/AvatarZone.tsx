import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {slots} from './theme';
import {useMs} from './primitives';

export type AvatarState = {state: string; atMs: number | null};

const src = (state: string) => staticFile(`assets/avatar/avatar-${state}.png`);

/** Which pose is active at `ms` — states are ordered and only change on meaning. */
const activeIndex = (states: AvatarState[], ms: number) => {
  let index = 0;
  for (let i = 0; i < states.length; i++) {
    if (states[i].atMs !== null && ms >= (states[i].atMs as number)) index = i;
  }
  return index;
};

const CROSSFADE_MS = 260;

// Stacked drop-shadows approximate a sticker die-cut outline on a cut-out PNG.
const STICKER_FILTER =
  'drop-shadow(0 0 3px rgba(255,255,255,0.95)) drop-shadow(0 0 3px rgba(255,255,255,0.95)) ' +
  'drop-shadow(0 0 3px rgba(255,255,255,0.85)) drop-shadow(0 14px 26px rgba(0,0,0,0.55))';

/**
 * Bottom-left avatar. The PNGs are square cut-outs, so they are never stretched
 * or cropped — only translated and scaled uniformly.
 */
export const AvatarZone: React.FC<{
  states: AvatarState[];
  /** sticker outline + drop shadow, for reels where the avatar sits on video */
  sticker?: boolean;
}> = ({states, sticker = false}) => {
  const ms = useMs();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const index = activeIndex(states, ms);
  const current = states[index];
  const previous = index > 0 ? states[index - 1] : null;

  // The first pose is present from frame 0 — the hook must not fade in.
  const swap = current.atMs === null || index === 0
    ? 1
    : interpolate(ms, [current.atMs, current.atMs + CROSSFADE_MS], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  // Idle breathing: ~4.5 s cycle, 1.2 % scale, 5 px drift. Deterministic.
  const t = frame / fps;
  const breath = Math.sin((t / 4.5) * Math.PI * 2);
  const sway = Math.sin((t / 7.3) * Math.PI * 2);
  const scale = 1 + breath * 0.012;
  const driftY = breath * -5;
  const driftX = sway * 3;

  // A small settle whenever the pose changes, so the swap does not feel like a cut.
  const settle = interpolate(swap, [0, 1], [0.955, 1], {extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        position: 'absolute',
        left: slots.avatar.x,
        top: slots.avatar.y,
        width: slots.avatar.width,
        height: slots.avatar.height,
        transform: `translate(${driftX}px, ${driftY}px) scale(${scale * settle})`,
        transformOrigin: 'bottom center',
      }}
    >
      {/* soft contact shadow keeps the cut-out from floating on the light canvas */}
      <div
        style={{
          position: 'absolute',
          left: '14%',
          right: '14%',
          bottom: 6,
          height: 18,
          borderRadius: '50%',
          background: 'rgba(22,22,15,0.10)',
          filter: 'blur(9px)',
          opacity: sticker ? 0 : 0.8 + breath * 0.1,
        }}
      />
      {/* sticker outline is applied per-image so the crossfade stays clean */}
      {previous ? (
        <Img
          src={src(previous.state)}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 1 - swap, filter: sticker ? STICKER_FILTER : undefined}}
        />
      ) : null}
      <Img
        src={src(current.state)}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: swap, filter: sticker ? STICKER_FILTER : undefined}}
      />
    </div>
  );
};

import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {vibe} from './theme';
import {manrope, unbounded} from '../../theme/fonts';

/** Current composition time in milliseconds. */
export const useMs = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (frame / fps) * 1000;
};

export type Enter = {opacity: number; y: number; scale: number; progress: number};

/**
 * Standard element entrance: fade + short rise + a barely-there scale.
 * `atMs === null` means "never" and keeps the element hidden.
 */
export const useEnter = (atMs: number | null, options?: {durationMs?: number; rise?: number; pop?: boolean}): Enter => {
  const ms = useMs();
  const {fps} = useVideoConfig();
  const {durationMs = 420, rise = 22, pop = false} = options ?? {};

  if (atMs === null) return {opacity: 0, y: rise, scale: 0.98, progress: 0};

  const elapsed = ms - atMs;
  const progress = interpolate(elapsed, [0, durationMs], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (!pop) {
    return {opacity: progress, y: rise * (1 - progress), scale: 0.985 + 0.015 * progress, progress};
  }

  const bounce = spring({
    frame: Math.max(0, (elapsed / 1000) * fps),
    fps,
    config: {damping: 16, stiffness: 140, mass: 0.6},
    durationInFrames: Math.round((durationMs / 1000) * fps),
  });
  return {opacity: progress, y: rise * (1 - bounce), scale: 0.92 + 0.08 * bounce, progress};
};

/** Fades an element out again once `untilMs` passes. 1 = fully visible. */
export const useExit = (untilMs: number | null, durationMs = 340): number => {
  const ms = useMs();
  if (untilMs === null) return 1;
  return interpolate(ms, [untilMs - durationMs, untilMs], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const enterStyle = (enter: Enter, exit = 1): React.CSSProperties => ({
  opacity: enter.opacity * exit,
  transform: `translateY(${enter.y}px) scale(${enter.scale})`,
});

type Tone = 'danger' | 'warning' | 'mint' | 'neutral';

const TONES: Record<Tone, {fg: string; bg: string; border: string}> = {
  danger: {fg: vibe.danger, bg: vibe.dangerSoft, border: 'rgba(200,80,63,0.42)'},
  warning: {fg: '#8A6410', bg: vibe.warnSoft, border: 'rgba(217,162,27,0.48)'},
  mint: {fg: '#0A7A55', bg: vibe.mintSoft, border: 'rgba(18,185,129,0.42)'},
  neutral: {fg: vibe.inkSoft, bg: 'rgba(22,22,15,0.05)', border: vibe.line},
};

export const Chip: React.FC<{
  label: string;
  tone?: Tone;
  size?: number;
  style?: React.CSSProperties;
}> = ({label, tone = 'neutral', size = 30, style}) => {
  const palette = TONES[tone];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: `${Math.round(size * 0.42)}px ${Math.round(size * 0.8)}px`,
        borderRadius: 999,
        background: palette.bg,
        border: `2px solid ${palette.border}`,
        color: palette.fg,
        fontFamily: unbounded,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 0.4,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {label}
    </div>
  );
};

/** Flat diagram box. `accent` draws the left keyline that marks a live node. */
export const Box: React.FC<{
  label: string;
  sublabel?: string;
  width?: number | string;
  accent?: string;
  filled?: boolean;
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({label, sublabel, width, accent, filled = false, fontSize = 32, style}) => (
  <div
    style={{
      width,
      boxSizing: 'border-box',
      padding: '18px 26px',
      borderRadius: 18,
      background: filled ? vibe.paper : 'transparent',
      border: `2.5px solid ${accent ?? vibe.line}`,
      borderLeftWidth: accent ? 10 : 2.5,
      borderLeftColor: accent ?? vibe.line,
      color: vibe.ink,
      fontFamily: unbounded,
      fontWeight: 700,
      fontSize,
      letterSpacing: 0.2,
      lineHeight: 1.1,
      textAlign: 'left',
      ...style,
    }}
  >
    {label}
    {sublabel ? (
      <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 21, color: vibe.inkSoft, marginTop: 7, letterSpacing: 0}}>
        {sublabel}
      </div>
    ) : null}
  </div>
);

/** Vertical connector with an arrow head, drawn progressively. */
export const ArrowDown: React.FC<{height?: number; progress?: number; color?: string; label?: string}> = ({
  height = 46,
  progress = 1,
  color = vibe.line,
  label,
}) => (
  <div style={{position: 'relative', height, width: '100%', display: 'flex', justifyContent: 'center'}}>
    <svg width={26} height={height} viewBox={`0 0 26 ${height}`} style={{overflow: 'visible'}}>
      <line
        x1={13}
        y1={0}
        x2={13}
        y2={2 + (height - 12) * progress}
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d={`M 6 ${height - 12} L 13 ${height - 2} L 20 ${height - 12}`}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={progress > 0.75 ? 1 : 0}
      />
    </svg>
    {label ? (
      <div
        style={{
          position: 'absolute',
          left: '52%',
          top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: manrope,
          fontWeight: 700,
          fontSize: 19,
          color,
          opacity: progress,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    ) : null}
  </div>
);

/** Horizontal connector between chain links. */
export const ArrowRight: React.FC<{width?: number; progress?: number; color?: string}> = ({
  width = 34,
  progress = 1,
  color = vibe.line,
}) => (
  <svg width={width} height={22} viewBox={`0 0 ${width} 22`} style={{flexShrink: 0}}>
    <line x1={0} y1={11} x2={(width - 8) * progress} y2={11} stroke={color} strokeWidth={3} strokeLinecap="round" />
    <path
      d={`M ${width - 13} 5 L ${width - 3} 11 L ${width - 13} 17`}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={progress > 0.7 ? 1 : 0}
    />
  </svg>
);

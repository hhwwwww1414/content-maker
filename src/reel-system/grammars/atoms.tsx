import React from 'react';
import {interpolate} from 'remotion';
import {night} from '../../components/vibe/theme';
import {unbounded} from '../../theme/fonts';
import {useMs} from '../../components/vibe/primitives';
import {Caption, NightChip} from '../../components/vpn/glass';
import type {Cue, Item, Tone} from './types';

/**
 * Shared building blocks for every grammar. Keeping them here is what makes the
 * grammars look like one channel instead of eight unrelated templates.
 */

/** The body slot every grammar draws inside: clear of both Instagram overlays. */
export const BODY = {left: 90, top: 608, width: 900} as const;

export const TONE_COLOR: Record<Tone, string> = {
  mint: night.mint,
  yellow: night.yellow,
  red: night.red,
  neutral: night.textSoft,
};

/** Chip tone names differ from ours by one word; map rather than rename. */
export const CHIP_TONE: Record<Tone, 'mint' | 'warning' | 'danger' | 'neutral'> = {
  mint: 'mint',
  yellow: 'warning',
  red: 'danger',
  neutral: 'neutral',
};

/** Progress 0..1 of a resolved cue. Unresolved cues stay invisible. */
export const useCue = (cue: Cue | null | undefined, durationMs = 380): number => {
  const ms = useMs();
  const at = cue?.atMs;
  if (at === null || at === undefined) return 0;
  return interpolate(ms, [at, at + durationMs], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const rise = (on: number, distance = 10): React.CSSProperties => ({
  opacity: on,
  transform: `translateY(${(1 - on) * distance}px)`,
});

export const Headline: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, color = night.text, size = 30, style}) => (
  <div
    style={{
      fontFamily: unbounded,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.1,
      color,
      textShadow: night.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Small uppercase label that names the card without competing with it. */
export const CardLabel: React.FC<{children?: string | null}> = ({children}) =>
  children ? <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{children}</Caption> : null;

/** A verdict lands hard: bigger, coloured, slightly late. */
export const Verdict: React.FC<{item?: Item | null; size?: number}> = ({item, size = 38}) => {
  const on = useCue(item, 460);
  if (!item) return null;
  return (
    <div style={{...rise(on, 12), minHeight: size + 12}}>
      <Headline size={size} color={TONE_COLOR[item.tone ?? 'yellow']}>
        {item.label}
      </Headline>
    </div>
  );
};

/** Chips accumulate left to right and stay — the argument stays visible. */
export const ChipRow: React.FC<{items?: Item[] | null; size?: number}> = ({items, size = 21}) => {
  const ms = useMs();
  if (!items || items.length === 0) return null;
  return (
    <div style={{display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', minHeight: size + 22}}>
      {items.map((item) => {
        const at = item.atMs;
        const on =
          at === null || at === undefined
            ? 0
            : interpolate(ms, [at, at + 340], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (on <= 0.001) return null;
        return (
          <div key={item.label} style={{opacity: on, transform: `translateY(${(1 - on) * 8}px)`}}>
            <NightChip label={item.label} tone={CHIP_TONE[item.tone ?? 'neutral']} size={size} />
          </div>
        );
      })}
    </div>
  );
};

/** Arrow used by `flow`; draws itself as the cue advances. */
export const Arrow: React.FC<{progress: number; direction: 'row' | 'column'; color?: string}> = ({
  progress,
  direction,
  color = night.line,
}) => {
  const length = direction === 'row' ? 46 : 40;
  if (direction === 'row') {
    return (
      <svg width={length} height={24} viewBox={`0 0 ${length} 24`} style={{flexShrink: 0}}>
        <line x1={0} y1={12} x2={(length - 10) * progress} y2={12} stroke={color} strokeWidth={3} strokeLinecap="round" />
        <path
          d={`M ${length - 15} 5 L ${length - 4} 12 L ${length - 15} 19`}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={progress > 0.7 ? 1 : 0}
        />
      </svg>
    );
  }
  return (
    <svg width={24} height={length} viewBox={`0 0 24 ${length}`}>
      <line x1={12} y1={0} x2={12} y2={(length - 10) * progress} stroke={color} strokeWidth={3} strokeLinecap="round" />
      <path
        d={`M 5 ${length - 15} L 12 ${length - 4} L 19 ${length - 15}`}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={progress > 0.7 ? 1 : 0}
      />
    </svg>
  );
};

/** Minimal glyph set for `compare` rows. Deliberately few and flat. */
export const RowGlyph: React.FC<{kind: string; color: string}> = ({kind, color}) => {
  if (kind === 'none') return null;
  return (
    <svg width={70} height={54} viewBox="0 0 70 54" style={{flexShrink: 0}}>
      {kind === 'window' || kind === 'agent' ? (
        <>
          <rect x={2} y={2} width={66} height={44} rx={8} fill="rgba(255,255,255,0.05)" stroke={color} strokeWidth={2.5} />
          <line x1={2} y1={15} x2={68} y2={15} stroke={color} strokeWidth={2} />
          <line x1={11} y1={26} x2={50} y2={26} stroke={night.textFaint} strokeWidth={3} strokeLinecap="round" />
          <line x1={11} y1={36} x2={38} y2={36} stroke={night.textFaint} strokeWidth={3} strokeLinecap="round" />
          {kind === 'agent' ? (
            <path d="M44 29 L44 45 L48 41 L51 49 L55 47 L52 39 L58 39 Z" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          ) : null}
        </>
      ) : null}
      {kind === 'lock' ? (
        <>
          <rect x={16} y={20} width={38} height={28} rx={6} fill="rgba(255,255,255,0.05)" stroke={color} strokeWidth={2.5} />
          <path d="M24 20 v-6 a11 11 0 0 1 22 0 v6" fill="none" stroke={color} strokeWidth={2.5} />
        </>
      ) : null}
      {kind === 'doc' ? (
        <>
          <rect x={14} y={4} width={42} height={46} rx={6} fill="rgba(255,255,255,0.05)" stroke={color} strokeWidth={2.5} />
          <line x1={22} y1={18} x2={48} y2={18} stroke={night.textFaint} strokeWidth={3} strokeLinecap="round" />
          <line x1={22} y1={28} x2={44} y2={28} stroke={night.textFaint} strokeWidth={3} strokeLinecap="round" />
          <line x1={22} y1={38} x2={38} y2={38} stroke={night.textFaint} strokeWidth={3} strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
};

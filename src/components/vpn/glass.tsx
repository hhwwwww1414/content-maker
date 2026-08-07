import React from 'react';
import {night} from '../vibe/theme';
import {manrope, unbounded} from '../../theme/fonts';

/** Semi-transparent card that keeps the moving background visible behind it. */
export const Glass: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  strong?: boolean;
  accent?: string;
}> = ({children, style, strong = false, accent}) => (
  <div
    style={{
      boxSizing: 'border-box',
      background: strong ? night.glassStrong : night.glass,
      border: `2px solid ${accent ?? night.glassBorder}`,
      borderLeft: accent ? `9px solid ${accent}` : `2px solid ${night.glassBorder}`,
      borderRadius: 22,
      padding: '20px 26px',
      ...style,
    }}
  >
    {children}
  </div>
);

type Tone = 'danger' | 'warning' | 'mint' | 'neutral';

const TONES: Record<Tone, string> = {
  danger: night.red,
  warning: night.yellow,
  mint: night.mint,
  neutral: night.textSoft,
};

export const NightChip: React.FC<{label: string; tone?: Tone; size?: number; style?: React.CSSProperties}> = ({
  label,
  tone = 'neutral',
  size = 26,
  style,
}) => {
  const color = TONES[tone];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${Math.round(size * 0.42)}px ${Math.round(size * 0.78)}px`,
        borderRadius: 999,
        background: 'rgba(10,12,16,0.62)',
        border: `2px solid ${color}`,
        color,
        fontFamily: unbounded,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 0.3,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        textShadow: night.shadow,
        ...style,
      }}
    >
      {label}
    </div>
  );
};

/** Label that gets struck through as the narration dismisses it. */
export const StrikeText: React.FC<{
  label: string;
  progress: number;
  fontSize?: number;
  color?: string;
  strikeColor?: string;
  style?: React.CSSProperties;
}> = ({label, progress, fontSize = 34, color = night.text, strikeColor = night.red, style}) => (
  <div style={{position: 'relative', display: 'inline-block', ...style}}>
    <div
      style={{
        fontFamily: unbounded,
        fontWeight: 700,
        fontSize,
        color,
        opacity: 1 - progress * 0.45,
        letterSpacing: 0.2,
        textShadow: night.shadow,
      }}
    >
      {label}
    </div>
    <div
      style={{
        position: 'absolute',
        left: -6,
        right: -6,
        top: '54%',
        height: Math.max(4, Math.round(fontSize / 9)),
        borderRadius: 3,
        background: strikeColor,
        transformOrigin: 'left center',
        transform: `scaleX(${progress})`,
      }}
    />
  </div>
);

export const Caption: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      fontFamily: manrope,
      fontWeight: 700,
      fontSize: 21,
      letterSpacing: 0.4,
      color: night.textSoft,
      textShadow: night.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

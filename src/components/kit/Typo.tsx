import React from 'react';
import {useCurrentFrame} from 'remotion';
import {colors} from '../../theme/colors';
import {enterAt, riseY, type} from '../../theme/tokens';

/**
 * Typographic kit for the reel visual system. A small mint kicker above a
 * mixed-case display headline replaces walls of uppercase; emphasis is carried
 * by a single <Accent> word.
 */

type Align = 'left' | 'center';

/** Mint eyebrow with a short leading rule. Sets the topic in a calm voice. */
export const Kicker: React.FC<{
  children: React.ReactNode;
  from: number;
  align?: Align;
  style?: React.CSSProperties;
}> = ({children, from, align = 'left', style}) => {
  const frame = useCurrentFrame();
  const t = enterAt(frame, from);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: 12,
        opacity: t,
        translate: `0 ${riseY(t, 10)}px`,
        ...style,
      }}
    >
      <span style={{width: 34, height: 3, borderRadius: 3, background: colors.mint, boxShadow: '0 0 12px rgba(34,240,208,0.6)'}} />
      <span style={type.kicker}>{children}</span>
    </div>
  );
};

/** One emphasized word inside a Display line. */
export const Accent: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = colors.mint}) => (
  <span style={{color, textShadow: `0 0 34px ${color}55`}}>{children}</span>
);

/** Large mixed-case headline with a soft rise+settle entrance. */
export const Display: React.FC<{
  children: React.ReactNode;
  from: number;
  align?: Align;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, from, align = 'left', size, style}) => {
  const frame = useCurrentFrame();
  const t = enterAt(frame, from);
  return (
    <div
      style={{
        ...type.display,
        ...(size ? {fontSize: size} : null),
        textAlign: align,
        opacity: t,
        translate: `0 ${riseY(t, 16)}px`,
        textShadow: '0 14px 40px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Secondary headline (smaller than Display). */
export const Headline: React.FC<{
  children: React.ReactNode;
  from: number;
  align?: Align;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, from, align = 'left', size, style}) => {
  const frame = useCurrentFrame();
  const t = enterAt(frame, from);
  return (
    <div
      style={{
        ...type.headline,
        ...(size ? {fontSize: size} : null),
        textAlign: align,
        opacity: t,
        translate: `0 ${riseY(t, 12)}px`,
        textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

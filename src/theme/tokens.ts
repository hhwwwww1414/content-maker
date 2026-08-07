import type {CSSProperties} from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {colors} from './colors';
import {manrope, unbounded} from './fonts';

/**
 * Design tokens for the reel visual system (Framework V2, Phase 2).
 *
 * The goal is to stop reels looking like a slideshow of full-screen uppercase
 * headlines: one consistent motion language, a real type hierarchy (kicker →
 * display → body), a spacing scale, and elevation presets for glass surfaces.
 */

// --- Spacing ---------------------------------------------------------------
export const space = {xs: 8, sm: 16, md: 24, lg: 40, xl: 64, xxl: 96} as const;

export const radius = {sm: 14, md: 22, lg: 32, pill: 999} as const;

// --- Motion ----------------------------------------------------------------
const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

export const ease = {
  /** Decelerate to rest — default for entrances. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.inOut(Easing.cubic),
  /** Slow, filmic — for cameras and backgrounds. */
  soft: Easing.inOut(Easing.quad),
} as const;

export const springs = {
  /** Settles with no perceptible bounce — text, cards. */
  enter: {damping: 26, stiffness: 90, mass: 1} as const,
  /** Slight overshoot for accents / punchlines. */
  emphasis: {damping: 14, stiffness: 120, mass: 0.9} as const,
  /** Unhurried, for large hero reveals. */
  calm: {damping: 28, stiffness: 65, mass: 1.2} as const,
} as const;

/** Standard beat lengths in frames (@30fps). */
export const beat = {quick: 8, base: 14, slow: 24, hold: 40} as const;

/**
 * A single entrance value 0→1 that fades and eases. Use for opacity and to drive
 * a small translate/scale. `delay` staggers grouped elements.
 */
export const enterAt = (frame: number, from: number, dur = beat.base): number =>
  interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out});

/** Symmetric fade in/out over a window; `settle` controls the ramp length. */
export const fadeWindow = (
  frame: number,
  from: number,
  to: number,
  settle = beat.base,
): number =>
  interpolate(
    frame,
    [from, from + settle, Math.max(from + settle + 1, to - settle), to],
    [0, 1, 1, 0],
    CLAMP,
  );

/** Spring driver bound to a start frame. */
export const springAt = (
  frame: number,
  fps: number,
  from: number,
  config: {damping: number; stiffness: number; mass: number} = springs.enter,
): number => spring({frame: frame - from, fps, config});

/** Translate-up-into-place helper: returns px offset for an entrance value. */
export const riseY = (t: number, distance = 14): number =>
  interpolate(t, [0, 1], [distance, 0], CLAMP);

// --- Typography roles ------------------------------------------------------
// Mixed-case display + a small mint kicker beats walls of uppercase. Emphasis is
// carried by ONE accent word, not by shouting the whole line.

export const type = {
  kicker: {
    fontFamily: manrope,
    fontWeight: 700,
    fontSize: 26,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.mint,
  } as CSSProperties,
  display: {
    fontFamily: unbounded,
    fontWeight: 800,
    fontSize: 76,
    lineHeight: 1.02,
    letterSpacing: -2.5,
    color: colors.white,
  } as CSSProperties,
  headline: {
    fontFamily: unbounded,
    fontWeight: 700,
    fontSize: 50,
    lineHeight: 1.08,
    letterSpacing: -1.4,
    color: colors.white,
  } as CSSProperties,
  body: {
    fontFamily: manrope,
    fontWeight: 600,
    fontSize: 32,
    lineHeight: 1.3,
    color: colors.gray,
  } as CSSProperties,
  caption: {
    fontFamily: unbounded,
    fontWeight: 700,
    fontSize: 46,
    lineHeight: 1.14,
    letterSpacing: -0.5,
    color: colors.white,
  } as CSSProperties,
  label: {
    fontFamily: manrope,
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gray,
  } as CSSProperties,
} as const;

// --- Elevation (glass surfaces) --------------------------------------------
export const elevation = {
  glass: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    border: '1px solid rgba(184,255,243,0.14)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.06)',
    backdropFilter: 'blur(8px)',
  } as CSSProperties,
  raised: {
    background: 'linear-gradient(180deg, rgba(21,27,29,0.92), rgba(12,17,19,0.92))',
    border: '1px solid rgba(184,255,243,0.10)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.46)',
  } as CSSProperties,
  accent: {
    background: `linear-gradient(180deg, ${colors.lightMint}, ${colors.mint})`,
    boxShadow: '0 20px 60px rgba(34,240,208,0.30)',
  } as CSSProperties,
} as const;

/** Soft mint aura behind a hero/accent element. */
export const glow = (opacity = 0.22, blur = 160): CSSProperties => ({
  background: colors.mint,
  filter: `blur(${blur}px)`,
  opacity,
  borderRadius: '50%',
});

import {Easing} from 'remotion';

/**
 * Central config for the "Цифровой почерк" (Traffic Signature) reel.
 * One source of truth for colours, geometry, the repeating signature rhythm,
 * safe zones and shared easings — so no component re-derives its own timing.
 */

export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
/** Premium reveal / deceleration curve. */
export const REVEAL = {easing: Easing.bezier(0.16, 1, 0.3, 1), ...CLAMP} as const;
export const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;
export const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const tsColors = {
  bgDeep: '#05090A',
  bgPanel: '#0A1113',
  mint: '#22F0D0',
  lightMint: '#8CFFE9',
  /** Cold forensic cyan for the traces themselves (kept distinct from the mint accent). */
  cyan: '#5FC7E6',
  cyanDeep: '#2E7E92',
  /** Sealed, unreadable capsule body. */
  crystal: '#0C1417',
  crystalEdge: 'rgba(120,200,210,0.30)',
  /** Minimal amber analysis marker — used sparingly. */
  amber: '#F2B45A',
  white: '#F6FAF9',
  gray: '#9BA8A5',
} as const;

/** Instagram Reels safe zone. Content x 110-820, y 270-1450. Visual centre x ~470. */
export const tsSafe = {
  left: 110,
  right: 820,
  top: 270,
  bottom: 1450,
  centerX: 470,
  contentWidth: 700,
  captionBottom: 372,
  captionLeft: 100,
  captionRight: 156,
} as const;

/** The horizontal lane the encrypted flow travels along (scenes 1-2). */
export const lane = {
  y: 852,
  /** where a capsule enters / exits the frame horizontally */
  enterX: 1320,
  exitX: -360,
} as const;

/**
 * THE traffic signature — the repeating "почерк".
 * A rhythm of pulses: long, short, short, (pause), long, short.
 * Each pulse: `len` = bar length in px, `gap` = space to the next pulse in px.
 * A larger gap reads as a timing pause. This same array drives every trace so
 * all three visibly share one handwriting.
 */
export const SIGNATURE = [
  {len: 44, gap: 15}, // ━━  long
  {len: 15, gap: 13}, // ━   short
  {len: 15, gap: 44}, // ━   short  + pause
  {len: 58, gap: 15}, // ━━━ long
  {len: 17, gap: 34}, // ━   short  + trailing gap
] as const;

/** Total pixel width of one signature period. */
export const SIGNATURE_WIDTH = SIGNATURE.reduce((sum, p) => sum + p.len + p.gap, 0);

/** Pulse x-offsets (start of each bar) relative to the trace origin. */
export const SIGNATURE_OFFSETS = (() => {
  const out: {x: number; len: number}[] = [];
  let cursor = 0;
  for (const p of SIGNATURE) {
    out.push({x: cursor, len: p.len});
    cursor += p.len + p.gap;
  }
  return out;
})();

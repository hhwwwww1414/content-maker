/**
 * Light "engineering paper" palette for the vibe-coding-trust reel.
 * Deliberately separate from the dark GhostPepe theme — this reel is the only
 * light-canvas format in the repo.
 */
export const vibe = {
  bg: '#F3F3EF',
  bgTint: '#EAEAE3',
  ink: '#16160F',
  inkSoft: '#6B6B60',
  inkFaint: 'rgba(22,22,15,0.10)',
  line: 'rgba(22,22,15,0.16)',
  mint: '#12B981',
  mintSoft: 'rgba(18,185,129,0.12)',
  danger: '#C8503F',
  dangerSoft: 'rgba(200,80,63,0.12)',
  warn: '#D9A21B',
  warnSoft: 'rgba(217,162,27,0.14)',
  paper: '#FFFFFF',
} as const;

/**
 * Palette for reels that sit on top of a moving video instead of paper.
 * Same slot geometry, inverted contrast: light type over a darkened backdrop.
 */
export const night = {
  text: '#FFFFFF',
  textSoft: 'rgba(255,255,255,0.68)',
  textFaint: 'rgba(255,255,255,0.34)',
  mint: '#3FE0A8',
  yellow: '#FFD24A',
  red: '#FF6B5A',
  glass: 'rgba(16,18,22,0.56)',
  glassStrong: 'rgba(12,14,18,0.74)',
  glassBorder: 'rgba(255,255,255,0.18)',
  line: 'rgba(255,255,255,0.24)',
  shadow: '0 2px 18px rgba(0,0,0,0.55)',
} as const;

/** Caption tone -> colour, keyed by the `tone` field the caption builder emits. */
export const nightTones: Record<string, string> = {
  mint: night.mint,
  yellow: night.yellow,
  red: night.red,
  accent: night.mint,
};

/**
 * Fixed canvas slots. Every element lives in exactly one slot so the layers
 * accumulate without ever colliding. Bottom-right stays clear of the Instagram
 * right rail (x >= 900, y >= 980) and the bottom caption strip (y >= 1440).
 */
export const slots = {
  sourceBadge: {x: 90, y: 248, width: 900, height: 44},
  eyebrow: {x: 90, y: 306, width: 900, height: 30},
  headline: {x: 90, y: 340, width: 900, height: 140},
  chipRail: {x: 90, y: 500, width: 810, height: 62},
  body: {x: 90, y: 584, width: 900, height: 520},
  avatar: {x: 46, y: 1116, width: 290, height: 290},
  captions: {x: 356, y: 1150, width: 522, height: 250},
} as const;

export const CANVAS = {width: 1080, height: 1920} as const;

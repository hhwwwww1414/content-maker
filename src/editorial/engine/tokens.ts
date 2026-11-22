import standards from '../../../config/reel.standards.json';

// Design tokens. Pure data: read by React, the validator and the tests, so a limit never lives in two places.

export const format = {
  width: standards.format.width,
  height: standards.format.height,
};

/** Instagram/TikTok chrome covers the rail and the bottom band: readable text stays inside. */
export const safe = {
  ...standards.safe,
  width: standards.safe.right - standards.safe.left,
  height: standards.safe.bottom - standards.safe.top,
};

/** The captions band sits low by default; `high` is for scenes whose subject owns the bottom of the frame. */
export const captionZones = {
  low: {top: 1400, height: 190},
  high: {top: 210, height: 170},
};
/** Where a scene may place its primary text when captions are low. */
export const stage = {left: safe.left, right: safe.right, top: safe.top, bottom: captionZones.low.top - 16, width: safe.width, height: captionZones.low.top - 16 - safe.top};

/** 4-pt spacing scale; layouts use names, not magic numbers. */
export const space = {xxs: 8, xs: 16, s: 24, m: 40, l: 64, xl: 96, xxl: 144} as const;
export const radius = {none: 0, s: 10, m: 22, l: 40, xl: 64, device: 96, pill: 999} as const;
export const weights = {regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800, black: 900} as const;
export const opacity = {faint: 0.08, soft: 0.2, muted: 0.55, strong: 0.85} as const;

/** Modular scale tuned for phone reading at 1080 wide. Nothing readable goes below `caption`. */
export const typeScale = {
  micro: 30, caption: 34, body: 42, lead: 56, title: 76, headline: 104, display: 148, poster: 220, giant: 360,
} as const;

/** Depth: a soft contact shadow plus a wide ambient one, which is what makes a flat card feel placed. */
export const elevation = {
  flat: 'none',
  low: '0 2px 6px rgba(0,0,0,.18), 0 12px 28px rgba(0,0,0,.16)',
  mid: '0 4px 10px rgba(0,0,0,.2), 0 28px 64px rgba(0,0,0,.28)',
  high: '0 8px 18px rgba(0,0,0,.28), 0 60px 120px rgba(0,0,0,.42)',
} as const;

/** The layout grid: 6 columns inside the safe width. */
export const grid = {
  columns: 6, gutter: 20,
  col: (n: number) => safe.left + n * ((safe.width + 20) / 6),
  span: (n: number) => n * ((safe.width + 20) / 6) - 20,
};

/** Seconds, not frames: the same choreography holds at 30 and 60 fps. */
export const durations = {instant: 0.1, fast: 0.22, base: 0.42, slow: 0.8, slower: 1.4, drift: 6} as const;

export type Rgb = [number, number, number];
export const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const channel = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export const luminance = ([r, g, b]: Rgb) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
export const contrastRatio = (a: string, b: string) => {
  const [hi, lo] = [luminance(hexToRgb(a)), luminance(hexToRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
export const alpha = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
export const mix = (a: string, b: string, t: number) => {
  const x = hexToRgb(a), y = hexToRgb(b);
  const v = x.map((c, i) => Math.round(c + (y[i] - c) * t));
  return `#${v.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

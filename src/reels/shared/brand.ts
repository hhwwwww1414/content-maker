/**
 * Shared brand constants for batch 2026-07-25-a1.
 *
 * Only genuinely universal things live here: palette, official asset paths and
 * the generated-audio path convention. Everything that makes a reel look like
 * itself — world, hero, camera, motion, typography — stays in its own folder.
 */

export const BRAND = {
  bg: '#0A1012',
  deep: '#05090A',
  graphite: '#151B1D',
  mint: '#22F0D0',
  lightMint: '#8CFFE9',
  white: '#F6FAF9',
  gray: '#9BA8A5',
  caption: '#F6FAF9',
  captionAccent: '#22F0D0',
  danger: '#FF6B61',
  amber: '#FFC24B',
  ice: '#6FC8FF',
} as const;

export const ASSETS = {
  background: 'assets/backgrounds/cyberspace-dark.png',
  mascot: 'assets/mascot/ghostpepe-main.png',
  ambient: 'generated/ambient.wav',
} as const;

export const voicePath = (key: string): string => `generated/voiceover-${key}.wav`;

export const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/**
 * Shared geometry and palette for the "интернет на два канала" network mixing
 * console. One coordinate system in world space (1080x1920) that every console
 * part positions against, so the chassis, strips, faders, meters and routing bus
 * always line up under one virtual camera.
 */

export const MIXER = {
  panelLeft: 168,
  panelRight: 792,
  panelTop: 452,
  panelBottom: 1204,
  localX: 300,
  masterX: 480,
  worldX: 660,
  stripW: 152,
  /** Knob-centre travel of a fader (top = max level, bottom = min level). */
  faderTop: 596,
  faderBottom: 1112,
  busTop: 1236,
  busBottom: 1372,
} as const;

/** Screen y of a fader knob for a normalised level (0 = bottom, 1 = top). */
export const faderY = (level: number) => MIXER.faderBottom + (MIXER.faderTop - MIXER.faderBottom) * level;

/** LOCAL = cold white with a subtle mint; WORLD = mint with a subtle cyan. */
export const CH = {
  localCore: '#EAF3F1',
  localGlow: 'rgba(140,255,233,0.55)',
  worldCore: '#22F0D0',
  worldGlow: 'rgba(63,224,255,0.6)',
  cyan: '#3FE0FF',
  amber: '#F2B15A',
  amberGlow: 'rgba(242,177,90,0.55)',
} as const;

/** Deterministic pseudo-value in [0,1) from an integer seed (no Math.random). */
export const seeded = (n: number) => {
  const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};

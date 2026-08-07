/** Deterministic pseudo-random in [0,1). Replaces Math.random() so every particle,
 * ribbon and fingerprint line renders identically on every frame and every machine. */
export const seeded = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Deterministic value in [min,max) for a given integer index and channel. */
export const seededRange = (index: number, channel: number, min: number, max: number): number =>
  min + seeded(index * 1.618 + channel * 7.31) * (max - min);

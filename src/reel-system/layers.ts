export const LAYERS = {
  BACKGROUND: 0,
  ENVIRONMENT: 10,
  HERO_BACK: 20,
  HERO: 30,
  HERO_FRONT: 40,
  TEXT: 50,
  CAPTIONS: 60,
  BRAND: 70,
  DEBUG: 80,
} as const;

export type LayerName = keyof typeof LAYERS;

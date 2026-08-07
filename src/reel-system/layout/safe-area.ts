import type {BoundingBox} from './layout-types';
import config from './safe-area.config.json';

/**
 * SINGLE SOURCE OF TRUTH for Instagram Reels geometry.
 *
 * The primitive numbers live in ./safe-area.config.json so both the TypeScript
 * runtime and the Node QA scripts (scripts/qa-reels.mjs) read the exact same
 * values. Do not hardcode top/bottom/right insets anywhere else.
 *
 * Profile: "balanced" (top 220, bottom 480, right rail 180x620).
 */

export const CANVAS = config.canvas as {width: number; height: number};

/** Regions covered by the Instagram Reels UI. No opaque critical content here. */
export const IG_UNSAFE = config.unsafe as Record<'top' | 'bottom' | 'right', BoundingBox>;

const s = config.safe;

/** Positive safe area: where critical content (text, icons, CTA, hero) must live. */
export const SAFE = {
  left: s.left,
  right: s.right,
  top: s.top,
  bottom: s.bottom,
  x: s.left,
  y: s.top,
  width: config.canvas.width - s.left - s.right,
  height: config.canvas.height - s.top - s.bottom,
  captionBottomInset: s.captionBottomInset,
  captionMaxLines: s.captionMaxLines,
} as const;

export type UnsafeZoneName = keyof typeof IG_UNSAFE;

const overlap = (a: BoundingBox, b: BoundingBox): number => {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
};

/** Which IG_UNSAFE zones a box intersects. */
export const boxIntersectsUnsafe = (
  box: BoundingBox,
): {hit: boolean; zones: UnsafeZoneName[]} => {
  const zones = (Object.keys(IG_UNSAFE) as UnsafeZoneName[]).filter(
    (name) => overlap(box, IG_UNSAFE[name]) > 0,
  );
  return {hit: zones.length > 0, zones};
};

/** Clamp a box so it sits fully inside the SAFE rectangle (best-effort). */
export const clampIntoSafe = (box: BoundingBox): BoundingBox => {
  const width = Math.min(box.width, SAFE.width);
  const height = Math.min(box.height, SAFE.height);
  const x = Math.min(Math.max(box.x, SAFE.x), SAFE.x + SAFE.width - width);
  const y = Math.min(Math.max(box.y, SAFE.y), SAFE.y + SAFE.height - height);
  return {x, y, width, height};
};

/** Ready-made caption slot, centered, sitting above the bottom unsafe zone. */
export const captionSlot = (height = 160): BoundingBox => ({
  x: SAFE.x,
  y: CANVAS.height - SAFE.captionBottomInset - height,
  width: SAFE.width,
  height,
});

export const isSafeZoneEnforced = (): boolean =>
  typeof process !== 'undefined' && !!process.env && process.env.REEL_QA === '1';

export const assertSafe = (box: BoundingBox, id: string): void => {
  const {hit, zones} = boxIntersectsUnsafe(box);
  if (hit && isSafeZoneEnforced()) {
    throw new Error(
      `[safe-area] "${id}" intersects Instagram unsafe zone(s): ${zones.join(', ')} — box ${JSON.stringify(box)}`,
    );
  }
};

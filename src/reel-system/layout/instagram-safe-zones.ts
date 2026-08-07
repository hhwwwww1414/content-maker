import type {BoundingBox} from './layout-types';
import {IG_UNSAFE} from './safe-area';

/**
 * @deprecated Import IG_UNSAFE / SAFE / CANVAS from './safe-area' instead.
 * Kept as a thin re-export so older code keeps compiling against one source of truth.
 */
export const INSTAGRAM_REEL_SAFE_ZONES = {
  rightOverlay: IG_UNSAFE.right,
  bottomOverlay: IG_UNSAFE.bottom,
  topOverlay: IG_UNSAFE.top,
} satisfies Record<string, BoundingBox>;

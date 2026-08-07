import {overlapArea} from './CollisionGuard';
import {IG_UNSAFE} from './safe-area';
import type {LayoutValidation, RegisteredLayoutElement} from './layout-types';

const CRITICAL_KINDS = new Set(['headline', 'hero', 'heroCriticalArea', 'mascotFace', 'subtitle', 'cta', 'criticalLabel']);

/** Validates registered critical elements against ALL Instagram unsafe zones. */
export const validateSafeZones = (elements: RegisteredLayoutElement[]): LayoutValidation => {
  const zones = Object.entries(IG_UNSAFE);
  const errors: string[] = [];
  for (const element of elements) {
    if (!CRITICAL_KINDS.has(element.kind)) continue;
    for (const [name, box] of zones) {
      if (overlapArea(element.box, box) > 0) {
        errors.push(`${element.id} (${element.kind}) intersects IG ${name} zone`);
      }
    }
  }
  return {valid: errors.length === 0, errors};
};

// The visual overlay now lives in SafeArea.tsx (single source of truth).
export {SafeZoneOverlay, SafeZoneOverlay as SafeZoneGuard} from './SafeArea';

import React from 'react';
import type {BoundingBox, LayoutValidation, RegisteredLayoutElement} from './layout-types';

const area = (box: BoundingBox) => box.width * box.height;

export const overlapArea = (a: BoundingBox, b: BoundingBox) => {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
};

export const validateCollisions = (elements: RegisteredLayoutElement[], threshold = 0): LayoutValidation => {
  const rules = [
    ['headline', 'mascotFace'],
    ['headline', 'heroCriticalArea'],
    ['subtitle', 'mascotFace'],
    ['subtitle', 'cta'],
    ['cta', 'instagramBottomOverlay'],
    ['heroCriticalArea', 'instagramRightOverlay'],
  ] as const;

  const errors: string[] = [];
  for (const [leftKind, rightKind] of rules) {
    const left = elements.find((element) => element.kind === leftKind);
    const right = elements.find((element) => element.kind === rightKind);
    if (!left || !right) continue;
    const overlap = overlapArea(left.box, right.box);
    const ratio = overlap / Math.max(1, Math.min(area(left.box), area(right.box)));
    if (ratio > threshold) errors.push(`${left.kind} collides with ${right.kind} (${ratio.toFixed(2)})`);
  }

  return {valid: errors.length === 0, errors};
};

export const CollisionGuard: React.FC<{validation: LayoutValidation}> = ({validation}) => {
  if (validation.valid) return null;
  return <pre style={{color: '#fecaca', whiteSpace: 'pre-wrap'}}>{validation.errors.join('\n')}</pre>;
};

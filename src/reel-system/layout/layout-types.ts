export type CriticalElementKind = 'headline' | 'hero' | 'heroCriticalArea' | 'mascotFace' | 'subtitle' | 'cta' | 'criticalLabel' | 'instagramRightOverlay' | 'instagramBottomOverlay';

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type RegisteredLayoutElement = {
  id: string;
  kind: CriticalElementKind;
  box: BoundingBox;
};

export type LayoutValidation = {
  valid: boolean;
  errors: string[];
};

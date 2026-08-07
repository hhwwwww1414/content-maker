import {z} from 'zod';

export const openingArchetypes = [
  'OBJECT-FIRST',
  'TEXT-FIRST',
  'ACTION-FIRST',
  'POV',
  'MACRO-MYSTERY',
  'BEFORE-AFTER',
  'INTERRUPTED-ACTION',
  'DOCUMENTARY',
  'SECURITY-CAMERA',
  'FAKE-SYSTEM',
  'ENVIRONMENT-FIRST',
  'ABSTRACT-MOTION',
] as const;

export const endingArchetypes = [
  'NO-END-CARD',
  'OBJECT-TRANSFORMS-TO-BRAND',
  'ENVIRONMENTAL-BRAND',
  'LOOP-BACK-TO-FIRST-FRAME',
  'QUESTION-END',
  'HARD-THESIS-END',
  'MASCOT-ONLY',
  'TYPOGRAPHIC-END',
  'VISUAL-PUNCHLINE',
] as const;

export const mascotUsages = ['no mascot', 'cameo', 'reflection', 'background observer', 'reveal late', 'main character'] as const;

export const reelHistoryEntrySchema = z.object({
  id: z.string().min(1),
  concept: z.string().min(1),
  hookType: z.string().min(1),
  firstFrameType: z.string().min(1),
  heroObject: z.string().min(1),
  heroObjectCategory: z.string().min(1),
  environment: z.string().min(1),
  cameraOpening: z.string().min(1),
  cameraLanguage: z.string().min(1),
  compositionStyle: z.string().min(1),
  dominantGeometry: z.string().min(1),
  mascotUsage: z.string().min(1),
  mascotEntrance: z.string().min(1),
  textComposition: z.string().min(1),
  transitionLanguage: z.string().min(1),
  endingType: z.string().min(1),
  ctaType: z.string().min(1),
  visualMetaphor: z.string().min(1),
  usedObjects: z.array(z.string()),
  usedMotionPatterns: z.array(z.string()),
  accentColors: z.array(z.string()),
});

export const reelHistorySchema = z.object({
  schemaVersion: z.literal(1),
  reels: z.array(reelHistoryEntrySchema),
});

export type ReelHistoryEntry = z.infer<typeof reelHistoryEntrySchema>;
export type ReelHistory = z.infer<typeof reelHistorySchema>;

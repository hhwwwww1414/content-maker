import type {ReelHistory, ReelHistoryEntry} from './reel-history.schema';

export type CriticalSimilarityKey =
  | 'HERO'
  | 'OPENING'
  | 'ENDING'
  | 'ENVIRONMENT'
  | 'CAMERA'
  | 'MASCOT_ENTRANCE'
  | 'VISUAL_METAPHOR'
  | 'COMPOSITION';

export type NoveltyComparison = {
  reelId: string;
  score: number;
  matches: CriticalSimilarityKey[];
  fields: Record<string, boolean>;
};

export type NoveltyReport = {
  valid: boolean;
  rejectionReason?: string;
  comparisons: NoveltyComparison[];
};

const normalize = (value: string) => value.trim().toLowerCase();
const same = (a: string, b: string) => normalize(a) === normalize(b);

export const compareReelNovelty = (candidate: ReelHistoryEntry, previous: ReelHistoryEntry): NoveltyComparison => {
  const fields = {
    hero: same(candidate.heroObject, previous.heroObject) || same(candidate.heroObjectCategory, previous.heroObjectCategory),
    opening: same(candidate.hookType, previous.hookType) || same(candidate.firstFrameType, previous.firstFrameType),
    ending: same(candidate.endingType, previous.endingType),
    environment: same(candidate.environment, previous.environment),
    camera: same(candidate.cameraOpening, previous.cameraOpening) || same(candidate.cameraLanguage, previous.cameraLanguage),
    mascotEntrance: same(candidate.mascotEntrance, previous.mascotEntrance),
    visualMetaphor: same(candidate.visualMetaphor, previous.visualMetaphor),
    composition: same(candidate.compositionStyle, previous.compositionStyle) || same(candidate.textComposition, previous.textComposition),
  };

  const matches: CriticalSimilarityKey[] = [];
  if (fields.hero) matches.push('HERO');
  if (fields.opening) matches.push('OPENING');
  if (fields.ending) matches.push('ENDING');
  if (fields.environment) matches.push('ENVIRONMENT');
  if (fields.camera) matches.push('CAMERA');
  if (fields.mascotEntrance) matches.push('MASCOT_ENTRANCE');
  if (fields.visualMetaphor) matches.push('VISUAL_METAPHOR');
  if (fields.composition) matches.push('COMPOSITION');

  return {
    reelId: previous.id,
    score: matches.length / 8,
    matches,
    fields,
  };
};

export const analyzeNovelty = (candidate: ReelHistoryEntry, history: ReelHistory): NoveltyReport => {
  const comparisons = history.reels.map((previous) => compareReelNovelty(candidate, previous));
  const rejectedBy = comparisons.find((comparison) => comparison.matches.length >= 3);

  return {
    valid: rejectedBy === undefined,
    rejectionReason: rejectedBy
      ? `Rejected: ${candidate.id} matches ${rejectedBy.reelId} in ${rejectedBy.matches.join(', ')}`
      : undefined,
    comparisons,
  };
};

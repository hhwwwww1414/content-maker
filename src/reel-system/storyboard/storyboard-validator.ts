import type {Storyboard} from './types';

export type StoryboardValidation = {
  valid: boolean;
  errors: string[];
};

export const validateStoryboard = (storyboard: Storyboard): StoryboardValidation => {
  const errors: string[] = [];
  if (storyboard.shots.length === 0) errors.push('Storyboard must contain at least one shot');

  storyboard.shots.forEach((shot, index) => {
    if (shot.end <= shot.start) errors.push(`${shot.id}: end must be greater than start`);
    if (index > 0 && shot.start < storyboard.shots[index - 1].end) errors.push(`${shot.id}: shot overlaps previous shot`);
    if (shot.supportElements.length > 2) errors.push(`${shot.id}: scene complexity exceeds 2 supporting elements`);
    if (shot.text.length > 1 && shot.supportElements.length > 1) errors.push(`${shot.id}: too many simultaneous messages`);
    if (!shot.transitionReason.trim()) errors.push(`${shot.id}: transitionReason is required`);
    if (shot.assetType === 'HTML' && shot.hero.silhouetteImportance === 'high' && /physical|3d|perspective/i.test(shot.hero.visualDescription)) {
      errors.push(`${shot.id}: physical high-silhouette hero needs R3F/IMAGE/SVG clarity, not random HTML divs`);
    }
  });

  return {valid: errors.length === 0, errors};
};

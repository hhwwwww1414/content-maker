import type {Storyboard} from './types';
import type {StoryboardValidation} from './storyboard-validator';

export const validateSceneComplexity = (storyboard: Storyboard): StoryboardValidation => {
  const errors: string[] = [];

  storyboard.shots.forEach((shot) => {
    const primaryHeroCount = shot.hero.semanticName.trim() ? 1 : 0;
    const primaryMessageCount = shot.text.length > 0 ? 1 : 0;
    if (primaryHeroCount > 1) errors.push(`${shot.id}: more than one primary hero concept`);
    if (primaryMessageCount > 1) errors.push(`${shot.id}: more than one simultaneous primary message`);
    if (shot.supportElements.length > 2) errors.push(`${shot.id}: more than two supporting elements`);
  });

  return {valid: errors.length === 0, errors};
};

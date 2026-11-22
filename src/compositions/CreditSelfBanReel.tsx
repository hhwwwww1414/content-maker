import timeline from '../generated/timeline-credit-self-ban.json';
import captions from '../generated/captions-credit-self-ban.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/credit-self-ban-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const CreditSelfBanReel = createReel(timeline as unknown as ReelTimeline, captions);

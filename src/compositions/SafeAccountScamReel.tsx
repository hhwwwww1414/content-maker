import timeline from '../generated/timeline-safe-account-scam.json';
import captions from '../generated/captions-safe-account-scam.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/safe-account-scam-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const SafeAccountScamReel = createReel(timeline as unknown as ReelTimeline, captions);

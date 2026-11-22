import timeline from '../generated/timeline-flat-back-to-seller.json';
import captions from '../generated/captions-flat-back-to-seller.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/flat-back-to-seller-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const FlatBackToSellerReel = createReel(timeline as unknown as ReelTimeline, captions);

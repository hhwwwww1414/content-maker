import timeline from '../generated/timeline-tv-watches-you.json';
import captions from '../generated/captions-tv-watches-you.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/tv-watches-you-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const TvWatchesYouReel = createReel(timeline as unknown as ReelTimeline, captions);

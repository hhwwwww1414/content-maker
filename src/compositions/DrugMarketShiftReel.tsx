import timeline from '../generated/timeline-drug-market-shift.json';
import captions from '../generated/captions-drug-market-shift.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/drug-market-shift-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const DrugMarketShiftReel = createReel(timeline as unknown as ReelTimeline, captions);

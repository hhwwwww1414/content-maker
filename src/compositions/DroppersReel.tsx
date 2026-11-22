import timeline from '../generated/timeline-droppers.json';
import captions from '../generated/captions-droppers.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/droppers-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const DroppersReel = createReel(timeline as unknown as ReelTimeline, captions);

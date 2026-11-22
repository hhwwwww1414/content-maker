import timeline from '../generated/timeline-eleven-lines-broke-internet.json';
import captions from '../generated/captions-eleven-lines-broke-internet.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/eleven-lines-broke-internet-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const ElevenLinesBrokeInternetReel = createReel(timeline as unknown as ReelTimeline, captions);

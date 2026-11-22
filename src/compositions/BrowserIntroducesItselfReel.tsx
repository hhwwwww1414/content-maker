import timeline from '../generated/timeline-browser-introduces-itself.json';
import captions from '../generated/captions-browser-introduces-itself.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/browser-introduces-itself-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const BrowserIntroducesItselfReel = createReel(timeline as unknown as ReelTimeline, captions);

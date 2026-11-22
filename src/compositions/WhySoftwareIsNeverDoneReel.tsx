import timeline from '../generated/timeline-why-software-is-never-done.json';
import captions from '../generated/captions-why-software-is-never-done.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/why-software-is-never-done-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const WhySoftwareIsNeverDoneReel = createReel(timeline as unknown as ReelTimeline, captions);

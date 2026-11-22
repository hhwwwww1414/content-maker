import timeline from '../generated/timeline-ai-browser-hijack.json';
import captions from '../generated/captions-ai-browser-hijack.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled entirely from scene grammars declared in
 * `content/ai-browser-hijack-reel.json`. There is no reel-specific rendering
 * code any more — this file exists only to bind one timeline to the engine.
 */
export const AiBrowserHijackReel = createReel(timeline as unknown as ReelTimeline, captions);

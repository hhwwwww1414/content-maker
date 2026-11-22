import timeline from '../generated/timeline-claude-watermark.json';
import captions from '../generated/captions-claude-watermark.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/claude-watermark-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const ClaudeWatermarkReel = createReel(timeline as unknown as ReelTimeline, captions);

import timeline from '../generated/timeline-ai-voice-scam-48k.json';
import captions from '../generated/captions-ai-voice-scam-48k.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in `content/ai-voice-scam-48k-reel.json`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const AiVoiceScam48kReel = createReel(timeline as unknown as ReelTimeline, captions);

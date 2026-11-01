import type React from 'react';

/**
 * Hand-made scenes for beats the JSON layers cannot express. Register a component
 * here and set `"component": "<name>"` on that scene; `useScene()` from
 * ../kit/scene gives it the voice-cue clock. Other scenes are not affected.
 */
export const customScenes: Record<string, React.FC> = {};

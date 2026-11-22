import React from 'react';
import timeline from '../generated/timeline-claude-watermark.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {ClaudeWatermarkReel} from './ClaudeWatermarkReel';

export const ClaudeWatermarkContactSheet: React.FC = () => (
  <ContactSheet reel={ClaudeWatermarkReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

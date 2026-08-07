import React from 'react';
import timeline from '../generated/timeline-website-controls-ai.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {WebsiteControlsAiReel} from './WebsiteControlsAiReel';

export const WebsiteControlsAiContactSheet: React.FC = () => (
  <ContactSheet reel={WebsiteControlsAiReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

import React from 'react';
import timeline from '../generated/timeline-ai-browser-hijack.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {AiBrowserHijackReel} from './AiBrowserHijackReel';

export const AiBrowserHijackContactSheet: React.FC = () => (
  <ContactSheet reel={AiBrowserHijackReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

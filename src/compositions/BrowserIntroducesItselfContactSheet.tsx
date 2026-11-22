import React from 'react';
import timeline from '../generated/timeline-browser-introduces-itself.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {BrowserIntroducesItselfReel} from './BrowserIntroducesItselfReel';

export const BrowserIntroducesItselfContactSheet: React.FC = () => (
  <ContactSheet reel={BrowserIntroducesItselfReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

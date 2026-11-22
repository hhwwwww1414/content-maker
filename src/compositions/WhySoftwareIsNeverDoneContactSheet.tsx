import React from 'react';
import timeline from '../generated/timeline-why-software-is-never-done.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {WhySoftwareIsNeverDoneReel} from './WhySoftwareIsNeverDoneReel';

export const WhySoftwareIsNeverDoneContactSheet: React.FC = () => (
  <ContactSheet reel={WhySoftwareIsNeverDoneReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

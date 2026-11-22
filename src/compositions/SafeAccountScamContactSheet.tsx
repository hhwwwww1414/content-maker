import React from 'react';
import timeline from '../generated/timeline-safe-account-scam.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {SafeAccountScamReel} from './SafeAccountScamReel';

export const SafeAccountScamContactSheet: React.FC = () => (
  <ContactSheet reel={SafeAccountScamReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

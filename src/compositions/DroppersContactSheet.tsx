import React from 'react';
import timeline from '../generated/timeline-droppers.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {DroppersReel} from './DroppersReel';

export const DroppersContactSheet: React.FC = () => (
  <ContactSheet reel={DroppersReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

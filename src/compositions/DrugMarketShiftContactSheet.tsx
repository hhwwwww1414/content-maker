import React from 'react';
import timeline from '../generated/timeline-drug-market-shift.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {DrugMarketShiftReel} from './DrugMarketShiftReel';

export const DrugMarketShiftContactSheet: React.FC = () => (
  <ContactSheet reel={DrugMarketShiftReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

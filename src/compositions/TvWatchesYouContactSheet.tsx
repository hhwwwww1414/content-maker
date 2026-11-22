import React from 'react';
import timeline from '../generated/timeline-tv-watches-you.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {TvWatchesYouReel} from './TvWatchesYouReel';

export const TvWatchesYouContactSheet: React.FC = () => (
  <ContactSheet reel={TvWatchesYouReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

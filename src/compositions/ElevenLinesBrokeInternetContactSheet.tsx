import React from 'react';
import timeline from '../generated/timeline-eleven-lines-broke-internet.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {ElevenLinesBrokeInternetReel} from './ElevenLinesBrokeInternetReel';

export const ElevenLinesBrokeInternetContactSheet: React.FC = () => (
  <ContactSheet reel={ElevenLinesBrokeInternetReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

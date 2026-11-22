import React from 'react';
import timeline from '../generated/timeline-flat-back-to-seller.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {FlatBackToSellerReel} from './FlatBackToSellerReel';

export const FlatBackToSellerContactSheet: React.FC = () => (
  <ContactSheet reel={FlatBackToSellerReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

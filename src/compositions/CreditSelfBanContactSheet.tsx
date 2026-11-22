import React from 'react';
import timeline from '../generated/timeline-credit-self-ban.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {CreditSelfBanReel} from './CreditSelfBanReel';

export const CreditSelfBanContactSheet: React.FC = () => (
  <ContactSheet reel={CreditSelfBanReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

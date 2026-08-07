import React from 'react';
import timeline from '../generated/timeline-how-sites-detect-vpn.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {HowSitesDetectVpnReel} from './HowSitesDetectVpnReel';

export const HowSitesDetectVpnContactSheet: React.FC = () => (
  <ContactSheet reel={HowSitesDetectVpnReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

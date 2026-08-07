import React from 'react';
import timeline from '../generated/timeline-passkey-explained.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {PasskeyExplainedReel} from './PasskeyExplainedReel';

export const PasskeyExplainedContactSheet: React.FC = () => (
  <ContactSheet reel={PasskeyExplainedReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

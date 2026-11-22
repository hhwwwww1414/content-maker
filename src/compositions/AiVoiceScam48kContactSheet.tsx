import React from 'react';
import timeline from '../generated/timeline-ai-voice-scam-48k.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {AiVoiceScam48kReel} from './AiVoiceScam48kReel';

export const AiVoiceScam48kContactSheet: React.FC = () => (
  <ContactSheet reel={AiVoiceScam48kReel} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);

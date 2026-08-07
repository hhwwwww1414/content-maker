import {Audio} from '@remotion/media';
import type {ReactNode} from 'react';
import {AbsoluteFill, Sequence, Series, staticFile, useVideoConfig} from 'remotion';
import captionPages from '../generated/captions-graveyard.json';
import {CaptionPage} from '../components/CaptionPage';
import {SceneFade} from '../components/SceneFade';
import {GraveyardHookScene} from '../scenes/GraveyardHookScene';
import {VpnFailureScene} from '../scenes/VpnFailureScene';
import {DigitalGraveyardScene} from '../scenes/DigitalGraveyardScene';
import {GhostPepeArrivalScene} from '../scenes/GhostPepeArrivalScene';
import {ConnectionFlowScene} from '../scenes/ConnectionFlowScene';
import {GraveyardBenefitsScene} from '../scenes/GraveyardBenefitsScene';
import {GraveyardCtaScene} from '../scenes/GraveyardCtaScene';
import {colors} from '../theme/colors';
import {computeGraveyardSceneFrames} from './graveyardSceneFrames';

type CaptionToken = {text: string; fromMs: number; toMs: number};
type CaptionPageData = {text: string; startMs: number; durationMs: number; tokens: CaptionToken[]};

// A small visual-only safety margin so a caption page never feels like it beats the
// voice to the word: it appears a couple of frames after the real speech onset.
const CAPTION_SAFE_OFFSET_FRAMES = 2;

export const GhostPepeGraveyardReel: React.FC = () => {
  const {fps} = useVideoConfig();
  const {frames, starts, benefitsStarts} = computeGraveyardSceneFrames();
  const pages = captionPages as CaptionPageData[];

  const sceneNodes: ReactNode[] = [
    <GraveyardHookScene key="hook" />,
    <VpnFailureScene key="failure" />,
    <DigitalGraveyardScene key="graveyard" />,
    <GhostPepeArrivalScene key="arrival" durationInFrames={frames[3]} />,
    <ConnectionFlowScene key="connect" />,
    <GraveyardBenefitsScene key="benefits" itemStarts={benefitsStarts} />,
    <GraveyardCtaScene key="cta" />,
  ];

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep}}>
      <Series>
        {frames.map((duration, index) => {
          const isFirst = index === 0;
          const isLast = index === frames.length - 1;
          const transitionFrames = Math.max(20, Math.min(35, Math.floor(duration * 0.22)));
          const fadeIn = isFirst ? 0 : transitionFrames;
          const fadeOut = isLast ? 0 : transitionFrames;
          return (
            <Series.Sequence key={index} durationInFrames={duration} premountFor={Math.min(fps, duration)}>
              <SceneFade durationInFrames={duration} fadeIn={fadeIn} fadeOut={fadeOut}>
                {sceneNodes[index]}
              </SceneFade>
            </Series.Sequence>
          );
        })}
      </Series>

      <AbsoluteFill>
        {pages.map((page, index) => {
          const startFrame = Math.round((page.startMs / 1000) * fps) + CAPTION_SAFE_OFFSET_FRAMES;
          const pageDuration = Math.max(1, Math.round((page.durationMs / 1000) * fps) - CAPTION_SAFE_OFFSET_FRAMES);
          return (
            <Sequence key={index} from={startFrame} durationInFrames={pageDuration}>
              <CaptionPage page={page} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <Audio src={staticFile('generated/ambient.wav')} loop volume={(frame) => Math.min(0.07, (frame / (fps * 2)) * 0.07)} />
      <Audio src={staticFile('generated/voiceover-graveyard.wav')} volume={1} />

      <Sequence from={starts[0] + 28} premountFor={fps}>
        <Audio src={staticFile('generated/error.wav')} volume={0.24} />
      </Sequence>
      <Sequence from={starts[1] + 30} premountFor={fps}>
        <Audio src={staticFile('generated/click.wav')} volume={0.18} />
      </Sequence>
      <Sequence from={starts[1] + 45} premountFor={fps}>
        <Audio src={staticFile('generated/click.wav')} volume={0.18} />
      </Sequence>
      <Sequence from={starts[1] + 60} premountFor={fps}>
        <Audio src={staticFile('generated/click.wav')} volume={0.18} />
      </Sequence>
      <Sequence from={starts[1] + 32} premountFor={fps}>
        <Audio src={staticFile('generated/fall.wav')} volume={0.34} />
      </Sequence>
      <Sequence from={starts[2] + 2} premountFor={fps}>
        <Audio src={staticFile('generated/fall.wav')} volume={0.26} />
      </Sequence>
      <Sequence from={Math.max(0, starts[3] + 64)} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.2} />
      </Sequence>
      <Sequence from={starts[4] + 36} premountFor={fps}>
        <Audio src={staticFile('generated/click.wav')} volume={0.16} />
      </Sequence>
      <Sequence from={starts[4] + 94} premountFor={fps}>
        <Audio src={staticFile('generated/click.wav')} volume={0.16} />
      </Sequence>
      <Sequence from={starts[4] + 164} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};

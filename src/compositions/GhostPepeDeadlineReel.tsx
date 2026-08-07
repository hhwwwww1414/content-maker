import {Audio} from '@remotion/media';
import type {ReactNode} from 'react';
import {AbsoluteFill, Sequence, Series, staticFile, useVideoConfig} from 'remotion';
import timeline from '../generated/timeline-deadline.json';
import captionPages from '../generated/captions-deadline.json';
import {CaptionPage} from '../components/CaptionPage';
import {SceneFade} from '../components/SceneFade';
import {DeadlineHookScene} from '../scenes/DeadlineHookScene';
import {DeadlineProblemScene} from '../scenes/DeadlineProblemScene';
import {DeadlineSolutionScene} from '../scenes/DeadlineSolutionScene';
import {DeadlineResultScene} from '../scenes/DeadlineResultScene';
import {DeadlineCtaScene} from '../scenes/DeadlineCtaScene';
import {colors} from '../theme/colors';
import {deadlineLayout} from '../theme/layout';

type CaptionToken = {text: string; fromMs: number; toMs: number};
type CaptionPageData = {text: string; startMs: number; durationMs: number; tokens: CaptionToken[]};

// A small visual-only safety margin so a caption page never feels like it beats the
// voice to the word: it appears a couple of frames after the real speech onset.
const CAPTION_SAFE_OFFSET_FRAMES = 2;

export const GhostPepeDeadlineReel: React.FC = () => {
  const {fps} = useVideoConfig();
  const pages = captionPages as CaptionPageData[];

  // The final "cta" line is already shown as large on-screen text in DeadlineCtaScene,
  // so its caption is dropped to keep the CTA screen free of redundant bottom text.
  const ctaStartMs = timeline.segments[timeline.segments.length - 1].startMs;
  const visiblePages = pages.filter((page) => page.startMs < ctaStartMs);

  const sceneFrames = timeline.segments.map((segment, index) =>
    Math.max(1, Math.round(((segment.durationMs + segment.pauseAfterMs + (index === timeline.segments.length - 1 ? timeline.finalHoldMs : 0)) / 1000) * fps)),
  );

  const sceneNodes: ReactNode[] = [
    <DeadlineHookScene key="hook" durationInFrames={sceneFrames[0]} />,
    <DeadlineProblemScene key="problem" />,
    <DeadlineSolutionScene key="solution" durationInFrames={sceneFrames[2]} />,
    <DeadlineResultScene key="result" />,
    <DeadlineCtaScene key="cta" />,
  ];

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep}}>
      <Series>
        {sceneFrames.map((duration, index) => {
          const isFirst = index === 0;
          const isLast = index === sceneFrames.length - 1;
          const transitionFrames = Math.max(10, Math.min(32, Math.floor(duration * 0.25)));
          const fadeIn = isFirst ? 0 : transitionFrames;
          const fadeOut = isLast ? 0 : transitionFrames;
          return (
            <Series.Sequence key={timeline.segments[index].id} durationInFrames={duration} premountFor={Math.min(fps, duration)}>
              <SceneFade durationInFrames={duration} fadeIn={fadeIn} fadeOut={fadeOut}>
                {sceneNodes[index]}
              </SceneFade>
            </Series.Sequence>
          );
        })}
      </Series>

      <AbsoluteFill>
        {visiblePages.map((page, index) => {
          const startFrame = Math.round((page.startMs / 1000) * fps) + CAPTION_SAFE_OFFSET_FRAMES;
          const pageDuration = Math.max(1, Math.round((page.durationMs / 1000) * fps) - CAPTION_SAFE_OFFSET_FRAMES);
          return (
            <Sequence key={index} from={startFrame} durationInFrames={pageDuration}>
              <CaptionPage page={page} layout={deadlineLayout} riseIn />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <Audio src={staticFile('generated/ambient.wav')} loop volume={(frame) => Math.min(0.06, (frame / (fps * 2)) * 0.06)} />
      <Audio src={staticFile('generated/voiceover-deadline.wav')} volume={1} />

      <Sequence from={Math.round(timeline.segments[1].startMs / 1000 * fps)} premountFor={fps}>
        <Audio src={staticFile('generated/error.wav')} volume={0.22} />
      </Sequence>
      <Sequence from={Math.round((timeline.segments[2].startMs + timeline.segments[2].durationMs * 0.85) / 1000 * fps)} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.26} />
      </Sequence>
    </AbsoluteFill>
  );
};

import {Audio} from '@remotion/media';
import type {ReactNode} from 'react';
import {AbsoluteFill, Sequence, Series, staticFile, useVideoConfig} from 'remotion';
import timeline from '../generated/timeline-quest.json';
import captionPages from '../generated/captions-quest.json';
import {CaptionPage} from '../components/CaptionPage';
import {SceneFade} from '../components/SceneFade';
import {QuestHookScene} from '../scenes/QuestHookScene';
import {QuestMazeScene} from '../scenes/QuestMazeScene';
import {QuestTrialScene} from '../scenes/QuestTrialScene';
import {QuestArrivalScene} from '../scenes/QuestArrivalScene';
import {QuestRouteScene} from '../scenes/QuestRouteScene';
import {QuestCtaScene} from '../scenes/QuestCtaScene';
import {colors} from '../theme/colors';
import {deadlineLayout} from '../theme/layout';
import {computeQuestSceneFrames} from './questSceneFrames';

type CaptionToken = {text: string; fromMs: number; toMs: number};
type CaptionPageData = {text: string; startMs: number; durationMs: number; tokens: CaptionToken[]};

// A small visual-only safety margin so a caption page never feels like it beats the
// voice to the word: it appears a couple of frames after the real speech onset.
const CAPTION_SAFE_OFFSET_FRAMES = 2;

export const GhostPepeQuestReel: React.FC = () => {
  const {fps} = useVideoConfig();
  const pages = captionPages as CaptionPageData[];
  const {frames: sceneFrames, beatFrames, beatSpeechFrames} = computeQuestSceneFrames();

  // Both cta_a ("GhostPepeBot") and cta_b ("когда интернет должен просто работать") are
  // already shown as large on-screen text in QuestCtaScene, so their captions are
  // dropped to keep the CTA screen free of redundant bottom text.
  const ctaStartMs = timeline.segments.find((s) => s.id.startsWith('cta'))?.startMs ?? Infinity;
  const visiblePages = pages.filter((page) => page.startMs < ctaStartMs);

  const sceneNodes: ReactNode[] = [
    <QuestHookScene key="hook" durationInFrames={sceneFrames[0]} beats={beatFrames[0]} beatSpeech={beatSpeechFrames[0]} />,
    <QuestMazeScene key="maze" durationInFrames={sceneFrames[1]} beats={beatFrames[1]} />,
    <QuestTrialScene key="trial" durationInFrames={sceneFrames[2]} beats={beatFrames[2]} beatSpeech={beatSpeechFrames[2]} />,
    <QuestArrivalScene key="arrival" durationInFrames={sceneFrames[3]} beats={beatFrames[3]} />,
    <QuestRouteScene key="route" durationInFrames={sceneFrames[4]} beats={beatFrames[4]} />,
    <QuestCtaScene key="cta" beats={beatFrames[5]} />,
  ];

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep}}>
      <Series>
        {sceneFrames.map((duration, index) => {
          const isFirst = index === 0;
          const isLast = index === sceneFrames.length - 1;
          // Generous crossfade overlap (18-30f) so a new scene's calm opening motion is
          // already underway while the previous scene's hold is still fading out --
          // never a hard cut, never two competing bursts of motion at once.
          const transitionFrames = Math.max(18, Math.min(30, Math.floor(duration * 0.26)));
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
      <Audio src={staticFile('generated/voiceover-quest.wav')} volume={1} />

      <Sequence from={Math.round((timeline.segments.find((s) => s.id === 'maze_a')?.startMs ?? 0) / 1000 * fps)} premountFor={fps}>
        <Audio src={staticFile('generated/error.wav')} volume={0.16} />
      </Sequence>
      <Sequence from={Math.round((timeline.segments.find((s) => s.id === 'route_c')?.startMs ?? 0) / 1000 * fps)} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.2} />
      </Sequence>
    </AbsoluteFill>
  );
};

import {Audio} from '@remotion/media';
import type {ReactNode} from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import timeline from '../generated/timeline-whitelist.json';
import captionPages from '../generated/captions-whitelist.json';
import {CaptionPage} from '../components/CaptionPage';
import {CyberBackground} from '../components/CyberBackground';
import {CyberCheckpoint} from '../components/CyberCheckpoint';
import {NewsLabel} from '../components/NewsLabel';
import {WhitelistCtaScene} from '../scenes/WhitelistCtaScene';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';
import {computeWhitelistFrames} from './whitelistSceneFrames';

type CaptionToken = {text: string; fromMs: number; toMs: number};
type CaptionPageData = {text: string; startMs: number; durationMs: number; tokens: CaptionToken[]};

const CAPTION_SAFE_OFFSET_FRAMES = 2;
const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** One headline line with a calm fade-and-rise entrance at its sequence-local beat. */
const Line: React.FC<{at: number; size: number; color: string; enterFrames?: number; glow?: boolean; children: ReactNode}> = ({
  at,
  size,
  color,
  enterFrames = 16,
  glow = false,
  children,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [at, at + enterFrames], [0, 1], EASE);
  return (
    <div
      style={{
        fontFamily: unbounded,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.16,
        letterSpacing: -1,
        textTransform: 'uppercase',
        color,
        textShadow: glow ? '0 0 34px rgba(34,240,208,.35)' : '0 4px 26px rgba(2,3,4,.6)',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [16, 0])}px`,
      }}
    >
      {children}
    </div>
  );
};

/** Positions a text block inside the Instagram safe area (x 110-820) and fades it out
 * near the end of its own sequence, so no overlay ever disappears in a single frame. */
const Overlay: React.FC<{top: number; durationInFrames: number; children: ReactNode}> = ({top, durationInFrames, children}) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [durationInFrames - 14, durationInFrames - 2], [1, 0], EASE);
  return (
    <div style={{position: 'absolute', left: 110, width: 710, top, textAlign: 'center', opacity: out, zIndex: 20}}>
      {children}
    </div>
  );
};

export const GhostPepeWhitelistReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beats = computeWhitelistFrames();
  const pages = captionPages as CaptionPageData[];

  // CTA copy is already large on-screen text, so its caption pages are dropped.
  const ctaStartMs = timeline.segments.find((s) => s.id === 'cta_a')?.startMs ?? Infinity;
  const visiblePages = pages.filter((page) => page.startMs < ctaStartMs);

  // The checkpoint never hard-cuts away: it dissolves into the binary background
  // right as the CTA screen resolves underneath it.
  const dissolve = interpolate(frame, [beats.ctaStart - 6, beats.ctaStart + 26], [1, 0], EASE);
  const bgIntensity = interpolate(
    frame,
    [0, beats.passStart, beats.passStart + 40, beats.ctaStart, beats.ctaStart + 30],
    [0.5, 0.5, 0.68, 0.68, 0.55],
    EASE,
  );

  const hookDuration = beats.factStart + 13;
  const factDuration = beats.passStart + 12 - beats.factB;
  const passFrom = beats.passStart + 10;
  const passDuration = beats.linkStart + 10 - passFrom;
  const linkFrom = beats.linkStart + 6;
  const linkDuration = beats.ctaStart + 8 - linkFrom;

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep}}>
      <CyberBackground mode="mint" intensity={bgIntensity} />

      {dissolve > 0 ? (
        <AbsoluteFill style={{opacity: dissolve, filter: `blur(${(1 - dissolve) * 12}px)`}}>
          <CyberCheckpoint beats={beats} />
        </AbsoluteFill>
      ) : null}

      {/* Scene 1: viral hook -- fully readable by frame 8 */}
      <Sequence from={1} durationInFrames={hookDuration}>
        <Overlay top={288} durationInFrames={hookDuration}>
          <Line at={0} size={56} color={colors.white} enterFrames={6}>
            Интернет теперь
          </Line>
          <Line at={2} size={56} color={colors.mint} enterFrames={6} glow>
            с фейс-контролем?
          </Line>
        </Overlay>
      </Sequence>
      <Sequence from={12} durationInFrames={hookDuration - 12}>
        <Overlay top={452} durationInFrames={hookDuration - 12}>
          <NewsLabel text="ПЕТЕРБУРГ · 10 ИЮЛЯ" />
        </Overlay>
      </Sequence>

      {/* Scene 2: the news fact */}
      <Sequence from={beats.factB} durationInFrames={factDuration}>
        <Overlay top={298} durationInFrames={factDuration}>
          <Line at={0} size={50} color={colors.white}>
            Мобильный интернет
          </Line>
          <Line at={8} size={50} color={colors.mint} glow>
            работает по списку
          </Line>
        </Overlay>
      </Sequence>

      {/* Scene 3: some pass, some stay behind the door */}
      <Sequence from={passFrom} durationInFrames={passDuration}>
        <Overlay top={292} durationInFrames={passDuration}>
          <Line at={0} size={52} color={colors.mint} glow>
            Одни проходят
          </Line>
          <Line at={beats.passB - passFrom} size={46} color={colors.white}>
            Другие остаются
          </Line>
          <Line at={beats.passB - passFrom + 6} size={46} color={colors.white}>
            за дверью
          </Line>
        </Overlay>
      </Sequence>

      {/* Scene 4: the contradiction */}
      <Sequence from={linkFrom} durationInFrames={linkDuration}>
        <Overlay top={296} durationInFrames={linkDuration}>
          <Line at={0} size={58} color={colors.white}>
            Связь <span style={{color: colors.mint, textShadow: '0 0 34px rgba(34,240,208,.4)'}}>есть</span>
          </Line>
          <Line at={beats.linkB - linkFrom} size={42} color={colors.white}>
            Полного интернета <span style={{color: colors.errorRed, textShadow: '0 0 26px rgba(255,90,82,.4)'}}>нет</span>
          </Line>
        </Overlay>
      </Sequence>

      {/* Scene 5: engagement CTA */}
      <Sequence from={beats.ctaStart - 6} premountFor={60}>
        <WhitelistCtaScene questionAt={6} commentAt={beats.ctaB - (beats.ctaStart - 6)} />
      </Sequence>

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

      <Audio src={staticFile('generated/ambient.wav')} loop volume={(f) => Math.min(0.06, (f / (fps * 2)) * 0.06)} />
      <Audio src={staticFile('generated/voiceover-whitelist.wav')} volume={1} />

      <Sequence from={beats.factStart + 44} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.13} />
      </Sequence>
      <Sequence from={beats.factStart + 138} premountFor={fps}>
        <Audio src={staticFile('generated/error.wav')} volume={0.12} />
      </Sequence>
      <Sequence from={beats.ctaStart - 6} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.18} />
      </Sequence>
    </AbsoluteFill>
  );
};

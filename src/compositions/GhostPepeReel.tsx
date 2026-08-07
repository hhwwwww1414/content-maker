import {Audio} from '@remotion/media';
import {AbsoluteFill, Img, interpolate, Sequence, Series, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import timeline from '../generated/timeline.json';
import {ProblemScene} from '../scenes/ProblemScene';
import {IntroScene} from '../scenes/IntroScene';
import {ConnectScene} from '../scenes/ConnectScene';
import {BenefitsScene} from '../scenes/BenefitsScene';
import {CtaScene} from '../scenes/CtaScene';
import {colors} from '../theme/colors';

const sceneComponents = [ProblemScene, IntroScene, ConnectScene, BenefitsScene, CtaScene];

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: colors.background, overflow: 'hidden'}}>
      <Img
        src={staticFile('assets/backgrounds/cyberspace-main.png')}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: interpolate(frame, [0, timeline.durationInFrames], [1.025, 1.065], {extrapolateRight: 'clamp'}),
          translate: `${Math.sin(frame / 52) * 6}px ${Math.cos(frame / 61) * 8}px`,
        }}
      />
      <AbsoluteFill style={{background: 'rgba(1,7,8,.42)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(0,4,5,.34) 0%,transparent 26%,transparent 72%,rgba(0,4,5,.55) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(0,4,5,.72) 0%,rgba(0,4,5,.08) 24%,rgba(0,4,5,.12) 72%,rgba(0,4,5,.78) 100%)'}} />
    </AbsoluteFill>
  );
};

export const GhostPepeReel: React.FC = () => {
  const {fps} = useVideoConfig();
  const sceneFrames = timeline.segments.map((segment, index) =>
    Math.max(1, Math.round(((segment.durationMs + segment.pauseAfterMs + (index === timeline.segments.length - 1 ? timeline.finalHoldMs : 0)) / 1000) * fps)),
  );

  return (
    <AbsoluteFill style={{backgroundColor: colors.background}}>
      <Background />
      <Series>
        {sceneFrames.map((duration, index) => {
          const Scene = sceneComponents[index];
          return <Series.Sequence key={timeline.segments[index].id} durationInFrames={duration} premountFor={Math.min(fps, duration)}><Scene /></Series.Sequence>;
        })}
      </Series>
      <Audio src={staticFile('generated/ambient.wav')} loop volume={(frame) => Math.min(.10, frame / (fps * 2) * .10)} />
      <Audio src={staticFile('generated/voiceover.wav')} volume={1} />
      <Sequence from={Math.max(0, Math.round(timeline.segments[0].endMs / 1000 * fps) - 10)} premountFor={fps}><Audio src={staticFile('generated/error.wav')} volume={.24} /></Sequence>
      <Sequence from={Math.round(timeline.segments[1].startMs / 1000 * fps)} premountFor={fps}><Audio src={staticFile('generated/whoosh.wav')} volume={.16} /></Sequence>
      <Sequence from={Math.round((timeline.segments[2].startMs + timeline.segments[2].durationMs * .22) / 1000 * fps)} premountFor={fps}><Audio src={staticFile('generated/click.wav')} volume={.22} /></Sequence>
      <Sequence from={Math.round((timeline.segments[2].startMs + timeline.segments[2].durationMs * .68) / 1000 * fps)} premountFor={fps}><Audio src={staticFile('generated/connect.wav')} volume={.20} /></Sequence>
    </AbsoluteFill>
  );
};

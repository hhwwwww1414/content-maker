import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {graveyardLayout} from '../theme/layout';

const CALM_SPRING = {damping: 24, stiffness: 75, mass: 1.1};

export const GhostPepeArrivalScene: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // The phrase holds through essentially the whole spoken line so the viewer has time
  // to read it, then the mascot eases in near the end of the line and through the pause.
  const mascotStart = Math.round(durationInFrames * 0.7);
  const phraseFadeStart = Math.round(durationInFrames * 0.82);
  const phraseFadeEnd = Math.round(durationInFrames * 0.97);

  const redFade = interpolate(frame, [0, 65], [0.75, 0], {extrapolateRight: 'clamp'});
  const phraseEnter = interpolate(frame, [2, 22], [0, 1], {extrapolateRight: 'clamp'});
  const phraseExit = interpolate(frame, [phraseFadeStart, phraseFadeEnd], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const reveal = spring({frame: frame - mascotStart, fps, config: CALM_SPRING});
  const glow = interpolate(Math.sin(frame / 42), [-1, 1], [0.2, 0.33]);
  const floatY = Math.sin(frame / 68) * 2;

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.75} />
      <AbsoluteFill style={{background: `rgba(120,26,24,${redFade})`}} />
      <AbsoluteFill style={{left: graveyardLayout.safeLeft, right: 1080 - graveyardLayout.safeRight, width: 'auto', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>
        <div
          style={{
            position: 'absolute',
            width: 640,
            height: 640,
            borderRadius: '50%',
            background: colors.mint,
            filter: 'blur(160px)',
            opacity: glow,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: graveyardLayout.safeTop,
            textAlign: 'center',
            opacity: phraseEnter * phraseExit,
            translate: `0 ${interpolate(phraseEnter, [0, 1], [24, 0])}px`,
          }}
        >
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 58, color: colors.white, textTransform: 'uppercase', letterSpacing: -2}}>
            Хватит искать
            <br />
            <span style={{color: colors.mint}}>новый</span>
          </div>
        </div>
        {frame >= mascotStart - 8 && (
          <div
            style={{
              opacity: Math.max(0, Math.min(1, reveal)),
              scale: interpolate(reveal, [0, 1], [0.85, 1], {extrapolateRight: 'clamp'}),
              translate: `0 ${interpolate(reveal, [0, 1], [40, floatY], {extrapolateRight: 'clamp'})}px`,
              filter: `blur(${interpolate(reveal, [0, 1], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
            }}
          >
            <Img
              src={staticFile('assets/mascot/ghostpepe-main.png')}
              style={{width: 680, height: 680, objectFit: 'contain'}}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

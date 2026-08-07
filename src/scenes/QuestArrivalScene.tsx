import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {GlassPanel} from '../components/GlassPanel';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';
import {CALM_SPRING} from '../theme/motion';

export const QuestArrivalScene: React.FC<{durationInFrames: number; beats: number[]}> = ({durationInFrames, beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beat2 = beats[1] ?? 72;

  // The maze calms down first: background intensity eases off before anything else moves.
  const calm = interpolate(frame, [0, 34], [1, 0.42], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Mint mist gathers, then the mascot resolves out of it on a calm spring.
  const mistBuild = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const reveal = spring({frame: frame - 14, fps, config: CALM_SPRING});
  const revealClamped = Math.max(0, Math.min(1, reveal));

  // A thin impulse sweeps outward from the mascot once it has settled, dissolving the
  // two leftover maze walls as it passes them rather than snapping them away.
  const impulseStart = Math.max(60, beat2 - 6);
  const impulse = interpolate(frame, [impulseStart, impulseStart + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wallsFade = 1 - impulse;

  const textStart = beat2 + 14;
  const textIn = interpolate(frame, [textStart, textStart + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={calm} />
      <AbsoluteFill
        style={{
          left: deadlineLayout.safeLeft,
          right: 1080 - deadlineLayout.safeRight,
          width: 'auto',
          top: deadlineLayout.safeTop,
          bottom: 1920 - deadlineLayout.safeBottom,
          height: 'auto',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 560,
            height: 560,
            borderRadius: '50%',
            background: colors.mint,
            filter: 'blur(150px)',
            opacity: mistBuild * 0.3 + revealClamped * 0.05,
          }}
        />

        <div style={{position: 'absolute', width: 110, height: 300, translate: '-260px 0', opacity: wallsFade}}>
          <GlassPanel width={110} height={300} opacity={1} />
        </div>
        <div style={{position: 'absolute', width: 110, height: 300, translate: '160px -20px', opacity: wallsFade}}>
          <GlassPanel width={110} height={300} opacity={1} />
        </div>

        <div
          style={{
            position: 'absolute',
            width: 640,
            height: 4,
            borderRadius: 4,
            background: `linear-gradient(90deg, rgba(34,240,208,0), ${colors.mint}, rgba(34,240,208,0))`,
            opacity: interpolate(impulse, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
            boxShadow: '0 0 22px rgba(34,240,208,.6)',
          }}
        />

        <div style={{translate: '-46px 0', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div
            style={{
              scale: interpolate(revealClamped, [0, 1], [0.96, 1]),
              opacity: revealClamped,
              translate: `0 ${interpolate(revealClamped, [0, 1], [36, 0])}px`,
              filter: `blur(${interpolate(revealClamped, [0, 1], [7, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
            }}
          >
            <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain'}} />
          </div>
        </div>

        <div style={{marginTop: 34, textAlign: 'center', opacity: textIn, translate: `0 ${interpolate(textIn, [0, 1], [18, 0])}px`}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 48, lineHeight: 1.14, letterSpacing: -1.5, color: colors.white, textTransform: 'uppercase'}}>
            Один понятный
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 48,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.mint,
              textTransform: 'uppercase',
              textShadow: '0 0 36px rgba(34,240,208,.35)',
            }}
          >
            Путь
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

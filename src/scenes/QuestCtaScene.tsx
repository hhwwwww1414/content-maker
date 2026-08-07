import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';
import {CALM_SPRING} from '../theme/motion';

export const QuestCtaScene: React.FC<{beats: number[]}> = ({beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beat2 = beats[1] ?? 43;

  const reveal = Math.max(0, Math.min(1, spring({frame, fps, config: CALM_SPRING})));
  const glow = interpolate(Math.sin(frame / 42), [-1, 1], [0.16, 0.26]);

  // The mint route from the previous scene continues down into the CTA as a single line.
  const lineGrow = interpolate(frame, [10, 40], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const tagline1 = interpolate(frame, [beat2, beat2 + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const tagline2 = interpolate(frame, [beat2 + 16, beat2 + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const buttonStart = 70;
  const buttonIn = interpolate(frame, [buttonStart, buttonStart + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // A single calm light sweep crosses the button once everything has settled, then the
  // whole composition stays stable for the remainder of the scene.
  const sweepStart = 96;
  const sweepProgress = interpolate(frame, [sweepStart, sweepStart + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.5} />
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
        <div style={{position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: colors.mint, filter: 'blur(160px)', opacity: glow}} />

        <div style={{translate: '-40px 0', scale: interpolate(reveal, [0, 1], [0.9, 1]), opacity: reveal}}>
          <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 280, height: 280, objectFit: 'contain'}} />
        </div>

        <div
          style={{
            marginTop: 6,
            width: 4,
            height: 60 * lineGrow,
            borderRadius: 4,
            background: `linear-gradient(180deg, ${colors.mint}, rgba(34,240,208,0))`,
            boxShadow: '0 0 14px rgba(34,240,208,.6)',
          }}
        />

        <div style={{marginTop: 12, textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 32,
              lineHeight: 1.16,
              color: colors.lightMint,
              textTransform: 'uppercase',
              opacity: tagline1,
              translate: `0 ${interpolate(tagline1, [0, 1], [14, 0])}px`,
            }}
          >
            Когда интернет
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 32,
              lineHeight: 1.16,
              color: colors.lightMint,
              textTransform: 'uppercase',
              opacity: tagline2,
              translate: `0 ${interpolate(tagline2, [0, 1], [14, 0])}px`,
            }}
          >
            Должен просто работать
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            width: 610,
            height: 102,
            borderRadius: 30,
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
            background: colors.mint,
            border: '1px solid rgba(140,255,233,.85)',
            marginTop: 30,
            boxShadow: `0 22px 70px rgba(34,240,208,${0.2 + glow})`,
            opacity: buttonIn,
            scale: interpolate(buttonIn, [0, 1], [0.94, 1]),
          }}
        >
          <div
            style={{
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 32,
              color: colors.background,
              textAlign: 'center',
              zIndex: 1,
            }}
          >
            ОТКРЫТЬ В TELEGRAM
          </div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 140,
              left: `${-30 + sweepProgress * 160}%`,
              background: 'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 50%, rgba(255,255,255,0) 100%)',
              opacity: interpolate(sweepProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {EnergySphere} from '../components/EnergySphere';
import {GlassPanel} from '../components/GlassPanel';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const QuestHookScene: React.FC<{durationInFrames: number; beats: number[]; beatSpeech: number[]}> = ({
  durationInFrames,
  beats,
  beatSpeech,
}) => {
  const frame = useCurrentFrame();

  const line1 = interpolate(frame, [4, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line2Start = beats[1] ?? 34;
  const line2 = interpolate(frame, [line2Start, line2Start + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line3Start = line2Start + Math.round((beatSpeech[1] ?? 40) * 0.25);
  const line3 = interpolate(frame, [line3Start, line3Start + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // A single glowing route line draws in first, then the glass walls rise around it.
  const lineGrow = interpolate(frame, [0, 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wallLeft = interpolate(frame, [16, 46], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wallRight = interpolate(frame, [26, 56], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sphereIn = interpolate(frame, [44, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // A slow forward glide once the sphere has settled in, held through the rest of the scene.
  const glide = interpolate(frame, [70, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cameraDrift = interpolate(glide, [0, 1], [0, -26]);
  const cameraScale = interpolate(glide, [0, 1], [1, 1.035]);

  // The first closed turn eases into view well before the scene ends, foreshadowing scene 2.
  const turnStart = Math.max(80, durationInFrames - 34);
  const turnIn = interpolate(frame, [turnStart, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{scale: cameraScale, translate: `0 ${cameraDrift}px`}}>
      <CyberBackground mode="mint" intensity={0.72} />
      <AbsoluteFill
        style={{
          left: deadlineLayout.safeLeft,
          right: 1080 - deadlineLayout.safeRight,
          width: 'auto',
          top: deadlineLayout.safeTop,
          height: 'auto',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 50,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.white,
              textTransform: 'uppercase',
              opacity: line1,
              translate: `0 ${interpolate(line1, [0, 1], [18, 0])}px`,
            }}
          >
            Пять минут назад
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 50,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.white,
              textTransform: 'uppercase',
              opacity: line2,
              translate: `0 ${interpolate(line2, [0, 1], [18, 0])}px`,
            }}
          >
            Ты хотел
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 50,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.mint,
              textTransform: 'uppercase',
              opacity: line3,
              translate: `0 ${interpolate(line3, [0, 1], [18, 0])}px`,
              textShadow: '0 0 36px rgba(34,240,208,.35)',
            }}
          >
            Просто открыть страницу
          </div>
        </div>

        <div style={{marginTop: 70, position: 'relative', width: 640, height: 460}}>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              translate: '-50% 0',
              width: 4,
              height: 300 * lineGrow,
              borderRadius: 4,
              background: `linear-gradient(180deg, rgba(34,240,208,0), ${colors.mint})`,
              boxShadow: '0 0 16px rgba(34,240,208,.55)',
            }}
          />

          <div style={{position: 'absolute', left: 60, bottom: 30}}>
            <GlassPanel width={110} height={280} opacity={wallLeft} translateY={interpolate(wallLeft, [0, 1], [50, 0])} />
          </div>
          <div style={{position: 'absolute', right: 60, bottom: 30}}>
            <GlassPanel width={110} height={280} opacity={wallRight} translateY={interpolate(wallRight, [0, 1], [50, 0])} />
          </div>

          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 210,
              translate: '-50% 0',
              opacity: sphereIn,
              scale: interpolate(sphereIn, [0, 1], [0.6, 1]),
            }}
          >
            <EnergySphere size={30} />
          </div>

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 40,
              translate: '-50% 0',
              opacity: turnIn,
              scale: interpolate(turnIn, [0, 1], [0.92, 1]),
            }}
          >
            <GlassPanel width={340} height={120} opacity={1} tint="rgba(20,26,28,.7)" />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

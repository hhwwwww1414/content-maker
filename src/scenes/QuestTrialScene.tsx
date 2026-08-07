import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {EnergySphere} from '../components/EnergySphere';
import {GlassPanel} from '../components/GlassPanel';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

const PARTICLES = [
  {dx: -120, dy: -70, size: 15, delay: 6, digit: '1'},
  {dx: 118, dy: -90, size: 13, delay: 14, digit: '0'},
  {dx: -140, dy: 40, size: 12, delay: 22, digit: '0'},
  {dx: 132, dy: 60, size: 16, delay: 10, digit: '1'},
  {dx: -60, dy: 110, size: 12, delay: 28, digit: '1'},
  {dx: 70, dy: 118, size: 13, delay: 18, digit: '0'},
];

export const QuestTrialScene: React.FC<{durationInFrames: number; beats: number[]; beatSpeech: number[]}> = ({
  durationInFrames,
  beats,
  beatSpeech,
}) => {
  const frame = useCurrentFrame();
  const line1Start = beats[1] ?? 20;
  const line1 = interpolate(frame, [line1Start, line1Start + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line2Start = line1Start + Math.round((beatSpeech[1] ?? 46) * 0.5);
  const line2 = interpolate(frame, [line2Start, line2Start + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // The walls breathe very gently -- a slow sine wobble, never a hard reset.
  const wobble = Math.sin(frame / 46) * 10;

  // The sphere's route bends ahead of it in a smooth S-curve.
  const sphereX = interpolate(frame, [0, 30, 60, 90, durationInFrames], [-70, 60, -50, 40, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // A false exit glows into view mid-scene, then dissolves back into the maze.
  const falseExit = interpolate(frame, [18, 42, 66, 84], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const markIn = interpolate(frame, [30, 58], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.6} />

      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            width: 300,
            height: 170,
            borderRadius: 30,
            background: `rgba(34,240,208,${0.06 + falseExit * 0.16})`,
            border: `1px solid rgba(140,255,233,${0.15 + falseExit * 0.35})`,
            boxShadow: `0 0 ${70 * falseExit}px rgba(34,240,208,${falseExit * 0.4})`,
            translate: `0 ${-260 + wobble * 0.4}px`,
          }}
        />
      </AbsoluteFill>

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
        <div style={{position: 'relative', width: 640, height: 320}}>
          <div style={{position: 'absolute', left: 40, top: 20, translate: `${wobble}px 0`}}>
            <GlassPanel width={100} height={260} opacity={0.85} />
          </div>
          <div style={{position: 'absolute', right: 40, top: 40, translate: `${-wobble}px 0`}}>
            <GlassPanel width={100} height={260} opacity={0.85} />
          </div>

          <div style={{position: 'absolute', left: '50%', bottom: 30, translate: `calc(-50% + ${sphereX}px) 0`}}>
            <EnergySphere size={28} />
          </div>

          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              translate: '-50% 0',
              opacity: markIn,
              scale: interpolate(markIn, [0, 1], [0.85, 1]),
            }}
          >
            <div style={{position: 'relative', width: 300, height: 200}}>
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  translate: '-50% -50%',
                  fontFamily: unbounded,
                  fontWeight: 800,
                  fontSize: 100,
                  color: colors.mint,
                  textShadow: '0 0 50px rgba(34,240,208,.5)',
                }}
              >
                ?
              </div>
              {PARTICLES.map((p, i) => {
                const pIn = interpolate(frame, [30 + p.delay, 30 + p.delay + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `calc(50% + ${p.dx}px)`,
                      top: `calc(50% + ${p.dy}px)`,
                      translate: '-50% -50%',
                      fontFamily: 'monospace',
                      fontSize: p.size,
                      color: colors.lightMint,
                      opacity: pIn * 0.7,
                    }}
                  >
                    {p.digit}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{marginTop: 26, textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 46,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.white,
              textTransform: 'uppercase',
              opacity: line1,
              translate: `0 ${interpolate(line1, [0, 1], [16, 0])}px`,
            }}
          >
            Интернет устроил
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 46,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.mint,
              textTransform: 'uppercase',
              opacity: line2,
              translate: `0 ${interpolate(line2, [0, 1], [16, 0])}px`,
            }}
          >
            Тебе испытание
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

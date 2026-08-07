import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';
import {CALM_SPRING} from '../theme/motion';

/** Final engagement screen: the mascot as a calm digital-news anchor (no connect
 * button, no promises) asking the audience what still opens for them. `questionAt` and
 * `commentAt` are sequence-local frames of the two voice beats. */
export const WhitelistCtaScene: React.FC<{questionAt: number; commentAt: number}> = ({questionAt, commentAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const reveal = Math.max(0, Math.min(1, spring({frame: frame - 4, fps, config: CALM_SPRING})));
  const glow = interpolate(Math.sin(frame / 44), [-1, 1], [0.14, 0.24]);
  const q1 = interpolate(frame, [questionAt, questionAt + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const q2 = interpolate(frame, [questionAt + 12, questionAt + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const comment = interpolate(frame, [commentAt, commentAt + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
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

        <div style={{translate: '-48px 0', scale: `${interpolate(reveal, [0, 1], [0.92, 1])}`, opacity: reveal}}>
          <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 280, height: 280, objectFit: 'contain'}} />
        </div>

        <div style={{marginTop: 22, textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 44,
              lineHeight: 1.16,
              color: colors.white,
              textTransform: 'uppercase',
              opacity: q1,
              translate: `0 ${interpolate(q1, [0, 1], [14, 0])}px`,
            }}
          >
            Что открывается
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 44,
              lineHeight: 1.16,
              color: colors.mint,
              textTransform: 'uppercase',
              textShadow: '0 0 30px rgba(34,240,208,.35)',
              opacity: q2,
              translate: `0 ${interpolate(q2, [0, 1], [14, 0])}px`,
            }}
          >
            У тебя?
          </div>
        </div>

        <div
          style={{
            marginTop: 30,
            padding: '22px 40px',
            borderRadius: 26,
            border: '1.5px solid rgba(140,255,233,.45)',
            background: 'rgba(12,26,24,.55)',
            boxShadow: `0 18px 60px rgba(34,240,208,${0.08 + glow / 2})`,
            textAlign: 'center',
            opacity: comment,
            translate: `0 ${interpolate(comment, [0, 1], [16, 0])}px`,
          }}
        >
          <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 34, lineHeight: 1.22, color: colors.lightMint, textTransform: 'uppercase'}}>
            Напиши город
          </div>
          <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 34, lineHeight: 1.22, color: colors.lightMint, textTransform: 'uppercase'}}>
            в комментариях
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

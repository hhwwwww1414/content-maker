import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

const STEPS = ['TELEGRAM', 'ПОДПИСКА', 'VPN-КЛИЕНТ'];
const STEP_START = 24;
const STEP_STAGGER = 16;

export const FakeConnectionArrivalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const reveal = spring({frame, fps, config: {damping: 22, stiffness: 90, mass: 1}});
  const glow = interpolate(Math.sin(frame / 40), [-1, 1], [0.16, 0.28]);
  const badgeEnter = interpolate(frame, [10, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.7} />
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
        <div style={{position: 'absolute', width: 540, height: 540, borderRadius: '50%', background: colors.mint, filter: 'blur(160px)', opacity: glow}} />

        <div style={{translate: '-46px 0', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div
            style={{
              scale: interpolate(reveal, [0, 1], [0.96, 1]),
              opacity: reveal,
              translate: `0 ${interpolate(reveal, [0, 1], [36, 0])}px`,
              filter: `blur(${interpolate(reveal, [0, 1], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
            }}
          >
            <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain'}} />
          </div>

          <div
            style={{
              marginTop: 8,
              padding: '12px 26px',
              borderRadius: 20,
              background: 'rgba(16,22,24,.9)',
              border: '1.5px solid rgba(140,255,233,.3)',
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 26,
              color: colors.white,
              opacity: badgeEnter,
              translate: `0 ${interpolate(badgeEnter, [0, 1], [14, 0])}px`,
            }}
          >
            Telegram-бот
          </div>
        </div>

        <div style={{marginTop: 30, display: 'flex', gap: 10, justifyContent: 'center'}}>
          {STEPS.map((step, index) => {
            const appearFrame = STEP_START + index * STEP_STAGGER;
            const enter = interpolate(frame, [appearFrame, appearFrame + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div
                key={step}
                style={{
                  fontFamily: unbounded,
                  fontWeight: 800,
                  fontSize: 19,
                  color: colors.background,
                  background: colors.mint,
                  border: '1px solid rgba(140,255,233,.7)',
                  borderRadius: 16,
                  padding: '11px 16px',
                  whiteSpace: 'nowrap',
                  opacity: enter,
                  translate: `0 ${interpolate(enter, [0, 1], [12, 0])}px`,
                }}
              >
                {step}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

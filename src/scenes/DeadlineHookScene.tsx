import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {PhoneFrame} from '../components/PhoneFrame';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const DeadlineHookScene: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();

  const hookEnter = interpolate(frame, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hookY = interpolate(hookEnter, [0, 1], [26, 0]);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.025], {extrapolateRight: 'clamp'});

  const secondTick = Math.round(durationInFrames * 0.42);
  const thirdTick = Math.round(durationInFrames * 0.78);
  const timer = frame < secondTick ? 15 : frame < thirdTick ? 14 : 13;
  const tickFrame = frame < secondTick ? 0 : frame < thirdTick ? secondTick : thirdTick;
  const tickPulse = interpolate(frame, [tickFrame, tickFrame + 10], [0.75, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const glow = interpolate(Math.sin(frame / 34), [-1, 1], [0.12, 0.22]);

  return (
    <AbsoluteFill style={{scale: zoom}}>
      <CyberBackground mode="error" intensity={0.5} />
      <AbsoluteFill style={{background: `rgba(142,32,28,${glow})`, mixBlendMode: 'screen'}} />
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
        <div style={{textAlign: 'center', opacity: hookEnter, translate: `0 ${hookY}px`}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 58, lineHeight: 1.1, letterSpacing: -2, color: colors.white, textTransform: 'uppercase'}}>
            До созвона
          </div>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 84, lineHeight: 1.05, letterSpacing: -3, color: colors.errorRed, textTransform: 'uppercase'}}>
            15 секунд
          </div>
        </div>
        <div style={{marginTop: 58}}>
          <PhoneFrame width={420} height={600}>
            <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26}}>
              <div style={{position: 'relative', width: 96, height: 96, display: 'grid', placeItems: 'center'}}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '8px solid rgba(255,255,255,.08)',
                    borderTopColor: colors.errorRed,
                    rotate: `${frame * 7}deg`,
                  }}
                />
                <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 32, color: colors.white, scale: tickPulse}}>{timer}</div>
              </div>
              <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 27, color: colors.white, textAlign: 'center'}}>VPN ПОДКЛЮЧАЕТСЯ</div>
            </div>
          </PhoneFrame>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

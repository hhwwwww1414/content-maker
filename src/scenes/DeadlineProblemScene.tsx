import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {PhoneFrame} from '../components/PhoneFrame';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const DeadlineProblemScene: React.FC = () => {
  const frame = useCurrentFrame();

  const headlineEnter = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
  const pulse = interpolate(frame, [0, 8, 18], [0.3, 1, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const spinnerAngle = interpolate(frame, [0, 10], [0, 80], {extrapolateRight: 'clamp'});
  const errorShown = interpolate(frame, [14, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="error" glitch intensity={0.9} />
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
        <div style={{textAlign: 'center', opacity: headlineEnter}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 50, lineHeight: 1.15, letterSpacing: -2, color: colors.white, textTransform: 'uppercase'}}>
            Знакомая
            <br />
            <span style={{color: colors.errorRed}}>ситуация</span>
          </div>
        </div>
        <div style={{marginTop: 54}}>
          <PhoneFrame width={420} height={600} danger>
            <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24}}>
              <div style={{position: 'relative', width: 96, height: 96, display: 'grid', placeItems: 'center'}}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: `8px solid rgba(255,90,82,${0.18 + pulse * 0.24})`,
                    borderTopColor: colors.errorRed,
                    rotate: `${spinnerAngle}deg`,
                  }}
                />
                <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 32, color: colors.white}}>12</div>
              </div>
              <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 24, color: colors.errorRed, textAlign: 'center'}}>СЕРВЕР НЕ ОТВЕЧАЕТ</div>
              <div
                style={{
                  padding: '9px 20px',
                  borderRadius: 16,
                  background: 'rgba(255,90,82,.14)',
                  border: '1px solid rgba(255,90,82,.4)',
                  fontFamily: unbounded,
                  fontWeight: 700,
                  fontSize: 19,
                  color: colors.errorRed,
                  opacity: errorShown,
                }}
              >
                ОШИБКА
              </div>
            </div>
          </PhoneFrame>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {BrandMascot} from '../components/BrandMascot';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const DeadlineResultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  const lineY = interpolate(enter, [0, 1], [24, 0]);
  const line2Enter = interpolate(frame, [14, 32], [0, 1], {extrapolateRight: 'clamp'});
  const line2Y = interpolate(line2Enter, [0, 1], [24, 0]);

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.4} />
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
        <div style={{opacity: enter}}>
          <BrandMascot size={280} calm />
        </div>
        <div style={{marginTop: 40, textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 48,
              letterSpacing: -2,
              color: colors.white,
              textTransform: 'uppercase',
              opacity: enter,
              translate: `0 ${lineY}px`,
            }}
          >
            Без лишних шагов
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 36,
              color: colors.lightMint,
              textTransform: 'uppercase',
              marginTop: 18,
              opacity: line2Enter,
              translate: `0 ${line2Y}px`,
            }}
          >
            Без поиска нового VPN
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

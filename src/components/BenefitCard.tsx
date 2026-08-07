import type {ReactNode} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope} from '../theme/fonts';

export const BenefitCard: React.FC<{icon: ReactNode; text: string; appearFrame: number}> = ({icon, text, appearFrame}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [appearFrame, appearFrame + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '24px 30px',
        borderRadius: 28,
        background: 'rgba(10,18,19,.82)',
        border: `1.5px solid rgba(140,255,233,.28)`,
        boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [18, 0])}px`,
        scale: interpolate(enter, [0, 1], [0.97, 1]),
      }}
    >
      <div style={{width: 56, height: 56, flex: '0 0 auto', display: 'grid', placeItems: 'center'}}>{icon}</div>
      <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 32, color: colors.white}}>{text}</span>
    </div>
  );
};

import type {ReactNode} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';

export const AppStatusCard: React.FC<{
  icon: ReactNode;
  label: string;
  status: string;
  loading?: boolean;
  error?: boolean;
  appearFrame: number;
}> = ({icon, label, status, loading = false, error = false, appearFrame}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [appearFrame, appearFrame + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        position: 'relative',
        width: 196,
        padding: '20px 18px',
        borderRadius: 24,
        background: 'rgba(16,22,24,.9)',
        border: '1.5px solid rgba(140,255,233,.22)',
        boxShadow: '0 20px 50px rgba(0,0,0,.35)',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [16, 0])}px`,
        scale: interpolate(enter, [0, 1], [0.96, 1]),
        boxSizing: 'border-box',
      }}
    >
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: colors.errorRed,
            boxShadow: '0 0 10px rgba(255,90,82,.8)',
          }}
        />
      )}
      <div style={{width: 40, height: 40, display: 'grid', placeItems: 'center'}}>{icon}</div>
      <div style={{marginTop: 10, fontFamily: unbounded, fontWeight: 700, fontSize: 19, color: colors.white}}>{label}</div>
      <div style={{marginTop: 8, display: 'flex', alignItems: 'center', gap: 8}}>
        {loading ? (
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '3px solid rgba(255,255,255,.15)',
              borderTopColor: colors.mint,
              rotate: `${frame * 10}deg`,
            }}
          />
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M2 7l3.5 3.5L12 3.5" fill="none" stroke={colors.mint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 15, color: loading ? colors.gray : colors.mint}}>{status}</div>
      </div>
    </div>
  );
};

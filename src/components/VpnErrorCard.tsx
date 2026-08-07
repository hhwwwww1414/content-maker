import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';

export type VpnErrorCardProps = {
  label: string;
  error: string;
  startFrame: number;
  fallFrame: number;
  rotation: number;
  x: number;
  y?: number;
};

export const VpnErrorCard: React.FC<VpnErrorCardProps> = ({label, error, startFrame, fallFrame, rotation, x, y = 0}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;

  const enter = interpolate(frame, [startFrame, startFrame + 19], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shakeWindow = frame > startFrame + 16 && frame < startFrame + 24;
  const shake = shakeWindow ? Math.sin((frame - startFrame) * 1.8) * 1.5 * (1 - (frame - startFrame - 16) / 8) : 0;
  // A single soft pulse (not a double blink) settling into a steady tinted border.
  const flashing = interpolate(frame, [startFrame + 19, startFrame + 26, startFrame + 40], [0, 1, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const errorShown = interpolate(frame, [startFrame + 24, startFrame + 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fall = interpolate(frame, [fallFrame, fallFrame + 35], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = interpolate(frame, [fallFrame + 20, fallFrame + 35], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * enter;

  const translateY = y + interpolate(enter, [0, 1], [30, 0]) + fall * 260;
  const translateX = x + shake;
  const rotate = fall * rotation * 0.7;
  const borderColor = `rgba(255,90,82,${0.22 + flashing * 0.58})`;

  return (
    <div
      style={{
        position: 'absolute',
        width: 288,
        padding: '22px 24px',
        boxSizing: 'border-box',
        borderRadius: 30,
        background: 'rgba(16,10,10,.92)',
        border: `2px solid ${borderColor}`,
        boxShadow: '0 20px 60px rgba(0,0,0,.45)',
        opacity,
        translate: `${translateX}px ${translateY}px`,
        rotate: `${rotate}deg`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            border: '5px solid rgba(255,255,255,.1)',
            borderTopColor: colors.errorRed,
            rotate: `${frame * 10}deg`,
            flex: '0 0 auto',
          }}
        />
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 26, color: colors.white}}>{label}</div>
      </div>
      <div style={{marginTop: 16, height: 6, borderRadius: 4, background: 'rgba(255,255,255,.08)', overflow: 'hidden'}}>
        <div style={{width: '62%', height: '100%', background: colors.errorRed, opacity: .8}} />
      </div>
      <div
        style={{
          marginTop: 16,
          padding: '10px 14px',
          borderRadius: 14,
          background: 'rgba(255,90,82,.14)',
          border: '1px solid rgba(255,90,82,.4)',
          fontFamily: manrope,
          fontWeight: 700,
          fontSize: 19,
          color: colors.errorRed,
          opacity: errorShown,
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    </div>
  );
};

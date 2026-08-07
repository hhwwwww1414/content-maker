import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';

export type MazeDoorVariant = 'closing' | 'deadend' | 'error';

/** A large crystal-glass maze door. `triggerFrame` is when it plays its own outcome
 * (closes / opens onto a dead end / flags an error) after the initial entrance. */
export const MazeDoor: React.FC<{label: string; variant: MazeDoorVariant; appearFrame: number; triggerFrame: number}> = ({
  label,
  variant,
  appearFrame,
  triggerFrame,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [appearFrame, appearFrame + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const triggered = interpolate(frame, [triggerFrame, triggerFrame + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const borderColor =
    variant === 'error'
      ? `rgba(255,90,82,${0.25 + triggered * 0.5})`
      : variant === 'closing'
        ? `rgba(155,168,165,${0.3 + triggered * 0.3})`
        : 'rgba(140,255,233,.28)';

  return (
    <div
      style={{
        position: 'relative',
        width: 192,
        height: 250,
        borderRadius: 26,
        background: variant === 'closing' ? `rgba(20,26,28,${0.68 + triggered * 0.24})` : 'rgba(16,22,24,.72)',
        border: `2px solid ${borderColor}`,
        boxShadow: '0 25px 70px rgba(0,0,0,.4)',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [20, 0])}px`,
        scale: interpolate(enter, [0, 1], [0.95, 1]),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {variant === 'closing' && <div style={{position: 'absolute', inset: 0, background: 'rgba(6,10,11,.85)', opacity: triggered}} />}
      <div
        style={{
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 21,
          color: colors.white,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          zIndex: 1,
          opacity: variant === 'closing' ? 1 - triggered * 0.55 : 1,
          textAlign: 'center',
        }}
      >
        {label}
      </div>
      {variant === 'deadend' && (
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 16, color: colors.gray, opacity: triggered, zIndex: 1}}>ТУПИК</div>
      )}
      {variant === 'error' && (
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 12,
            background: 'rgba(255,90,82,.15)',
            border: '1px solid rgba(255,90,82,.45)',
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 15,
            color: colors.errorRed,
            opacity: triggered,
            zIndex: 1,
          }}
        >
          ОШИБКА
        </div>
      )}
    </div>
  );
};

import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope} from '../theme/fonts';

/** Small newsroom chip ("ПЕТЕРБУРГ · 10 ИЮЛЯ"): calm fade-and-rise entrance driven by
 * its sequence-local frame, with a softly breathing live-dot. */
export const NewsLabel: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dotPulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(frame / 16));

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 28px',
        borderRadius: 40,
        background: 'rgba(8,12,13,.62)',
        border: '1px solid rgba(140,255,233,.32)',
        boxShadow: '0 8px 30px rgba(2,3,4,.4)',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [12, 0])}px`,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: colors.mint,
          opacity: dotPulse,
          boxShadow: `0 0 ${10 * dotPulse}px rgba(34,240,208,.8)`,
        }}
      />
      <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: colors.lightMint}}>{text}</div>
    </div>
  );
};

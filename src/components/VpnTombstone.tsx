import {interpolate, useCurrentFrame} from 'remotion';
import {manrope} from '../theme/fonts';

export type VpnTombstoneProps = {
  x: number;
  scale: number;
  depth: number;
  errorText: string;
  appearFrame: number;
};

export const VpnTombstone: React.FC<VpnTombstoneProps> = ({x, scale, depth, errorText, appearFrame}) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [appearFrame, appearFrame + 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const glow = interpolate(Math.sin(frame / 40 + x), [-1, 1], [0.42, 0.6]);
  const fog = 1 - depth * 0.4;
  // Object first, then its details: the binary reflection and error label settle in
  // shortly after the slab itself has risen.
  const detailsEnter = interpolate(frame, [appearFrame + 14, appearFrame + 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 0,
        translate: `${x - 84}px ${interpolate(rise, [0, 1], [90, 0])}px`,
        scale,
        opacity: rise * fog,
      }}
    >
      <div
        style={{
          width: 168,
          height: 220,
          borderRadius: '58px 58px 16px 16px',
          background: 'linear-gradient(180deg, rgba(58,18,17,.85) 0%, rgba(14,6,6,.92) 100%)',
          border: '2px solid rgba(255,140,130,.4)',
          boxShadow: `0 0 ${50 + glow * 70}px rgba(255,90,82,${glow})`,
          position: 'relative',
          overflow: 'hidden',
          filter: depth > 0.55 ? `blur(${depth * 1.6}px)` : 'none',
        }}
      >
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(255,90,82,.32), transparent 62%)'}} />
        <div style={{position: 'absolute', top: 22, left: 0, right: 0, textAlign: 'center', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: 'rgba(255,170,165,.5)', whiteSpace: 'pre', opacity: detailsEnter}}>
          {'01001\n10110'}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 26,
            left: 12,
            right: 12,
            textAlign: 'center',
            fontFamily: manrope,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: 0.5,
            color: 'rgba(255,180,175,.75)',
            opacity: detailsEnter,
          }}
        >
          {errorText}
        </div>
      </div>
    </div>
  );
};

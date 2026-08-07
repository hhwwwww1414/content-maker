import {interpolate} from 'remotion';
import {CLAMP, REVEAL, tsColors} from './trafficSignatureConfig';

/**
 * The remaining trace resolves into a single thin mint line that underlines the
 * brand — the signature reduced to one clean stroke.
 */
export const FinalSignatureLine: React.FC<{
  cx: number;
  cy: number;
  width: number;
  progress: number;
  opacity?: number;
}> = ({cx, cy, width, progress, opacity = 1}) => {
  const w = interpolate(progress, [0, 1], [0, width], REVEAL);
  const glow = interpolate(progress, [0.4, 1], [0.2, 0.6], CLAMP);
  return (
    <div style={{position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-50%)', opacity}}>
      <div
        style={{
          width: w,
          height: 2.5,
          borderRadius: 2,
          background: `linear-gradient(90deg, rgba(34,240,208,0), ${tsColors.mint} 20%, ${tsColors.lightMint} 50%, ${tsColors.mint} 80%, rgba(34,240,208,0))`,
          boxShadow: `0 0 ${10 + glow * 16}px rgba(34,240,208,${glow})`,
          transform: 'translateX(-50%)',
        }}
      />
      {/* travelling highlight dot */}
      <div
        style={{
          position: 'absolute',
          left: interpolate(progress, [0.3, 1], [-width / 2, width / 2], REVEAL),
          top: 1.25,
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: tsColors.lightMint,
          transform: 'translate(-50%,-50%)',
          opacity: interpolate(progress, [0.3, 0.5, 0.95, 1], [0, 1, 1, 0], CLAMP),
          boxShadow: '0 0 14px rgba(140,255,233,.8)',
        }}
      />
    </div>
  );
};

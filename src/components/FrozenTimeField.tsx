import {Easing, interpolate} from 'remotion';
import {colors} from '../theme/colors';

const EASE = {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const points = Array.from({length: 28}, (_, index) => ({
  x: 40 + ((index * 83) % 650),
  y: 30 + ((index * 137) % 720),
  size: 2 + (index % 4),
  delay: (index % 9) / 12,
}));

export const FrozenTimeField: React.FC<{progress: number}> = ({progress}) => (
  <div style={{position: 'absolute', left: 80, top: 410, width: 730, height: 760, pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: 70,
        top: 100,
        width: 480,
        height: 480,
        borderRadius: '50%',
        opacity: interpolate(progress, [0, 0.35, 1], [0, 0.22, 0.46], EASE),
        background: 'radial-gradient(circle, rgba(34,240,208,.2), rgba(34,240,208,.03) 48%, transparent 72%)',
        filter: 'blur(22px)',
      }}
    />
    {points.map((point, index) => {
      const visible = interpolate(progress, [point.delay, Math.min(1, point.delay + 0.28)], [0, 1], EASE);
      return <div key={index} style={{position: 'absolute', left: point.x, top: point.y, width: point.size, height: point.size, borderRadius: '50%', background: colors.lightMint, opacity: visible * 0.55, boxShadow: '0 0 12px rgba(34,240,208,.72)'}} />;
    })}
  </div>
);


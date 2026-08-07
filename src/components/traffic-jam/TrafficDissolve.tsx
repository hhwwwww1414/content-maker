import {interpolate} from 'remotion';
import {roadX, roadY} from './geometry';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * The calm red -> graphite -> mint transition that dissolves the jam. A mint
 * sheen sweeps down the road while the pooled red congestion residue shrinks and
 * fades — no green flash, no burst of light, just the congestion draining away.
 */
export const TrafficDissolve: React.FC<{frame: number; progress: number}> = ({progress}) => {
  if (progress <= 0.001) return null;

  // Mint sweep travels from mid-road toward the near edge.
  const sweepP = interpolate(progress, [0, 1], [0.45, 1.05], CLAMP);
  const sweepY = roadY(Math.min(1, sweepP));
  const sweepOpacity = interpolate(progress, [0, 0.15, 0.85, 1], [0, 0.5, 0.5, 0], CLAMP);

  // Residual red congestion pools, low on the glass, shrinking away.
  const redFade = interpolate(progress, [0, 0.7], [1, 0], CLAMP);
  const pools = [
    {p: 0.78, off: -300},
    {p: 0.86, off: 0},
    {p: 0.82, off: 300},
    {p: 0.92, off: -140},
  ];

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {pools.map((pool, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: roadX(pool.off, pool.p) - 110 * redFade,
            top: roadY(pool.p) - 26,
            width: 220 * redFade,
            height: 66,
            borderRadius: '50%',
            background: '#FF5A52',
            opacity: 0.16 * redFade,
            filter: 'blur(26px)',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: sweepY - 90,
          width: 1080,
          height: 180,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(34,240,208,0.28), rgba(34,240,208,0))',
          opacity: sweepOpacity,
          filter: 'blur(16px)',
        }}
      />
    </div>
  );
};

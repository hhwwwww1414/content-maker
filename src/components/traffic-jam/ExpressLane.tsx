import {colors} from '../../theme/colors';

/**
 * The elevated express lane that opens above the jam: a thinner, cleaner, mintier
 * suspended ribbon with no red lights. It unfurls into depth (reveal), carries a
 * calm mint flow, and in the finale collapses toward a single stable line.
 */
const N = 26;

const centerX = (t: number) => 486 + 64 * t;
const centerY = (t: number) => 522 + 668 * t;
const halfW = (t: number, collapse: number) => (5 + 70 * t) * (1 - 0.86 * collapse);

export const ExpressLane: React.FC<{
  frame: number;
  reveal: number; // 0..1 unfurls the lane into depth
  flow: number; // 0..1 mint flow travelling along the lane
  collapse: number; // 0..1 narrows toward a single line
  opacity: number;
}> = ({frame, reveal, flow, collapse, opacity}) => {
  if (opacity <= 0.001) return null;

  const tStart = 1 - reveal;
  const steps: number[] = [];
  for (let i = 0; i <= N; i++) steps.push(tStart + ((1 - tStart) * i) / N);

  const left = steps.map((t) => `${(centerX(t) - halfW(t, collapse)).toFixed(1)},${centerY(t).toFixed(1)}`);
  const right = steps
    .slice()
    .reverse()
    .map((t) => `${(centerX(t) + halfW(t, collapse)).toFixed(1)},${centerY(t).toFixed(1)}`);
  const poly = [...left, ...right].join(' ');
  const centerLine = steps.map((t, i) => `${i === 0 ? 'M' : 'L'}${centerX(t).toFixed(1)},${centerY(t).toFixed(1)}`).join(' ');

  // Calm mint flow markers travelling up the ribbon into depth.
  const markers: {x: number; y: number; s: number; o: number}[] = [];
  if (flow > 0.001) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const raw = ((frame * 0.0075 + i / n) % 1 + 1) % 1;
      const t = 1 - raw; // near -> far
      if (t < tStart) continue;
      markers.push({x: centerX(t), y: centerY(t), s: 0.2 + 0.8 * t, o: flow * (0.3 + 0.7 * t)});
    }
  }

  return (
    <div style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="tj-exp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22F0D0" stopOpacity="0.05" />
            <stop offset="60%" stopColor="#22F0D0" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#8CFFE9" stopOpacity="0.26" />
          </linearGradient>
        </defs>
        <polygon points={poly} fill="url(#tj-exp)" />
        <path d={centerLine} fill="none" stroke={colors.lightMint} strokeWidth={2} strokeOpacity={0.5} />
        <path
          d={centerLine}
          fill="none"
          stroke={colors.mint}
          strokeWidth={6}
          strokeOpacity={0.22}
          style={{filter: 'blur(4px)'}}
        />
      </svg>
      {markers.map((m, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: m.x - 9 * m.s,
            top: m.y - 5 * m.s,
            width: 18 * m.s,
            height: 10 * m.s,
            borderRadius: 8,
            background: colors.lightMint,
            opacity: m.o,
            boxShadow: `0 0 ${16 * m.s}px rgba(34,240,208,0.8)`,
          }}
        />
      ))}
    </div>
  );
};

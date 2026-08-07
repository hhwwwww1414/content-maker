import {colors} from '../../theme/colors';
import {LANE_HALF, NEAR_Y, persp, roadX, roadY, ROAD_HALF, VP} from './geometry';

const FAR = 0.035;

/** Straight radiating line from the vanishing point to a near-edge offset. */
const line = (offsetNear: number) => ({
  x1: roadX(offsetNear, FAR),
  y1: roadY(FAR),
  x2: roadX(offsetNear, 1),
  y2: NEAR_Y,
});

/**
 * The suspended multi-level cyber highway: a dark crystal-glass surface in
 * vanishing-point perspective, graphite lane planes, mint lane contours, thin
 * moving light separators and drifting digital fog. Red lane light bleeds in
 * scenes 1-2 and crossfades to mint as the road clears.
 */
export const DataHighway: React.FC<{
  frame: number;
  lightsMint: number; // 0 = red jam lighting, 1 = mint free-flow lighting
  clearing: number; // 0 = congested/dark, 1 = surface lightens
}> = ({frame, lightsMint, clearing}) => {
  const edgeL = line(-ROAD_HALF);
  const edgeR = line(ROAD_HALF);
  const dividers = [-450, -LANE_HALF, LANE_HALF, 450];

  const surfaceMint = 0.16 + 0.12 * clearing;
  const redBleed = 0.32 * (1 - lightsMint);
  const contourColor = `rgba(34,240,208,${(0.5 + 0.35 * lightsMint).toFixed(3)})`;

  // Thin light separators scrolling down the two inner dividers.
  const dashes: {x: number; y: number; s: number; key: string}[] = [];
  for (const off of [-LANE_HALF, LANE_HALF]) {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const p = ((frame * 0.0016 + i / n) % 1 + 1) % 1;
      const pr = persp(0.12 + p * 0.88);
      dashes.push({x: roadX(off, 0.12 + p * 0.88), y: pr.y, s: pr.scale, key: `${off}-${i}`});
    }
  }

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* Road surface trapezoid */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="tj-road" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1214" stopOpacity="0.2" />
            <stop offset="38%" stopColor="#121b1d" stopOpacity={0.86} />
            <stop offset="100%" stopColor="#161f21" stopOpacity={0.96} />
          </linearGradient>
          <radialGradient id="tj-clear" cx="50%" cy="86%" r="60%">
            <stop offset="0%" stopColor="#1c2a2b" stopOpacity={0.5 * clearing} />
            <stop offset="100%" stopColor="#1c2a2b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <polygon
          points={`${edgeL.x1},${edgeL.y1} ${edgeR.x1},${edgeR.y1} ${edgeR.x2},${edgeR.y2} ${edgeL.x2},${edgeL.y2}`}
          fill="url(#tj-road)"
        />
        <polygon
          points={`${edgeL.x1},${edgeL.y1} ${edgeR.x1},${edgeR.y1} ${edgeR.x2},${edgeR.y2} ${edgeL.x2},${edgeL.y2}`}
          fill="url(#tj-clear)"
        />
        {/* graphite lane plane sheen */}
        <polygon
          points={`${edgeL.x1},${edgeL.y1} ${edgeR.x1},${edgeR.y1} ${edgeR.x2},${edgeR.y2} ${edgeL.x2},${edgeL.y2}`}
          fill={`rgba(34,240,208,${surfaceMint * 0.12})`}
        />
        {/* red congestion bleed pooling low on the glass */}
        {redBleed > 0.01 && (
          <polygon
            points={`${roadX(-ROAD_HALF, 0.5)},${roadY(0.5)} ${roadX(ROAD_HALF, 0.5)},${roadY(0.5)} ${edgeR.x2},${edgeR.y2} ${edgeL.x2},${edgeL.y2}`}
            fill={`rgba(255,86,82,${redBleed * 0.4})`}
          />
        )}

        {/* outer road edges */}
        {[edgeL, edgeR].map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={contourColor} strokeWidth={3} />
        ))}
        {/* lane dividers */}
        {dividers.map((off, i) => {
          const l = line(off);
          const inner = Math.abs(off) === LANE_HALF;
          return (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={contourColor}
              strokeWidth={inner ? 2 : 1.4}
              strokeOpacity={inner ? 0.9 : 0.5}
            />
          );
        })}
      </svg>

      {/* Moving light separators on the inner lane dividers */}
      {dashes.map((d) => (
        <div
          key={d.key}
          style={{
            position: 'absolute',
            left: d.x - 3.2 * d.s,
            top: d.y - 12 * d.s,
            width: 6.4 * d.s,
            height: 24 * d.s,
            borderRadius: 8,
            background: colors.mint,
            opacity: 0.16 + 0.5 * d.s * (0.5 + 0.5 * lightsMint),
            boxShadow: `0 0 ${10 * d.s}px rgba(34,240,208,0.5)`,
          }}
        />
      ))}

      {/* Drifting digital fog bands */}
      {[0.16, 0.34, 0.58].map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: roadY(p) - 60,
            width: 1080,
            height: 150,
            background: `radial-gradient(ellipse at 50% 50%, rgba(120,200,190,${0.05 - i * 0.008}), rgba(0,0,0,0))`,
            filter: 'blur(14px)',
            transform: `translateX(${Math.sin(frame * 0.01 + i) * 22}px)`,
          }}
        />
      ))}

      {/* far fog at the vanishing point */}
      <div
        style={{
          position: 'absolute',
          left: VP.x - 220,
          top: VP.y - 70,
          width: 440,
          height: 200,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(90,150,145,0.14), rgba(0,0,0,0))',
          filter: 'blur(26px)',
        }}
      />
    </div>
  );
};

import {interpolate} from 'remotion';
import {CLAMP, REVEAL, SIGNATURE, tsColors} from './trafficSignatureConfig';

const NODES = 15;
const BOX_W = 620;
const BOX_H = 460;

/** Deterministic sculpture node layout derived from the signature rhythm. */
const layout = (() => {
  const pts: {x: number; y: number; z: number; r: number}[] = [];
  for (let i = 0; i < NODES; i++) {
    const t = (i / NODES) * Math.PI * 2;
    const pulse = SIGNATURE[i % SIGNATURE.length];
    const lenNorm = (pulse.len - 15) / (58 - 15); // 0..1
    const rx = BOX_W * 0.42;
    const ry = BOX_H * 0.4;
    // a flowing figure-eight topology, modulated by the pulse length
    const x = Math.cos(t) * rx * (0.62 + 0.38 * lenNorm);
    const y = Math.sin(t * 2 + 0.6) * ry * (0.5 + 0.5 * lenNorm) * 0.62;
    const z = Math.cos(t * 1 + 0.3); // -1..1 depth
    pts.push({x, y, z, r: 4 + lenNorm * 5});
  }
  return pts;
})();

/**
 * SIGNATURE CONSTELLATION — the three flat traces lift into an objective 3D
 * structure: a single recognisable form (a flowing waveform sculpture), not a
 * fingerprint, DNA helix or tunnel. Assembles as `progress` rises from the lane.
 */
export const SignatureConstellation: React.FC<{
  cx: number;
  cy: number;
  progress: number;
  opacity?: number;
  frame?: number;
  scale?: number;
  /** small perspective drift, degrees */
  driftDeg?: number;
}> = ({cx, cy, progress, opacity = 1, frame = 0, scale = 1, driftDeg = 0}) => {
  const assemble = interpolate(progress, [0, 1], [0, 1], REVEAL);
  const drift = Math.sin(frame * 0.02) * driftDeg;

  const projected = layout.map((p, i) => {
    const depthScale = 0.78 + (p.z + 1) / 2 * 0.44;
    const wobble = Math.sin(frame * 0.03 + i * 0.7) * 3;
    return {
      x: p.x * assemble * depthScale,
      y: (p.y * assemble - (1 - assemble) * -10) * depthScale + wobble * assemble,
      depthScale,
      z: p.z,
      r: p.r,
    };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        width: 0,
        height: 0,
        opacity,
        transform: `rotate(${drift}deg)`,
      }}
    >
      <svg
        width={BOX_W * 1.4 * scale}
        height={BOX_H * 1.4 * scale}
        viewBox={`${-BOX_W * 0.7} ${-BOX_H * 0.7} ${BOX_W * 1.4} ${BOX_H * 1.4}`}
        style={{position: 'absolute', left: -BOX_W * 0.7 * scale, top: -BOX_H * 0.7 * scale, overflow: 'visible'}}
      >
        {/* connections */}
        {projected.map((p, i) => {
          const n = projected[(i + 1) % projected.length];
          const near = (p.z + n.z) / 2;
          return (
            <line
              key={`l${i}`}
              x1={p.x}
              y1={p.y}
              x2={n.x}
              y2={n.y}
              stroke={tsColors.cyan}
              strokeWidth={0.9 + (near + 1) / 2 * 1.3}
              strokeOpacity={interpolate(assemble, [0.25, 0.75], [0, 0.32 + (near + 1) / 2 * 0.3], CLAMP)}
            />
          );
        })}
        {/* nodes */}
        {projected.map((p, i) => (
          <circle
            key={`n${i}`}
            cx={p.x}
            cy={p.y}
            r={p.r * p.depthScale}
            fill={i % 3 === 0 ? tsColors.mint : tsColors.lightMint}
            opacity={interpolate(assemble, [0, 0.5], [0, 0.55 + (p.z + 1) / 2 * 0.4], CLAMP)}
            style={{filter: `drop-shadow(0 0 ${6 + (p.z + 1) / 2 * 8}px rgba(34,240,208,.5))`}}
          />
        ))}
      </svg>
    </div>
  );
};

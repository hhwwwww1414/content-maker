import {interpolate} from 'remotion';
import {DataCapsule} from './DataCapsule';
import {persp, roadX, roadY} from './geometry';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Express-lane centreline, matched to ExpressLane.tsx.
const centerX = (t: number) => 486 + 64 * t;
const centerY = (t: number) => 522 + 668 * t;

/** Packets that lift off the jam, merge onto the express lane and accelerate away. */
const MERGERS = [
  {lane: -300, p0: 0.86, delay: 0.0, w: 150},
  {lane: 300, p0: 0.9, delay: 0.08, w: 148},
  {lane: 0, p0: 0.8, delay: 0.16, w: 172},
  {lane: -300, p0: 0.72, delay: 0.26, w: 140},
  {lane: 0, p0: 0.66, delay: 0.36, w: 160},
];

const at = (m: (typeof MERGERS)[number], u: number) => {
  const hx = roadX(m.lane, m.p0);
  const hy = roadY(m.p0);
  const hscale = persp(m.p0).scale;
  const ex = centerX(1);
  const ey = centerY(1);
  if (u < 0.62) {
    const k = u / 0.62;
    return {
      x: interpolate(u, [0, 0.62], [hx, ex], CLAMP),
      y: interpolate(u, [0, 0.62], [hy, ey], CLAMP) - Math.sin(k * Math.PI) * 70,
      scale: interpolate(u, [0, 0.62], [hscale, 1], CLAMP),
      brake: interpolate(u, [0, 0.3, 0.62], [0.9, 0.6, 0], CLAMP),
      mint: interpolate(u, [0.3, 0.62], [0, 1], CLAMP),
    };
  }
  const t = interpolate(u, [0.62, 1], [1, 0.12], CLAMP);
  return {x: centerX(t), y: centerY(t), scale: 0.2 + 0.8 * t, brake: 0, mint: 1};
};

/**
 * Scene 4 hero: each stalled packet softly re-routes off the jam, rises to the
 * express lane and speeds into depth, its stop-light turning mint. Nothing
 * teleports — every capsule follows one continuous eased path.
 */
export const FlowMerge: React.FC<{frame: number; progress: number; opacity: number}> = ({progress, opacity}) => {
  if (opacity <= 0.001) return null;
  return (
    <div style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
      {MERGERS.map((m, i) => {
        const u = interpolate(progress, [m.delay, 1], [0, 1], CLAMP);
        if (u <= 0) return null;
        const s = at(m, u);
        const fade = interpolate(u, [0, 0.06, 0.92, 1], [0, 1, 1, 0], CLAMP);
        return (
          <div key={i} style={{opacity: fade}}>
            <DataCapsule x={s.x} y={s.y} scale={s.scale} widthNear={m.w} brake={s.brake} mint={s.mint} />
          </div>
        );
      })}
    </div>
  );
};

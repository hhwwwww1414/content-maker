/**
 * Shared vanishing-point geometry for the "цифровая пробка" cyber highway.
 *
 * One straight road receding to a single vanishing point. Because both the
 * horizontal spread and the screen depth are driven by the same nonlinear term
 * `yt`, every lane divider is a straight line from the vanishing point to its
 * near edge, and capsules, labels and glows all share one perspective scale.
 */

export const VP = {x: 480, y: 452} as const;
export const NEAR_Y = 1520;

/** Near-edge (bottom) x-offset of each labelled lane centre, relative to VP.x. */
export const LANE_OFFSETS = [-300, 0, 300] as const;
/** Near-edge half width of the whole road surface. */
export const ROAD_HALF = 486;
/** Spacing between lane dividers at the near edge. */
export const LANE_HALF = 150;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export type Persp = {yt: number; y: number; scale: number};

/** Map a depth `p` (0 = far / at the vanishing point, 1 = near / bottom). */
export const persp = (p: number): Persp => {
  const yt = Math.pow(clamp01(p), 1.7);
  return {
    yt,
    y: VP.y + (NEAR_Y - VP.y) * yt,
    scale: 0.1 + 1.16 * yt,
  };
};

/** Screen x of a point whose near-edge x-offset from VP.x is `offsetNear`. */
export const roadX = (offsetNear: number, p: number) => VP.x + offsetNear * persp(p).yt;

/** Screen y for a given depth. */
export const roadY = (p: number) => persp(p).y;

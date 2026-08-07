import {interpolate} from 'remotion';
import {unbounded} from '../../theme/fonts';
import {colors} from '../../theme/colors';
import {DataCapsule} from './DataCapsule';
import {persp, roadX, roadY} from './geometry';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Jam queue: capsules bunched tightly, denser toward the near edge. */
const QUEUE = [0.3, 0.4, 0.49, 0.57, 0.64, 0.71, 0.78, 0.85, 0.92];
/** Per-slot width factor so each lane's packets read as a different data-form. */
const SPAN = 0.72;
const LO = 0.26;

/**
 * A single labelled lane of the highway. Owns its queue of data-capsules and
 * their traffic state: stalled with red stop-lights in the jam, then rolling
 * with calm mint running-lights once the flow is released. No teleporting —
 * capsules scroll continuously and fade softly at the lane's near/far edges.
 */
export const TrafficLane: React.FC<{
  frame: number;
  laneIndex: number;
  laneOffset: number;
  widthNear: number;
  brake: number;
  mint: number;
  roll: number; // 0 = stopped, 1 = flowing
  opacity: number;
  label?: string;
  labelOpacity?: number;
  labelP?: number;
}> = ({frame, laneIndex, laneOffset, widthNear, brake, mint, roll, opacity, label, labelOpacity = 0, labelP = 0.6}) => {
  if (opacity <= 0.001) return null;

  const capsules = QUEUE.map((base, i) => {
    const seed = i * 1.7 + laneIndex * 2.3;
    // occasional tiny forward lurch while stalled
    const creep = 0.008 * Math.pow(Math.max(0, Math.sin(frame * 0.05 + seed)), 10);
    const scroll = roll * (frame * 0.0042 + laneIndex * 0.03);
    let p = base + creep + scroll;
    p = LO + (((p - LO) % SPAN) + SPAN) % SPAN;
    const pr = persp(p);
    const edgeFade =
      interpolate(p, [LO, LO + 0.05], [0, 1], CLAMP) * interpolate(p, [LO + SPAN - 0.06, LO + SPAN], [1, 0], CLAMP);
    const wf = 0.82 + 0.34 * ((i * 37) % 7) / 7; // deterministic per-slot form variety
    return {
      key: i,
      x: roadX(laneOffset, p),
      y: pr.y,
      scale: pr.scale,
      width: widthNear * wf,
      fade: edgeFade,
      p,
    };
  });

  // Painted lane label, projected onto the glass surface. Each lane uses its own
  // depth so the three labels never share a horizontal band (no collision).
  const lp = persp(labelP);
  const labelScale = Math.min(1.05, Math.max(0.72, lp.scale));

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      {capsules
        .sort((a, b) => a.p - b.p)
        .map((c) => (
          <div key={c.key} style={{opacity: c.fade}}>
            <DataCapsule x={c.x} y={c.y} scale={c.scale} widthNear={c.width} brake={brake} mint={mint} />
          </div>
        ))}
      {label && labelOpacity > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: roadX(laneOffset, labelP),
            top: lp.y,
            transform: `translate(-50%,-50%) scale(${labelScale.toFixed(3)}) perspective(640px) rotateX(52deg)`,
            transformOrigin: 'center',
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 46,
            letterSpacing: 1,
            whiteSpace: 'nowrap',
            color: `rgba(198,255,244,${(0.92 * labelOpacity).toFixed(3)})`,
            opacity: labelOpacity,
            textShadow: '0 2px 18px rgba(0,0,0,0.7), 0 0 24px rgba(34,240,208,0.55)',
            pointerEvents: 'none',
          }}
        >
          {label}
        </div>
      )}
      {/* faint pooled reflection colour on the lane surface */}
      <div
        style={{
          position: 'absolute',
          left: roadX(laneOffset, 0.9) - 90,
          top: roadY(0.9) - 20,
          width: 180,
          height: 60,
          borderRadius: '50%',
          background: mint > brake ? colors.mint : colors.errorRed,
          opacity: 0.06 * Math.max(brake, mint),
          filter: 'blur(24px)',
        }}
      />
    </div>
  );
};

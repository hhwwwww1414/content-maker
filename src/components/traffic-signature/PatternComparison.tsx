import {interpolate} from 'remotion';
import {CLAMP, SIGNATURE_OFFSETS, SIGNATURE_WIDTH, tsColors} from './trafficSignatureConfig';

/**
 * Stacks up to three independent traces and reveals that they share one rhythm:
 * once `match` rises, thin vertical guides drop through every aligned pulse,
 * proving the pattern repeated. This is the first real payoff of the hook.
 */
export const PatternComparison: React.FC<{
  cx: number;
  cy: number;
  /** per-row draw progress, top to bottom */
  reveals: number[];
  /** 0..1 — vertical alignment guides + convergence glow */
  match?: number;
  rowGap?: number;
  opacity?: number;
  scale?: number;
}> = ({cx, cy, reveals, match = 0, rowGap = 74, opacity = 1, scale = 1}) => {
  const rows = reveals.length;
  const totalH = (rows - 1) * rowGap;
  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        width: SIGNATURE_WIDTH,
        transform: `translate(-50%,-50%) scale(${scale})`,
        opacity,
      }}
    >
      {/* alignment guides */}
      {SIGNATURE_OFFSETS.map(({x, len}, i) => (
        <div
          key={`g${i}`}
          style={{
            position: 'absolute',
            left: x + len / 2 - 1,
            top: -18,
            width: 2,
            height: totalH + 36,
            background: `linear-gradient(180deg, rgba(34,240,208,0), ${tsColors.mint}, rgba(34,240,208,0))`,
            opacity: interpolate(match, [0.15 + i * 0.12, 0.45 + i * 0.12], [0, 0.75], CLAMP),
            boxShadow: '0 0 10px rgba(34,240,208,.5)',
          }}
        />
      ))}
      {/* trace rows */}
      {reveals.map((reveal, r) => {
        const drawn = reveal * SIGNATURE_WIDTH;
        const rowColor = interpolate(match, [0.3, 0.9], [0, 1], CLAMP);
        return (
          <div key={`r${r}`} style={{position: 'absolute', left: 0, top: r * rowGap, height: 2}}>
            {SIGNATURE_OFFSETS.map(({x, len}, i) => {
              const h = 15 + len * 0.16;
              const appear = drawn <= 0 ? 0 : interpolate(drawn, [x, x + len], [0, 1], CLAMP);
              const col = r === 0 ? tsColors.cyan : `rgba(${lerpCyanMint(rowColor)})`;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x,
                    top: -h / 2,
                    width: len,
                    height: h,
                    borderRadius: h / 2,
                    background: r === 0 ? tsColors.cyan : col,
                    opacity: appear,
                    boxShadow: `0 0 ${9 + match * 8}px rgba(95,199,230,.5)`,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

/** cyan -> mint blend as a raw "r,g,b" string for the converging rows. */
function lerpCyanMint(t: number): string {
  const c = [95, 199, 230];
  const m = [34, 240, 208];
  const v = c.map((cv, i) => Math.round(cv + (m[i] - cv) * t));
  return `${v[0]},${v[1]},${v[2]}`;
}

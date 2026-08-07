import {interpolate} from 'remotion';
import {CLAMP, EASE, SIGNATURE_OFFSETS, SIGNATURE_WIDTH, tsColors} from './trafficSignatureConfig';

/**
 * A new, unknown encrypted stream rises from below and its trace overlays the
 * stored signature. It aligns and matches — a second mini-payoff (ПОХОЖ). The
 * system does not block it; it simply recognises the handwriting.
 */
export const UnknownFlowMatch: React.FC<{
  cx: number;
  cy: number;
  /** 0..1 : rise (0-0.5) -> align (0.5-0.78) -> match glow (0.78-1) */
  progress: number;
  opacity?: number;
  scale?: number;
}> = ({cx, cy, progress, opacity = 1, scale = 1}) => {
  const rise = interpolate(progress, [0, 0.55], [150, 0], EASE);
  const matched = interpolate(progress, [0.72, 1], [0, 1], CLAMP);
  const drawn = interpolate(progress, [0, 0.4], [0, 1], CLAMP) * SIGNATURE_WIDTH;
  return (
    <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${scale})`, opacity}}>
      {/* stored signature ghost */}
      <div style={{position: 'absolute', left: -SIGNATURE_WIDTH / 2, top: 0, width: SIGNATURE_WIDTH, height: 0}}>
        {SIGNATURE_OFFSETS.map(({x, len}, i) => {
          const h = 15 + len * 0.16;
          return (
            <div
              key={`s${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: -h / 2,
                width: len,
                height: h,
                borderRadius: h / 2,
                border: `1.5px solid rgba(34,240,208,${0.35 + matched * 0.4})`,
                background: matched > 0 ? `rgba(34,240,208,${matched * 0.5})` : 'transparent',
                boxShadow: matched > 0 ? `0 0 ${8 + matched * 12}px rgba(34,240,208,${matched * 0.6})` : 'none',
              }}
            />
          );
        })}
      </div>
      {/* incoming unknown trace */}
      <div style={{position: 'absolute', left: -SIGNATURE_WIDTH / 2, top: rise, width: SIGNATURE_WIDTH, height: 0, opacity: 1 - matched * 0.65}}>
        {SIGNATURE_OFFSETS.map(({x, len}, i) => {
          const h = 15 + len * 0.16;
          const appear = drawn <= 0 ? 0 : interpolate(drawn, [x, x + len], [0, 1], CLAMP);
          return (
            <div
              key={`u${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: -h / 2,
                width: len,
                height: h,
                borderRadius: h / 2,
                background: tsColors.cyan,
                opacity: appear,
                boxShadow: '0 0 9px rgba(95,199,230,.5)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

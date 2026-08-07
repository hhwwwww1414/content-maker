import {BrakeSignalGlow} from './BrakeSignalGlow';

/**
 * One abstract packet of data, drawn as a smooth crystal-glass capsule with a
 * glowing core, seen from behind-and-above on the highway. Purely presentational:
 * the lane owns its position, depth scale and traffic state.
 */
export const DataCapsule: React.FC<{
  x: number;
  y: number;
  scale: number; // perspective scale (near = large)
  widthNear: number; // near-edge width in px
  brake: number; // red stop-light amount (0..1)
  mint: number; // free-flow mint amount (0..1)
  reflect?: boolean; // draw a soft mirrored sheen under the glass
}> = ({x, y, scale, widthNear, brake, mint, reflect = true}) => {
  const w = widthNear * scale;
  const h = w * 0.66;
  const coreMint = 0.28 + 0.5 * mint;
  const border = mint > brake ? `rgba(34,240,208,${(0.42 + 0.3 * mint).toFixed(3)})` : `rgba(150,180,178,0.4)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        pointerEvents: 'none',
      }}
    >
      {/* soft reflection on the glossy road below the capsule */}
      {reflect && (
        <div
          style={{
            position: 'absolute',
            left: w * 0.08,
            top: h * 0.86,
            width: w * 0.84,
            height: h * 0.7,
            borderRadius: h * 0.4,
            background:
              mint > brake
                ? `rgba(34,240,208,${(0.14 * mint + 0.04).toFixed(3)})`
                : `rgba(255,86,82,${(0.16 * brake + 0.03).toFixed(3)})`,
            filter: `blur(${Math.max(4, w * 0.09)}px)`,
            transform: 'scaleY(-1)',
            opacity: 0.8,
          }}
        />
      )}

      {/* capsule body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: h * 0.42,
          background:
            'linear-gradient(180deg, rgba(30,44,46,0.96) 0%, rgba(17,26,28,0.98) 46%, rgba(9,15,16,0.99) 100%)',
          border: `${Math.max(1, w * 0.014)}px solid ${border}`,
          boxShadow: `inset 0 ${h * 0.16}px ${h * 0.3}px rgba(150,255,233,0.10), 0 ${h * 0.14}px ${h * 0.4}px rgba(0,0,0,0.5)`,
          overflow: 'hidden',
        }}
      >
        {/* glowing data core */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '54%',
            width: w * 0.5,
            height: h * 0.3,
            transform: 'translate(-50%,-50%)',
            borderRadius: h,
            background: `rgba(34,240,208,${coreMint.toFixed(3)})`,
            filter: `blur(${Math.max(2, w * 0.05)}px)`,
          }}
        />
        {/* top windshield highlight */}
        <div
          style={{
            position: 'absolute',
            left: w * 0.16,
            top: h * 0.1,
            width: w * 0.68,
            height: h * 0.22,
            borderRadius: h,
            background: 'linear-gradient(180deg, rgba(180,255,240,0.22), rgba(180,255,240,0))',
          }}
        />
      </div>

      <BrakeSignalGlow width={w} brake={brake} mint={mint} />
    </div>
  );
};

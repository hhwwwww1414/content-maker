import {interpolate} from 'remotion';
import {CLAMP, SIGNATURE_OFFSETS, SIGNATURE_WIDTH, tsColors} from './trafficSignatureConfig';

/**
 * A compact, canonical rendering of the stored signature — the reference
 * "почерк" the system keeps and compares against. Small, technical, with an
 * optional TRAFFIC SIGNATURE caption.
 */
export const SignaturePattern: React.FC<{
  cx: number;
  cy: number;
  scale?: number;
  opacity?: number;
  reveal?: number;
  caption?: boolean;
  color?: string;
}> = ({cx, cy, scale = 1, opacity = 1, reveal = 1, caption = true, color = tsColors.mint}) => {
  const drawn = reveal * SIGNATURE_WIDTH;
  return (
    <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${scale})`, opacity}}>
      <div style={{position: 'relative', width: SIGNATURE_WIDTH, height: 40}}>
        {SIGNATURE_OFFSETS.map(({x, len}, i) => {
          const h = 16 + len * 0.16;
          const appear = drawn <= 0 ? 0 : interpolate(drawn, [x, x + len], [0, 1], CLAMP);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: 20 - h / 2,
                width: len,
                height: h,
                borderRadius: h / 2,
                background: color,
                opacity: appear,
                boxShadow: `0 0 12px rgba(34,240,208,.5)`,
              }}
            />
          );
        })}
      </div>
      {caption ? (
        <div
          style={{
            marginTop: 10,
            textAlign: 'center',
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: 3,
            color: tsColors.gray,
            opacity: interpolate(reveal, [0.7, 1], [0, 1], CLAMP),
          }}
        >
          TRAFFIC SIGNATURE
        </div>
      ) : null}
    </div>
  );
};

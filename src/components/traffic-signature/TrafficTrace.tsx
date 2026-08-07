import {interpolate} from 'remotion';
import {CLAMP, SIGNATURE_OFFSETS, SIGNATURE_WIDTH, tsColors} from './trafficSignatureConfig';

/** Height of a pulse bar, derived from its length so long pulses read as taller. */
const pulseHeight = (len: number) => 15 + len * 0.16;

/**
 * The light trail a capsule leaves behind: the signature rhythm rendered as a
 * row of glowing rounded bars. `reveal` (0..1) draws it progressively from the
 * left so it appears to be laid down as the capsule passes.
 */
export const TrafficTrace: React.FC<{
  x: number;
  y: number;
  reveal?: number;
  opacity?: number;
  scale?: number;
  color?: string;
  glow?: string;
  /** subtle per-pulse breathing highlight (0..1 intensity) */
  emphasis?: number;
  periods?: number;
  frame?: number;
}> = ({x, y, reveal = 1, opacity = 1, scale = 1, color = tsColors.cyan, glow = 'rgba(95,199,230,.55)', emphasis = 0, periods = 1, frame = 0}) => {
  const totalWidth = SIGNATURE_WIDTH * periods;
  const drawn = reveal * totalWidth;
  const bars: React.ReactNode[] = [];
  for (let p = 0; p < periods; p++) {
    for (let i = 0; i < SIGNATURE_OFFSETS.length; i++) {
      const {x: ox, len} = SIGNATURE_OFFSETS[i];
      const bx = p * SIGNATURE_WIDTH + ox;
      const appear = drawn <= 0 ? 0 : interpolate(drawn, [bx, bx + len], [0, 1], CLAMP);
      if (appear <= 0) continue;
      const h = pulseHeight(len);
      const breathe = emphasis > 0 ? 1 + emphasis * 0.5 * (0.5 + 0.5 * Math.sin(frame * 0.22 - i * 0.9 - p * 1.3)) : 1;
      bars.push(
        <div
          key={`${p}-${i}`}
          style={{
            position: 'absolute',
            left: bx,
            top: -h / 2,
            width: len,
            height: h,
            borderRadius: h / 2,
            background: `linear-gradient(180deg, ${tsColors.lightMint === color ? color : color}, ${color})`,
            opacity: appear,
            transform: `scaleY(${breathe})`,
            boxShadow: `0 0 ${10 + emphasis * 10}px ${glow}`,
          }}
        />,
      );
    }
  }
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity, transform: `scale(${scale})`, transformOrigin: 'left center'}}>
      {/* baseline thread */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: -0.5,
          width: drawn,
          height: 1,
          background: `linear-gradient(90deg, ${glow}, rgba(95,199,230,0))`,
          opacity: 0.5,
        }}
      />
      {bars}
    </div>
  );
};

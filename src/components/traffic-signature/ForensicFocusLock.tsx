import {interpolate} from 'remotion';
import {CLAMP, OUT, tsColors} from './trafficSignatureConfig';

/**
 * A precise focus-lock frame: four corner brackets that fade in around a target
 * and then snap inward ~7px and settle. Deliberately NOT a shake or glitch — a
 * controlled forensic "lock" beat.
 */
export const ForensicFocusLock: React.FC<{
  cx: number;
  cy: number;
  w: number;
  h: number;
  appear?: number;
  /** 0..1 — the inward snap; crosses 0->1 fast at the lock moment. */
  lock?: number;
  color?: string;
}> = ({cx, cy, w, h, appear = 1, lock = 0, color = tsColors.mint}) => {
  const inset = interpolate(lock, [0, 1], [7, 0], OUT);
  const len = 34;
  const th = 3;
  const bw = w - inset * 2;
  const bh = h - inset * 2;
  const glow = interpolate(lock, [0, 0.4, 1], [0.2, 0.9, 0.5], CLAMP);
  const corner = (top: boolean, left: boolean): React.CSSProperties => ({
    position: 'absolute',
    [top ? 'top' : 'bottom']: 0,
    [left ? 'left' : 'right']: 0,
    width: len,
    height: len,
    [top ? 'borderTop' : 'borderBottom']: `${th}px solid ${color}`,
    [left ? 'borderLeft' : 'borderRight']: `${th}px solid ${color}`,
    borderRadius: top && left ? '8px 0 0 0' : top ? '0 8px 0 0' : left ? '0 0 0 8px' : '0 0 8px 0',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - bw / 2,
        top: cy - bh / 2,
        width: bw,
        height: bh,
        opacity: appear,
        filter: `drop-shadow(0 0 ${8 + glow * 12}px rgba(34,240,208,${glow}))`,
      }}
    >
      <div style={corner(true, true)} />
      <div style={corner(true, false)} />
      <div style={corner(false, true)} />
      <div style={corner(false, false)} />
    </div>
  );
};

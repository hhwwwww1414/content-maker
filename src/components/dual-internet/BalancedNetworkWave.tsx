import {CH} from './console';

/**
 * The finale wave: the two channels rise into one calm, symmetric balanced
 * waveform that runs horizontally across the frame. It does not mix traffic — it
 * is a visual sign of balance, and doubles as the underline for the closing text.
 */
export const BalancedNetworkWave: React.FC<{
  frame: number;
  progress: number; // 0..1 forms from the centre outward
  cy: number;
  opacity: number;
  amplitude?: number;
}> = ({frame, progress, cy, opacity, amplitude = 1}) => {
  if (opacity <= 0.001) return null;
  const left = 150;
  const right = 810;
  const width = right - left;
  const n = 60;
  const t = frame * 0.05;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = left + u * width;
    const env = Math.sin(u * Math.PI); // taper ends
    const w = 0.6 * Math.sin(7 * u * Math.PI + t) + 0.4 * Math.sin(13 * u * Math.PI - t * 0.6);
    const y = cy + 20 * amplitude * w * env;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const d = `M ${pts.join(' L ')}`;
  const draw = Math.max(0, Math.min(1, progress));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity}}>
      <path d={d} fill="none" stroke={CH.worldGlow} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={0.4} style={{filter: 'blur(5px)'}} />
      <path d={d} fill="none" stroke={CH.worldCore} strokeWidth={2.6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
    </svg>
  );
};

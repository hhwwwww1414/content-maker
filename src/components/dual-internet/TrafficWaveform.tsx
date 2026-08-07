/**
 * A waveform-like traffic stream for one channel. Deterministic sum of sines
 * that scrolls with the frame; its vertical amplitude and brightness follow the
 * channel level continuously, so a channel never boolean-switches off — it only
 * loses amplitude and dims.
 */
export const TrafficWaveform: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
  amplitude: number; // 0..1 channel level
  core: string;
  glow: string;
  speed?: number;
  seed?: number;
}> = ({frame, cx, cy, width, height, amplitude, core, glow, speed = 1, seed = 0}) => {
  const n = 46;
  const left = cx - width / 2;
  const amp = (height / 2) * (0.16 + 0.84 * amplitude);
  const t = frame * 0.08 * speed;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = left + u * width;
    const w =
      0.5 * Math.sin(6.2 * u * Math.PI + t + seed) +
      0.3 * Math.sin(11 * u * Math.PI - t * 0.7 + seed * 1.7) +
      0.2 * Math.sin(17 * u * Math.PI + t * 1.3 + seed * 0.9);
    // taper the ends so the stream fades into the strip rather than cutting hard
    const taper = Math.sin(u * Math.PI);
    const y = cy + amp * w * taper;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  const d = `M ${pts.join(' L ')}`;
  const op = 0.2 + 0.8 * amplitude;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <path d={d} fill="none" stroke={glow} strokeWidth={9} strokeLinecap="round" opacity={op * 0.4} style={{filter: 'blur(5px)'}} />
      <path d={d} fill="none" stroke={core} strokeWidth={2.6} strokeLinecap="round" opacity={op} />
    </svg>
  );
};

/**
 * A patch cable made of light. A quadratic curve with a gentle sag that draws
 * itself in via `progress` (0..1). Deterministic; no filters that vary between
 * Chromium renders.
 */
export const LightPatchCable: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  color: string;
  glow: string;
  sag?: number;
}> = ({x1, y1, x2, y2, progress, color, glow, sag = 70}) => {
  const mx = (x1 + x2) / 2;
  const my = Math.max(y1, y2) + sag;
  const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  const dash = Math.max(0, Math.min(1, progress));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <path d={d} fill="none" stroke={glow} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - dash} opacity={0.4} style={{filter: 'blur(4px)'}} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - dash} />
      {/* connector plugs */}
      {[[x1, y1], [x2, y2]].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={5} fill={color} opacity={dash > 0.02 ? 1 : 0} style={{filter: `drop-shadow(0 0 6px ${glow})`}} />
      ))}
    </svg>
  );
};

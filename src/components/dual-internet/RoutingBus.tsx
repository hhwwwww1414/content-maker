import {CH, MIXER, seeded} from './console';

/**
 * The large translucent routing bus beneath the console. Two independent lanes —
 * LOCAL (thin white/mint) and WORLD (mint/cyan) — carry their own signal
 * packets. The streams run in parallel and never cross or cancel.
 */
export const RoutingBus: React.FC<{
  frame: number;
  active: number; // 0..1 fade-in of the whole bus
  localLevel: number;
  worldLevel: number;
}> = ({frame, active, localLevel, worldLevel}) => {
  if (active <= 0.001) return null;
  const left = MIXER.panelLeft + 6;
  const right = MIXER.panelRight - 6;
  const width = right - left;
  const laneLocalY = MIXER.busTop + 34;
  const laneWorldY = MIXER.busBottom - 34;

  const packets = (y: number, level: number, color: string, glow: string, dir: number, seedBase: number) => {
    const n = 9;
    const out = [];
    for (let i = 0; i < n; i++) {
      const speed = 0.0022 + 0.0006 * seeded(seedBase + i);
      const p = ((frame * speed * dir + i / n + seeded(seedBase + i * 2)) % 1 + 1) % 1;
      const x = left + p * width;
      const size = 10 + 26 * level;
      out.push(
        <div
          key={`${seedBase}-${i}`}
          style={{
            position: 'absolute',
            left: x - size / 2,
            top: y - 2,
            width: size,
            height: 4,
            borderRadius: 3,
            background: color,
            opacity: (0.3 + 0.6 * level) * active,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />,
      );
    }
    return out;
  };

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {/* bus body */}
      <div
        style={{
          position: 'absolute',
          left,
          top: MIXER.busTop,
          width,
          height: MIXER.busBottom - MIXER.busTop,
          borderRadius: 22,
          background: 'linear-gradient(180deg, rgba(18,28,30,0.5), rgba(9,15,16,0.62))',
          border: '1px solid rgba(140,255,233,0.12)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
          opacity: active,
        }}
      />
      {/* lane rails */}
      {[laneLocalY, laneWorldY].map((y, i) => (
        <div key={i} style={{position: 'absolute', left: left + 16, top: y - 1, width: width - 32, height: 2, background: 'rgba(140,255,233,0.14)', opacity: active}} />
      ))}
      {/* lane labels */}
      <div style={{position: 'absolute', left: left + 18, top: laneLocalY - 30, fontFamily: 'monospace', fontSize: 14, letterSpacing: 3, color: 'rgba(155,168,165,0.7)', opacity: active}}>LOCAL</div>
      <div style={{position: 'absolute', left: left + 18, top: laneWorldY + 12, fontFamily: 'monospace', fontSize: 14, letterSpacing: 3, color: 'rgba(155,168,165,0.7)', opacity: active}}>WORLD</div>

      {packets(laneLocalY, localLevel, CH.localCore, CH.localGlow, 1, 11)}
      {packets(laneWorldY, worldLevel, CH.worldCore, CH.worldGlow, 1, 41)}
    </div>
  );
};

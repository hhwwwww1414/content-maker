import {seeded} from './console';

/**
 * A VU-like vertical traffic meter: a stack of segment LEDs whose lit level
 * follows the channel amplitude continuously (each segment cross-fades rather
 * than snapping). A soft ambient flicker keeps it alive without ever jumping.
 */
export const TrafficVuMeter: React.FC<{
  frame: number;
  x: number;
  bottom: number;
  height: number;
  amplitude: number; // 0..1
  core: string;
  warn?: number; // 0..1 amber warning blend on the top segments
  seed?: number;
}> = ({frame, x, bottom, height, amplitude, core, warn = 0, seed = 0}) => {
  const segments = 14;
  const gap = 4;
  const segH = (height - gap * (segments - 1)) / segments;
  const w = 16;
  // gentle ambient breathing so the meter is never perfectly static
  const breathe = 0.04 * Math.sin(frame * 0.12 + seed);
  const level = Math.max(0, Math.min(1, amplitude + breathe));
  const lit = level * segments;

  return (
    <div style={{position: 'absolute', left: x - w / 2, top: bottom - height, width: w, height, pointerEvents: 'none'}}>
      {Array.from({length: segments}).map((_, i) => {
        const fromTop = segments - 1 - i; // 0 = bottom segment
        const on = Math.max(0, Math.min(1, lit - fromTop));
        const isTop = fromTop >= segments - 3;
        const amber = isTop ? warn : 0;
        const flick = 0.9 + 0.1 * seeded(i * 3 + Math.floor(frame / 4) + seed);
        const col = amber > 0.5 ? '#F2B15A' : core;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: i * (segH + gap),
              width: w,
              height: segH,
              borderRadius: 3,
              background: col,
              opacity: (0.08 + 0.9 * on) * flick,
              boxShadow: on > 0.15 ? `0 0 ${8 * on}px ${col}` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};

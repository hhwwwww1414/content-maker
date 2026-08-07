import {Easing, interpolate} from 'remotion';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

/**
 * Soft concentric radio waves rolling outward from a point. Used around the SIM in
 * scene 1 and around the tower in scene 2, so the same visual language carries the
 * viewer between scenes instead of a cut.
 */
export const RadioSpectrumField: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  /** Waves in flight at once. */
  count?: number;
  /** Frames one wave takes to travel from the centre to `maxRadius`. */
  period?: number;
  maxRadius?: number;
  opacity?: number;
  /** 0 = cool international blue, 1 = local mint. */
  syncProgress?: number;
  /** Slight vertical squash so the rings read as ground-plane waves. */
  flatten?: number;
}> = ({frame, cx, cy, count = 4, period = 96, maxRadius = 620, opacity = 1, syncProgress = 1, flatten = 0.42}) => {
  const waves = Array.from({length: count}, (_, index) => {
    const phase = ((frame / period) + index / count) % 1;
    const radius = interpolate(phase, [0, 1], [40, maxRadius], OUT);
    const fade = interpolate(phase, [0, 0.12, 0.7, 1], [0, 0.62, 0.28, 0], CLAMP);
    const width = interpolate(phase, [0, 1], [3.2, 1], CLAMP);
    return {radius, fade, width, key: index};
  });

  const stroke = (alpha: number) =>
    `rgba(${Math.round(96 - 62 * syncProgress)}, ${Math.round(176 + 64 * syncProgress)}, ${Math.round(255 - 47 * syncProgress)}, ${alpha})`;

  return (
    <div style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
      {waves.map((wave) => (
        <div
          key={wave.key}
          style={{
            position: 'absolute',
            left: cx - wave.radius,
            top: cy - wave.radius * flatten,
            width: wave.radius * 2,
            height: wave.radius * 2 * flatten,
            borderRadius: '50%',
            border: `${wave.width}px solid ${stroke(wave.fade)}`,
            boxShadow: `0 0 26px ${stroke(wave.fade * 0.45)}`,
          }}
        />
      ))}
    </div>
  );
};

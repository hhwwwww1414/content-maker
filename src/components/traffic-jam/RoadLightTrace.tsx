import {colors} from '../../theme/colors';

const centerX = (t: number) => 486 + 64 * t;
const centerY = (t: number) => 522 + 668 * t;

/** Soft light trails left by the accelerated capsules as they flow into depth. */
export const RoadLightTrace: React.FC<{frame: number; intensity: number}> = ({frame, intensity}) => {
  if (intensity <= 0.001) return null;
  const streaks = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const raw = ((frame * 0.006 + i / n) % 1 + 1) % 1;
    const t = 1 - raw;
    const len = 90 + 220 * t;
    streaks.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: centerX(t) - 2,
          top: centerY(t) - len,
          width: 4 * (0.3 + 0.7 * t),
          height: len,
          borderRadius: 4,
          background: `linear-gradient(180deg, rgba(34,240,208,0), ${colors.mint})`,
          opacity: intensity * (0.14 + 0.4 * t) * raw,
          filter: 'blur(2px)',
        }}
      />,
    );
  }
  return <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>{streaks}</div>;
};

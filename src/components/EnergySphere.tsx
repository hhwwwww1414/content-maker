import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';

/** The small glowing orb that stands in for the user moving through the maze. */
export const EnergySphere: React.FC<{size?: number; intensity?: number}> = ({size = 28, intensity = 1}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 10), [-1, 1], [0.88, 1.12]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 32%, ${colors.lightMint}, ${colors.mint} 55%, rgba(34,240,208,.25) 100%)`,
        boxShadow: `0 0 ${26 * intensity}px rgba(34,240,208,${0.75 * intensity}), 0 0 ${58 * intensity}px rgba(34,240,208,${0.35 * intensity})`,
        scale: pulse,
      }}
    />
  );
};

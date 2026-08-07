import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';

/** A glowing gradient beam that grows in from the left, used for the GhostPepeBot
 * ray cutting through the maze and for the CTA scene's route line. */
export const MintBeam: React.FC<{width: number; appearFrame: number; angle?: number; thickness?: number}> = ({
  width,
  appearFrame,
  angle = 0,
  thickness = 4,
}) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [appearFrame, appearFrame + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        width,
        height: thickness,
        borderRadius: thickness,
        background: `linear-gradient(90deg, rgba(34,240,208,0) 0%, ${colors.mint} 45%, ${colors.lightMint} 100%)`,
        boxShadow: '0 0 18px rgba(34,240,208,.65)',
        transformOrigin: 'left center',
        scale: `${grow} 1`,
        rotate: `${angle}deg`,
        opacity: interpolate(grow, [0, 0.15, 1], [0, 1, 1]),
      }}
    />
  );
};

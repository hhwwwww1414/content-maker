import React from 'react';
import {useCurrentFrame} from 'remotion';
import {elevation, enterAt, radius as radii, riseY} from '../../theme/tokens';

/** Reusable glass/raised surface with a soft rise entrance. */
export const GlassCard: React.FC<{
  children?: React.ReactNode;
  from?: number;
  variant?: keyof typeof elevation;
  radius?: number;
  style?: React.CSSProperties;
}> = ({children, from = 0, variant = 'glass', radius = radii.lg, style}) => {
  const frame = useCurrentFrame();
  const t = enterAt(frame, from);
  return (
    <div
      style={{
        ...elevation[variant],
        borderRadius: radius,
        opacity: t,
        translate: `0 ${riseY(t, 18)}px`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

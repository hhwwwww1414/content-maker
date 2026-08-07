import {colors} from '../theme/colors';

export const ConnectionLine: React.FC<{progress: number; stable?: boolean}> = ({progress, stable = false}) => {
  const color = stable ? colors.mint : colors.lightMint;
  const dash = Math.round(progress * 360);
  return (
    <svg width="10" height="120" viewBox="0 0 10 120" style={{opacity: progress > 0 ? 0.9 : 0}}>
      <path d="M5 0V120" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${dash} 400`} opacity={stable ? 1 : 0.7} />
      {stable && <circle cx="5" cy="60" r="6" fill={color} opacity={0.9} />}
    </svg>
  );
};

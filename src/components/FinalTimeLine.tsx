import {Easing, interpolate} from 'remotion';
import {colors} from '../theme/colors';

const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const FinalTimeLine: React.FC<{progress: number}> = ({progress}) => (
  <div style={{position: 'absolute', left: 112, top: 1115, width: 700, height: 70, opacity: progress}}>
    <div style={{position: 'absolute', left: 0, top: 31, width: interpolate(progress, [0, 1], [0, 700], EASE), height: 3, borderRadius: 4, background: `linear-gradient(90deg, transparent, ${colors.mint} 18%, ${colors.lightMint} 72%, transparent)`, boxShadow: '0 0 24px rgba(34,240,208,.58)'}} />
    {Array.from({length: 7}, (_, index) => (
      <div key={index} style={{position: 'absolute', left: 48 + index * 98, top: 26, width: 12, height: 12, borderRadius: '50%', background: colors.lightMint, opacity: interpolate(progress, [index / 9, index / 9 + 0.2], [0, 0.88], EASE), boxShadow: '0 0 18px rgba(34,240,208,.7)'}} />
    ))}
  </div>
);


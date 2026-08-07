import {Easing, interpolate} from 'remotion';
import {colors} from '../theme/colors';

const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ChronometerHand: React.FC<{turnProgress: number; freezeProgress: number; opacity: number}> = ({
  turnProgress,
  freezeProgress,
  opacity,
}) => {
  const rotation = interpolate(turnProgress * (1 - freezeProgress * 0.06), [0, 1], [-120, 240], EASE);
  return (
    <div style={{position: 'absolute', left: 40, top: 390, width: 430, height: 430, opacity}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(140,255,233,.14)', boxShadow: 'inset 0 0 70px rgba(34,240,208,.04)'}} />
      {Array.from({length: 12}, (_, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: 212,
            top: 12,
            width: 3,
            height: index % 3 === 0 ? 24 : 13,
            background: 'rgba(140,255,233,.22)',
            transformOrigin: '2px 203px',
            rotate: `${index * 30}deg`,
          }}
        />
      ))}
      <div style={{position: 'absolute', left: 211, top: 64, width: 5, height: 153, borderRadius: 9, background: colors.mint, boxShadow: '0 0 20px rgba(34,240,208,.55)', transformOrigin: '50% 100%', rotate: `${rotation}deg`}} />
      <div style={{position: 'absolute', left: 201, top: 201, width: 24, height: 24, borderRadius: '50%', background: colors.lightMint, boxShadow: '0 0 28px rgba(34,240,208,.7)'}} />
    </div>
  );
};


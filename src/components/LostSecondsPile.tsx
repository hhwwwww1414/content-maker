import {Easing, interpolate} from 'remotion';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';

const EASE = {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const labels = ['09', '−4', '08', '−7', '06', ':12', '−5', '07', ':03', '04', '−9', ':18', '02', '−6'];

export const LostSecondsPile: React.FC<{progress: number; returnProgress: number}> = ({progress, returnProgress}) => (
  <div style={{position: 'absolute', left: 104, top: 650, width: 300, height: 250, opacity: 1 - returnProgress}}>
    {labels.map((label, index) => {
      const reveal = interpolate(progress, [index / 22, index / 22 + 0.26], [0, 1], EASE);
      const column = index % 5;
      const row = Math.floor(index / 5);
      return (
        <div
          key={`${label}-${index}`}
          style={{
            position: 'absolute',
            left: 28 + column * 52 + (row % 2) * 12,
            top: 150 - row * 42 - (column % 2) * 13,
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 25 + (index % 3) * 4,
            color: index % 4 === 0 ? colors.lightMint : colors.mint,
            opacity: reveal * (0.52 + (index % 4) * 0.11),
            translate: `0 ${interpolate(reveal, [0, 1], [-22, 0], EASE)}px`,
            rotate: `${-8 + (index % 6) * 3}deg`,
            textShadow: '0 0 18px rgba(34,240,208,.42)',
          }}
        >
          {label}
        </div>
      );
    })}
  </div>
);


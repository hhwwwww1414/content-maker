import {Easing, interpolate} from 'remotion';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';

const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const hash = (seed: number) => {
  const x = Math.sin(seed * 91.173) * 43758.5453;
  return x - Math.floor(x);
};

export const TimeDigitParticle: React.FC<{
  frame: number;
  index: number;
  seed: number;
  progress: number;
  reverse?: boolean;
  frozen?: number;
  opacity?: number;
}> = ({frame, index, seed, progress, reverse = false, frozen = 0, opacity = 1}) => {
  const x = (hash(seed + index * 3.7) - 0.5) * 170;
  const drift = (hash(seed + index * 8.1) - 0.5) * 42;
  const delay = hash(seed + index * 13.3) * 0.42;
  const local = interpolate(progress, [delay, Math.min(1, delay + 0.58)], [0, 1], EASE);
  const travel = reverse ? 1 - local : local;
  const y = interpolate(travel, [0, 1], [-210, 250], EASE);
  const turn = interpolate(local, [0, 0.42, 1], [reverse ? -8 : 4, reverse ? 2 : -3, reverse ? 7 : 5], EASE);
  const scale = 0.72 + hash(seed + index * 5.5) * 0.28;
  const labels = ['09', '08', '07', '06', '−4', '−7', '−5', ':', '00'];
  const label = labels[index % labels.length];
  return (
    <div
      style={{
        position: 'absolute',
        left: 120 + x + drift * local,
        top: 220 + y,
        opacity: opacity * interpolate(local, [0, 0.12, 0.88, 1], [0, 1, 1, 0.12], EASE),
        translate: `${interpolate(frozen, [0, 1], [0, drift * 0.08], EASE)}px 0`,
        rotate: `${turn}deg`,
        scale,
        fontFamily: unbounded,
        fontWeight: 800,
        fontSize: 28,
        color: colors.lightMint,
        WebkitTextStroke: '1px rgba(246,250,249,.24)',
        textShadow: `0 0 ${14 + hash(seed + index) * 18}px rgba(34,240,208,.72)`,
        filter: `brightness(${interpolate(local, [0, 0.76, 1], [1.25, 1, 0.52], EASE)})`,
      }}
    >
      {label}
    </div>
  );
};


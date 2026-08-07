import {colors} from '../../theme/colors';

/**
 * The red rear stop-light of a stalled data-capsule. Two soft lamps plus a
 * bloom; intensity crossfades red -> mint as the jam is released, so the same
 * lamp becomes the calm mint running-light of a moving capsule.
 */
export const BrakeSignalGlow: React.FC<{
  width: number;
  brake: number; // 1 = full red stop-light, 0 = off
  mint: number; // 0 = red, 1 = mint free-flow glow
}> = ({width, brake, mint}) => {
  if (brake <= 0.001 && mint <= 0.001) return null;
  const red = `rgba(255,86,82,${(0.9 * brake).toFixed(3)})`;
  const mintC = `rgba(34,240,208,${(0.85 * mint).toFixed(3)})`;
  const lampW = width * 0.24;
  const lampH = Math.max(3, width * 0.09);
  const gap = width * 0.2;
  const bloom = Math.max(brake, mint);
  return (
    <div style={{position: 'absolute', top: -lampH * 0.5, left: 0, width, height: lampH, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: width * 0.9,
          height: width * 0.42,
          transform: 'translate(-50%,-60%)',
          borderRadius: '50%',
          background: brake >= mint ? colors.errorRed : colors.mint,
          opacity: bloom * 0.32,
          filter: `blur(${Math.max(6, width * 0.14)}px)`,
        }}
      />
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            top: '50%',
            left: `calc(50% + ${side * gap}px)`,
            width: lampW,
            height: lampH,
            transform: 'translate(-50%,-50%)',
            borderRadius: lampH,
            background: `linear-gradient(90deg, ${red}, ${mintC})`,
            boxShadow: `0 0 ${lampH * 2.4}px ${brake >= mint ? red : mintC}`,
          }}
        />
      ))}
    </div>
  );
};

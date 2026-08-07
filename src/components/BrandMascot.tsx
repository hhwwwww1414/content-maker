import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';

export const BrandMascot: React.FC<{size?: number; calm?: boolean}> = ({size = 560, calm = false}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.12),
        overflow: 'hidden',
        border: '1px solid rgba(140,255,233,.28)',
        boxShadow: '0 30px 110px rgba(0,0,0,.58), 0 0 70px rgba(34,240,208,.13)',
        translate: `0 ${Math.sin(frame / 18) * (calm ? 5 : 10)}px`,
        scale: interpolate(Math.sin(frame / 28), [-1, 1], [0.995, 1.015]),
      }}
    >
      <Img
        src={staticFile('assets/mascot/ghostpepe-second.png')}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
    </div>
  );
};

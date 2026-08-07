import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';

const TILE_COUNT = 14;

export const SubscriptionCard: React.FC<{copyFrame: number}> = ({copyFrame}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 26], [0, 1], {extrapolateRight: 'clamp'});
  const copied = frame > copyFrame;
  const copyPulse = interpolate(frame, [copyFrame, copyFrame + 8, copyFrame + 16], [1, 1.05, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  // Tiles light up green one after another as the key is "read", finishing right around copyFrame.
  const lightUpStart = 8;
  const lightUpSpan = Math.max(1, copyFrame - lightUpStart - 4);
  const tileStep = lightUpSpan / TILE_COUNT;

  return (
    <div
      style={{
        width: 680,
        padding: '40px 44px',
        borderRadius: 40,
        background: 'rgba(16,22,24,.94)',
        border: `2px solid ${copied ? 'rgba(34,240,208,.4)' : colors.line}`,
        boxShadow: '0 30px 90px rgba(0,0,0,.4)',
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [40, 0])}px`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 32, color: colors.white}}>Подписка</div>
      <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 23, color: colors.gray, marginTop: 8}}>Ключ доступа для VPN-клиента</div>
      <div
        style={{
          marginTop: 28,
          height: 84,
          borderRadius: 22,
          background: 'rgba(34,240,208,.08)',
          border: '1px solid rgba(140,255,233,.22)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 22px',
          gap: 6,
          boxSizing: 'border-box',
          scale: copyPulse,
        }}
      >
        {Array.from({length: TILE_COUNT}).map((_, i) => {
          const lit = interpolate(frame, [lightUpStart + i * tileStep, lightUpStart + i * tileStep + 5], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 24,
                borderRadius: 7,
                background: `rgba(140,255,233,${0.18 + lit * 0.62})`,
                boxShadow: lit > 0.4 ? `0 0 ${12 * lit}px rgba(34,240,208,${lit * 0.55})` : 'none',
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          marginTop: 20,
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 24,
          color: copied ? colors.mint : colors.gray,
          textAlign: 'center',
        }}
      >
        {copied ? 'Импортировано в VPN-клиент' : 'Копирование ключа…'}
      </div>
    </div>
  );
};

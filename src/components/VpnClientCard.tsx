import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';

export const VpnClientCard: React.FC<{connectFrame: number}> = ({connectFrame}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 26], [0, 1], {extrapolateRight: 'clamp'});
  // A gradual settle into the connected state instead of an instant colour/text swap.
  const connectProgress = interpolate(frame, [connectFrame, connectFrame + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const connected = connectProgress > 0.5;
  // One gentle settle-in pulse right as it connects, then still — no persistent dynamics.
  const settlePulse = interpolate(frame, [connectFrame, connectFrame + 14, connectFrame + 24], [1, 1.05, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div
      style={{
        width: 680,
        padding: '40px 44px',
        borderRadius: 40,
        background: 'rgba(16,22,24,.96)',
        border: `2px solid rgba(${140 - 5 * connectProgress},${168 + 72 * connectProgress},${165 + 43 * connectProgress},${0.16 + connectProgress * 0.34})`,
        boxShadow: `0 30px ${90 + connectProgress * 20}px rgba(${connectProgress > 0 ? 34 : 0},${connectProgress * 240},${connectProgress * 208},${connectProgress * 0.2})`,
        opacity: enter,
        translate: `0 ${interpolate(enter, [0, 1], [40, 0])}px`,
        boxSizing: 'border-box',
      }}
    >
      <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 32, color: colors.white}}>VPN-клиент</div>
      <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 23, color: colors.gray, marginTop: 8}}>Быстрый импорт</div>
      <div style={{display: 'flex', alignItems: 'center', gap: 28, marginTop: 30}}>
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: `rgba(${36 - 2 * connectProgress},${48 + 192 * connectProgress},${52 + 156 * connectProgress},1)`,
            scale: settlePulse,
            boxShadow: connected ? '0 0 50px rgba(34,240,208,.4)' : 'none',
            flex: '0 0 auto',
          }}
        >
          <svg width="46" height="46" viewBox="0 0 52 52">
            <path
              d="M26 8v17M14 15a17 17 0 1 0 24 0"
              fill="none"
              stroke={`rgba(${155 - 139 * connectProgress},${168 - 152 * connectProgress},${165 - 156 * connectProgress},1)`}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 36, color: connected ? colors.mint : colors.white, opacity: connected ? 1 : 1 - connectProgress}}>
            {connected ? 'Подключено' : 'Не подключено'}
          </div>
          <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 23, color: colors.gray}}>{connected ? 'Стабильное соединение' : 'Одно нажатие'}</div>
        </div>
      </div>
    </div>
  );
};

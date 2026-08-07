import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ConnectionTunnel} from '../components/ConnectionTunnel';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const FakeConnectionInvestigateScene: React.FC = () => {
  const frame = useCurrentFrame();

  const badgeEnter = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const litFraction = interpolate(frame, [0, 20], [0, 0.32], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const packetFraction = interpolate(frame, [10, 46], [0, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const line1 = interpolate(frame, [8, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line2 = interpolate(frame, [22, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const line3 = interpolate(frame, [36, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.55} />
      <AbsoluteFill
        style={{
          left: deadlineLayout.safeLeft,
          right: 1080 - deadlineLayout.safeRight,
          width: 'auto',
          top: deadlineLayout.safeTop,
          bottom: 1920 - deadlineLayout.safeBottom,
          height: 'auto',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            padding: '10px 22px',
            borderRadius: 18,
            background: 'rgba(34,240,208,.1)',
            border: '1px solid rgba(140,255,233,.3)',
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 20,
            color: colors.mint,
            opacity: badgeEnter,
            scale: interpolate(badgeEnter, [0, 1], [0.9, 1]),
          }}
        >
          VPN-клиент · подключено
        </div>

        <div style={{marginTop: 56, width: 660}}>
          <ConnectionTunnel litFraction={litFraction} packetFraction={packetFraction} />
        </div>

        <div style={{marginTop: 64, textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 44,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.white,
              textTransform: 'uppercase',
              opacity: line1,
              translate: `0 ${interpolate(line1, [0, 1], [16, 0])}px`,
            }}
          >
            Зелёная кнопка
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 44,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.white,
              textTransform: 'uppercase',
              opacity: line2,
              translate: `0 ${interpolate(line2, [0, 1], [16, 0])}px`,
            }}
          >
            Ещё не значит
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 44,
              lineHeight: 1.14,
              letterSpacing: -1.5,
              color: colors.mint,
              textTransform: 'uppercase',
              opacity: line3,
              translate: `0 ${interpolate(line3, [0, 1], [16, 0])}px`,
            }}
          >
            Рабочее соединение
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

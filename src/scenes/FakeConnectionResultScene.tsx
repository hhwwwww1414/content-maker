import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {AppStatusCard} from '../components/AppStatusCard';
import {ConnectionTunnel} from '../components/ConnectionTunnel';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

const SiteIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28">
    <rect x="2" y="4" width="24" height="20" rx="4" fill="none" stroke={colors.mint} strokeWidth="2.4" />
    <line x1="2" y1="12" x2="26" y2="12" stroke={colors.mint} strokeWidth="2" />
    <circle cx="7" cy="8" r="1.4" fill={colors.mint} />
    <circle cx="11.5" cy="8" r="1.4" fill={colors.mint} opacity=".7" />
  </svg>
);

const VideoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="none" stroke={colors.mint} strokeWidth="2.4" />
    <path d="M11 9l9 5-9 5V9z" fill={colors.mint} />
  </svg>
);

const MessageIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28">
    <path d="M4 6h20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10l-6 5V8a2 2 0 0 1 2-2z" fill="none" stroke={colors.mint} strokeWidth="2.4" />
  </svg>
);

export const FakeConnectionResultScene: React.FC = () => {
  const frame = useCurrentFrame();

  const litFraction = interpolate(frame, [0, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const packetFraction = interpolate(frame, [6, 34], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const statusEnter = interpolate(frame, [46, 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.65} />
      <AbsoluteFill
        style={{
          left: deadlineLayout.safeLeft,
          right: 1080 - deadlineLayout.safeRight,
          width: 'auto',
          top: deadlineLayout.safeTop,
          height: 'auto',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{width: 660, marginTop: 20}}>
          <ConnectionTunnel litFraction={litFraction} packetFraction={packetFraction} />
        </div>

        <div
          style={{
            marginTop: 40,
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 46,
            letterSpacing: -1.5,
            color: colors.mint,
            textTransform: 'uppercase',
            textAlign: 'center',
            opacity: statusEnter,
            translate: `0 ${interpolate(statusEnter, [0, 1], [16, 0])}px`,
            textShadow: '0 0 40px rgba(34,240,208,.4)',
          }}
        >
          Соединение работает
        </div>

        <div style={{marginTop: 34, display: 'flex', gap: 14, justifyContent: 'center'}}>
          <AppStatusCard icon={<SiteIcon />} label="Сайт" status="Открыт" appearFrame={38} />
          <AppStatusCard icon={<VideoIcon />} label="Видео" status="Загружено" appearFrame={46} />
          <AppStatusCard icon={<MessageIcon />} label="Сообщения" status="Доставлены" appearFrame={54} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

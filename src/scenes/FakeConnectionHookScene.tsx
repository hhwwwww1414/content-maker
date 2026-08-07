import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {AppStatusCard} from '../components/AppStatusCard';
import {CyberBackground} from '../components/CyberBackground';
import {VpnClientCard} from '../components/VpnClientCard';
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

export const FakeConnectionHookScene: React.FC = () => {
  const frame = useCurrentFrame();

  const headlineEnter = interpolate(frame, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const questionEnter = interpolate(frame, [6, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.7} />
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
        <div style={{textAlign: 'center'}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 78,
              letterSpacing: -3,
              color: colors.mint,
              textTransform: 'uppercase',
              opacity: headlineEnter,
              translate: `0 ${interpolate(headlineEnter, [0, 1], [22, 0])}px`,
              textShadow: '0 0 40px rgba(34,240,208,.4)',
            }}
          >
            Подключено
          </div>
          <div
            style={{
              marginTop: 12,
              opacity: questionEnter,
              translate: `0 ${interpolate(questionEnter, [0, 1], [18, 0])}px`,
            }}
          >
            <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 42, lineHeight: 1.15, letterSpacing: -1, color: colors.white, textTransform: 'uppercase'}}>
              Тогда почему
            </div>
            <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 42, lineHeight: 1.15, letterSpacing: -1, color: colors.errorRed, textTransform: 'uppercase'}}>
              Ничего не грузится?
            </div>
          </div>
        </div>

        <div style={{marginTop: 40}}>
          <VpnClientCard connectFrame={-30} />
        </div>

        <div style={{marginTop: 26, display: 'flex', gap: 14, justifyContent: 'center'}}>
          <AppStatusCard icon={<SiteIcon />} label="Сайт" status="Загрузка..." loading appearFrame={30} />
          <AppStatusCard icon={<VideoIcon />} label="Видео" status="Загрузка..." loading error appearFrame={38} />
          <AppStatusCard icon={<MessageIcon />} label="Сообщения" status="Загрузка..." loading appearFrame={46} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

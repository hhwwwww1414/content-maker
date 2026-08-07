import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {TelegramCard} from '../components/TelegramCard';
import {VpnConnectionCard} from '../components/VpnConnectionCard';
import {colors} from '../theme/colors';
import {layout} from '../theme/layout';
import {manrope, unbounded} from '../theme/fonts';

const steps = ['Telegram', 'Подписка', 'VPN', 'Готово'];

export const ConnectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const phase = Math.min(3, Math.floor(frame / 42));

  return (
    <AbsoluteFill style={{paddingTop: layout.top, boxSizing: 'border-box', alignItems: 'center'}}>
      <div style={{width: layout.contentWidth, fontFamily: unbounded, fontWeight: 800, fontSize: 62, lineHeight: 1.08, letterSpacing: -2, color: colors.white, textAlign: 'center'}}>
        ТРИ ШАГА.
        <br />
        <span style={{color: colors.mint}}>ОДНО НАЖАТИЕ.</span>
      </div>
      <div style={{width: layout.contentWidth, display: 'flex', marginTop: 42, alignItems: 'center', justifyContent: 'center', gap: 12}}>
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 21,
              color: index <= phase ? colors.background : colors.gray,
              background: index <= phase ? colors.mint : 'rgba(155,168,165,.10)',
              border: index <= phase ? '1px solid rgba(140,255,233,.7)' : '1px solid rgba(140,255,233,.12)',
              borderRadius: 16,
              padding: '12px 15px',
              whiteSpace: 'nowrap',
            }}
          >
            {step}
          </div>
        ))}
      </div>
      <div style={{height: 720, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: layout.contentWidth, marginTop: 16}}>
        <div style={{position: 'absolute', opacity: interpolate(frame, [0, 58, 72], [1, 1, 0], {extrapolateRight: 'clamp'}), scale: interpolate(frame, [58, 74], [1, .88], {extrapolateRight: 'clamp'})}}>
          <TelegramCard />
        </div>
        <div style={{position: 'absolute', opacity: interpolate(frame, [62, 80], [0, 1], {extrapolateRight: 'clamp'}), scale: interpolate(frame, [62, 82], [.88, 1], {extrapolateRight: 'clamp'})}}>
          <VpnConnectionCard />
        </div>
        <svg width="680" height="140" viewBox="0 0 680 140" style={{position: 'absolute', top: 535, opacity: interpolate(frame, [38, 78, 92], [0, .8, 0], {extrapolateRight: 'clamp'})}}>
          <path d="M72 70H568" stroke={colors.mint} strokeWidth="5" strokeDasharray="16 18" />
          <path d="M568 44L612 70L568 96" fill="none" stroke={colors.mint} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

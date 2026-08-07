import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {PhoneFrame} from '../components/PhoneFrame';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {graveyardLayout} from '../theme/layout';

export const GraveyardHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const glitch = frame > 6 && frame < 13 ? Math.sin(frame * 14) * 5 : 0;
  const hookEnter = interpolate(frame, [8, 15], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hookY = interpolate(hookEnter, [0, 1], [70, 0]);
  const status = frame < 28 ? 'ПОДКЛЮЧЕНИЕ…' : frame < 52 ? 'ОШИБКА' : 'СЕРВЕР НЕ ОТВЕЧАЕТ';
  const statusColor = frame < 28 ? colors.white : colors.errorRed;

  return (
    <AbsoluteFill>
      <CyberBackground mode="error" glitch intensity={1.1} />
      <AbsoluteFill style={{left: graveyardLayout.safeLeft, right: 1080 - graveyardLayout.safeRight, width: 'auto', alignItems: 'center', paddingTop: graveyardLayout.safeTop, boxSizing: 'border-box'}}>
        <div style={{textAlign: 'center', translate: `${glitch}px ${hookY}px`, opacity: hookEnter}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 60, lineHeight: 1.08, letterSpacing: -2, color: colors.white, textTransform: 'uppercase'}}>
            POV: ты скачал
            <br />
            уже <span style={{color: colors.errorRed}}>пятый VPN</span>
          </div>
        </div>
        <div style={{marginTop: 56, scale: interpolate(frame, [0, 13], [0.86, 1], {extrapolateRight: 'clamp'})}}>
          <PhoneFrame width={420} height={620} danger={frame >= 28}>
            <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26}}>
              <div style={{width: 90, height: 90, borderRadius: '50%', border: '8px solid rgba(255,255,255,.08)', borderTopColor: statusColor, rotate: `${frame * 9}deg`}} />
              <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 28, color: statusColor, textAlign: 'center'}}>{status}</div>
            </div>
          </PhoneFrame>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {MapNetwork} from '../components/MapNetwork';
import {colors} from '../theme/colors';
import {layout} from '../theme/layout';
import {manrope, unbounded} from '../theme/fonts';

const Shield = () => (
  <svg width="78" height="88" viewBox="0 0 90 102">
    <path d="M45 5L82 20V49C82 73 66 91 45 98C24 91 8 73 8 49V20Z" fill="rgba(34,240,208,.14)" stroke={colors.mint} strokeWidth="6" />
    <path d="M28 50L40 62L64 36" fill="none" stroke={colors.lightMint} strokeWidth="7" strokeLinecap="round" />
  </svg>
);

const DeviceIcon: React.FC<{kind: 'phone' | 'laptop' | 'tablet'}> = ({kind}) => (
  <div style={{width: kind === 'laptop' ? 112 : kind === 'tablet' ? 78 : 58, height: kind === 'laptop' ? 72 : kind === 'tablet' ? 100 : 108, border: `4px solid ${colors.lightMint}`, borderRadius: kind === 'laptop' ? 9 : 14, position: 'relative'}}>
    {kind === 'laptop' && <div style={{position: 'absolute', width: 134, height: 6, background: colors.lightMint, left: -15, bottom: -12, borderRadius: 8}} />}
  </div>
);

export const BenefitsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{paddingTop: layout.top, boxSizing: 'border-box', alignItems: 'center'}}>
      <div style={{width: layout.contentWidth, fontFamily: unbounded, fontWeight: 800, fontSize: 58, lineHeight: 1.1, letterSpacing: -2, color: colors.white, textAlign: 'center'}}>
        СВЯЗЬ ПОД ВАШ
        <br />
        <span style={{color: colors.mint}}>РИТМ ЖИЗНИ</span>
      </div>
      <div style={{height: 440, marginTop: 8, scale: .74}}>
        <MapNetwork />
      </div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, height: 120, marginTop: -28, opacity: interpolate(frame, [25, 48], [0, 1], {extrapolateRight: 'clamp'})}}>
        <DeviceIcon kind="phone" />
        <DeviceIcon kind="laptop" />
        <DeviceIcon kind="tablet" />
        <Shield />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 14, width: layout.contentWidth, marginTop: 32}}>
        {['Несколько локаций', 'Современные протоколы', 'Разные устройства'].map((text, index) => (
          <div
            key={text}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '19px 26px',
              borderRadius: 23,
              background: 'rgba(5,15,16,.84)',
              border: `1px solid ${colors.line}`,
              boxShadow: '0 18px 50px rgba(0,0,0,.24)',
              opacity: interpolate(frame, [18 + index * 10, 30 + index * 10], [0, 1], {extrapolateRight: 'clamp'}),
              translate: `${interpolate(frame, [18 + index * 10, 34 + index * 10], [-40, 0], {extrapolateRight: 'clamp'})}px 0`,
            }}
          >
            <div style={{width: 16, height: 16, flex: '0 0 auto', borderRadius: '50%', background: colors.mint, boxShadow: '0 0 22px rgba(34,240,208,.55)'}} />
            <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 33, color: colors.white}}>{text}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

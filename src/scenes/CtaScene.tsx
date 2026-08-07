import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMascot} from '../components/BrandMascot';
import {colors} from '../theme/colors';
import {layout} from '../theme/layout';
import {manrope, unbounded} from '../theme/fonts';

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 18, stiffness: 105}});
  const glow = interpolate(Math.sin(frame / 18), [-1, 1], [.11, .20]);

  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: layout.top, boxSizing: 'border-box'}}>
      <div style={{position: 'absolute', width: 620, height: 620, borderRadius: '50%', background: colors.mint, filter: 'blur(170px)', opacity: glow, top: 240}} />
      <div style={{height: 420, scale: interpolate(reveal, [0, 1], [.8, 1]), opacity: reveal}}>
        <BrandMascot size={420} calm />
      </div>
      <div style={{width: layout.contentWidth, fontFamily: unbounded, fontWeight: 800, fontSize: 64, letterSpacing: -3, color: colors.white, marginTop: 24, textAlign: 'center'}}>
        GhostPepe<span style={{color: colors.mint}}>Bot</span>
      </div>
      <div style={{width: layout.contentWidth, fontFamily: unbounded, fontWeight: 700, fontSize: 48, lineHeight: 1.18, color: colors.white, textAlign: 'center', marginTop: 24}}>
        Интернет без
        <br />
        <span style={{color: colors.lightMint}}>лишней возни</span>
      </div>
      <div
        style={{
          width: layout.contentWidth,
          height: 110,
          borderRadius: 30,
          display: 'grid',
          placeItems: 'center',
          background: colors.mint,
          color: colors.background,
          border: '1px solid rgba(140,255,233,.82)',
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 48,
          marginTop: 46,
          boxShadow: '0 22px 70px rgba(34,240,208,.22)',
          scale: interpolate(reveal, [0, 1], [.94, 1]),
        }}
      >
        Подключить в Telegram
      </div>
    </AbsoluteFill>
  );
};

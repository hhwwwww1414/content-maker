import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMascot} from '../components/BrandMascot';
import {colors} from '../theme/colors';
import {layout} from '../theme/layout';
import {manrope, unbounded} from '../theme/fonts';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 17, stiffness: 125, mass: .8}});

  return (
    <AbsoluteFill style={{alignItems: 'center', paddingTop: layout.top, boxSizing: 'border-box'}}>
      <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 28, letterSpacing: 6, color: colors.mint, opacity: interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'})}}>
        ЗАЩИЩЁННЫЙ ДОСТУП
      </div>
      <div style={{marginTop: 34, scale: interpolate(reveal, [0, 1], [.68, 1]), opacity: reveal}}>
        <BrandMascot size={500} />
      </div>
      <div style={{width: layout.contentWidth, marginTop: 34, textAlign: 'center', opacity: interpolate(frame, [14, 28], [0, 1], {extrapolateRight: 'clamp'}), translate: `0 ${interpolate(frame, [14, 32], [45, 0], {extrapolateRight: 'clamp'})}px`}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 66, letterSpacing: -3, color: colors.white}}>
          GhostPepe<span style={{color: colors.mint}}>Bot</span>
        </div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 46, color: colors.lightMint, marginTop: 18}}>ВСЁ ПРОЩЕ</div>
      </div>
    </AbsoluteFill>
  );
};

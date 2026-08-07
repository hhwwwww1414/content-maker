import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';
import {graveyardLayout} from '../theme/layout';

export const GraveyardCtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 24, stiffness: 75, mass: 1.1}});
  const glow = interpolate(Math.sin(frame / 42), [-1, 1], [0.16, 0.26]);
  const floatY = Math.sin(frame / 68) * 2;

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.6} />
      <AbsoluteFill style={{left: graveyardLayout.safeLeft, right: 1080 - graveyardLayout.safeRight, width: 'auto', top: graveyardLayout.safeTop, bottom: 1920 - graveyardLayout.safeBottom, height: 'auto', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', width: 560, height: 560, borderRadius: '50%', background: colors.mint, filter: 'blur(170px)', opacity: glow}} />
        <div style={{scale: interpolate(reveal, [0, 1], [0.82, 1]), opacity: reveal, translate: `0 ${floatY}px`}}>
          <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 340, height: 340, objectFit: 'contain'}} />
        </div>
        <div style={{fontFamily: unbounded, fontWeight: 500, fontSize: 34, color: colors.lightMint, marginTop: 18, textAlign: 'center'}}>Интернет без лишней возни</div>
        <div
          style={{
            width: 640,
            height: 106,
            borderRadius: 30,
            display: 'grid',
            placeItems: 'center',
            background: colors.mint,
            color: colors.background,
            border: '1px solid rgba(140,255,233,.85)',
            fontFamily: manrope,
            fontWeight: 800,
            fontSize: 40,
            marginTop: 34,
            boxShadow: `0 22px 70px rgba(34,240,208,${0.2 + glow})`,
            scale: interpolate(reveal, [0, 1], [0.94, 1]),
          }}
        >
          Подключить в Telegram
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

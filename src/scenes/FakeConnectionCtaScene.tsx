import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CyberBackground} from '../components/CyberBackground';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

export const FakeConnectionCtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 24, stiffness: 75, mass: 1.1}});
  const glow = interpolate(Math.sin(frame / 42), [-1, 1], [0.16, 0.26]);

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.5} />
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
        <div style={{position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: colors.mint, filter: 'blur(160px)', opacity: glow}} />
        <div style={{scale: interpolate(reveal, [0, 1], [0.82, 1]), opacity: reveal}}>
          <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain'}} />
        </div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 44, color: colors.lightMint, marginTop: 22, textAlign: 'center'}}>
          Интернет без лишней возни
        </div>
        <div
          style={{
            width: 620,
            height: 104,
            borderRadius: 30,
            display: 'grid',
            placeItems: 'center',
            background: colors.mint,
            color: colors.background,
            border: '1px solid rgba(140,255,233,.85)',
            fontFamily: manrope,
            fontWeight: 800,
            fontSize: 34,
            marginTop: 34,
            boxShadow: `0 22px 70px rgba(34,240,208,${0.2 + glow})`,
            scale: interpolate(reveal, [0, 1], [0.94, 1]),
            textAlign: 'center',
          }}
        >
          ПОДКЛЮЧИТЬ В TELEGRAM
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

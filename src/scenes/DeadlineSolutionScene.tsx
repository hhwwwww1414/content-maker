import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandMascot} from '../components/BrandMascot';
import {ConnectionLine} from '../components/ConnectionLine';
import {CyberBackground} from '../components/CyberBackground';
import {SubscriptionCard} from '../components/SubscriptionCard';
import {TelegramBotCard} from '../components/TelegramBotCard';
import {VpnClientCard} from '../components/VpnClientCard';
import {colors} from '../theme/colors';
import {manrope} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';

const STEPS = ['TELEGRAM', 'ПОДПИСКА', 'ПОДКЛЮЧЕНО'];

export const DeadlineSolutionScene: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = spring({frame, fps, config: {damping: 22, stiffness: 90, mass: 1}});
  const redFade = interpolate(frame, [0, 30], [0.4, 0], {extrapolateRight: 'clamp'});
  const glow = interpolate(Math.sin(frame / 40), [-1, 1], [0.16, 0.28]);

  const telegramPress = Math.round(durationInFrames * 0.26);
  const subEnter = Math.round(durationInFrames * 0.34);
  const subCopy = Math.round(durationInFrames * 0.56);
  const clientEnter = Math.round(durationInFrames * 0.68);
  const connectFrame = Math.max(10, Math.round((durationInFrames - clientEnter) * 0.28));

  const phase = frame < subEnter ? 0 : frame < clientEnter ? 1 : 2;

  return (
    <AbsoluteFill>
      <CyberBackground mode="mint" intensity={0.6} />
      <AbsoluteFill style={{background: `rgba(120,26,24,${redFade})`}} />
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
        <div style={{position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: colors.mint, filter: 'blur(120px)', opacity: glow, top: -40}} />
        <div
          style={{
            scale: interpolate(reveal, [0, 1], [0.82, 1]),
            opacity: reveal,
            filter: `blur(${interpolate(reveal, [0, 1], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
          }}
        >
          <BrandMascot size={220} calm />
        </div>
        <div style={{display: 'flex', marginTop: 26, gap: 10, justifyContent: 'center'}}>
          {STEPS.map((step, index) => (
            <div
              key={step}
              style={{
                fontFamily: manrope,
                fontWeight: 800,
                fontSize: 19,
                color: index <= phase ? colors.background : colors.gray,
                background: index <= phase ? colors.mint : 'rgba(155,168,165,.10)',
                border: index <= phase ? '1px solid rgba(140,255,233,.7)' : '1px solid rgba(140,255,233,.12)',
                borderRadius: 16,
                padding: '11px 16px',
                whiteSpace: 'nowrap',
              }}
            >
              {step}
            </div>
          ))}
        </div>
        <div style={{marginTop: 8, opacity: 0.9}}>
          <ConnectionLine progress={Math.min(1, frame / clientEnter)} stable={frame >= clientEnter + connectFrame} />
        </div>
        <div style={{marginTop: 6, position: 'relative', width: 680, height: 300}}>
          <Sequence from={0} durationInFrames={subEnter} layout="none">
            <div style={{position: 'absolute', inset: 0}}>
              <TelegramBotCard pressFrame={telegramPress} />
            </div>
          </Sequence>
          <Sequence from={subEnter} durationInFrames={clientEnter - subEnter} layout="none">
            <div style={{position: 'absolute', inset: 0}}>
              <SubscriptionCard copyFrame={subCopy - subEnter} />
            </div>
          </Sequence>
          <Sequence from={clientEnter} layout="none">
            <div style={{position: 'absolute', inset: 0}}>
              <VpnClientCard connectFrame={connectFrame} />
            </div>
          </Sequence>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

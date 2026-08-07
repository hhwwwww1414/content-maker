import {Audio} from '@remotion/media';
import type {TikTokPage} from '@remotion/captions';
import type {ReactNode} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captions from '../generated/captions-dual-internet.json';
import {CaptionPage} from '../components/CaptionPage';
import {NetworkMixer} from '../components/dual-internet/NetworkMixer';
import {NetworkChannelStrip} from '../components/dual-internet/NetworkChannelStrip';
import {MasterNetworkFader} from '../components/dual-internet/MasterNetworkFader';
import {DualRouteSplitter} from '../components/dual-internet/DualRouteSplitter';
import {RoutingBus} from '../components/dual-internet/RoutingBus';
import {EqualizerMascotReveal} from '../components/dual-internet/EqualizerMascotReveal';
import {BalancedNetworkWave} from '../components/dual-internet/BalancedNetworkWave';
import {CH, MIXER} from '../components/dual-internet/console';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {trafficJamLayout} from '../theme/layout';
import {dualInternetFrames as beats} from './dualInternetSceneFrames';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;
const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Headline in the upper-central safe area (x 110-820), above the console. */
const HeroText: React.FC<{top: number; opacity: number; size?: number; color?: string; children: ReactNode}> = ({
  top,
  opacity,
  size = 52,
  color = colors.white,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 110,
      top,
      width: 710,
      zIndex: 30,
      textAlign: 'center',
      fontFamily: unbounded,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.12,
      letterSpacing: -1.4,
      textTransform: 'uppercase',
      color,
      opacity,
      translate: `0 ${interpolate(opacity, [0, 1], [10, 0], OUT)}px`,
      textShadow: color === colors.mint ? '0 0 32px rgba(34,240,208,.36)' : '0 5px 28px rgba(0,0,0,.78)',
    }}
  >
    {children}
  </div>
);

export const GhostPepeDualInternetReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pages = captions as TikTokPage[];

  // --- One coherent virtual camera -------------------------------------------
  const cameraScale = interpolate(
    frame,
    [0, beats.s2a, beats.s3a, beats.s4a, beats.s5a, beats.durationInFrames],
    [1.0, 1.055, 1.05, 1.07, 1.0, 0.95],
    EASE,
  );
  const cameraY = interpolate(
    frame,
    [0, beats.s2a, beats.s3a, beats.s4a, beats.s5a, beats.durationInFrames],
    [-4, 14, 34, 26, -12, -44],
    EASE,
  );

  // --- Master bias, tracking the voiceover: rises to WORLD (VPN ON) through the
  // hook and "с включённым VPN … может ограничивать доступ", then swings to LOCAL
  // (VPN OFF) on "выключаешь и наоборот" — one switch forcing the choice.
  const masterBias = interpolate(
    frame,
    [0, 30, 62, 185, 212, beats.s3a],
    [0.46, 0.8, 0.82, 0.8, 0.2, 0.28],
    EASE,
  );

  // --- Split into independent routes (scene 3) --------------------------------
  const split = interpolate(frame, [beats.s3a + 6, beats.s3c], [0, 1], EASE);
  const masterOpacity = interpolate(frame, [beats.s3c - 6, beats.s3c + 20], [1, 0], EASE);
  const splitterOn = interpolate(frame, [beats.s3a + 8, beats.s3c], [0, 1], EASE);

  // Channel levels: coupled before the split, independent & stable after.
  const coupledLocal = 0.16 + 0.8 * (1 - masterBias);
  const coupledWorld = 0.16 + 0.8 * masterBias;
  const indepLocal = 0.78 + 0.03 * Math.sin(frame * 0.1);
  const indepWorld = 0.82 + 0.03 * Math.sin(frame * 0.1 + 1.5);
  const localLevel = lerp(coupledLocal, indepLocal, split);
  const worldLevel = lerp(coupledWorld, indepWorld, split);
  // Amber warning on whichever channel is being starved (scenes 1-2 only).
  const localWarn = interpolate(localLevel, [0.2, 0.4], [1, 0], CLAMP) * (1 - split);
  const worldWarn = interpolate(worldLevel, [0.2, 0.4], [1, 0], CLAMP) * (1 - split);

  const busActive = interpolate(frame, [beats.s3b, beats.s3c + 20], [0, 1], EASE);

  // --- Console fade for the finale --------------------------------------------
  const consoleOpacity = interpolate(frame, [0, 22], [0, 1], EASE) * interpolate(frame, [beats.s5a - 4, beats.s5a + 32], [1, 0.1], EASE);

  // --- Mascot equalizer reveal (scene 4) --------------------------------------
  const mascotReveal = interpolate(frame, [beats.s4a - 6, beats.s4c + 6], [0, 1], EASE);

  // --- Balanced finale wave ---------------------------------------------------
  const balancedProgress = interpolate(frame, [beats.s5a, beats.s5a + 42], [0, 1], EASE);
  const balancedOpacity = interpolate(frame, [beats.s5a - 4, beats.s5a + 22], [0, 1], EASE);

  // --- Text beats -------------------------------------------------------------
  const hookText = interpolate(frame, [6, 18, beats.s2a - 8, beats.s2a + 2], [0, 1, 1, 0], EASE);
  const sc3a = interpolate(frame, [beats.s3a + 4, beats.s3a + 20, beats.s3c + 8, beats.s3c + 20], [0, 1, 1, 0], EASE);
  const sc3b = interpolate(frame, [beats.s3a + 20, beats.s3a + 34, beats.s3c + 8, beats.s3c + 20], [0, 1, 1, 0], EASE);
  const sc4 = interpolate(frame, [beats.s4a + 8, beats.s4a + 24, beats.s4c + 6, beats.s4c + 18], [0, 1, 1, 0], EASE);

  const ctaBrand = interpolate(frame, [beats.s5a + 6, beats.s5a + 28], [0, 1], OUT);
  const ctaLine = interpolate(frame, [beats.s5a + 16, beats.s5a + 40], [0, 1], OUT);
  const ctaBtn = interpolate(frame, [beats.s5b - 2, beats.s5b + 24], [0, 1], OUT);

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep, overflow: 'hidden'}}>
      {/* Official background */}
      <Img
        src={staticFile('assets/backgrounds/cyberspace-dark.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: interpolate(frame, [0, beats.s3a, beats.s5a, beats.durationInFrames], [0.4, 0.3, 0.4, 0.72], EASE),
          scale: String(interpolate(frame, [0, beats.durationInFrames], [1.07, 1.02], EASE)),
        }}
      />
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse at 50% 44%, rgba(16,64,58,.2), rgba(3,7,8,.72) 58%, rgba(2,4,5,.96) 100%)'}}
      />

      {/* ---------------- Console world under one camera ---------------- */}
      <AbsoluteFill style={{translate: `0 ${cameraY}px`, scale: String(cameraScale), transformOrigin: '480px 860px', zIndex: 10}}>
        <div style={{opacity: consoleOpacity}}>
          <NetworkMixer frame={frame} opacity={1} />
          <NetworkChannelStrip
            frame={frame}
            x={MIXER.localX}
            level={localLevel}
            labels={['LOCAL', 'DIRECT', 'RU']}
            core={CH.localCore}
            glow={CH.localGlow}
            seed={7}
            warn={localWarn}
          />
          <NetworkChannelStrip
            frame={frame}
            x={MIXER.worldX}
            level={worldLevel}
            labels={['WORLD', 'EXTERNAL', 'ROUTE']}
            core={CH.worldCore}
            glow={CH.worldGlow}
            seed={19}
            warn={worldWarn}
          />
          <MasterNetworkFader frame={frame} bias={masterBias} split={split} opacity={masterOpacity} />
          <DualRouteSplitter frame={frame} progress={splitterOn} localBias={indepLocal} worldBias={indepWorld} />
          <RoutingBus frame={frame} active={busActive} localLevel={localLevel} worldLevel={worldLevel} />
        </div>
      </AbsoluteFill>

      {/* ---------------- Finale balanced wave ---------------- */}
      <BalancedNetworkWave frame={frame} progress={balancedProgress} cy={1178} opacity={balancedOpacity} amplitude={0.8} />

      {/* ---------------- Mascot: equalizer reveal, left of centre ---------------- */}
      <div style={{position: 'absolute', inset: 0, zIndex: 20}}>
        <EqualizerMascotReveal
          frame={frame}
          progress={mascotReveal}
          left={205}
          width={330}
          top={648}
          height={300}
          mascotSrc={staticFile('assets/mascot/ghostpepe-main.png')}
          mascotSize={266}
        />
      </div>

      {/* ---------------- Scene 1: hook ---------------- */}
      <HeroText top={270} opacity={hookText} size={50}>
        Включил <span style={{color: colors.mint}}>VPN</span>
        <br />
        почему пропало
        <br />
        другое?
      </HeroText>

      {/* ---------------- Scene 3: not choose, separate ---------------- */}
      <HeroText top={292} opacity={sc3a} size={54}>
        Не выбирать
      </HeroText>
      <HeroText top={360} opacity={sc3b} size={54} color={colors.mint}>
        а разделять
      </HeroText>

      {/* ---------------- Scene 4: each traffic its own route ---------------- */}
      <HeroText top={300} opacity={sc4} size={50}>
        Каждому трафику
        <br />
        <span style={{color: colors.mint}}>свой маршрут</span>
      </HeroText>

      {/* ---------------- Scene 5: final ---------------- */}
      <div style={{position: 'absolute', inset: 0, zIndex: 30}}>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 986,
            width: 710,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: -1,
            color: colors.white,
            opacity: ctaBrand,
            translate: `0 ${interpolate(ctaBrand, [0, 1], [10, 0], OUT)}px`,
          }}
        >
          {' '}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 1058,
            width: 710,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 40,
            lineHeight: 1.16,
            letterSpacing: -1.2,
            textTransform: 'uppercase',
            color: colors.white,
            opacity: ctaLine,
            translate: `0 ${interpolate(ctaLine, [0, 1], [10, 0], OUT)}px`,
          }}
        >
          Никаких постоянных
          <br />
          <span style={{color: colors.mint}}>переключений</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 205,
            top: 1216,
            width: 670,
            padding: '24px 0',
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: colors.bgDeep,
            background: `linear-gradient(180deg, ${colors.lightMint}, ${colors.mint})`,
            borderRadius: 40,
            opacity: ctaBtn,
            transform: `scale(${interpolate(ctaBtn, [0, 1], [0.92, 1], OUT)})`,
            boxShadow: '0 16px 54px rgba(34,240,208,.32)',
          }}
        >
          Настроить свой маршрут
        </div>
      </div>

      {/* ---------------- Captions ---------------- */}
      <AbsoluteFill style={{zIndex: 40}}>
        {pages.map((page, index) => {
          const startFrame = Math.round((page.startMs / 1000) * fps) + 1;
          const durationInFrames = Math.max(1, Math.round((page.durationMs / 1000) * fps) - 1);
          return (
            <Sequence key={`${page.startMs}-${index}`} from={startFrame} durationInFrames={durationInFrames} premountFor={fps}>
              <CaptionPage page={page} layout={trafficJamLayout} riseIn steadyWords fontSize={46} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {/* ---------------- Sound ---------------- */}
      <Audio src={staticFile('generated/ambient.wav')} loop volume={(f) => Math.min(0.04, (f / (fps * 2)) * 0.04)} />
      <Audio src={staticFile('generated/voiceover-dual-internet.wav')} volume={1} />
      <Sequence from={beats.s3a - 4} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.06} />
      </Sequence>
      <Sequence from={beats.s4a - 4} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.06} />
      </Sequence>
      <Sequence from={beats.s5a - 4} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.05} />
      </Sequence>
    </AbsoluteFill>
  );
};

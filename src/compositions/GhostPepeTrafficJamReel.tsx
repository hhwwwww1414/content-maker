import {Audio} from '@remotion/media';
import type {TikTokPage} from '@remotion/captions';
import type {ReactNode} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captions from '../generated/captions-traffic-jam.json';
import {CaptionPage} from '../components/CaptionPage';
import {DataHighway} from '../components/traffic-jam/DataHighway';
import {TrafficLane} from '../components/traffic-jam/TrafficLane';
import {ExpressLane} from '../components/traffic-jam/ExpressLane';
import {FlowMerge} from '../components/traffic-jam/FlowMerge';
import {TrafficDissolve} from '../components/traffic-jam/TrafficDissolve';
import {RoadLightTrace} from '../components/traffic-jam/RoadLightTrace';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {trafficJamLayout} from '../theme/layout';
import {trafficJamFrames as beats} from './trafficJamSceneFrames';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;
const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

/** Headline sitting in the upper-central safe area (x 110-820, above the road). */
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
      letterSpacing: -1.6,
      textTransform: 'uppercase',
      color,
      opacity,
      translate: `0 ${interpolate(opacity, [0, 1], [12, 0], OUT)}px`,
      textShadow: color === colors.mint ? '0 0 34px rgba(34,240,208,.4)' : '0 6px 32px rgba(0,0,0,.8)',
    }}
  >
    {children}
  </div>
);

/** A calm mint wave that passes across the mascot area while it assembles. */
const MintRevealWave: React.FC<{frame: number; reveal: number}> = ({frame, reveal}) => {
  if (reveal <= 0.001 || reveal >= 0.999) return null;
  const passes = [0, 0.36, 0.72];
  return (
    <div style={{position: 'absolute', left: 120, top: 560, width: 500, height: 380, pointerEvents: 'none', overflow: 'visible'}}>
      {passes.map((offset, i) => {
        const local = ((reveal + offset) % 1 + 1) % 1;
        const x = interpolate(local, [0, 1], [-120, 520], CLAMP);
        const o = Math.sin(local * Math.PI) * 0.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: 0,
              width: 120,
              height: 380,
              background: `linear-gradient(90deg, rgba(34,240,208,0), rgba(34,240,208,${o.toFixed(3)}), rgba(34,240,208,0))`,
              filter: 'blur(10px)',
              transform: `skewX(-8deg)`,
            }}
          />
        );
      })}
    </div>
  );
};

export const GhostPepeTrafficJamReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pages = captions as TikTokPage[];

  // --- One continuous camera descending along the highway --------------------
  const cameraScale = interpolate(
    frame,
    [0, beats.jamA, beats.heroA, beats.flowA, beats.flowB, beats.ctaA, beats.durationInFrames],
    [0.98, 1.02, 1.05, 1.06, 1.03, 1.0, 0.99],
    EASE,
  );
  const cameraY = interpolate(
    frame,
    [0, beats.jamA, beats.heroA, beats.flowA, beats.ctaA, beats.durationInFrames],
    [-18, 8, -4, -34, 8, 16],
    EASE,
  );

  // --- Global traffic state ---------------------------------------------------
  const lightsMint = interpolate(frame, [196, 266], [0, 1], EASE); // road contours red -> mint
  const clearing = interpolate(frame, [300, 362], [0, 1], EASE); // lower road lightens
  const brake = interpolate(frame, [0, 8, 292, 344], [1, 1, 1, 0], EASE); // capsule stop-lights
  const capMint = interpolate(frame, [300, 362], [0, 1], EASE);
  const roll = interpolate(frame, [300, 374], [0, 1], EASE); // capsules start moving
  const laneLabel = interpolate(frame, [beats.jamA, beats.jamA + 16, beats.jamC + 26, beats.heroA - 4], [0, 1, 1, 0], EASE);

  // Highway recedes as the finale background takes over.
  const worldFade = interpolate(frame, [beats.ctaA + 6, beats.ctaB + 24], [1, 0.12], EASE);
  const laneOpacity = interpolate(frame, [6, 26], [0, 1], EASE) * worldFade;

  // --- Express lane / flow ----------------------------------------------------
  const expReveal = interpolate(frame, [250, 302], [0, 1], EASE);
  const expFlow = interpolate(frame, [300, 344], [0, 1], EASE);
  const expCollapse = interpolate(frame, [beats.ctaA - 4, beats.ctaA + 44], [0, 1], EASE);
  const expOpacity = interpolate(frame, [250, 300, beats.ctaB + 18, beats.ctaB + 48], [0, 1, 1, 0], EASE);
  const mergeProgress = interpolate(frame, [298, 374], [0, 1], EASE);
  const mergeOpacity = interpolate(frame, [298, 310, beats.ctaA - 2, beats.ctaA + 18], [0, 1, 1, 0], EASE);
  const dissolve = interpolate(frame, [300, 374], [0, 1], EASE);
  const traceIntensity = interpolate(frame, [312, 342, beats.ctaA, beats.ctaA + 30], [0, 1, 1, 0], EASE);

  // --- Mascot -----------------------------------------------------------------
  const mascotReveal = interpolate(frame, [beats.heroA - 4, beats.heroB + 8], [0, 1], EASE);
  const mascotFloat = Math.sin(frame * 0.03) * 6;

  // --- Text beats -------------------------------------------------------------
  const hookText = interpolate(frame, [6, 16, beats.jamA - 8, beats.jamA + 4], [0, 1, 1, 0], EASE);
  const jamText = interpolate(frame, [beats.jamB - 6, beats.jamB + 12, beats.heroA - 10, beats.heroA + 2], [0, 1, 1, 0], EASE);
  const heroText = interpolate(frame, [beats.heroB - 4, beats.heroB + 16, beats.flowA - 8, beats.flowA + 4], [0, 1, 1, 0], EASE);
  const flowText = interpolate(frame, [beats.flowB - 6, beats.flowB + 14, beats.ctaA - 8, beats.ctaA + 2], [0, 1, 1, 0], EASE);

  const ctaLine = interpolate(frame, [beats.ctaA + 8, beats.ctaA + 32], [0, 1], OUT);
  const ctaUnderline = interpolate(frame, [beats.ctaA + 24, beats.ctaB + 8], [0, 1], OUT);
  const ctaButton = interpolate(frame, [beats.ctaB - 2, beats.ctaB + 22], [0, 1], OUT);

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep, overflow: 'hidden'}}>
      {/* Official background: held back under the highway world, re-forming for the finale. */}
      <Img
        src={staticFile('assets/backgrounds/cyberspace-dark.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: interpolate(frame, [0, beats.heroA, beats.ctaA, beats.durationInFrames], [0.4, 0.3, 0.44, 0.74], EASE),
          scale: String(interpolate(frame, [0, beats.durationInFrames], [1.08, 1.02], EASE)),
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 46%, rgba(16,64,58,.22), rgba(3,7,8,.7) 56%, rgba(2,4,5,.96) 100%)',
        }}
      />

      {/* ---------------- One continuous highway world under one camera ---------------- */}
      <AbsoluteFill
        style={{translate: `0 ${cameraY}px`, scale: String(cameraScale), transformOrigin: '480px 900px', zIndex: 10}}
      >
        <div style={{opacity: laneOpacity}}>
          <DataHighway frame={frame} lightsMint={lightsMint} clearing={clearing} />
          <TrafficLane
            frame={frame}
            laneIndex={0}
            laneOffset={-300}
            widthNear={165}
            brake={brake}
            mint={capMint}
            roll={roll}
            opacity={1}
            label="ЗАПРОСЫ"
            labelOpacity={laneLabel}
            labelP={0.5}
          />
          <TrafficLane
            frame={frame}
            laneIndex={1}
            laneOffset={0}
            widthNear={182}
            brake={brake}
            mint={capMint}
            roll={roll}
            opacity={1}
            label="ВИДЕО"
            labelOpacity={laneLabel}
            labelP={0.68}
          />
          <TrafficLane
            frame={frame}
            laneIndex={2}
            laneOffset={300}
            widthNear={165}
            brake={brake}
            mint={capMint}
            roll={roll}
            opacity={1}
            label="СООБЩЕНИЯ"
            labelOpacity={laneLabel}
            labelP={0.8}
          />
        </div>

        <TrafficDissolve frame={frame} progress={dissolve} />
        <div style={{opacity: worldFade}}>
          <ExpressLane frame={frame} reveal={expReveal} flow={expFlow} collapse={expCollapse} opacity={expOpacity} />
          <FlowMerge frame={frame} progress={mergeProgress} opacity={mergeOpacity} />
          <RoadLightTrace frame={frame} intensity={traceIntensity} />
        </div>
      </AbsoluteFill>

      {/* ---------------- Mascot: calm flow dispatcher, left of centre ---------------- */}
      <div style={{position: 'absolute', inset: 0, zIndex: 24}}>
        <MintRevealWave frame={frame} reveal={mascotReveal} />
        <div
          style={{
            position: 'absolute',
            left: 190,
            top: 566 + mascotFloat,
            width: 300,
            height: 300,
            opacity: mascotReveal,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '52%',
              width: 300,
              height: 300,
              transform: 'translate(-50%,-50%)',
              borderRadius: '50%',
              background: colors.mint,
              opacity: 0.16 * mascotReveal,
              filter: 'blur(70px)',
            }}
          />
          <Img
            src={staticFile('assets/mascot/ghostpepe-main.png')}
            style={{
              position: 'relative',
              width: 300,
              height: 300,
              objectFit: 'contain',
              filter: `blur(${interpolate(mascotReveal, [0, 1], [10, 0], CLAMP)}px)`,
              scale: String(interpolate(mascotReveal, [0, 1], [0.9, 1], OUT)),
            }}
          />
        </div>
      </div>

      {/* ---------------- Scene 1: viral hook ---------------- */}
      <HeroText top={296} opacity={hookText} size={58}>
        Твой интернет
        <br />
        <span style={{color: colors.mint}}>стоит в пробке</span>
      </HeroText>

      {/* ---------------- Scene 2: data present, no movement ---------------- */}
      <HeroText top={300} opacity={jamText} size={56}>
        Данные есть
        <br />
        <span style={{color: colors.error}}>движения нет</span>
      </HeroText>

      {/* ---------------- Scene 3: not noise, free flow ---------------- */}
      <HeroText top={300} opacity={heroText} size={52}>
        Нужен не шум
        <br />
        <span style={{color: colors.mint}}>а свободный поток</span>
      </HeroText>

      {/* ---------------- Scene 4: traffic moves again ---------------- */}
      <HeroText top={306} opacity={flowText} size={60}>
        Трафик
        <br />
        <span style={{color: colors.mint}}>снова идёт</span>
      </HeroText>

      {/* ---------------- Scene 5: final CTA ---------------- */}
      <div style={{position: 'absolute', inset: 0, zIndex: 30}}>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 984,
            width: 710,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 48,
            lineHeight: 1.14,
            letterSpacing: -1.6,
            textTransform: 'uppercase',
            color: colors.white,
            opacity: ctaLine,
            translate: `0 ${interpolate(ctaLine, [0, 1], [12, 0], OUT)}px`,
          }}
        >
          Выйди из
          <br />
          <span style={{color: colors.mint}}>цифровой пробки</span>
        </div>
        {/* the express lane settling into a single stable mint underline */}
        <div
          style={{
            position: 'absolute',
            left: 465 - 150 * ctaUnderline,
            top: 1118,
            width: 300 * ctaUnderline,
            height: 4,
            borderRadius: 4,
            background: colors.mint,
            opacity: ctaUnderline,
            boxShadow: '0 0 20px rgba(34,240,208,.7)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: 1168,
            width: 630,
            padding: '26px 0',
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: colors.bgDeep,
            background: `linear-gradient(180deg, ${colors.lightMint}, ${colors.mint})`,
            borderRadius: 42,
            opacity: ctaButton,
            transform: `scale(${interpolate(ctaButton, [0, 1], [0.9, 1], OUT)})`,
            boxShadow: '0 18px 60px rgba(34,240,208,.34)',
          }}
        >
          Открыть в Telegram
        </div>
      </div>

      {/* ---------------- Captions ---------------- */}
      <AbsoluteFill style={{zIndex: 40}}>
        {pages.map((page, index) => {
          const startFrame = Math.round((page.startMs / 1000) * fps) + 1;
          const durationInFrames = Math.max(1, Math.round((page.durationMs / 1000) * fps) - 1);
          return (
            <Sequence key={`${page.startMs}-${index}`} from={startFrame} durationInFrames={durationInFrames} premountFor={fps}>
              <CaptionPage page={page} layout={trafficJamLayout} riseIn steadyWords fontSize={48} />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {/* ---------------- Sound ---------------- */}
      <Audio src={staticFile('generated/ambient.wav')} loop volume={(f) => Math.min(0.04, (f / (fps * 2)) * 0.04)} />
      <Audio src={staticFile('generated/voiceover-traffic-jam.wav')} volume={1} />
      <Sequence from={beats.heroA - 6} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.06} />
      </Sequence>
      <Sequence from={beats.flowA - 4} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.07} />
      </Sequence>
      <Sequence from={beats.ctaB - 4} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.05} />
      </Sequence>
    </AbsoluteFill>
  );
};

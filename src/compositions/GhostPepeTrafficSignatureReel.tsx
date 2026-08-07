import {Audio} from '@remotion/media';
import type {TikTokPage} from '@remotion/captions';
import type {ReactNode} from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captions from '../generated/captions-traffic-signature.json';
import {CaptionPage} from '../components/CaptionPage';
import {EncryptedDataCapsule} from '../components/traffic-signature/EncryptedDataCapsule';
import {TrafficTrace} from '../components/traffic-signature/TrafficTrace';
import {PatternComparison} from '../components/traffic-signature/PatternComparison';
import {TrafficDimensionMarker} from '../components/traffic-signature/TrafficDimensionMarker';
import {RhythmIntervalMarker} from '../components/traffic-signature/RhythmIntervalMarker';
import {ReflectionMascotReveal} from '../components/traffic-signature/ReflectionMascotReveal';
import {ForensicFocusLock} from '../components/traffic-signature/ForensicFocusLock';
import {FinalSignatureLine} from '../components/traffic-signature/FinalSignatureLine';
import {CLAMP, EASE, OUT, tsColors} from '../components/traffic-signature/trafficSignatureConfig';
import {unbounded} from '../theme/fonts';
import {trafficJamLayout} from '../theme/layout';
import {tsFrames as F} from './trafficSignatureSceneFrames';

const LANE_Y = 852;

/** Upper-central headline. Never reflows; opacity/translate only. */
const HeroText: React.FC<{top: number; opacity: number; size?: number; color?: string; children: ReactNode}> = ({
  top,
  opacity,
  size = 56,
  color = tsColors.white,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 110,
      top,
      width: 700,
      textAlign: 'center',
      fontFamily: unbounded,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.1,
      letterSpacing: -1.6,
      textTransform: 'uppercase',
      color,
      opacity,
      translate: `0 ${interpolate(opacity, [0, 1], [8, 0], OUT)}px`,
      textShadow: color === tsColors.mint ? '0 0 34px rgba(34,240,208,.4)' : '0 5px 26px rgba(0,0,0,.8)',
    }}
  >
    {children}
  </div>
);

export const GhostPepeTrafficSignatureReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pages = captions as TikTokPage[];

  // ---------------- ONE COHERENT CAMERA: slow, <=3deg drift ----------------
  const cameraScale = interpolate(frame, [0, F.s2a, F.s4a, F.s5a, F.durationInFrames], [1.0, 1.03, 1.05, 1.0, 0.95], EASE);
  const cameraY = interpolate(frame, [0, F.s2a, F.s4a, F.s5a, F.durationInFrames], [-6, 12, 16, -8, -40], EASE);
  const cameraRot = interpolate(frame, [0, F.s4a, F.durationInFrames], [-0.5, 0.4, -0.7], EASE);

  // ---------------- Ambient fog (deterministic) ----------------
  const fog1 = 0.5 + 0.5 * Math.sin(frame * 0.014);
  const fog2 = 0.5 + 0.5 * Math.sin(frame * 0.011 + 2);

  // =================== SCENE 1 — HOOK ===================
  const cap1X = interpolate(frame, [0, 40], [470, 1190], EASE);
  const cap1Op = interpolate(frame, [0, 34, 42], [1, 1, 0], CLAMP);
  const row1 = interpolate(frame, [14, 44], [0, 1], EASE);
  const cap2X = interpolate(frame, [F.s1c - 2, F.s1c + 28], [430, 1190], EASE);
  const cap2Op = interpolate(frame, [F.s1c - 4, F.s1c + 2, F.s1c + 24, F.s1c + 30], [0, 1, 1, 0], CLAMP);
  const row2 = interpolate(frame, [F.s1c + 2, F.s1c + 28], [0, 1], EASE);
  const row3 = interpolate(frame, [F.s2a - 2, F.s2a + 22], [0, 1], EASE);
  const matchGuides = interpolate(frame, [F.s2a + 4, F.s2a + 26], [0, 1], EASE);
  const comparisonOpacity = interpolate(frame, [14, 28, F.s2b - 14, F.s2b - 4], [0, 1, 1, 0], CLAMP);
  const lockAppear = interpolate(frame, [F.s1b + 6, F.s1b + 16, F.s1c + 8, F.s1c + 16], [0, 1, 1, 0], CLAMP);
  const lockSnap = interpolate(frame, [F.s1b + 14, F.s1b + 20], [0, 1], OUT);

  const h1a = interpolate(frame, [0, 8, F.s1b - 4, F.s1b + 3], [1, 1, 1, 0], CLAMP); // ТРАФИК ЗАШИФРОВАН
  const h1aScale = interpolate(frame, [0, 10], [1.015, 1], OUT);
  const h1bMask = interpolate(frame, [F.s1b, F.s1b + 8], [0, 1], EASE);
  const h1b = interpolate(frame, [F.s1b, F.s1b + 6, F.s1c - 2, F.s1c + 4], [0, 1, 1, 0], CLAMP); // НО ЕГО УЗНАЛИ
  const h1c = interpolate(frame, [F.s1c, F.s1c + 5, F.s2a - 4, F.s2a + 2], [0, 1, 1, 0], CLAMP); // КАК?
  const h1cSettle = interpolate(frame, [F.s1c, F.s1c + 6], [4, 0], OUT);
  const hPocherk = interpolate(frame, [F.s2a + 8, F.s2a + 20, F.s2b - 2, F.s2b + 6], [0, 1, 1, 0], CLAMP); // У ПОТОКА ЕСТЬ ПОЧЕРК

  // =================== SCENE 2 — ПОЧЕРК / ПРИЗНАКИ ===================
  const bigTraceOpacity = interpolate(frame, [F.s2b - 16, F.s2b - 4, F.s4a - 6, F.s4a + 2], [0, 1, 1, 0], CLAMP);
  const bigTraceReveal = interpolate(frame, [F.s2b - 16, F.s2b + 8], [0, 1], EASE);
  const mSize = interpolate(frame, [F.s2b - 4, F.s2b + 16], [0, 1], EASE); // РАЗМЕР
  const mRhythm = interpolate(frame, [F.s2b + 10, F.s2b + 32], [0, 1], EASE); // РИТМ

  // =================== SCENE 3 — REFLECTION MASCOT REVEAL + THESIS ===================
  // Capsule sweep starts before scene 2 clears, so there is no empty lull.
  const revealProgress = interpolate(frame, [F.s4a - 14, F.s4a + 42], [0, 1], EASE);
  const h4 = interpolate(frame, [F.s4a + 16, F.s4a + 30, F.s5a - 6, F.s5a], [0, 1, 1, 0], CLAMP); // ШИФРОВАНИЕ ≠ НЕВИДИМОСТЬ
  const mascotCx = interpolate(frame, [F.s4a, F.s5a], [366, 330], EASE);
  const mascotCy = interpolate(frame, [F.s4a, F.s5a], [862, 626], EASE);
  const mascotSize = interpolate(frame, [F.s4a, F.s5a], [286, 214], EASE);
  const mascotOp = interpolate(frame, [F.s4a + 18, F.s4a + 30, F.durationInFrames - 5, F.durationInFrames], [0, 1, 1, 0.92], CLAMP);
  const mascotBob = Math.sin(frame * 0.045) * 4;

  // =================== SCENE 4 — FINAL PULL-BACK ===================
  const finalLine = interpolate(frame, [F.s5a, F.s5a + 40], [0, 1], EASE);
  const ctaBrand = interpolate(frame, [F.s5a + 4, F.s5a + 26], [0, 1], OUT);
  const ctaTagline = interpolate(frame, [F.s5a + 16, F.s5a + 40], [0, 1], OUT);
  const ctaHook = interpolate(frame, [F.s5b, F.s5b + 22], [0, 1], OUT);

  const mascotSrc = staticFile('assets/mascot/ghostpepe-main.png');

  return (
    <AbsoluteFill style={{backgroundColor: tsColors.bgDeep, overflow: 'hidden'}}>
      {/* ---------------- Forensic lab background ---------------- */}
      <Img
        src={staticFile('assets/backgrounds/cyberspace-dark.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: interpolate(frame, [0, F.s2a, F.s5a, F.durationInFrames], [0.28, 0.24, 0.3, 0.6], EASE),
          transform: `scale(${interpolate(frame, [0, F.durationInFrames], [1.08, 1.02], EASE)})`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 46%, rgba(10,40,44,.32), rgba(3,7,8,.82) 56%, rgba(1,3,4,.98) 100%)'}} />
      <div style={{position: 'absolute', left: 60 + fog1 * 120, top: 420, width: 620, height: 620, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,240,208,.08), rgba(34,240,208,0) 70%)', filter: 'blur(6px)'}} />
      <div style={{position: 'absolute', right: 20 + fog2 * 120, top: 900, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(95,199,230,.07), rgba(95,199,230,0) 70%)', filter: 'blur(6px)'}} />

      {/* ================= CAMERA-TRACKED WORLD ================= */}
      <AbsoluteFill style={{transform: `translateY(${cameraY}px) scale(${cameraScale}) rotate(${cameraRot}deg)`, transformOrigin: '470px 860px'}}>
        {/* --- Scene 1: capsules + comparison traces --- */}
        <div style={{opacity: comparisonOpacity}}>
          <PatternComparison cx={470} cy={824} reveals={[row1, row2, row3]} match={matchGuides} rowGap={64} />
        </div>
        <ForensicFocusLock cx={470} cy={824} w={330} h={96} appear={lockAppear} lock={lockSnap} />
        <EncryptedDataCapsule cx={cap1X} cy={LANE_Y} w={272} h={404} opacity={cap1Op} gloss={interpolate(frame, [0, 40], [0.2, 0.85], CLAMP)} />
        <EncryptedDataCapsule cx={cap2X} cy={LANE_Y} w={250} h={378} opacity={cap2Op} gloss={interpolate(frame, [F.s1c, F.s1c + 30], [0.2, 0.85], CLAMP)} />

        {/* --- Scene 2: enlarged trace + РАЗМЕР / РИТМ annotations --- */}
        <div style={{opacity: bigTraceOpacity}}>
          <TrafficTrace x={168} y={796} reveal={bigTraceReveal} periods={2} scale={1.32} color={tsColors.cyan} emphasis={0.4} frame={frame} />
          <TrafficDimensionMarker x={177} y={760} width={58} progress={mSize} />
          <RhythmIntervalMarker x={360} y={812} gap={78} progress={mRhythm} />
        </div>

        {/* --- Scene 3: reflection mascot reveal (capsule + reflection only) --- */}
        <ReflectionMascotReveal
          progress={revealProgress}
          mascotSrc={mascotSrc}
          mascotCx={366}
          mascotCy={862}
          mascotSize={286}
          enterX={1200}
          exitX={-260}
          laneY={862}
        />

        {/* --- Single mascot: revealed in scene 3, travels up into the finale --- */}
        <div style={{position: 'absolute', left: mascotCx, top: mascotCy + mascotBob, transform: 'translate(-50%,-50%)', opacity: mascotOp}}>
          <Img src={mascotSrc} style={{width: mascotSize, height: 'auto', filter: 'drop-shadow(0 16px 38px rgba(0,0,0,.5)) drop-shadow(0 0 24px rgba(34,240,208,.13))'}} />
        </div>
      </AbsoluteFill>

      {/* ================= HEADLINES (stable, not camera-warped) ================= */}
      <HeroText top={356} opacity={h1a} size={62}>
        <div style={{transform: `scale(${h1aScale})`, transformOrigin: 'center'}}>
          Трафик
          <br />
          Зашифрован
        </div>
      </HeroText>

      <div style={{position: 'absolute', left: 110, top: 372, width: 700, height: 170, overflow: 'hidden', clipPath: `inset(0 ${(1 - h1bMask) * 100}% 0 0)`, pointerEvents: 'none'}}>
        <HeroText top={0} opacity={h1b} size={64}>
          Но его
          <br />
          <span style={{color: tsColors.mint}}>узнали</span>
        </HeroText>
      </div>

      <HeroText top={392 + h1cSettle} opacity={h1c} size={128}>
        Как<span style={{color: tsColors.mint}}>?</span>
      </HeroText>

      <HeroText top={368} opacity={hPocherk} size={56}>
        У потока есть
        <br />
        <span style={{color: tsColors.mint}}>почерк</span>
      </HeroText>

      {/* Thesis */}
      <HeroText top={332} opacity={h4} size={58}>
        Шифрование
        <br />
        <span style={{fontSize: 46, color: tsColors.gray}}>не равно</span>
        <br />
        <span style={{color: tsColors.mint}}>невидимость</span>
      </HeroText>

      {/* ================= FINAL ================= */}
      <div style={{position: 'absolute', inset: 0}}>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 946,
            width: 700,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 46,
            letterSpacing: -1,
            color: tsColors.white,
            opacity: ctaBrand,
            translate: `0 ${interpolate(ctaBrand, [0, 1], [10, 0], OUT)}px`,
          }}
        >
          {' '}
        </div>
        <FinalSignatureLine cx={470} cy={1010} width={452} progress={finalLine} opacity={ctaBrand} />
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 1040,
            width: 700,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 40,
            lineHeight: 1.16,
            letterSpacing: -1.2,
            textTransform: 'uppercase',
            color: tsColors.white,
            opacity: ctaTagline,
            translate: `0 ${interpolate(ctaTagline, [0, 1], [10, 0], OUT)}px`,
          }}
        >
          Интернет сложнее
          <br />
          <span style={{color: tsColors.mint}}>одной кнопки</span>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 1236,
            width: 700,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 30,
            lineHeight: 1.24,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: tsColors.lightMint,
            opacity: ctaHook,
            translate: `0 ${interpolate(ctaHook, [0, 1], [8, 0], OUT)}px`,
          }}
        >
          Теперь ты знаешь,
          <br />
          что видит сеть
        </div>
      </div>

      {/* ================= CAPTIONS ================= */}
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

      {/* ================= SOUND ================= */}
      <Audio src={staticFile('generated/ambient.wav')} loop volume={(f) => Math.min(0.035, (f / (fps * 2)) * 0.035)} />
      <Audio src={staticFile('generated/voiceover-traffic-signature.wav')} volume={1} />
      <Sequence from={0} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.05} />
      </Sequence>
      <Sequence from={F.s1b + 14} premountFor={fps}>
        <Audio src={staticFile('generated/click.wav')} volume={0.28} />
      </Sequence>
      <Sequence from={F.s2a + 4} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.06} />
      </Sequence>
      <Sequence from={F.s4a - 14} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.05} />
      </Sequence>
    </AbsoluteFill>
  );
};

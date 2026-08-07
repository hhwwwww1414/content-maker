import {Audio} from '@remotion/media';
import type {TikTokPage} from '@remotion/captions';
import type {ReactNode} from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import captions from '../generated/captions-foreign-sim.json';
import {CaptionPage} from '../components/CaptionPage';
import {FrequencySync} from '../components/foreign-sim/FrequencySync';
import {HolographicSim} from '../components/foreign-sim/HolographicSim';
import {MobileTowerCore} from '../components/foreign-sim/MobileTowerCore';
import {NetworkRuleField} from '../components/foreign-sim/NetworkRuleField';
import {RadioSpectrumField} from '../components/foreign-sim/RadioSpectrumField';
import {RoamingDataRibbon} from '../components/foreign-sim/RoamingDataRibbon';
import {SignalWaveReveal} from '../components/foreign-sim/SignalWaveReveal';
import {TrafficFingerprint} from '../components/foreign-sim/TrafficFingerprint';
import {colors} from '../theme/colors';
import {manrope, unbounded} from '../theme/fonts';
import {deadlineLayout} from '../theme/layout';
import {foreignSimFrames as beats} from './foreignSimSceneFrames';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;
const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

/** Where the rule field re-writes each stream, in world x. */
const FIELD_X = 604;

/** Streams crossing the frame. Only the middle three carry labels in scene 3. */
const RIBBONS = [
  {index: 0, y: 596, label: undefined, continues: true, thickness: 11},
  {index: 1, y: 692, label: 'FOREIGN', continues: true, thickness: 17},
  {index: 2, y: 852, label: 'ROAMING', continues: false, thickness: 15},
  {index: 3, y: 1008, label: 'DATA', continues: true, thickness: 16},
  {index: 4, y: 1116, label: undefined, continues: false, thickness: 10},
];

/** Headline sitting in the upper safe area, x 110-820. */
const HeroText: React.FC<{
  top: number;
  opacity: number;
  size?: number;
  color?: string;
  children: ReactNode;
}> = ({top, opacity, size = 48, color = colors.white, children}) => (
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
      lineHeight: 1.14,
      letterSpacing: -1.4,
      textTransform: 'uppercase',
      color,
      opacity,
      translate: `0 ${interpolate(opacity, [0, 1], [10, 0], OUT)}px`,
      textShadow: color === colors.mint ? '0 0 32px rgba(34,240,208,.36)' : '0 5px 30px rgba(0,0,0,.76)',
    }}
  >
    {children}
  </div>
);

/** Small type floating inside the 3D space rather than sitting on a UI card. */
const FloatLabel: React.FC<{
  top: number;
  opacity: number;
  size?: number;
  color?: string;
  letterSpacing?: number;
  children: ReactNode;
}> = ({top, opacity, size = 30, color = colors.lightMint, letterSpacing = 3.4, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 110,
      top,
      width: 710,
      zIndex: 28,
      textAlign: 'center',
      fontFamily: unbounded,
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.2,
      letterSpacing,
      textTransform: 'uppercase',
      color,
      opacity,
      translate: `0 ${interpolate(opacity, [0, 1], [8, 0], OUT)}px`,
      textShadow: '0 0 22px rgba(34,240,208,.34)',
    }}
  >
    {children}
  </div>
);

export const GhostPepeForeignSimNewsReel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pages = captions as TikTokPage[];

  // --- One continuous camera through the whole world -------------------------
  const cameraScale = interpolate(
    frame,
    [0, beats.minc, 160, beats.rule, 252, beats.turn, beats.cta, 442],
    [0.95, 1.0, 1.02, 1.12, 1.24, 1.0, 0.95, 0.92],
    EASE,
  );
  const cameraY = interpolate(
    frame,
    [0, beats.minc, 160, 252, beats.turn, beats.cta, 442],
    [12, -12, -58, -104, -18, 12, 22],
    EASE,
  );

  // --- Global state of the traffic -------------------------------------------
  /** How far the rule field has re-written the streams (sweeps right to left). */
  const ribbonSync = interpolate(frame, [150, 252], [0, 1], EASE);
  const fieldActivity = interpolate(frame, [192, 248], [0, 1], EASE);
  const simSync = interpolate(frame, [200, 350], [0, 1], EASE);
  const ringSync = interpolate(frame, [300, 366], [0, 1], EASE);
  const fingerprint = interpolate(frame, [beats.turnB - 12, 366], [0, 1], EASE);
  const mascotReveal = interpolate(frame, [374, 452], [0, 1], EASE);

  // --- Object opacities / placement ------------------------------------------
  const worldFade = interpolate(frame, [beats.cta + 2, 402], [1, 0], EASE);
  const ribbonOpacity =
    interpolate(frame, [0, 18, 200, 250, 340], [0, 0.8, 0.72, 1, 0.85], EASE) * worldFade;

  const simOpacity =
    interpolate(frame, [0, 12, 214, 250, 268, 300], [0, 1, 1, 0.12, 0.12, 1], EASE) * worldFade;
  const simScale = interpolate(
    frame,
    [0, beats.minc, 160, 244, beats.turn, 340, 404],
    [1.12, 1.14, 0.8, 0.62, 0.78, 1.02, 1.07],
    EASE,
  );
  const simX = interpolate(frame, [0, beats.minc, 162, 244, 300, 404], [465, 465, 352, 322, 432, 465], EASE);
  const simY = interpolate(frame, [0, beats.minc, 162, 244, 300, 404], [842, 838, 902, 940, 852, 820], EASE);

  const towerReveal = interpolate(frame, [96, 152], [0, 1], OUT);
  const towerOpacity = interpolate(frame, [204, 238, 372, 396], [1, 0.1, 0.1, 0], EASE) * worldFade;

  const fieldOpacity = interpolate(frame, [186, 228, 296, 344], [0, 1, 1, 0], EASE) * worldFade;
  const ringOpacity = interpolate(frame, [284, 316, 358, 386], [0, 1, 1, 0], EASE) * worldFade;

  // --- Text beats -------------------------------------------------------------
  const hookText = interpolate(frame, [2, 8, 92, 112], [0, 1, 1, 0], EASE);
  const newsLabel = interpolate(frame, [10, 24, 96, 116], [0, 1, 1, 0], EASE);
  const roamWord = interpolate(frame, [94, 116, 198, 218], [0, 1, 1, 0], EASE);
  const roamRule = interpolate(frame, [124, 148, 198, 218], [0, 1, 1, 0], EASE);
  const thesisA = interpolate(frame, [beats.rule, 226, 278, 296], [0, 1, 1, 0], EASE);
  const thesisB = interpolate(frame, [beats.ruleB, 262, 278, 296], [0, 1, 1, 0], EASE);
  // Strictly sequential so the question is fully gone before the answer arrives.
  const question = interpolate(frame, [288, 306, 320, 334], [0, 1, 1, 0], EASE);
  const answerNo = interpolate(frame, [301, 316, 320, 334], [0, 1, 1, 0], EASE);
  const turnThesis = interpolate(frame, [336, 358, 374, 392], [0, 1, 1, 0], EASE);

  const ctaBrand = interpolate(frame, [382, 406], [0, 1], OUT);
  const ctaAsk = interpolate(frame, [392, 418], [0, 1], OUT);
  const ctaNotice = interpolate(frame, [beats.ctaB - 4, 442], [0, 1], OUT);
  const ctaWrite = interpolate(frame, [430, 452], [0, 1], OUT);

  return (
    <AbsoluteFill style={{backgroundColor: colors.bgDeep, overflow: 'hidden'}}>
      {/* Official background: held back while the spectrum world is in front, then
          re-formed as the streams recede into depth. */}
      <Img
        src={staticFile('assets/backgrounds/cyberspace-dark.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: interpolate(frame, [0, 200, 372, 444], [0.46, 0.32, 0.4, 0.72], EASE),
          scale: String(interpolate(frame, [0, 444], [1.09, 1.02], EASE)),
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 44% 47%, rgba(18,72,66,.24), rgba(3,7,8,.7) 55%, rgba(2,4,5,.95) 100%)',
        }}
      />

      {/* ---------------- One continuous world under one camera ---------------- */}
      <AbsoluteFill style={{translate: `0 ${cameraY}px`, scale: String(cameraScale), transformOrigin: '465px 880px'}}>
        {/* Spectral streams: the same ribbons run from scene 1 to scene 5 */}
        <div style={{position: 'absolute', inset: 0, opacity: ribbonOpacity}}>
          {RIBBONS.map((ribbon) => (
            <RoamingDataRibbon
              key={ribbon.index}
              frame={frame}
              index={ribbon.index}
              y={ribbon.y}
              label={ribbon.label && frame > 196 && frame < 300 ? ribbon.label : undefined}
              fieldX={FIELD_X}
              syncProgress={ribbonSync}
              continues={ribbon.continues}
              thickness={ribbon.thickness}
            />
          ))}
        </div>

        {/* Radio waves around the SIM in scene 1, handed over to the tower in scene 2 */}
        <RadioSpectrumField
          frame={frame}
          cx={simX}
          cy={simY}
          count={4}
          period={104}
          maxRadius={430}
          syncProgress={simSync}
          opacity={interpolate(frame, [6, 30, 150, 200], [0, 0.7, 0.7, 0.14], EASE) * worldFade}
        />

        {/* Abstract tower in the depth of scene 2 */}
        <div style={{position: 'absolute', left: 520, top: 618}}>
          <MobileTowerCore frame={frame} reveal={towerReveal} opacity={towerOpacity} />
        </div>
        <RadioSpectrumField
          frame={frame}
          cx={670}
          cy={662}
          count={5}
          period={112}
          maxRadius={540}
          syncProgress={1}
          opacity={interpolate(frame, [104, 150, 216, 264], [0, 0.66, 0.66, 0.1], EASE) * worldFade}
        />

        {/* The rule field the streams pass through in scene 3 */}
        <div style={{position: 'absolute', left: FIELD_X - 134, top: 522}}>
          <NetworkRuleField frame={frame} activity={fieldActivity} opacity={fieldOpacity} height={806} />
        </div>

        {/* International spectral rings realigning around the SIM in scene 4 */}
        <div style={{position: 'absolute', left: simX - 380, top: simY - 380}}>
          <FrequencySync frame={frame} sync={ringSync} opacity={ringOpacity} />
        </div>

        {/* The hero SIM, present in every scene at a different depth */}
        <div style={{position: 'absolute', left: simX - 214, top: simY - 168}}>
          <HolographicSim
            frame={frame}
            opacity={simOpacity}
            scale={simScale}
            syncProgress={simSync}
            faceOverlay={fingerprint > 0 ? <TrafficFingerprint frame={frame} progress={fingerprint} /> : null}
          />
        </div>
      </AbsoluteFill>

      {/* ---------------- Scene 1: news hook ---------------- */}
      <HeroText top={292} opacity={hookText} size={48}>
        Иностранная SIM
        <br />
        больше не
        <br />
        <span style={{color: colors.mint}}>«другой интернет»?</span>
      </HeroText>
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 512,
          width: 710,
          textAlign: 'center',
          zIndex: 29,
          fontFamily: manrope,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 4.2,
          color: colors.gray,
          opacity: newsLabel,
        }}
      >
        10 ИЮЛЯ · РОССИЯ
      </div>

      {/* ---------------- Scene 2: what changed ---------------- */}
      <FloatLabel top={318} opacity={roamWord} size={34} color={'rgba(178,226,255,.94)'}>
        Роуминг
      </FloatLabel>
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 372,
          width: 710,
          textAlign: 'center',
          zIndex: 28,
          fontFamily: unbounded,
          fontWeight: 700,
          fontSize: 32,
          color: colors.mint,
          opacity: roamRule,
          textShadow: '0 0 20px rgba(34,240,208,.4)',
        }}
      >
        ↓
      </div>
      <FloatLabel top={426} opacity={roamRule} size={31} color={colors.lightMint}>
        Общие правила сети
      </FloatLabel>

      {/* ---------------- Scene 3: the thesis ---------------- */}
      <HeroText top={296} opacity={thesisA} size={49}>
        Другая SIM
      </HeroText>
      <HeroText top={368} opacity={thesisB} size={46} color={colors.mint}>
        не значит
        <br />
        другие правила
      </HeroText>

      {/* ---------------- Scene 4: the turn ---------------- */}
      <HeroText top={294} opacity={question} size={47}>
        SIM изменилась?
      </HeroText>
      <FloatLabel top={372} opacity={answerNo} size={26} color={colors.gray} letterSpacing={5}>
        Нет
      </FloatLabel>
      <HeroText top={300} opacity={turnThesis} size={47}>
        Изменились
        <br />
        <span style={{color: colors.mint}}>правила трафика</span>
      </HeroText>

      {/* ---------------- Scene 5: news close ---------------- */}
      <SignalWaveReveal progress={mascotReveal} left={250} top={520} width={300} height={330} />
      <div style={{position: 'absolute', inset: 0, zIndex: 30}}>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 890,
            width: 710,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 44,
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
            top: 962,
            width: 710,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 45,
            lineHeight: 1.16,
            textTransform: 'uppercase',
            color: colors.white,
            opacity: ctaAsk,
            translate: `0 ${interpolate(ctaAsk, [0, 1], [10, 0], OUT)}px`,
          }}
        >
          Пользовался
          <br />
          иностранной SIM?
        </div>
        <div
          style={{
            position: 'absolute',
            left: 110,
            top: 1104,
            width: 710,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 42,
            textTransform: 'uppercase',
            color: colors.mint,
            opacity: ctaNotice,
            translate: `0 ${interpolate(ctaNotice, [0, 1], [10, 0], OUT)}px`,
            textShadow: '0 0 30px rgba(34,240,208,.36)',
          }}
        >
          Заметил разницу?
        </div>
        <div
          style={{
            position: 'absolute',
            left: 174,
            top: 1186,
            width: 582,
            textAlign: 'center',
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 25,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: colors.lightMint,
            opacity: ctaWrite,
          }}
        >
          Напиши в комментариях
        </div>
      </div>

      {/* ---------------- Captions ---------------- */}
      <AbsoluteFill style={{zIndex: 40}}>
        {pages.map((page, index) => {
          const startFrame = Math.round((page.startMs / 1000) * fps) + 1;
          const durationInFrames = Math.max(1, Math.round((page.durationMs / 1000) * fps) - 1);
          return (
            <Sequence key={`${page.startMs}-${index}`} from={startFrame} durationInFrames={durationInFrames} premountFor={fps}>
              <CaptionPage page={page} layout={deadlineLayout} riseIn steadyWords />
            </Sequence>
          );
        })}
      </AbsoluteFill>

      <Audio src={staticFile('generated/ambient.wav')} loop volume={(audioFrame) => Math.min(0.042, (audioFrame / (fps * 2)) * 0.042)} />
      <Audio src={staticFile('generated/voiceover-foreign-sim.wav')} volume={1} />
      <Sequence from={beats.minc - 6} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.08} />
      </Sequence>
      <Sequence from={beats.rule - 6} premountFor={fps}>
        <Audio src={staticFile('generated/whoosh.wav')} volume={0.07} />
      </Sequence>
      <Sequence from={beats.turn - 4} premountFor={fps}>
        <Audio src={staticFile('generated/connect.wav')} volume={0.06} />
      </Sequence>
    </AbsoluteFill>
  );
};

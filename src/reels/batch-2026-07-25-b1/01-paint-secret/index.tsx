import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-craft01-paint-secret.json';
import captionsJson from '../../../generated/captions-craft01-paint-secret.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * CRAFT 01 — "Секрет, который никто не передавал" (обмен Диффи—Хеллмана).
 *
 * Camera grammar: OVERHEAD TABLETOP LOCKED — камера прибита над столом и не
 * двигается. Motion grammar: IRREVERSIBLE LIQUID MIXING — единственная механика
 * ролика в том, что краски соединяются и обратного хода нет.
 * Ending: HARD-THESIS-END. Mascot: не используется.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const COMMON = '#4E7C8A';
const SECRET_A = '#22F0D0';
const SECRET_B = '#F2B24C';

// --- colour ------------------------------------------------------------------
const toRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const toHex = (rgb: [number, number, number]) =>
  `#${rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;

const lerpColor = (from: string, to: string, t: number): string => {
  const a = toRgb(from);
  const b = toRgb(to);
  return toHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
};

/** Pigments combine regardless of order — that is the whole point of the trick. */
const blend = (colors: string[]): string => {
  const sum = colors.map(toRgb).reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
  return toHex([sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length]);
};

const MIX_A = blend([COMMON, SECRET_A]);
const MIX_B = blend([COMMON, SECRET_B]);
const FINAL = blend([COMMON, SECRET_A, SECRET_B]);

// --- table geometry (all inside the safe rectangle) --------------------------
const CHANNEL_Y = 664;
const COMMON_JAR = {x: 540, y: 548, r: 74};
const LEFT = 300;
const RIGHT = 780;
const SECRET_Y = 812;
const MIX_Y = 1056;
const JAR_R = 78;
const MIX_R = 86;

// --- background --------------------------------------------------------------
const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const glint = 0.16 + 0.03 * Math.sin(frame / 92);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#070A0B', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          left: -220,
          top: 300,
          width: 1520,
          height: 620,
          objectFit: 'cover',
          opacity: glint,
          filter: 'grayscale(0.6) brightness(0.4) blur(4px)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 46%, rgba(255,246,224,0.10), transparent 46%), radial-gradient(ellipse at 50% 52%, rgba(7,10,11,0.25), #070A0B 78%)',
        }}
      />
    </AbsoluteFill>
  );
};

// --- jar ---------------------------------------------------------------------
const Jar: React.FC<{x: number; y: number; r: number; color: string; fill: number; swirl?: number}> = ({
  x,
  y,
  r,
  color,
  fill,
  swirl = 0,
}) => {
  const frame = useCurrentFrame();
  const wobble = swirl * 6 * Math.sin(frame / 9);
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="rgba(255,255,255,0.03)" stroke="rgba(226,240,238,0.30)" strokeWidth={3} />
      <circle cx={x} cy={y} r={r - 9} fill={color} opacity={0.18 + 0.82 * fill} />
      {swirl > 0.01 ? (
        <circle cx={x + wobble} cy={y - wobble * 0.6} r={(r - 14) * 0.72} fill={color} opacity={0.35 * swirl} />
      ) : null}
      <path
        d={`M ${x - r * 0.62} ${y - r * 0.42} A ${r * 0.8} ${r * 0.8} 0 0 1 ${x - r * 0.08} ${y - r * 0.72}`}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        opacity={0.5}
      />
    </g>
  );
};

const JarLabel: React.FC<{x: number; y: number; text: string; color: string; from: number; to?: number}> = ({
  x,
  y,
  text,
  color,
  from,
  to,
}) => {
  const frame = useCurrentFrame();
  const o = to === undefined ? clock.rise(frame, from, 14) : interpolate(frame, [from, from + 14, to - 10, to], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 160,
        top: y,
        width: 320,
        textAlign: 'center',
        opacity: o,
        zIndex: LAYERS.TEXT,
      }}
    >
      <div style={{width: 2, height: 16, background: `${color}88`, margin: '0 auto 8px'}} />
      <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, letterSpacing: 1.6, color}}>{text}</span>
    </div>
  );
};

// --- the table act -----------------------------------------------------------
const Bench: React.FC = () => {
  const frame = useCurrentFrame();

  const pour1 = interpolate(frame, [clock.at('mx_first'), clock.end('mx_first') + 8], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.quad),
  });
  const swap = interpolate(frame, [clock.at('mx_send'), clock.end('mx_send') + 10], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const pour2 = interpolate(frame, [clock.at('mx_second'), clock.at('mx_same') + 14], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.quad),
  });
  const secretsIn = clock.rise(frame, clock.at('pa_own'), 18);
  const commonIn = clock.rise(frame, 6, 20);

  // the two mixed jars cross over each other — the exchange happens in the open
  const arc = (t: number, fromX: number, toX: number) => ({
    x: fromX + (toX - fromX) * t,
    y: MIX_Y - Math.sin(t * Math.PI) * 96,
  });
  const leftJar = arc(swap, LEFT, RIGHT);
  const rightJar = arc(swap, RIGHT, LEFT);

  const colorLeft = lerpColor(lerpColor(COMMON, MIX_A, pour1), FINAL, pour2);
  const colorRight = lerpColor(lerpColor(COMMON, MIX_B, pour1), FINAL, pour2);
  const swirl = Math.max(pour1 < 1 ? pour1 : 0, pour2 > 0 && pour2 < 1 ? pour2 : 0);

  const equalLine = clock.rise(frame, clock.at('mx_same'), 18);

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, zIndex: LAYERS.HERO, overflow: 'visible'}}>
      {/* the public channel: everything crossing it is visible to everyone */}
      <line
        x1={150}
        y1={CHANNEL_Y}
        x2={930}
        y2={CHANNEL_Y}
        stroke="rgba(226,240,238,0.34)"
        strokeWidth={2}
        strokeDasharray="10 14"
        opacity={clock.rise(frame, 10, 20)}
      />

      <g opacity={commonIn}>
        <Jar x={COMMON_JAR.x} y={COMMON_JAR.y} r={COMMON_JAR.r} color={COMMON} fill={1} />
      </g>

      <g opacity={secretsIn}>
        <Jar x={LEFT} y={SECRET_Y} r={JAR_R} color={SECRET_A} fill={1} />
        <Jar x={RIGHT} y={SECRET_Y} r={JAR_R} color={SECRET_B} fill={1} />
      </g>

      {/* pouring streams, drawn only while a pour is happening */}
      {pour1 > 0.01 && pour1 < 0.99 ? (
        <>
          <line x1={LEFT} y1={SECRET_Y + JAR_R} x2={LEFT} y2={MIX_Y - MIX_R} stroke={SECRET_A} strokeWidth={7} opacity={0.7} strokeLinecap="round" />
          <line x1={RIGHT} y1={SECRET_Y + JAR_R} x2={RIGHT} y2={MIX_Y - MIX_R} stroke={SECRET_B} strokeWidth={7} opacity={0.7} strokeLinecap="round" />
        </>
      ) : null}

      <g opacity={clock.rise(frame, clock.at('mx_first') - 6, 14)}>
        <Jar x={leftJar.x} y={leftJar.y} r={MIX_R} color={colorLeft} fill={Math.max(0.25, pour1)} swirl={swirl} />
        <Jar x={rightJar.x} y={rightJar.y} r={MIX_R} color={colorRight} fill={Math.max(0.25, pour1)} swirl={swirl} />
      </g>

      {/* the identity that makes the whole thing work */}
      {equalLine > 0.002 ? (
        <g opacity={equalLine}>
          <line x1={LEFT + MIX_R + 26} y1={MIX_Y - 9} x2={RIGHT - MIX_R - 26} y2={MIX_Y - 9} stroke={FINAL} strokeWidth={4} />
          <line x1={LEFT + MIX_R + 26} y1={MIX_Y + 9} x2={RIGHT - MIX_R - 26} y2={MIX_Y + 9} stroke={FINAL} strokeWidth={4} />
        </g>
      ) : null}
    </svg>
  );
};

/** What an eavesdropper actually collected, laid out above the channel. */
const EvidenceStrip: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('ea_only');
  const o = interpolate(frame, [from - 6, from + 16, clock.end('nb_num'), clock.end('nb_num') + 16], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  const strike = clock.rise(frame, from + 22, 20);
  const samples = [COMMON, MIX_A, MIX_B];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, zIndex: LAYERS.HERO_FRONT, overflow: 'visible'}} opacity={o}>
      {samples.map((c, i) => (
        <circle key={c} cx={400 + i * 140} cy={420} r={34} fill={c} stroke="rgba(226,240,238,0.4)" strokeWidth={2} />
      ))}
      {/* the impossible operation, struck through */}
      <line x1={362} y1={420} x2={362 + strike * 356} y2={420} stroke={BRAND.danger} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
};

const Annotations: React.FC = () => {
  const frame = useCurrentFrame();
  const chan = interpolate(frame, [12, 30, clock.at('mx_first'), clock.at('mx_first') + 14], [0, 1, 1, 0], CLAMP);
  const evidence = interpolate(
    frame,
    [clock.at('ea_only'), clock.at('ea_only') + 16, clock.end('nb_num'), clock.end('nb_num') + 14],
    [0, 1, 1, 0],
    CLAMP,
  );
  return (
    <>
      {chan > 0.002 ? (
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: CHANNEL_Y - 46,
            opacity: chan,
            fontFamily: manrope,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 2.6,
            color: 'rgba(226,240,238,0.66)',
            textTransform: 'uppercase',
            zIndex: LAYERS.TEXT,
          }}
        >
          открытый канал · слышно всем
        </div>
      ) : null}
      {evidence > 0.002 ? (
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: 330,
            opacity: evidence,
            fontFamily: manrope,
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 2.6,
            color: BRAND.danger,
            textTransform: 'uppercase',
            zIndex: LAYERS.TEXT,
          }}
        >
          обратно не разделить
        </div>
      ) : null}
      <JarLabel x={COMMON_JAR.x} y={COMMON_JAR.y + COMMON_JAR.r + 10} text="общая" color="#9FC4CE" from={clock.at('pa_common')} to={clock.at('mx_send')} />
      <JarLabel x={LEFT} y={SECRET_Y + JAR_R + 10} text="твоя" color={SECRET_A} from={clock.at('pa_own')} to={clock.at('mx_send')} />
      <JarLabel x={RIGHT} y={SECRET_Y + JAR_R + 10} text="его" color={SECRET_B} from={clock.at('pa_own')} to={clock.at('mx_send')} />
      <JarLabel x={540} y={MIX_Y + MIX_R + 16} text="один и тот же цвет" color={FINAL} from={clock.at('mx_same') + 6} to={clock.at('ea_only')} />
    </>
  );
};

/** HARD-THESIS-END: the argument closes over the two identical jars. */
const Thesis: React.FC = () => {
  const frame = useCurrentFrame();
  const o = clock.rise(frame, clock.at('br_ghost') + 10, 22);
  if (o <= 0.002) return null;
  return (
    <div style={{position: 'absolute', left: 112, top: 300, width: 720, opacity: o, zIndex: LAYERS.TEXT}}>
      <div style={{width: 86, height: 5, background: BRAND.mint, borderRadius: 4, marginBottom: 22}} />
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 70, lineHeight: 1.02, letterSpacing: -2.4, color: BRAND.white}}>
        Секрет,<br />который <span style={{color: BRAND.mint}}>не передавали</span>
      </div>
    </div>
  );
};

export const GhostPepeCraftPaintSecret: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: '#070A0B', overflow: 'hidden'}}>
      <Table />
      <Bench />
      <EvidenceStrip />
      <Annotations />
      <Thesis />
      <BatchCaption pages={pages} fps={clock.fps} frame="plate" face="manrope" accent={BRAND.mint} fontSize={40} />
      <Audio src={staticFile(voicePath('craft01-paint-secret'))} volume={1} />
      <Audio src={staticFile(ASSETS.ambient)} loop volume={0.03} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

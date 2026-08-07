import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-batch04-packet-too-big.json';
import captionsJson from '../../../generated/captions-batch04-packet-too-big.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * REEL 04 — "Пакет на два байта больше".
 *
 * Camera grammar: MICRO / ORTHOGRAPHIC EXPLORATION — a strict side elevation that
 * only ever steps closer, never pans or rolls. Motion grammar: MICROSCOPIC FLOW
 * CHOREOGRAPHY — many small elements form one legible process. Transitions are
 * flow continuations: the same rail carries every idea.
 * Ending: OBJECT-TRANSFORMS-TO-BRAND. Mascot: none.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const RAIL_Y = 880;
const SLOT_X = 620;
const SLOT_GAP = 84; // the MTU: parcels taller than this cannot pass
const FILTER_X = 250;

const STEEL = '#7FA6B4';

// --- channel walls from the brand plate -------------------------------------
const ChannelWalls: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, clock.total], [0, 26], CLAMP);
  const wall = (flip: boolean, left: number): React.CSSProperties => ({
    position: 'absolute',
    left,
    top: -120 + (flip ? shift : -shift),
    width: 430,
    height: 2160,
    objectFit: 'cover',
    transform: flip ? 'scaleX(-1)' : undefined,
    opacity: 0.34,
    filter: 'hue-rotate(160deg) saturate(0.7) brightness(0.5) blur(1.5px)',
  });
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#050A0C', overflow: 'hidden'}}>
      <Img src={staticFile(ASSETS.background)} style={wall(false, -120)} />
      <Img src={staticFile(ASSETS.background)} style={wall(true, 770)} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(5,10,12,0.95) 0%, rgba(8,16,19,0.35) 42%, rgba(8,16,19,0.35) 58%, rgba(5,10,12,0.95) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// --- stepped micro zoom ------------------------------------------------------
const zoomAt = (frame: number) => {
  const s1 = clock.at('z_closer');
  const s2 = clock.at('z_small');
  const s3 = clock.at('i_should');
  // opens already close to the rail so frame one has a readable object, not empty air
  const scale = interpolate(frame, [s1 - 4, s1 + 22, s2 - 4, s2 + 18, s3 - 4, s3 + 18], [1.16, 1.32, 1.32, 1.48, 1.48, 1.48], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  return scale;
};

// --- parcels -----------------------------------------------------------------
type Parcel = {offset: number; h: number; w: number};

const SMALL: Parcel[] = [
  {offset: 0.0, h: 44, w: 56},
  {offset: 0.22, h: 36, w: 46},
  {offset: 0.44, h: 50, w: 64},
  {offset: 0.66, h: 38, w: 50},
  {offset: 0.85, h: 46, w: 58},
];

const parcelStyle = (h: number, w: number, color: string): React.CSSProperties => ({
  position: 'absolute',
  width: w,
  height: h,
  borderRadius: 6,
  background: `linear-gradient(180deg, ${color}33, ${color}14)`,
  border: `2px solid ${color}`,
  boxSizing: 'border-box',
});

/**
 * The continuous stream. It never stops — that is what makes the jam readable.
 * While the oversized parcel occupies the gauge, small parcels are not drawn inside
 * its footprint: they have already gone through, and two objects must never share
 * the same spot on the rail.
 */
const SmallFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const speed = 3.4;
  const heroOwnsGauge = frame >= clock.at('z_big') - 20 && frame < clock.at('b_ghost') + 26;
  return (
    <>
      {SMALL.map((p, i) => {
        const period = 420;
        const t = (((frame * speed) / period + p.offset) % 1 + 1) % 1;
        const x = -120 + t * 1320;
        if (heroOwnsGauge && x > SLOT_X - 300 && x < SLOT_X + 140) return null;
        return <div key={i} style={{...parcelStyle(p.h, p.w, STEEL), left: x, top: RAIL_Y - p.h / 2, opacity: 0.85}} />;
      })}
    </>
  );
};

/** The hero: one oversized parcel that meets the gauge. */
const HeroParcel: React.FC = () => {
  const frame = useCurrentFrame();
  const arrive = clock.at('z_big');
  const retryFrom = clock.at('r_repeat');
  const fixFrom = clock.at('b_ghost');

  // approach -> jam -> (retry loop) -> resize -> pass through as the brand mark
  const approach = interpolate(frame, [arrive - 26, arrive + 6], [-260, SLOT_X - 150], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });

  const retryCycle = Math.max(0, frame - retryFrom);
  const retryX = frame >= retryFrom && frame < fixFrom ? SLOT_X - 150 - 220 + ((retryCycle * 5) % 220) : null;

  const fix = interpolate(frame, [fixFrom, fixFrom + 26], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  const passX = interpolate(frame, [fixFrom + 26, clock.at('f_thesis') + 10], [SLOT_X - 150, 1180], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  const h = interpolate(fix, [0, 1], [124, SLOT_GAP - 12], CLAMP);
  const w = interpolate(fix, [0, 1], [150, 132], CLAMP);
  const color = fix > 0.5 ? BRAND.mint : BRAND.danger;

  let x = approach;
  if (retryX !== null) x = retryX;
  if (frame >= fixFrom + 26) x = passX;
  else if (frame >= fixFrom) x = SLOT_X - 150;

  // the failed attempts vanish silently, exactly like the RFC describes
  const vanish = retryX !== null ? interpolate((retryCycle * 5) % 220, [150, 210], [1, 0], CLAMP) : 1;
  const visible = frame >= arrive - 26 ? vanish : 0;
  if (visible <= 0.002) return null;

  return (
    <div style={{...parcelStyle(h, w, color), left: x, top: RAIL_Y - h / 2, opacity: visible, borderRadius: fix > 0.5 ? 18 : 6}}>
      {fix > 0.6 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 22,
            color: BRAND.mint,
            opacity: interpolate(fix, [0.6, 1], [0, 1], CLAMP),
          }}
        >
          GhostPepe
        </div>
      ) : null}
    </div>
  );
};

/** The service reply that should explain the failure — and is filtered away. */
const IcmpReply: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('i_should');
  const t = interpolate(frame, [from, clock.end('i_filtered')], [0, 1], CLAMP);
  if (t <= 0.001 || t >= 0.999) return null;
  const x = interpolate(t, [0, 1], [SLOT_X - 40, FILTER_X - 30], CLAMP);
  // dissolves as it reaches the filter — input range must stay ascending
  const fade = interpolate(x, [FILTER_X + 6, FILTER_X + 90], [0, 1], CLAMP);
  return (
    <div
      style={{
        ...parcelStyle(40, 40, BRAND.amber),
        left: x,
        top: RAIL_Y - 96,
        opacity: fade,
        borderRadius: 8,
      }}
    />
  );
};

const Rail: React.FC = () => {
  const frame = useCurrentFrame();
  const slot = clock.rise(frame, clock.at('z_closer') + 6, 20);
  const filter = clock.rise(frame, clock.at('i_should') + 4, 16);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <line x1={-200} y1={RAIL_Y + 78} x2={1280} y2={RAIL_Y + 78} stroke="rgba(127,166,180,0.34)" strokeWidth={3} />
      {Array.from({length: 40}).map((_, i) => (
        <line
          key={i}
          x1={-200 + i * 40}
          y1={RAIL_Y + 78}
          x2={-200 + i * 40}
          y2={RAIL_Y + 92}
          stroke="rgba(127,166,180,0.22)"
          strokeWidth={2}
        />
      ))}

      {/* the gauge bulkhead with its rectangular cut */}
      <g opacity={slot}>
        <rect x={SLOT_X} y={RAIL_Y - 330} width={34} height={330 - SLOT_GAP / 2} fill="#16232833" stroke={STEEL} strokeWidth={2.6} />
        <rect x={SLOT_X} y={RAIL_Y + SLOT_GAP / 2} width={34} height={330 - SLOT_GAP / 2} fill="#16232833" stroke={STEEL} strokeWidth={2.6} />
        {Array.from({length: 9}).map((_, i) => (
          <line
            key={`hu${i}`}
            x1={SLOT_X}
            y1={RAIL_Y - 320 + i * 28}
            x2={SLOT_X + 34}
            y2={RAIL_Y - 306 + i * 28}
            stroke={STEEL}
            strokeWidth={1}
            opacity={0.35}
          />
        ))}
        {/* MTU dimension, kept well clear of the parcel lane */}
        <line x1={SLOT_X - 250} y1={RAIL_Y - SLOT_GAP / 2} x2={SLOT_X - 250} y2={RAIL_Y + SLOT_GAP / 2} stroke={BRAND.mint} strokeWidth={2.4} />
        <line x1={SLOT_X - 264} y1={RAIL_Y - SLOT_GAP / 2} x2={SLOT_X - 236} y2={RAIL_Y - SLOT_GAP / 2} stroke={BRAND.mint} strokeWidth={2.4} />
        <line x1={SLOT_X - 264} y1={RAIL_Y + SLOT_GAP / 2} x2={SLOT_X - 236} y2={RAIL_Y + SLOT_GAP / 2} stroke={BRAND.mint} strokeWidth={2.4} />
        <text x={SLOT_X - 232} y={RAIL_Y - SLOT_GAP / 2 - 12} fontFamily={manrope} fontSize="22" fontWeight="800" fill={BRAND.mint} letterSpacing="2">
          MTU
        </text>
      </g>

      {/* the filter that swallows the service reply */}
      <g opacity={filter}>
        {Array.from({length: 7}).map((_, i) => (
          <line
            key={i}
            x1={FILTER_X + i * 10}
            y1={RAIL_Y - 170}
            x2={FILTER_X + i * 10}
            y2={RAIL_Y - 40}
            stroke={BRAND.danger}
            strokeWidth={2}
            opacity={0.7}
          />
        ))}
      </g>
    </svg>
  );
};

// --- technical annotations ---------------------------------------------------
const Annotation: React.FC<{from: string; to: string; x: number; y: number; label: string; value: string; color: string}> = ({
  from,
  to,
  x,
  y,
  label,
  value,
  color,
}) => {
  const frame = useCurrentFrame();
  const a = clock.at(from);
  const b = clock.at(to);
  const o = interpolate(frame, [a, a + 12, b - 12, b], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o, zIndex: LAYERS.TEXT}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <span style={{width: 8, height: 8, borderRadius: 8, background: color}} />
        <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, letterSpacing: 2.2, color, textTransform: 'uppercase'}}>{label}</span>
      </div>
      <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 40, color: BRAND.white, marginTop: 4, letterSpacing: -1}}>{value}</div>
      <div style={{width: 120, height: 1, background: `${color}66`, marginTop: 10}} />
    </div>
  );
};

const Annotations: React.FC = () => {
  const frame = useCurrentFrame();
  const attempts = Math.min(48, Math.max(0, Math.floor((frame - clock.at('r_repeat')) / 9)));
  const showAttempts = interpolate(
    frame,
    [clock.at('r_repeat'), clock.at('r_repeat') + 12, clock.at('b_ghost'), clock.at('b_ghost') + 14],
    [0, 1, 1, 0],
    CLAMP,
  );
  return (
    <>
      <Annotation from="s_page" to="z_closer" x={130} y={330} label="симптом" value="ping идёт" color={STEEL} />
      <Annotation from="z_mtu" to="z_big" x={130} y={330} label="предел канала" value="MTU" color={BRAND.mint} />
      <Annotation from="z_big" to="i_should" x={130} y={330} label="пакет" value="шире на 2 байта" color={BRAND.danger} />
      <Annotation from="i_should" to="i_filtered" x={130} y={330} label="ответ маршрутизатора" value="ICMP" color={BRAND.amber} />
      <Annotation from="i_filtered" to="r_repeat" x={130} y={330} label="ICMP" value="отфильтрован" color={BRAND.danger} />
      <Annotation from="r_rfc" to="b_ghost" x={130} y={330} label="RFC 2923" value="чёрная дыра" color={BRAND.danger} />
      {showAttempts > 0.002 ? (
        <div
          style={{
            position: 'absolute',
            left: 130,
            top: 1140,
            opacity: showAttempts,
            fontFamily: manrope,
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: 2,
            color: BRAND.danger,
            fontVariantNumeric: 'tabular-nums',
            zIndex: LAYERS.TEXT,
          }}
        >
          попыток: {attempts}
        </div>
      ) : null}
    </>
  );
};

/**
 * The symptom itself, shown before any explanation: the text of a page arrives,
 * the picture never does. It leaves the frame when the camera steps closer.
 */
const SymptomCard: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = clock.rise(frame, 4, 14);
  const leave = interpolate(frame, [clock.at('z_closer') - 8, clock.at('z_closer') + 12], [1, 0], CLAMP);
  const o = enter * leave;
  if (o <= 0.002) return null;
  const lines = clock.rise(frame, clock.at('s_page'), 20);
  return (
    <div
      style={{
        position: 'absolute',
        left: 150,
        top: 468,
        width: 640,
        borderRadius: 18,
        padding: 24,
        background: 'linear-gradient(180deg, rgba(16,26,29,0.95), rgba(8,14,16,0.95))',
        border: '1px solid rgba(127,166,180,0.34)',
        boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
        opacity: o,
        zIndex: LAYERS.TEXT,
      }}
    >
      {[420, 560, 340].map((w, i) => (
        <div
          key={w}
          style={{
            width: w * Math.min(1, Math.max(0, lines * 3 - i)),
            height: 14,
            borderRadius: 7,
            background: 'rgba(246,250,249,0.30)',
            marginBottom: 12,
          }}
        />
      ))}
      <div
        style={{
          marginTop: 8,
          height: 190,
          borderRadius: 12,
          border: `2px dashed ${BRAND.danger}77`,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <svg width={72} height={62} viewBox="0 0 72 62" fill="none" stroke={`${BRAND.danger}aa`} strokeWidth="3">
          <rect x="3" y="3" width="66" height="56" rx="6" />
          <circle cx="22" cy="21" r="6" />
          <path d="M8 50l18-20 12 13 9-8 17 15" />
          <path d="M14 12l44 38" stroke={BRAND.danger} />
        </svg>
      </div>
    </div>
  );
};

/** The closing thesis annotation — no separate end card, the object carries it. */
const FinalNote: React.FC = () => {
  const frame = useCurrentFrame();
  const o = clock.rise(frame, clock.at('f_thesis') - 6, 18);
  if (o <= 0.002) return null;
  return (
    <div style={{position: 'absolute', left: 130, top: 330, width: 700, opacity: o, zIndex: LAYERS.TEXT}}>
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 60, lineHeight: 1.04, letterSpacing: -2, color: BRAND.white}}>
        Не связь.<br />
        <span style={{color: BRAND.mint}}>Обратная связь.</span>
      </div>
    </div>
  );
};

export const GhostPepeBatch04PacketTooBig: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = zoomAt(frame);
  return (
    <LayoutRegistryProvider>
      <AbsoluteFill style={{background: '#050A0C', overflow: 'hidden'}}>
        <ChannelWalls />
        <AbsoluteFill style={{zIndex: LAYERS.ENVIRONMENT, transform: `scale(${scale})`, transformOrigin: '54% 46%'}}>
          <Rail />
          <SmallFlow />
          <IcmpReply />
          <HeroParcel />
        </AbsoluteFill>
        <SymptomCard />
        <Annotations />
        <FinalNote />
        <BatchCaption pages={pages} fps={clock.fps} frame="plate" face="manrope" accent={BRAND.mint} fontSize={40} />
        <Audio src={staticFile(voicePath('batch04-packet-too-big'))} volume={1} />
        <Audio src={staticFile(ASSETS.ambient)} loop volume={0.026} />
        <SafeZoneOverlay />
      </AbsoluteFill>
    </LayoutRegistryProvider>
  );
};

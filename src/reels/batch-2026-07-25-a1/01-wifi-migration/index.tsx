import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-batch01-wifi-migration.json';
import captionsJson from '../../../generated/captions-batch01-wifi-migration.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * REEL 01 — "Четыре миллиарда раз в чужую сеть".
 *
 * World: a night city seen from above. Camera grammar is ONE CONTINUOUS
 * OBSERVATIONAL TAKE — a single uninterrupted push that never cuts; scenes change
 * because the camera has travelled, not because a shot was spliced.
 * Motion grammar is PHYSICAL STATE EVOLUTION: one field of access points changes
 * state (dark -> lit -> watchful -> claimed) for the whole runtime.
 * Ending: LOOP-BACK-TO-FIRST-FRAME. Mascot: none.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const AMBER = '#F2B24C';
const AMBER_DIM = '#8A6A2E';

// --- deterministic city layout ---------------------------------------------
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

type Point = {x: number; y: number; r: number; phase: number; lit: number};

const POINTS: Point[] = (() => {
  const rand = mulberry32(20260725);
  const out: Point[] = [];
  for (let i = 0; i < 64; i += 1) {
    out.push({
      x: 40 + rand() * 1000,
      y: 300 + rand() * 1320,
      r: 4 + rand() * 6,
      phase: rand() * Math.PI * 2,
      // order in which a point wakes up during the spread shot
      lit: rand(),
    });
  }
  return out;
})();

/** The one node that belongs to the viewer — everything is measured against it. */
const HOME = {x: 470, y: 1030};

// --- camera -----------------------------------------------------------------
// A single path. Keyframes sit on voice-segment starts so the move is motivated
// by the narration, but the motion itself never stops and never cuts.
const KEY = {
  open: 0,
  spread: clock.at('why_limit'),
  watchful: clock.at('t_sees'),
  pushed: clock.at('th_choice'),
  sealed: clock.at('br_ghost'),
  loop: clock.at('loop_back'),
  end: clock.total,
};

const camera = (frame: number) => {
  const stops = [KEY.open, KEY.spread, KEY.watchful, KEY.pushed, KEY.sealed, KEY.loop, KEY.end];
  const ease = {...CLAMP, easing: Easing.inOut(Easing.quad)};
  const scale = interpolate(frame, stops, [1.0, 1.1, 1.42, 1.16, 1.08, 1.0, 1.0], ease);
  const x = interpolate(frame, stops, [0, -30, -150, -60, -20, 0, 0], ease);
  const y = interpolate(frame, stops, [0, -70, -240, -110, -40, 0, 0], ease);
  return {scale, x, y};
};

// --- background -------------------------------------------------------------
/** Official brand plate, treated as city light: rotated, oversized, amber-graded. */
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, clock.total], [0, -34], CLAMP);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: BRAND.deep, overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          width: 1780,
          height: 3162,
          left: -350,
          top: -640 + drift,
          transform: 'rotate(8deg)',
          objectFit: 'cover',
          opacity: 0.5,
          filter: 'saturate(0.5) brightness(0.6)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 78%, rgba(242,178,76,0.20), rgba(8,12,14,0.72) 46%, #05090A 82%)',
        }}
      />
    </AbsoluteFill>
  );
};

// --- city -------------------------------------------------------------------
const CityGrid: React.FC = () => {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i <= 12; i += 1) {
    const x = 20 + i * 88;
    lines.push(<line key={`v${i}`} x1={x} y1={220} x2={x - 30} y2={1740} stroke="rgba(150,190,190,0.10)" strokeWidth={2} />);
  }
  for (let j = 0; j <= 16; j += 1) {
    const y = 240 + j * 96;
    lines.push(<line key={`h${j}`} x1={0} y1={y} x2={1080} y2={y - 26} stroke="rgba(150,190,190,0.07)" strokeWidth={2} />);
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {lines}
    </svg>
  );
};

/** Access points: the single hero field whose state evolves across the reel. */
const AccessPoints: React.FC = () => {
  const frame = useCurrentFrame();
  // a third of the field is already alight in frame one — the process predates us
  const wake = interpolate(frame, [0, KEY.spread, clock.end('d_growth')], [0.34, 0.42, 1], CLAMP);
  const claim = interpolate(frame, [KEY.pushed, clock.end('th_push')], [0, 1], CLAMP);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {POINTS.map((p, i) => {
        const on = p.lit <= wake ? 1 : 0;
        if (!on) return null;
        const pulse = 0.65 + 0.35 * Math.sin(frame / 22 + p.phase);
        const ring = 10 + 16 * pulse + claim * 6;
        return (
          <g key={i} opacity={0.35 + 0.55 * pulse}>
            <circle cx={p.x} cy={p.y} r={ring} fill="none" stroke={AMBER_DIM} strokeWidth={1.5} opacity={0.5} />
            <circle cx={p.x} cy={p.y} r={p.r} fill={AMBER} />
          </g>
        );
      })}
    </svg>
  );
};

/** Threads leaving the viewer's node for foreign points. */
const Threads: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [clock.at('why_search'), clock.end('d_growth')], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const pull = interpolate(frame, [KEY.pushed, clock.end('th_push')], [0, 1], CLAMP);
  const sealed = interpolate(frame, [KEY.sealed, KEY.sealed + 34], [0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const targets = POINTS.filter((p) => p.lit < 0.55).slice(0, 18);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {targets.map((p, i) => {
        const t = Math.max(0, Math.min(1, grow * 1.4 - i / targets.length));
        if (t <= 0) return null;
        const ex = HOME.x + (p.x - HOME.x) * t;
        const ey = HOME.y + (p.y - HOME.y) * t;
        return (
          <line
            key={i}
            x1={HOME.x}
            y1={HOME.y}
            x2={ex}
            y2={ey}
            stroke={AMBER}
            strokeWidth={1.6 + pull * 1.2}
            opacity={0.16 + 0.3 * pull}
          />
        );
      })}
      {/* the one sealed route — brand state of the same object, not a new object */}
      {sealed > 0 ? (
        <line
          x1={HOME.x}
          y1={HOME.y}
          x2={HOME.x + (830 - HOME.x) * sealed}
          y2={HOME.y + (470 - HOME.y) * sealed}
          stroke={BRAND.mint}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.95}
        />
      ) : null}
      <circle cx={HOME.x} cy={HOME.y} r={13} fill={sealed > 0.2 ? BRAND.mint : BRAND.gray} />
      <circle cx={HOME.x} cy={HOME.y} r={26} fill="none" stroke={sealed > 0.2 ? BRAND.mint : BRAND.gray} strokeWidth={2} opacity={0.5} />
    </svg>
  );
};

/** One point opens into an identification card — same object, new state. */
const IdentityCard: React.FC = () => {
  const frame = useCurrentFrame();
  const open = clock.rise(frame, clock.at('t_knows'), 18);
  const rule = clock.rise(frame, clock.at('t_rule'), 16);
  const close = interpolate(frame, [clock.end('t_rule') + 6, clock.end('t_rule') + 24], [1, 0], CLAMP);
  const o = open * close;
  if (o <= 0.002) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 250,
        top: 690,
        width: 470,
        borderRadius: 20,
        padding: 26,
        background: 'linear-gradient(180deg, rgba(28,24,16,0.96), rgba(14,12,9,0.96))',
        border: `1px solid ${AMBER}88`,
        boxShadow: '0 34px 80px rgba(0,0,0,0.6)',
        opacity: o,
        transform: `scale(${interpolate(open, [0, 1], [0.9, 1], CLAMP)})`,
        transformOrigin: '50% 100%',
      }}
    >
      <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 19, letterSpacing: 2, color: AMBER, textTransform: 'uppercase'}}>
        точка доступа
      </div>
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 42, color: BRAND.white, marginTop: 8}}>кто ты</div>
      <div
        style={{
          marginTop: 18,
          height: 3,
          borderRadius: 3,
          background: AMBER,
          width: `${20 + rule * 80}%`,
        }}
      />
      <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 24, color: BRAND.gray, marginTop: 14, opacity: rule}}>
        постановление № 1667 · идентификация
      </div>
    </div>
  );
};

// --- environmental typography ----------------------------------------------
/** The counter is an environmental readout pinned over the map, not a title card. */
const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  // ACTION-FIRST: the count is already running when the reel opens, and the loop
  // returns it to that same reading so the last frame matches the first.
  const LOOP_START = 3_100_000_000;
  const runUp = interpolate(frame, [0, clock.end('n_count')], [LOOP_START, 4_100_000_000], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const restart = interpolate(frame, [KEY.loop, KEY.loop + 10, clock.total], [4_100_000_000, LOOP_START, LOOP_START + 160_000_000], CLAMP);
  const value = frame < KEY.loop ? runUp : restart;
  // Group with a plain space so the readout never reflows on a locale-specific NBSP.
  const text = String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sub = interpolate(frame, [clock.at('n_when'), clock.at('n_when') + 14], [0, 1], CLAMP);
  return (
    <div style={{position: 'absolute', left: 110, top: 296, width: 720, zIndex: LAYERS.TEXT}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{width: 30, height: 3, background: AMBER, borderRadius: 3}} />
        <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 21, letterSpacing: 2.4, color: AMBER, textTransform: 'uppercase'}}>
          публичный Wi-Fi · 1 полугодие 2026
        </span>
      </div>
      <div
        style={{
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 74,
          letterSpacing: -2,
          color: BRAND.white,
          marginTop: 10,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 16px 46px rgba(0,0,0,0.75)',
        }}
      >
        {text}
      </div>
      <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 30, color: BRAND.gray, marginTop: 4, opacity: sub}}>
        подключений к чужим сетям
      </div>
    </div>
  );
};

/** Labels attached to what they describe, with a short leader line. */
const MapLabel: React.FC<{from: number; to: number; x: number; y: number; text: string; color: string}> = ({
  from,
  to,
  x,
  y,
  text,
  color,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 12, to - 10, to], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: o, zIndex: LAYERS.TEXT, display: 'flex', alignItems: 'center', gap: 12}}>
      <span style={{width: 46, height: 2, background: color, opacity: 0.8}} />
      <span
        style={{
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 30,
          color,
          textShadow: '0 8px 26px rgba(0,0,0,0.8)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    </div>
  );
};

const Labels: React.FC = () => (
  <>
    <MapLabel from={clock.at('why_limit')} to={clock.at('t_sees')} x={130} y={1188} text="×3,5 за год" color={AMBER} />
    <MapLabel from={clock.at('t_sees')} to={clock.at('t_knows')} x={130} y={1188} text="точка видит маршрут" color={AMBER} />
    <MapLabel from={clock.at('th_choice')} to={clock.at('br_ghost')} x={130} y={1188} text="выбора не было" color={BRAND.white} />
    <MapLabel from={clock.at('br_ghost')} to={clock.at('loop_back')} x={130} y={1188} text="GhostPepeBot · трафик закрыт" color={BRAND.mint} />
    <MapLabel from={clock.at('loop_again')} to={clock.total} x={130} y={1188} text="и завтра снова" color={AMBER} />
  </>
);

export const GhostPepeBatch01WifiMigration: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camera(frame);
  return (
    <LayoutRegistryProvider>
      <AbsoluteFill style={{background: BRAND.deep, overflow: 'hidden'}}>
        <Backdrop />
        <AbsoluteFill
          style={{
            zIndex: LAYERS.ENVIRONMENT,
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
            transformOrigin: '50% 52%',
          }}
        >
          <CityGrid />
          <AccessPoints />
          <Threads />
        </AbsoluteFill>
        <AbsoluteFill style={{zIndex: LAYERS.HERO_FRONT}}>
          <IdentityCard />
        </AbsoluteFill>
        <Counter />
        <Labels />
        <BatchCaption pages={pages} fps={clock.fps} frame="band" face="manrope" accent={AMBER} fontSize={40} />
        <Audio src={staticFile(voicePath('batch01-wifi-migration'))} volume={1} />
        <Audio src={staticFile(ASSETS.ambient)} loop volume={0.035} />
        <SafeZoneOverlay />
      </AbsoluteFill>
    </LayoutRegistryProvider>
  );
};

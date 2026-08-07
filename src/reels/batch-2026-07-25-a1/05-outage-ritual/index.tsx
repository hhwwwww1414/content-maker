import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-batch05-outage-ritual.json';
import captionsJson from '../../../generated/captions-batch05-outage-ritual.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * REEL 05 — "Ритуал".
 *
 * Camera grammar: DOCUMENTARY OBSERVATION — the camera sits still in the room and
 * lets the character do the work. Motion grammar: CHARACTER / ENVIRONMENT
 * INTERACTION — the scene advances because the mascot walks the same circle again.
 * Transitions are action match cuts. Ending: VISUAL PUNCHLINE.
 * Mascot: main character, official asset, uniform scale only.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

// --- room -------------------------------------------------------------------
/** The brand plate is what you see through the window, not the set itself. */
const Room: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = 0.94 + 0.06 * Math.sin(frame / 37);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#0C1011', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, #101617 0%, #0B1011 58%, #070B0C 100%)',
        }}
      />
      {/* window */}
      <div
        style={{
          position: 'absolute',
          left: 726,
          top: 250,
          width: 318,
          height: 512,
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid rgba(150,200,205,0.18)',
          boxShadow: '0 0 120px rgba(110,180,200,0.16)',
        }}
      >
        <Img
          src={staticFile(ASSETS.background)}
          style={{
            position: 'absolute',
            left: -180,
            top: -240,
            width: 700,
            height: 1244,
            objectFit: 'cover',
            filter: 'brightness(0.6) saturate(0.8) hue-rotate(-8deg)',
          }}
        />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,14,16,0.2), rgba(8,14,16,0.7))'}} />
        <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: 'rgba(150,200,205,0.18)'}} />
        <div style={{position: 'absolute', top: '46%', left: 0, right: 0, height: 3, background: 'rgba(150,200,205,0.18)'}} />
      </div>
      {/* desk lamp pool, left */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 520px 380px at 16% 40%, rgba(255,201,138,${0.17 * flicker}), transparent 70%)`,
        }}
      />
      {/* floor */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1168, height: 2, background: 'rgba(160,200,200,0.10)'}} />
    </AbsoluteFill>
  );
};

// --- the stalled feed --------------------------------------------------------
const FeedInset: React.FC<{dim: number}> = ({dim}) => {
  const frame = useCurrentFrame();
  const spin = (frame / 9) % (Math.PI * 2);
  return (
    <div
      style={{
        position: 'absolute',
        left: 132,
        top: 330,
        width: 386,
        height: 470,
        borderRadius: 26,
        background: 'linear-gradient(180deg, rgba(16,23,25,0.96), rgba(9,14,15,0.96))',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 40px 90px rgba(0,0,0,0.62)',
        overflow: 'hidden',
        opacity: 1 - dim * 0.72,
        zIndex: LAYERS.HERO_BACK,
      }}
    >
      {[0, 1].map((i) => (
        <div key={i} style={{padding: 18, borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
          <div style={{width: 150, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.16)'}} />
          <div style={{width: 300, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.09)', marginTop: 12}} />
          <div style={{width: 240, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.07)', marginTop: 8}} />
        </div>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 168, display: 'grid', placeItems: 'center'}}>
        <svg width={54} height={54} viewBox="0 0 54 54">
          <circle cx="27" cy="27" r="20" stroke="rgba(255,255,255,0.14)" strokeWidth="4" fill="none" />
          <path
            d={`M27 7 A20 20 0 0 1 ${27 + 20 * Math.sin(spin)} ${27 - 20 * Math.cos(spin)}`}
            stroke={BRAND.gray}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

// --- outage map --------------------------------------------------------------
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const COMPLAINTS = (() => {
  const rand = mulberry32(721);
  return Array.from({length: 34}).map(() => ({x: 24 + rand() * 292, y: 20 + rand() * 250, d: rand()}));
})();

const OutageMap: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('f_yes');
  const to = clock.end('f_news');
  const o = interpolate(frame, [from - 4, from + 14, to + 6, to + 22], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  const reveal = interpolate(frame, [from, to], [0, 1], CLAMP);
  return (
    <div
      style={{
        position: 'absolute',
        left: 560,
        top: 398,
        width: 340,
        height: 320,
        borderRadius: 20,
        background: 'linear-gradient(180deg, rgba(20,14,14,0.96), rgba(10,7,7,0.96))',
        border: `1px solid ${BRAND.danger}55`,
        boxShadow: '0 36px 80px rgba(0,0,0,0.6)',
        opacity: o,
        overflow: 'hidden',
        zIndex: LAYERS.HERO_FRONT,
      }}
    >
      <div style={{padding: '12px 16px', fontFamily: manrope, fontWeight: 800, fontSize: 19, letterSpacing: 2, color: BRAND.danger, textTransform: 'uppercase'}}>
        карта сбоев · 21.07
      </div>
      <svg width={340} height={270} style={{position: 'absolute', top: 46, left: 0}}>
        {COMPLAINTS.map((p, i) =>
          p.d <= reveal ? (
            <circle key={i} cx={p.x} cy={p.y} r={4 + p.d * 5} fill={BRAND.danger} opacity={0.35 + 0.5 * Math.sin(frame / 18 + i)} />
          ) : null,
        )}
      </svg>
    </div>
  );
};

// --- the character walking the ritual ---------------------------------------
const RITUAL_STEPS = ['r_stuck', 'st_1', 'st_2', 'st_3', 'st_4', 'st_5', 'f_yes', 'p_relief', 'p_ten', 'b_ghost'] as const;
const RITUAL_ANGLES = [200, 200, 252, 308, 344, 382, 382, 442, 502, 560];

const Mascot: React.FC = () => {
  const frame = useCurrentFrame();
  const deg = interpolate(
    frame,
    RITUAL_STEPS.map((id) => clock.at(id)),
    RITUAL_ANGLES,
    {...CLAMP, easing: Easing.inOut(Easing.quad)},
  );
  const rad = (deg * Math.PI) / 180;
  const x = 512 + 214 * Math.cos(rad);
  const y = 966 + 84 * Math.sin(rad);
  // uniform scale only — the official asset is never stretched or redrawn
  const scale = 0.9 + 0.13 * ((Math.sin(rad) + 1) / 2);
  const bob = Math.sin(frame / 15) * 4;
  const size = 300 * scale;
  return (
    <Img
      src={staticFile(ASSETS.mascot)}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2 + bob,
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 26px 46px rgba(0,0,0,0.6))',
        zIndex: LAYERS.HERO,
      }}
    />
  );
};

/** Faint trace of the circle already walked — the ritual made visible. */
const RitualPath: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [clock.at('st_1'), clock.at('b_ghost')], [0, 1], CLAMP);
  const o = interpolate(frame, [clock.at('st_2'), clock.at('st_2') + 20], [0, 0.4], CLAMP);
  const pts: string[] = [];
  for (let i = 0; i <= 80; i += 1) {
    const deg = 200 + (560 - 200) * (i / 80) * t;
    const rad = (deg * Math.PI) / 180;
    pts.push(`${512 + 214 * Math.cos(rad)},${1046 + 84 * Math.sin(rad)}`);
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, zIndex: LAYERS.ENVIRONMENT}}>
      <polyline points={pts.join(' ')} fill="none" stroke={BRAND.gray} strokeWidth={2} strokeDasharray="6 10" opacity={o} />
    </svg>
  );
};

/** Step chips read like stage directions, never repeating the subtitle text. */
const StepChip: React.FC = () => {
  const frame = useCurrentFrame();
  const steps = ['st_1', 'st_2', 'st_3', 'st_4', 'st_5'] as const;
  const active = steps.reduce<number>((acc, id, i) => (frame >= clock.at(id) ? i : acc), -1);
  const o = interpolate(
    frame,
    [clock.at('st_1') - 6, clock.at('st_1') + 10, clock.end('st_5'), clock.end('st_5') + 16],
    [0, 1, 1, 0],
    CLAMP,
  );
  if (o <= 0.002 || active < 0) return null;
  return (
    <div style={{position: 'absolute', left: 130, top: 262, opacity: o, display: 'flex', alignItems: 'center', gap: 12, zIndex: LAYERS.TEXT}}>
      {steps.map((id, i) => (
        <span
          key={id}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            fontFamily: manrope,
            fontWeight: 800,
            fontSize: 22,
            color: i <= active ? '#08100F' : BRAND.gray,
            background: i <= active ? BRAND.mint : 'rgba(255,255,255,0.06)',
            border: `1px solid ${i <= active ? BRAND.mint : 'rgba(255,255,255,0.12)'}`,
          }}
        >
          {i + 1}
        </span>
      ))}
      <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 24, letterSpacing: 2, color: BRAND.gray, textTransform: 'uppercase', marginLeft: 6}}>
        шаг ритуала
      </span>
    </div>
  );
};

/** The bill: ten minutes spent, nothing solved. */
const Ledger: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('p_relief');
  const o = clock.rise(frame, from - 6, 16);
  if (o <= 0.002) return null;
  const mins = Math.min(10, Math.max(0, (frame - from) / (clock.at('p_zero') - from) * 10));
  const mm = Math.floor(mins).toString().padStart(2, '0');
  const ss = Math.floor((mins % 1) * 60).toString().padStart(2, '0');
  return (
    <div style={{position: 'absolute', left: 130, top: 262, opacity: o, zIndex: LAYERS.TEXT}}>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 26}}>
        <div>
          <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, letterSpacing: 2.2, color: BRAND.gray, textTransform: 'uppercase'}}>
            потрачено
          </div>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 62, color: BRAND.white, fontVariantNumeric: 'tabular-nums'}}>
            {mm}:{ss}
          </div>
        </div>
        <div>
          <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, letterSpacing: 2.2, color: BRAND.gray, textTransform: 'uppercase'}}>
            решено
          </div>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 62, color: BRAND.danger}}>0</div>
        </div>
      </div>
    </div>
  );
};

/** The punchline is visual: a quiet working route beside a feed that never moved. */
const Punchline: React.FC = () => {
  const frame = useCurrentFrame();
  const o = clock.rise(frame, clock.at('b_ghost') + 6, 20);
  if (o <= 0.002) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 132,
        top: 838,
        opacity: o,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 24px',
        borderRadius: 999,
        background: `${BRAND.mint}18`,
        border: `1px solid ${BRAND.mint}88`,
        zIndex: LAYERS.TEXT,
      }}
    >
      <span style={{width: 12, height: 12, borderRadius: 12, background: BRAND.mint}} />
      <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, color: BRAND.mint}}>GhostPepeBot · обход открыт</span>
    </div>
  );
};

export const GhostPepeBatch05OutageRitual: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, clock.total], [0, 14], CLAMP);
  const mapDim = interpolate(
    frame,
    [clock.at('f_yes') - 6, clock.at('f_yes') + 14, clock.end('f_news'), clock.end('f_news') + 18],
    [0, 1, 1, 0],
    CLAMP,
  );
  return (
    <LayoutRegistryProvider>
      <AbsoluteFill style={{background: '#070B0C', overflow: 'hidden'}}>
        <Room />
        <AbsoluteFill style={{transform: `translateX(${-drift}px) scale(1.02)`, transformOrigin: '50% 50%'}}>
          <RitualPath />
          <FeedInset dim={mapDim} />
          <Mascot />
          <OutageMap />
        </AbsoluteFill>
        <StepChip />
        <Ledger />
        <Punchline />
        <BatchCaption pages={pages} fps={clock.fps} frame="bracket" face="manrope" accent={BRAND.mint} fontSize={40} />
        <Audio src={staticFile(voicePath('batch05-outage-ritual'))} volume={1} />
        <Audio src={staticFile(ASSETS.ambient)} loop volume={0.032} />
        <SafeZoneOverlay />
      </AbsoluteFill>
    </LayoutRegistryProvider>
  );
};

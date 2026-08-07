import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-craft04-avalanche.json';
import captionsJson from '../../../generated/captions-craft04-avalanche.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * CRAFT 04 — "Один бит — весь отпечаток" (лавинный эффект, HMAC).
 *
 * Camera grammar: ORTHOGONAL GRID LOCK — камера строго перпендикулярна сетке и
 * смещается только шагами по осям. Motion grammar: AVALANCHE PROPAGATION —
 * единственная механика: одна клетка запускает волну по всему полю.
 * Ending: TYPOGRAPHIC-END. Mascot: не используется.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const N = 8;
const CELL = 60;
const GAP = 7;
const GRID_W = N * CELL + (N - 1) * GAP;
const GRID_X = Math.round((1080 - GRID_W) / 2);
const GRID_Y = 560;

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Two "fingerprints" that differ in about half their cells, as a real hash would. */
const buildState = (seed: number) => {
  const rand = mulberry32(seed);
  return Array.from({length: N * N}).map(() => (rand() > 0.5 ? 1 : 0));
};
const STATE_A = buildState(9137);
const STATE_B = buildState(4421);
const STATE_C = buildState(7755);

const HEX_A = 'a4 f1 09 3c 7b e2 55 d8';
const HEX_B = '1c 6b d4 90 22 af 08 e7';

/** Distance from the seed cell decides when a cell flips — that is the avalanche. */
const ORIGIN = {row: 5, col: 2};
const distanceOf = (i: number) => {
  const row = Math.floor(i / N);
  const col = i % N;
  return Math.hypot(row - ORIGIN.row, col - ORIGIN.col);
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.12 + 0.03 * Math.sin(frame / 70);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#05080A', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          left: -640,
          top: -420,
          width: 2360,
          height: 2760,
          objectFit: 'cover',
          opacity: pulse,
          filter: 'brightness(0.35) blur(16px)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(34,240,208,0.08), transparent 54%), radial-gradient(ellipse at 50% 50%, rgba(5,8,10,0.3), #05080A 82%)',
        }}
      />
    </AbsoluteFill>
  );
};

const Grid: React.FC<{state: number[]; wave: number; offsetX?: number; scale?: number; accent?: string}> = ({
  state,
  wave,
  offsetX = 0,
  scale = 1,
  accent = BRAND.mint,
}) => (
  <div
    style={{
      position: 'absolute',
      left: GRID_X + offsetX,
      top: GRID_Y,
      width: GRID_W,
      height: GRID_W,
      transform: `scale(${scale})`,
      transformOrigin: '50% 50%',
      zIndex: LAYERS.HERO,
    }}
  >
    {state.map((bit, i) => {
      const flipped = distanceOf(i) <= wave;
      const on = flipped ? bit : STATE_A[i];
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (i % N) * (CELL + GAP),
            top: Math.floor(i / N) * (CELL + GAP),
            width: CELL,
            height: CELL,
            borderRadius: 8,
            boxSizing: 'border-box',
            background: on ? `${accent}2e` : 'rgba(255,255,255,0.028)',
            border: `2px solid ${on ? accent : 'rgba(226,240,238,0.14)'}`,
            boxShadow: on ? `0 0 16px ${accent}33` : 'none',
          }}
        />
      );
    })}
  </div>
);

const Field: React.FC = () => {
  const frame = useCurrentFrame();

  // shot 1 — the wave is already running when the reel opens
  const wave1 = interpolate(frame, [0, clock.end('hk_half')], [0, 12], {...CLAMP, easing: Easing.out(Easing.cubic)});
  // shot 3 — one input character changes, the field flips again
  const wave2 = interpolate(frame, [clock.at('tn_one') + 8, clock.at('tn_boom') + 26], [0, 12], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });

  const stable = frame >= clock.at('hs_what') && frame < clock.at('tn_one');
  const state = frame >= clock.at('tn_one') ? STATE_C : STATE_B;
  const wave = frame >= clock.at('tn_one') ? wave2 : stable ? 12 : wave1;

  // shot 5 — the field shrinks into a badge riding on a packet
  const shrink = interpolate(frame, [clock.at('us_mac'), clock.at('us_mac') + 26], [1, 0.34], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  // shot 6 — everything but a single cell goes dark
  const collapse = interpolate(frame, [clock.at('br_ghost'), clock.at('br_ghost') + 24], [1, 0], CLAMP);

  return (
    <div style={{opacity: collapse}}>
      <Grid state={state} wave={wave} scale={shrink} accent={frame >= clock.at('tn_one') ? BRAND.amber : BRAND.mint} />
    </div>
  );
};

/** The packet the fingerprint travels on, and what happens when it disagrees. */
const PacketCheck: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('us_check');
  const o = interpolate(frame, [from - 6, from + 16, clock.at('br_ghost'), clock.at('br_ghost') + 18], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  const reject = clock.rise(frame, clock.at('us_drop'), 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: 190,
        top: 1046,
        width: 700,
        height: 116,
        borderRadius: 16,
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, rgba(18,28,30,0.95), rgba(9,15,16,0.95))',
        border: `2px solid ${reject > 0.5 ? BRAND.danger : BRAND.mint}88`,
        opacity: o,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 22px',
        zIndex: LAYERS.HERO_FRONT,
      }}
    >
      <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 22, letterSpacing: 2.4, color: 'rgba(226,240,238,0.55)', textTransform: 'uppercase'}}>
        пакет
      </span>
      <span style={{flex: 1, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.10)'}} />
      <span
        style={{
          padding: '10px 18px',
          borderRadius: 10,
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: 2,
          color: reject > 0.5 ? BRAND.danger : BRAND.mint,
          border: `2px solid ${reject > 0.5 ? BRAND.danger : BRAND.mint}`,
          background: `${reject > 0.5 ? BRAND.danger : BRAND.mint}1f`,
        }}
      >
        {reject > 0.5 ? 'не сошёлся' : 'HMAC'}
      </span>
    </div>
  );
};

/** Hex diff readout under the grid: two fingerprints, differences highlighted. */
const HexDiff: React.FC = () => {
  const frame = useCurrentFrame();
  const showFirst = interpolate(frame, [clock.at('hs_what'), clock.at('hs_what') + 16, clock.at('us_check'), clock.at('us_check') + 14], [0, 1, 1, 0], CLAMP);
  const showSecond = interpolate(frame, [clock.at('tn_boom'), clock.at('tn_boom') + 16, clock.at('us_check'), clock.at('us_check') + 14], [0, 1, 1, 0], CLAMP);
  if (showFirst <= 0.002) return null;
  const rowStyle: React.CSSProperties = {
    fontFamily: manrope,
    fontWeight: 800,
    fontSize: 30,
    letterSpacing: 3,
    display: 'flex',
    gap: 12,
  };
  return (
    <div style={{position: 'absolute', left: GRID_X, top: GRID_Y + GRID_W + 26, width: GRID_W, zIndex: LAYERS.TEXT}}>
      <div style={{...rowStyle, opacity: showFirst, color: 'rgba(226,240,238,0.78)'}}>
        {HEX_A.split(' ').map((byte) => (
          <span key={`a-${byte}`}>{byte}</span>
        ))}
      </div>
      <div style={{...rowStyle, opacity: showSecond, color: BRAND.amber, marginTop: 12}}>
        {HEX_B.split(' ').map((byte, i) => (
          <span key={`b-${byte}`} style={{color: byte === HEX_A.split(' ')[i] ? 'rgba(226,240,238,0.5)' : BRAND.amber}}>
            {byte}
          </span>
        ))}
      </div>
    </div>
  );
};

const Kicker: React.FC = () => {
  const frame = useCurrentFrame();
  const items: {from: string; to: string; text: string; color: string}[] = [
    {from: 'hk_bit', to: 'hs_what', text: 'лавинный эффект', color: BRAND.mint},
    {from: 'hs_what', to: 'tn_one', text: 'отпечаток', color: 'rgba(226,240,238,0.6)'},
    {from: 'tn_one', to: 'us_check', text: '1 бит входа', color: BRAND.amber},
    {from: 'us_check', to: 'br_ghost', text: 'проверка пакета', color: BRAND.mint},
  ];
  return (
    <>
      {items.map((item) => {
        const from = clock.at(item.from);
        const to = clock.at(item.to);
        const o = interpolate(frame, [from, from + 12, to - 12, to], [0, 1, 1, 0], CLAMP);
        if (o <= 0.002) return null;
        return (
          <div
            key={item.text}
            style={{
              position: 'absolute',
              left: 130,
              top: 300,
              opacity: o,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              zIndex: LAYERS.TEXT,
            }}
          >
            <span style={{width: 30, height: 3, background: item.color}} />
            <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 30, letterSpacing: 2.4, color: item.color, textTransform: 'uppercase'}}>
              {item.text}
            </span>
          </div>
        );
      })}
    </>
  );
};

/** TYPOGRAPHIC-END: a single cell survives, the sentence carries the rest. */
const TypographicEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const o = clock.rise(frame, clock.at('br_ghost') + 12, 22);
  if (o <= 0.002) return null;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: GRID_X + 2 * (CELL + GAP),
          top: GRID_Y + 5 * (CELL + GAP),
          width: CELL,
          height: CELL,
          borderRadius: 8,
          border: `2px solid ${BRAND.mint}`,
          background: `${BRAND.mint}33`,
          boxShadow: `0 0 40px ${BRAND.mint}55`,
          opacity: o,
          zIndex: LAYERS.HERO_FRONT,
        }}
      />
      <div style={{position: 'absolute', left: 112, top: 300, width: 720, opacity: o, zIndex: LAYERS.TEXT}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 74, lineHeight: 1.02, letterSpacing: -2.4, color: BRAND.white}}>
          Один бит.<br />
          <span style={{color: BRAND.mint}}>Весь отпечаток.</span>
        </div>
      </div>
    </>
  );
};

export const GhostPepeCraftAvalanche: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: '#05080A', overflow: 'hidden'}}>
      <Backdrop />
      <Field />
      <HexDiff />
      <PacketCheck />
      <Kicker />
      <TypographicEnd />
      <BatchCaption pages={pages} fps={clock.fps} frame="rule" face="unbounded" accent={BRAND.mint} fontSize={40} />
      <Audio src={staticFile(voicePath('craft04-avalanche'))} volume={1} />
      <Audio src={staticFile(ASSETS.ambient)} loop volume={0.026} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

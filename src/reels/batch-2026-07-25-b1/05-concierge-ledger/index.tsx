import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-craft05-concierge-ledger.json';
import captionsJson from '../../../generated/captions-craft05-concierge-ledger.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * CRAFT 05 — "Один адрес на всех" (NAPT, RFC 3022).
 *
 * Camera grammar: WIDE LOBBY DESK OBSERVATION — камера стоит у входа и почти не
 * двигается. Motion grammar: TABLE LOOKUP CHOREOGRAPHY — строка находится, и
 * предмет уходит по найденному адресу. Ending: VISUAL-PUNCHLINE.
 * Mascot: главный персонаж за стойкой.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const WALL = {x: 132, y: 322, w: 752, h: 404};
const DESK = {x: 96, y: 964, w: 792, h: 214};

const ROWS = [
  {device: 'ноутбук', port: '51000'},
  {device: 'телефон', port: '52000'},
  {device: 'телевизор', port: '53000'},
];

// --- lobby -------------------------------------------------------------------
const Lobby: React.FC = () => {
  const frame = useCurrentFrame();
  const lamp = 0.16 + 0.02 * Math.sin(frame / 48);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#0B0E0F', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #131A1B 0%, #0C1213 56%, #080C0D 100%)'}} />
      {/* the view out of the lobby */}
      <div
        style={{
          position: 'absolute',
          left: 894,
          top: 300,
          width: 150,
          height: 620,
          overflow: 'hidden',
          borderLeft: '2px solid rgba(180,220,220,0.14)',
        }}
      >
        <Img
          src={staticFile(ASSETS.background)}
          style={{
            position: 'absolute',
            left: -260,
            top: -120,
            width: 660,
            height: 1172,
            objectFit: 'cover',
            filter: 'brightness(0.5) saturate(0.7) blur(1px)',
          }}
        />
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 620px 420px at 24% 62%, rgba(255,206,150,${lamp}), transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// --- pigeonhole wall ---------------------------------------------------------
const Wall: React.FC = () => {
  const frame = useCurrentFrame();
  // the wall multiplies when the reel moves from one home to a whole server
  const scaleUp = interpolate(frame, [clock.at('rf_nat'), clock.at('vp_same') + 20], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const cols = Math.round(interpolate(scaleUp, [0, 1], [6, 18], CLAMP));
  const rows = Math.round(interpolate(scaleUp, [0, 1], [3, 9], CLAMP));
  const cw = WALL.w / cols;
  const ch = WALL.h / rows;
  const highlight = clock.rise(frame, clock.at('bk_find'), 16);
  const lost = clock.rise(frame, clock.at('en_punch'), 24);

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const isTarget = r === 1 && c === 2 && cols === 6;
      const isLostOne = scaleUp > 0.5 && r === 4 && c === 7;
      const mint = (isTarget ? highlight : 0) || (isLostOne ? Math.max(0, 1 - lost) : 0);
      cells.push(
        <div
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            left: WALL.x + c * cw + 3,
            top: WALL.y + r * ch + 3,
            width: cw - 6,
            height: ch - 6,
            boxSizing: 'border-box',
            borderRadius: 4,
            background: mint > 0.05 ? `${BRAND.mint}22` : 'rgba(255,255,255,0.028)',
            border: `1px solid ${mint > 0.05 ? BRAND.mint : 'rgba(226,240,238,0.13)'}`,
          }}
        />,
      );
    }
  }
  return <div style={{position: 'absolute', inset: 0, zIndex: LAYERS.ENVIRONMENT}}>{cells}</div>;
};

// --- ledger ------------------------------------------------------------------
const Ledger: React.FC = () => {
  const frame = useCurrentFrame();
  const open = clock.rise(frame, clock.at('lg_book') - 4, 18);
  const fade = interpolate(frame, [clock.at('rf_nat'), clock.at('rf_nat') + 22], [1, 0.25], CLAMP);
  const found = clock.rise(frame, clock.at('bk_find'), 14);
  return (
    <div
      style={{
        position: 'absolute',
        left: DESK.x + 54,
        top: DESK.y + 24,
        width: 560,
        opacity: open * fade,
        zIndex: LAYERS.HERO_FRONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 19,
          letterSpacing: 2.4,
          color: 'rgba(60,48,30,0.62)',
          textTransform: 'uppercase',
          paddingBottom: 8,
          borderBottom: '2px solid rgba(60,48,30,0.35)',
        }}
      >
        <span style={{width: 210}}>устройство</span>
        <span style={{width: 150}}>порт</span>
        <span>адрес</span>
      </div>
      {ROWS.map((row, i) => {
        const written = clock.rise(frame, clock.at(i === 0 ? 'lg_two' : i === 1 ? 'lg_phone' : 'bk_come') + i * 3, 12);
        const isFound = i === 0 && found > 0.4;
        return (
          <div
            key={row.device}
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              padding: '10px 6px',
              marginTop: 4,
              borderRadius: 6,
              background: isFound ? `${BRAND.mint}26` : 'transparent',
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 28,
              color: '#2C2416',
              opacity: 0.25 + 0.75 * written,
            }}
          >
            <span style={{width: 210}}>{row.device}</span>
            <span style={{width: 150, color: isFound ? '#0B6B5C' : '#2C2416'}}>{row.port}</span>
            <span style={{opacity: 0.6}}>203.0.113.7</span>
          </div>
        );
      })}
    </div>
  );
};

const Desk: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: DESK.x,
      top: DESK.y,
      width: DESK.w,
      height: DESK.h,
      borderRadius: 14,
      background: 'linear-gradient(180deg, #E4D8BE, #B9A87F)',
      boxShadow: '0 -18px 60px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.4)',
      zIndex: LAYERS.HERO,
    }}
  />
);

const Concierge: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 34) * 4;
  const shrug = interpolate(frame, [clock.at('en_punch'), clock.at('en_punch') + 20], [0, 1], CLAMP);
  return (
    <Img
      src={staticFile(ASSETS.mascot)}
      style={{
        position: 'absolute',
        left: 636,
        top: 754 + bob - shrug * 10,
        width: 236,
        height: 236,
        objectFit: 'contain',
        filter: 'drop-shadow(0 22px 40px rgba(0,0,0,0.6))',
        zIndex: LAYERS.HERO_BACK,
      }}
    />
  );
};

/** The envelope that comes back and has to find its owner. */
const Envelope: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('bk_come');
  const t = interpolate(frame, [from, clock.at('bk_find') + 20], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.cubic)});
  const o = interpolate(frame, [from - 6, from + 12, clock.at('rf_nat'), clock.at('rf_nat') + 16], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  const x = interpolate(t, [0, 1], [70, WALL.x + 2 * (WALL.w / 6) + 14], CLAMP);
  const y = interpolate(t, [0, 0.5, 1], [1010, 830, WALL.y + 1 * (WALL.h / 3) + 14], CLAMP);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 108,
        height: 74,
        borderRadius: 6,
        background: 'linear-gradient(160deg, #F2EAD8, #D7CAAE)',
        border: '2px solid rgba(60,48,30,0.5)',
        opacity: o,
        zIndex: LAYERS.HERO_FRONT,
        display: 'grid',
        placeItems: 'center',
        fontFamily: manrope,
        fontWeight: 800,
        fontSize: 22,
        color: '#2C2416',
        boxShadow: '0 14px 26px rgba(0,0,0,0.45)',
      }}
    >
      51000
    </div>
  );
};

const LedgerNotes: React.FC = () => {
  const frame = useCurrentFrame();
  const items: {from: string; to: string; text: string; color: string}[] = [
    {from: 'hk_ten', to: 'lg_book', text: '10 устройств · 1 адрес', color: 'rgba(226,240,238,0.72)'},
    {from: 'lg_book', to: 'bk_come', text: 'журнал соответствий', color: BRAND.amber},
    {from: 'bk_come', to: 'rf_nat', text: 'ответ ищут по номеру', color: BRAND.mint},
    {from: 'rf_nat', to: 'br_ghost', text: 'RFC 3022 · 2001', color: 'rgba(226,240,238,0.72)'},
    {from: 'br_ghost', to: 'en_punch', text: 'та же таблица, но на сервере', color: BRAND.mint},
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
              left: 132,
              top: 264,
              opacity: o,
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 1.6,
              color: item.color,
              zIndex: LAYERS.TEXT,
            }}
          >
            {item.text}
          </div>
        );
      })}
    </>
  );
};

export const GhostPepeCraftConciergeLedger: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, clock.total], [0, 10], CLAMP);
  return (
    <LayoutRegistryProvider>
      <AbsoluteFill style={{background: '#080C0D', overflow: 'hidden'}}>
        <Lobby />
        <AbsoluteFill style={{transform: `translateX(${-drift}px)`}}>
          <Wall />
          <Concierge />
          <Desk />
          <Ledger />
          <Envelope />
        </AbsoluteFill>
        <LedgerNotes />
        <BatchCaption pages={pages} fps={clock.fps} frame="bubble" face="manrope" accent={BRAND.mint} fontSize={40} />
        <Audio src={staticFile(voicePath('craft05-concierge-ledger'))} volume={1} />
        <Audio src={staticFile(ASSETS.ambient)} loop volume={0.03} />
        <SafeZoneOverlay />
      </AbsoluteFill>
    </LayoutRegistryProvider>
  );
};

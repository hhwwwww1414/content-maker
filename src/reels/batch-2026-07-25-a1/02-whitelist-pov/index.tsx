import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-batch02-whitelist-pov.json';
import captionsJson from '../../../generated/captions-batch02-whitelist-pov.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * REEL 02 — "Половина телефона".
 *
 * Camera grammar: CONTROLLED FIRST-PERSON / OVER-SHOULDER. The frame is a held
 * shot — it sways and tilts, it never flies. Motion grammar: POV ENVIRONMENTAL
 * REVEAL — the story advances because the observer moves the device, not because
 * new objects appear. Transitions are foreground occlusions by the thumb.
 * Ending: QUESTION-END. Mascot: a single cameo in the glass reflection.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const PHONE = {x: 282, y: 318, w: 516, h: 862, radius: 54};
const SCREEN = {x: PHONE.x + 16, y: PHONE.y + 16, w: PHONE.w - 32, h: PHONE.h - 32};

const OK = '#37E0A6';
const WAIT = '#FFC24B';
const DEAD = '#FF6B61';

type Row = {id: string; label: string; state: 'ok' | 'wait' | 'dead'; domain: string};
const ROWS: Row[] = [
  {id: 'gos', label: 'Госуслуги', state: 'ok', domain: 'gosuslugi.ru'},
  {id: 'maps', label: 'Карты', state: 'wait', domain: 'maps.app'},
  {id: 'msg', label: 'Мессенджер', state: 'dead', domain: 'chat.app'},
];

const ROW_START = ['p_gos', 'p_maps', 'p_msg'] as const;

// --- handheld camera --------------------------------------------------------
/** Held, not flown: a slow breathing sway plus motivated tilts on the beats. */
const handheld = (frame: number) => {
  const sway = Math.sin(frame / 46) * 6;
  const bob = Math.cos(frame / 61) * 4;
  const tilt = interpolate(
    frame,
    [clock.at('p_same'), clock.at('p_notphone'), clock.at('w_list'), clock.at('w_wifi'), clock.at('w_mobile'), clock.at('b_ghost')],
    [0, -5.5, -2, 4.5, 4.5, 0],
    {...CLAMP, easing: Easing.inOut(Easing.quad)},
  );
  const lift = interpolate(
    frame,
    [clock.at('p_same'), clock.at('w_list'), clock.at('b_ghost')],
    [0, -26, 0],
    {...CLAMP, easing: Easing.inOut(Easing.quad)},
  );
  return {rotate: tilt + Math.sin(frame / 83) * 0.7, x: sway, y: bob + lift};
};

// --- backdrop ---------------------------------------------------------------
/** Evening room: the brand plate lives far out of focus as window light. */
const Room: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.5 + 0.05 * Math.sin(frame / 70);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#0B0F10', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          width: 2258,
          height: 4013,
          left: 240,
          top: -900,
          objectFit: 'cover',
          filter: 'blur(26px) saturate(0.7) brightness(0.55)',
          opacity: glow,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 14% 26%, rgba(255,196,120,0.16), transparent 42%), radial-gradient(ellipse at 62% 70%, rgba(8,14,16,0.5), #070B0C 78%)',
        }}
      />
    </AbsoluteFill>
  );
};

// --- phone ------------------------------------------------------------------
const StateDot: React.FC<{state: Row['state']; t: number}> = ({state, t}) => {
  const frame = useCurrentFrame();
  const color = state === 'ok' ? OK : state === 'wait' ? WAIT : DEAD;
  if (state === 'wait') {
    const a = (frame / 8) % (Math.PI * 2);
    return (
      <svg width={34} height={34} viewBox="0 0 34 34" style={{opacity: t}}>
        <circle cx="17" cy="17" r="13" stroke={`${color}44`} strokeWidth="3.4" fill="none" />
        <path
          d={`M17 4 A13 13 0 0 1 ${17 + 13 * Math.sin(a)} ${17 - 13 * Math.cos(a)}`}
          stroke={color}
          strokeWidth="3.4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width={34} height={34} viewBox="0 0 34 34" style={{opacity: t}}>
      <circle cx="17" cy="17" r="14" fill={`${color}22`} stroke={color} strokeWidth="2.6" />
      {state === 'ok' ? (
        <path d="M10 17.5l4.5 4.5L24 12" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M11 11l12 12M23 11L11 23" stroke={color} strokeWidth="3" strokeLinecap="round" />
      )}
    </svg>
  );
};

const AppRows: React.FC = () => {
  const frame = useCurrentFrame();
  const stampFrom = clock.at('w_how');
  const wifiOn = clock.rise(frame, clock.at('w_wifi'), 18);
  const revive = clock.rise(frame, clock.at('b_ghost'), 20);
  return (
    <div style={{position: 'absolute', left: SCREEN.x + 22, top: SCREEN.y + 112, width: SCREEN.w - 44}}>
      {ROWS.map((row, i) => {
        const appear = clock.rise(frame, clock.at(ROW_START[i]) - 6, 12);
        const alive = row.state === 'ok' ? 1 : Math.max(wifiOn, revive);
        const color = row.state === 'ok' || alive > 0.5 ? OK : row.state === 'wait' ? WAIT : DEAD;
        const stamp = clock.rise(frame, stampFrom + i * 10, 12);
        return (
          <div
            key={row.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '20px 18px',
              marginBottom: 18,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.045)',
              border: `1px solid ${color}44`,
              opacity: appear,
            }}
          >
            <div style={{width: 52, height: 52, borderRadius: 14, background: `${color}22`, border: `1px solid ${color}66`}} />
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 30, color: BRAND.white}}>{row.label}</div>
              <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: BRAND.gray, opacity: stamp}}>{row.domain}</div>
            </div>
            <StateDot state={alive > 0.5 ? 'ok' : row.state} t={appear} />
          </div>
        );
      })}
    </div>
  );
};

const NetworkBar: React.FC = () => {
  const frame = useCurrentFrame();
  const wifi = clock.rise(frame, clock.at('w_wifi'), 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: SCREEN.x + 22,
        top: SCREEN.y + 26,
        width: SCREEN.w - 44,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <svg width={36} height={30} viewBox="0 0 36 30" style={{opacity: 1 - wifi * 0.7}}>
        {[0, 1, 2, 3].map((b) => (
          <rect key={b} x={2 + b * 8} y={24 - (b + 1) * 5.5} width={6} height={(b + 1) * 5.5} rx={2} fill={BRAND.white} />
        ))}
      </svg>
      <svg width={36} height={30} viewBox="0 0 36 30" style={{opacity: 0.25 + wifi * 0.75}}>
        <path d="M4 12c8-7 20-7 28 0" stroke={wifi > 0.5 ? BRAND.mint : BRAND.gray} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M9.5 17.5c5-4.4 12-4.4 17 0" stroke={wifi > 0.5 ? BRAND.mint : BRAND.gray} strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="18" cy="24" r="2.6" fill={wifi > 0.5 ? BRAND.mint : BRAND.gray} />
      </svg>
      <span style={{marginLeft: 'auto', fontFamily: manrope, fontWeight: 700, fontSize: 22, color: BRAND.gray}}>
        {wifi > 0.5 ? 'Wi-Fi' : 'моб. интернет'}
      </span>
    </div>
  );
};

/** The real hero: the list that decides, sliding in over the interface. */
const WhitelistPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const inAt = clock.at('w_list');
  const outAt = clock.at('w_wifi');
  const slide = interpolate(frame, [inAt, inAt + 22], [1, 0], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const leave = interpolate(frame, [outAt - 4, outAt + 16], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  const opacity = interpolate(frame, [inAt - 4, inAt + 12, outAt, outAt + 16], [0, 1, 1, 0], CLAMP);
  if (opacity <= 0.002) return null;
  const count = Math.round(interpolate(frame, [clock.at('w_hundreds'), clock.end('w_hundreds')], [12, 500], {...CLAMP, easing: Easing.out(Easing.cubic)}));
  return (
    <div
      style={{
        position: 'absolute',
        left: SCREEN.x + 30,
        // sits clear of the last app row: rows end at SCREEN.y + 112 + 3*128
        top: SCREEN.y + 512,
        width: SCREEN.w - 60,
        borderRadius: 22,
        padding: 22,
        background: 'linear-gradient(180deg, rgba(12,20,22,0.96), rgba(7,12,13,0.96))',
        border: `1px solid ${BRAND.mint}44`,
        boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
        opacity,
        transform: `translateX(${slide * 340 + leave * 340}px)`,
      }}
    >
      <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 19, letterSpacing: 2, color: BRAND.mint, textTransform: 'uppercase'}}>
        белый список · Минцифры
      </div>
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 52, color: BRAND.white, marginTop: 6, fontVariantNumeric: 'tabular-nums'}}>
        {count}+
      </div>
      <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: BRAND.gray, marginTop: 2}}>разрешённых ресурсов</div>
      <div style={{marginTop: 16, display: 'flex', gap: 10}}>
        {['домен', 'IP', 'DPI'].map((chip, i) => (
          <span
            key={chip}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 20,
              color: BRAND.mint,
              background: `${BRAND.mint}18`,
              border: `1px solid ${BRAND.mint}55`,
              opacity: clock.rise(frame, clock.at('w_how') + i * 8, 10),
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
};

const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const cameo = interpolate(frame, [clock.at('b_ghost'), clock.at('b_ghost') + 18, clock.end('b_ghost'), clock.end('b_ghost') + 14], [0, 0.2, 0.2, 0], CLAMP);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: PHONE.x,
          top: PHONE.y,
          width: PHONE.w,
          height: PHONE.h,
          borderRadius: PHONE.radius,
          background: 'linear-gradient(160deg, #1B2325, #0C1214)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 60px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: SCREEN.x,
          top: SCREEN.y,
          width: SCREEN.w,
          height: SCREEN.h,
          borderRadius: PHONE.radius - 14,
          background: 'linear-gradient(180deg, #0A1214, #070D0E)',
          overflow: 'hidden',
        }}
      />
      <NetworkBar />
      <AppRows />
      <WhitelistPanel />
      {/* mascot appears only as a reflection on the glass — no redraw, no props */}
      <Img
        src={staticFile(ASSETS.mascot)}
        style={{
          position: 'absolute',
          left: SCREEN.x + SCREEN.w - 210,
          top: SCREEN.y + SCREEN.h - 250,
          width: 190,
          height: 190,
          objectFit: 'contain',
          opacity: cameo,
          mixBlendMode: 'screen',
          filter: 'blur(0.4px)',
        }}
      />
      {/* glass sheen, the only ambient motion on the device */}
      <div
        style={{
          position: 'absolute',
          left: SCREEN.x,
          top: SCREEN.y,
          width: SCREEN.w,
          height: SCREEN.h,
          borderRadius: PHONE.radius - 14,
          background: `linear-gradient(${118 + Math.sin(frame / 90) * 8}deg, rgba(255,255,255,0.09), transparent 42%)`,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

/** Foreground occlusion: the thumb crosses the lens instead of a cut. */
const Thumb: React.FC<{at: number}> = ({at}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at - 10, at + 12], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  if (t <= 0.001 || t >= 0.999) return null;
  const y = interpolate(t, [0, 1], [1980, 520], CLAMP);
  const x = interpolate(t, [0, 1], [-140, 260], CLAMP);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 760,
        height: 1080,
        borderRadius: '48% 52% 40% 60% / 60% 40% 60% 40%',
        background: 'linear-gradient(150deg, #14191B, #070B0C)',
        filter: 'blur(3px)',
        transform: `rotate(${interpolate(t, [0, 1], [-22, -6], CLAMP)}deg)`,
        zIndex: LAYERS.HERO_FRONT,
        boxShadow: '0 0 90px rgba(0,0,0,0.8)',
      }}
    />
  );
};

/** Typography lives attached to the device, never centred over the whole frame. */
const PovLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const beats: {id: string; until: string; text: string; color: string}[] = [
    {id: 'p_same', until: 'w_list', text: 'одна сеть · один телефон', color: BRAND.gray},
    {id: 'w_list', until: 'w_wifi', text: 'решает не телефон', color: BRAND.mint},
    {id: 'w_wifi', until: 'b_ghost', text: 'только мобильный трафик', color: WAIT},
  ];
  return (
    <>
      {beats.map((b) => {
        const from = clock.at(b.id);
        const to = clock.at(b.until);
        const o = interpolate(frame, [from, from + 12, to - 12, to], [0, 1, 1, 0], CLAMP);
        if (o <= 0.002) return null;
        return (
          <div
            key={b.id}
            style={{
              position: 'absolute',
              left: 130,
              top: 232,
              opacity: o,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: LAYERS.TEXT,
            }}
          >
            <span style={{width: 26, height: 3, background: b.color, borderRadius: 3}} />
            <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 27, letterSpacing: 1.4, color: b.color, textTransform: 'uppercase'}}>
              {b.text}
            </span>
          </div>
        );
      })}
    </>
  );
};

/**
 * QUESTION-END, carried by the object rather than by a headline: the screen empties
 * into a single blinking prompt. The words themselves stay in the caption, so the
 * headline layer never duplicates the subtitle.
 */
const QuestionEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('q_end');
  const o = clock.rise(frame, from - 8, 18);
  if (o <= 0.002) return null;
  const blink = 0.35 + 0.65 * (Math.sin(frame / 7) > 0 ? 1 : 0.25);
  return (
    <div
      style={{
        position: 'absolute',
        left: SCREEN.x,
        top: SCREEN.y,
        width: SCREEN.w,
        height: SCREEN.h,
        borderRadius: PHONE.radius - 14,
        background: 'linear-gradient(180deg, rgba(8,14,15,0.94), rgba(6,10,11,0.98))',
        opacity: o,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        zIndex: LAYERS.HERO_FRONT,
      }}
    >
      <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 190, color: BRAND.mint, textShadow: `0 0 70px ${BRAND.mint}55`}}>?</span>
      <span style={{width: 8, height: 120, background: BRAND.mint, opacity: blink, borderRadius: 2}} />
    </div>
  );
};

export const GhostPepeBatch02WhitelistPov: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = handheld(frame);
  return (
    <LayoutRegistryProvider>
      <AbsoluteFill style={{background: '#070B0C', overflow: 'hidden'}}>
        <Room />
        <AbsoluteFill
          style={{
            zIndex: LAYERS.HERO,
            transform: `translate(${cam.x}px, ${cam.y}px) rotate(${cam.rotate}deg)`,
            transformOrigin: '50% 62%',
          }}
        >
          <Phone />
          <QuestionEnd />
        </AbsoluteFill>
        <Thumb at={clock.at('p_same')} />
        <Thumb at={clock.at('w_list')} />
        <Thumb at={clock.at('b_ghost')} />
        <PovLabel />
        <BatchCaption pages={pages} fps={clock.fps} frame="bubble" face="manrope" accent={BRAND.mint} fontSize={40} />
        <Audio src={staticFile(voicePath('batch02-whitelist-pov'))} volume={1} />
        <Audio src={staticFile(ASSETS.ambient)} loop volume={0.03} />
        <SafeZoneOverlay />
      </AbsoluteFill>
    </LayoutRegistryProvider>
  );
};

import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-craft06-two-timers.json';
import captionsJson from '../../../generated/captions-craft06-two-timers.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * CRAFT 06 — "Два перфекциониста в одной трубе" (TCP over TCP meltdown).
 *
 * Camera grammar: SIDE-SCROLL TWO-TIER — камера едет строго по горизонтали вдоль
 * разреза трубы, без наклонов. Motion grammar: DUELING TIMERS CASCADE — два
 * периодических ритма расходятся, и разница копится очередью.
 * Ending: MASCOT-ONLY. Mascot: поздний выход.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const INNER = {y: 512, h: 232};
const OUTER = {y: 812, h: 232};
const DIAL_X = 268;
const DIAL_R = 76;

// --- shaft -------------------------------------------------------------------
const Shaft: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.17 + 0.03 * Math.sin(frame / 58);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#060A0C', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          left: -420,
          top: 420,
          width: 1920,
          height: 1080,
          objectFit: 'cover',
          transform: 'rotate(90deg)',
          opacity: glow,
          filter: 'brightness(0.4) saturate(0.6) blur(5px)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 46% 50%, rgba(111,200,255,0.07), transparent 52%), linear-gradient(180deg, #060A0C 0%, #0A1114 48%, #05090B 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const Tier: React.FC<{y: number; h: number; label: string; accent: string; opacity: number}> = ({y, h, label, accent, opacity}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: -60,
        top: y,
        width: 1200,
        height: h,
        borderRadius: 10,
        background: 'linear-gradient(180deg, rgba(18,28,32,0.9), rgba(9,15,18,0.9))',
        borderTop: `2px solid ${accent}55`,
        borderBottom: '2px solid rgba(0,0,0,0.55)',
        opacity,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 132,
        top: y + 14,
        fontFamily: manrope,
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: 3,
        color: accent,
        textTransform: 'uppercase',
        opacity,
      }}
    >
      {label}
    </div>
  </>
);

/** A countdown dial whose period is the whole point of the reel. */
const Dial: React.FC<{cx: number; cy: number; period: number; accent: string; opacity: number; label: string}> = ({
  cx,
  cy,
  period,
  accent,
  opacity,
  label,
}) => {
  const frame = useCurrentFrame();
  const t = (frame % period) / period;
  const angle = t * Math.PI * 2 - Math.PI / 2;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity}}>
      <circle cx={cx} cy={cy} r={DIAL_R} fill="rgba(8,14,16,0.9)" stroke={`${accent}88`} strokeWidth={3} />
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * (DIAL_R - 12)}
            y1={cy + Math.sin(a) * (DIAL_R - 12)}
            x2={cx + Math.cos(a) * (DIAL_R - 4)}
            y2={cy + Math.sin(a) * (DIAL_R - 4)}
            stroke={`${accent}66`}
            strokeWidth={2}
          />
        );
      })}
      <line cx={cx} cy={cy} x1={cx} y1={cy} x2={cx + Math.cos(angle) * (DIAL_R - 18)} y2={cy + Math.sin(angle) * (DIAL_R - 18)} stroke={accent} strokeWidth={5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={7} fill={accent} />
      <text x={cx} y={cy + DIAL_R + 34} textAnchor="middle" fontFamily={manrope} fontWeight="800" fontSize="24" fill={accent} letterSpacing="2">
        {label}
      </text>
    </svg>
  );
};

const Pipe: React.FC = () => {
  const frame = useCurrentFrame();

  const outerIn = clock.rise(frame, 4, 20);
  const innerIn = clock.rise(frame, clock.at('tw_in'), 22);

  // the outer timer doubles its period; the inner one never learns about it
  const outerPeriod = interpolate(frame, [clock.at('tw_slow'), clock.at('tw_slow') + 40], [46, 132], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  // retransmissions pile up between the moment they diverge and the meltdown
  const pileFrom = clock.at('tw_send');
  const pileTo = clock.at('ml_melt') + 20;
  const pile = interpolate(frame, [pileFrom, pileTo], [0, 22], CLAMP);
  const clear = clock.rise(frame, clock.at('ud_why'), 30);
  const visibleCount = Math.round(pile * (1 - clear));

  const fadeOut = interpolate(frame, [clock.at('br_end') - 10, clock.at('br_end') + 20], [1, 0], CLAMP);

  return (
    <div style={{position: 'absolute', inset: 0, zIndex: LAYERS.HERO, opacity: fadeOut}}>
      <Tier y={OUTER.y} h={OUTER.h} label="внешнее соединение" accent="#6FC8FF" opacity={outerIn} />
      <Tier y={INNER.y} h={INNER.h} label="внутреннее соединение" accent={BRAND.amber} opacity={innerIn} />

      <Dial cx={DIAL_X} cy={OUTER.y + OUTER.h / 2} period={outerPeriod} accent="#6FC8FF" opacity={outerIn} label="таймер" />
      <Dial cx={DIAL_X} cy={INNER.y + INNER.h / 2} period={46} accent={BRAND.amber} opacity={innerIn} label="таймер" />

      {/* steady traffic on the outer tier */}
      {[0, 1, 2, 3].map((i) => {
        const x = (((frame * 2.6 + i * 260) % 1240) + 1240) % 1240 - 120;
        return (
          <div
            key={`o${i}`}
            style={{
              position: 'absolute',
              left: 420 + (x % 760),
              top: OUTER.y + OUTER.h / 2 - 26,
              width: 76,
              height: 52,
              borderRadius: 6,
              border: '2px solid #6FC8FF',
              background: 'rgba(111,200,255,0.14)',
              opacity: outerIn * (1 - clear * 0.2),
            }}
          />
        );
      })}

      {/* the pile of identical retransmissions on the inner tier */}
      {Array.from({length: Math.max(0, visibleCount) }).map((_, i) => (
        <div
          key={`p${i}`}
          style={{
            position: 'absolute',
            left: 400 + (i % 11) * 44,
            top: INNER.y + 40 + Math.floor(i / 11) * 62,
            width: 40,
            height: 54,
            borderRadius: 5,
            border: `2px solid ${BRAND.danger}`,
            background: 'rgba(255,107,97,0.16)',
            opacity: innerIn,
          }}
        />
      ))}

      {/* the calm single stream once the tunnel drops to UDP */}
      {clear > 0.05
        ? [0, 1, 2, 3, 4].map((i) => {
            const x = (((frame * 4.4 + i * 190) % 1180) + 1180) % 1180 - 100;
            return (
              <div
                key={`u${i}`}
                style={{
                  position: 'absolute',
                  left: 400 + (x % 700),
                  top: INNER.y + INNER.h / 2 - 22,
                  width: 62,
                  height: 44,
                  borderRadius: 6,
                  border: `2px solid ${BRAND.mint}`,
                  background: `${BRAND.mint}22`,
                  opacity: clear,
                }}
              />
            );
          })
        : null}
    </div>
  );
};

const TimerNotes: React.FC = () => {
  const frame = useCurrentFrame();
  const items: {from: string; to: string; text: string; color: string}[] = [
    {from: 'hk_rel', to: 'tc_who', text: 'оба надёжные', color: 'rgba(226,240,238,0.75)'},
    {from: 'tc_who', to: 'tw_in', text: 'потерял — повторил', color: '#6FC8FF'},
    {from: 'tw_in', to: 'tw_slow', text: 'один внутри другого', color: BRAND.amber},
    {from: 'tw_slow', to: 'ml_melt', text: 'периоды разошлись', color: BRAND.danger},
    {from: 'ml_melt', to: 'ud_why', text: 'meltdown · Titz, 2001', color: BRAND.danger},
    {from: 'ud_why', to: 'br_end', text: 'UDP не спорит', color: BRAND.mint},
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
              top: 296,
              opacity: o,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              zIndex: LAYERS.TEXT,
            }}
          >
            <span style={{width: 26, height: 26, borderRadius: 26, border: `3px solid ${item.color}`}} />
            <span style={{fontFamily: unbounded, fontWeight: 700, fontSize: 40, letterSpacing: -0.8, color: item.color}}>{item.text}</span>
          </div>
        );
      })}
    </>
  );
};

/** MASCOT-ONLY: the last thing on screen is the character. */
const MascotEnd: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('br_end');
  const o = clock.rise(frame, from - 14, 26);
  if (o <= 0.002) return null;
  const bob = Math.sin(frame / 26) * 6;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o, zIndex: LAYERS.HERO_FRONT}}>
      <div
        style={{
          position: 'absolute',
          left: 540 - 220,
          top: 700,
          width: 440,
          height: 440,
          borderRadius: '50%',
          background: BRAND.mint,
          filter: 'blur(140px)',
          opacity: 0.2,
        }}
      />
      <Img
        src={staticFile(ASSETS.mascot)}
        style={{
          position: 'absolute',
          left: 540 - 165,
          top: 726 + bob,
          width: 330,
          height: 330,
          objectFit: 'contain',
          filter: 'drop-shadow(0 26px 54px rgba(0,0,0,0.6))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 1078,
          textAlign: 'center',
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: 5,
          color: BRAND.mint,
        }}
      >
        UDP
      </div>
    </div>
  );
};

export const GhostPepeCraftTwoTimers: React.FC = () => {
  const frame = useCurrentFrame();
  // one horizontal pass along the shaft, motivated by the narration beats
  const scroll = interpolate(
    frame,
    [0, clock.at('tc_who'), clock.at('tw_in'), clock.at('ml_melt'), clock.at('ud_why')],
    [0, -60, -120, -150, -60],
    {...CLAMP, easing: Easing.inOut(Easing.quad)},
  );
  return (
    <LayoutRegistryProvider>
      <AbsoluteFill style={{background: '#05090B', overflow: 'hidden'}}>
        <Shaft />
        <AbsoluteFill style={{transform: `translateX(${scroll}px)`}}>
          <Pipe />
        </AbsoluteFill>
        <TimerNotes />
        <MascotEnd />
        <BatchCaption pages={pages} fps={clock.fps} frame="plate" face="unbounded" accent={BRAND.mint} fontSize={40} />
        <Audio src={staticFile(voicePath('craft06-two-timers'))} volume={1} />
        <Audio src={staticFile(ASSETS.ambient)} loop volume={0.03} />
        <SafeZoneOverlay />
      </AbsoluteFill>
    </LayoutRegistryProvider>
  );
};

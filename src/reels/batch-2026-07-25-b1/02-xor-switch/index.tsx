import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-craft02-xor-switch.json';
import captionsJson from '../../../generated/captions-craft02-xor-switch.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * CRAFT 02 — "Одна кнопка туда и обратно" (симметрия XOR в потоковом шифре).
 *
 * Camera grammar: FLAT FRONTAL PANEL — прибор смотрит прямо в зрителя, камера не
 * двигается и не наклоняется. Motion grammar: BITWISE TOGGLE SYMMETRY — всё
 * движение это переключение ячеек, и повтор возвращает их обратно.
 * Ending: OBJECT-TRANSFORMS-TO-BRAND. Mascot: наклейка в углу прибора.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const PANEL = {x: 150, y: 372, w: 730, h: 786};
const CELL = 74;
const GAP = 6;
const ROW_X = PANEL.x + 48;
const ROW_Y = {rule: PANEL.y + 92, data: PANEL.y + 264, key: PANEL.y + 424, result: PANEL.y + 584};

const DATA = [1, 0, 1, 1, 0, 0, 1, 0];
const KEY = [0, 1, 1, 0, 1, 0, 1, 1];
const RESULT = DATA.map((d, i) => d ^ KEY[i]);

// --- panel shell -------------------------------------------------------------
const Rack: React.FC = () => {
  const frame = useCurrentFrame();
  const breath = 0.22 + 0.05 * Math.sin(frame / 64);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#070C0D', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          left: 430,
          top: -180,
          width: 260,
          height: 2280,
          objectFit: 'cover',
          opacity: breath,
          filter: 'hue-rotate(120deg) saturate(1.1) brightness(0.55) blur(2px)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 62%, rgba(34,240,208,0.09), transparent 52%), linear-gradient(180deg, #070C0D 0%, #0A1214 46%, #060A0B 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const Cell: React.FC<{x: number; y: number; on: number; accent: string; size?: number; label?: string}> = ({
  x,
  y,
  on,
  accent,
  size = CELL,
  label,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: 12,
      boxSizing: 'border-box',
      background: `rgba(${on > 0.5 ? '34,240,208' : '255,255,255'},${on > 0.5 ? 0.14 + 0.2 * on : 0.03})`,
      border: `2px solid ${on > 0.5 ? accent : 'rgba(226,240,238,0.18)'}`,
      display: 'grid',
      placeItems: 'center',
      fontFamily: manrope,
      fontWeight: 800,
      fontSize: 30,
      color: on > 0.5 ? accent : 'rgba(226,240,238,0.34)',
      boxShadow: on > 0.5 ? `0 0 22px ${accent}44` : 'none',
    }}
  >
    {label ?? (on > 0.5 ? '1' : '0')}
  </div>
);

const RowLabel: React.FC<{y: number; text: string; color: string; opacity: number}> = ({y, text, color, opacity}) => (
  <div
    style={{
      position: 'absolute',
      left: PANEL.x + 48,
      top: y - 34,
      opacity,
      fontFamily: manrope,
      fontWeight: 800,
      fontSize: 21,
      letterSpacing: 3,
      color,
      textTransform: 'uppercase',
    }}
  >
    {text}
  </div>
);

// --- the machine -------------------------------------------------------------
const Machine: React.FC = () => {
  const frame = useCurrentFrame();

  const dataIn = (i: number) => clock.rise(frame, clock.at('da_byte') + i * 4, 8);
  const keyIn = (i: number) => clock.rise(frame, clock.at('da_key') + i * 4, 8);
  const encrypt = (i: number) => clock.rise(frame, clock.at('da_noise') + i * 5, 8);
  const decrypt = (i: number) => clock.rise(frame, clock.at('ag_again') + 10 + i * 5, 8);
  const cancel = clock.rise(frame, clock.at('wh_cancel'), 20);

  // the brand transform: cells slide together into one mark
  const merge = interpolate(frame, [clock.at('br_ghost'), clock.at('en_one') + 10], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  const rowsOpacity = interpolate(frame, [clock.at('br_ghost') + 12, clock.at('br_ghost') + 34], [1, 0], CLAMP);
  const centreX = PANEL.x + PANEL.w / 2 - CELL / 2;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.w,
          height: PANEL.h,
          borderRadius: 30,
          background: 'linear-gradient(180deg, rgba(22,32,34,0.96), rgba(10,16,18,0.98))',
          border: '1px solid rgba(226,240,238,0.14)',
          boxShadow: '0 50px 110px rgba(0,0,0,0.66), inset 0 1px 0 rgba(255,255,255,0.06)',
          zIndex: LAYERS.HERO,
        }}
      />

      <div style={{position: 'absolute', inset: 0, zIndex: LAYERS.HERO_FRONT}}>
        {/* mode readout — the same button claims both jobs */}
        <div
          style={{
            position: 'absolute',
            left: PANEL.x + 48,
            top: PANEL.y + 34,
            display: 'flex',
            gap: 12,
            opacity: interpolate(frame, [4, 22, clock.at('br_ghost'), clock.at('br_ghost') + 18], [0, 1, 1, 0], CLAMP),
          }}
        >
          {['ШИФР', 'РАСШИФР'].map((mode, i) => {
            const active = i === 0 ? frame < clock.at('hk_back') : frame >= clock.at('hk_back');
            return (
              <span
                key={mode}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  fontFamily: manrope,
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: 2,
                  color: active ? '#06100F' : 'rgba(226,240,238,0.4)',
                  background: active ? BRAND.mint : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? BRAND.mint : 'rgba(226,240,238,0.16)'}`,
                }}
              >
                {mode}
              </span>
            );
          })}
        </div>

        {/* the single rule the whole reel rests on */}
        <div
          style={{
            position: 'absolute',
            left: ROW_X,
            top: ROW_Y.rule,
            display: 'flex',
            gap: 18,
            opacity: interpolate(
              frame,
              [clock.at('ru_rule') - 4, clock.at('ru_rule') + 14, clock.at('da_key'), clock.at('da_key') + 16],
              [0, 1, 1, 0],
              CLAMP,
            ),
          }}
        >
          {[
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
          ].map(([a, b], i) => {
            const t = clock.rise(frame, clock.at('ru_rule') + 6 + i * 7, 8);
            const out = a ^ b;
            return (
              <div key={`${a}${b}`} style={{display: 'flex', alignItems: 'center', gap: 8, opacity: 0.3 + 0.7 * t}}>
                <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 30, color: 'rgba(226,240,238,0.7)'}}>
                  {a}·{b}
                </span>
                <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, color: 'rgba(226,240,238,0.35)'}}>→</span>
                <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 32, color: out ? BRAND.mint : BRAND.amber}}>{out}</span>
              </div>
            );
          })}
        </div>

        <div style={{opacity: rowsOpacity}}>
          <RowLabel y={ROW_Y.data} text="данные" color="rgba(226,240,238,0.55)" opacity={clock.rise(frame, clock.at('da_byte') - 6, 12)} />
          <RowLabel y={ROW_Y.key} text="ключ" color={BRAND.amber} opacity={clock.rise(frame, clock.at('da_key') - 6, 12)} />
          <RowLabel y={ROW_Y.result} text="результат" color={BRAND.mint} opacity={clock.rise(frame, clock.at('da_noise') - 6, 12)} />

          {DATA.map((bit, i) => (
            <Cell key={`d${i}`} x={ROW_X + i * (CELL + GAP)} y={ROW_Y.data} on={bit * dataIn(i)} accent="#B8D8D4" />
          ))}
          {KEY.map((bit, i) => (
            <Cell key={`k${i}`} x={ROW_X + i * (CELL + GAP)} y={ROW_Y.key} on={bit * keyIn(i) * (1 - cancel)} accent={BRAND.amber} />
          ))}
        </div>

        {/* result row: encrypted, then decrypted back, then merged into the mark */}
        {RESULT.map((bit, i) => {
          const enc = encrypt(i);
          const dec = decrypt(i);
          const shown = dec > 0.5 ? DATA[i] : bit * enc;
          const x = ROW_X + i * (CELL + GAP);
          return (
            <Cell
              key={`r${i}`}
              x={x + (centreX - x) * merge}
              y={ROW_Y.result}
              on={enc > 0.05 ? shown : 0}
              accent={dec > 0.5 ? '#B8D8D4' : BRAND.mint}
            />
          );
        })}

        {/* the mark the row collapses into */}
        {merge > 0.4 ? (
          <div
            style={{
              position: 'absolute',
              left: PANEL.x + 48,
              top: ROW_Y.result,
              width: PANEL.w - 96,
              height: CELL,
              borderRadius: 20,
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(180deg, ${BRAND.lightMint}, ${BRAND.mint})`,
              opacity: interpolate(merge, [0.4, 0.9], [0, 1], CLAMP),
              boxShadow: `0 20px 60px ${BRAND.mint}44`,
            }}
          >
            <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 40, color: '#06100F'}}>GhostPepeBot</span>
          </div>
        ) : null}

        {/* mascot lives on this machine as a sticker, nothing more */}
        <Img
          src={staticFile(ASSETS.mascot)}
          style={{
            position: 'absolute',
            left: PANEL.x + PANEL.w - 168,
            top: PANEL.y + PANEL.h - 156,
            width: 132,
            height: 132,
            objectFit: 'contain',
            opacity: interpolate(frame, [clock.at('ch_cha'), clock.at('ch_cha') + 20], [0, 0.7], CLAMP),
          }}
        />
      </div>
    </>
  );
};

/** Monospace readout above the machine — never repeats the caption wording. */
const Readout: React.FC = () => {
  const frame = useCurrentFrame();
  const lines: {from: string; to: string; text: string; color: string}[] = [
    {from: 'hk_same', to: 'ru_rule', text: 'ONE OPERATION', color: BRAND.mint},
    {from: 'ru_rule', to: 'da_noise', text: 'XOR', color: BRAND.mint},
    {from: 'da_noise', to: 'ag_again', text: 'DATA ^ KEY = NOISE', color: BRAND.amber},
    {from: 'ag_again', to: 'wh_cancel', text: 'NOISE ^ KEY = DATA', color: BRAND.mint},
    {from: 'wh_cancel', to: 'br_ghost', text: 'KEY ^ KEY = 0', color: '#B8D8D4'},
  ];
  return (
    <>
      {lines.map((line) => {
        const from = clock.at(line.from);
        const to = clock.at(line.to);
        const o = interpolate(frame, [from, from + 12, to - 12, to], [0, 1, 1, 0], CLAMP);
        if (o <= 0.002) return null;
        return (
          <div
            key={line.text}
            style={{
              position: 'absolute',
              left: 152,
              top: 276,
              opacity: o,
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 34,
              letterSpacing: 4,
              color: line.color,
              zIndex: LAYERS.TEXT,
            }}
          >
            {line.text}
          </div>
        );
      })}
    </>
  );
};

export const GhostPepeCraftXorSwitch: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: '#070C0D', overflow: 'hidden'}}>
      <Rack />
      <Machine />
      <Readout />
      <BatchCaption pages={pages} fps={clock.fps} frame="band" face="manrope" accent={BRAND.mint} fontSize={40} />
      <Audio src={staticFile(voicePath('craft02-xor-switch'))} volume={1} />
      <Audio src={staticFile(ASSETS.ambient)} loop volume={0.028} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

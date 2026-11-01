import React from 'react';
import {random} from 'remotion';
import {bodyFont, displayFont} from './fonts';
import {BACK, EASE_IN_OUT, prog, QaText, useScene} from './scene';
import type {Cue} from './types';

export type CounterProps = {value: number; from?: number; decimals?: number; prefix?: string; suffix?: string; label?: string; cue?: Cue; until?: Cue; size?: number; ring?: boolean; align?: 'left' | 'center'};

// Duration comes from the voice: the number lands when `until` is spoken.
export const Counter: React.FC<CounterProps> = ({value, from = 0, decimals = 0, prefix = '', suffix = '', label, cue, until, size = 170, ring = false, align = 'center'}) => {
  const {frame, at, theme} = useScene();
  const start = at(cue);
  const end = until === undefined ? start + 24 : Math.max(start + 6, at(until));
  const t = prog(frame, start, end - start, EASE_IN_OUT);
  const shown = (from + (value - from) * t).toLocaleString('ru-RU', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  const appear = prog(frame, start, 10);
  const landed = prog(frame, end, 12, BACK);
  const number = (
    <QaText style={{fontFamily: displayFont(theme), fontWeight: theme.displayWeight, fontSize: size, lineHeight: 1.2, color: theme.accent, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: `scale(${0.96 + 0.04 * landed})`}}>
      {prefix}{shown}<span style={{fontSize: size * 0.42, marginLeft: size * 0.08}}>{suffix}</span>
    </QaText>
  );
  const caption = label && <QaText style={{fontFamily: bodyFont, fontWeight: 700, fontSize: 40, lineHeight: 1.15, color: theme.ink, marginTop: 18, textAlign: align}}>{label}</QaText>;
  if (!ring) return <div style={{position: 'absolute', inset: 0, opacity: appear, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', justifyContent: 'center'}}>{number}{caption}</div>;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: appear, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <svg viewBox="0 0 100 100" style={{position: 'absolute', height: '100%', transform: 'rotate(-90deg)'}}>
        <circle cx={50} cy={50} r={46} fill="none" stroke={theme.line} strokeWidth={3}/>
        <circle cx={50} cy={50} r={46} fill="none" stroke={theme.accent} strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - t}/>
      </svg>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>{number}{caption}</div>
    </div>
  );
};

export type UnitGridProps = {count: number; columns?: number; cue?: Cue; until?: Cue; size?: number; shape?: 'dot' | 'person'};

/** One mark per unit: shows a quantity as a crowd rather than a digit. */
export const UnitGrid: React.FC<UnitGridProps> = ({count, columns = 5, cue, until, size = 96, shape = 'person'}) => {
  const {frame, at, theme} = useScene();
  const start = at(cue);
  const end = until === undefined ? start + 30 : Math.max(start + 10, at(until));
  return (
    <div style={{position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${columns}, ${size}px)`, gap: size * 0.24, justifyContent: 'center', alignContent: 'center'}}>
      {Array.from({length: count}, (_, i) => {
        const delay = start + (end - start) * ((i + random(`unit-${i}`) * 0.5) / (count + 0.5));
        const p = prog(frame, delay, 10, BACK);
        return (
          <svg key={i} viewBox="0 0 40 40" width={size} height={size} style={{transform: `scale(${p})`, opacity: p > 0 ? 1 : 0}}>
            {shape === 'person' ? <><circle cx={20} cy={11} r={8} fill={theme.accent}/><path d="M5 38c0-11 6-17 15-17s15 6 15 17z" fill={theme.accent}/></> : <circle cx={20} cy={20} r={16} fill={theme.accent}/>}
          </svg>
        );
      })}
    </div>
  );
};

export type FingerprintProps = {cue?: Cue; collapseCue?: Cue; code?: string; columns?: number; rows?: number};

/** A picture dissolves into a short code: the mosaic physically becomes the fingerprint. */
export const Fingerprint: React.FC<FingerprintProps> = ({cue, collapseCue, code = 'A7 3F 9C E2 04 B1', columns = 12, rows = 8}) => {
  const {frame, at, theme} = useScene();
  const appear = prog(frame, at(cue), 12);
  const collapse = collapseCue === undefined ? 0 : prog(frame, at(collapseCue), 24);
  const cell = 66;
  return (
    <div data-qa-solid style={{position: 'absolute', inset: 0, opacity: appear}}>
      {Array.from({length: columns * rows}, (_, i) => {
        const c = i % columns, r = Math.floor(i / columns);
        const hue = random(`fp-${i}`);
        const drift = random(`fp-d-${i}`) * 0.5;
        const k = Math.min(1, collapse * (1 + drift));
        // Columns stay put and rows squeeze: the picture compresses into a barcode rather than vanishing.
        const tx = (c - columns / 2) * cell;
        const ty = (r - rows / 2) * cell * (1 - 0.72 * k);
        const color = hue > 0.66 ? theme.accent : hue > 0.33 ? theme.accent2 : theme.line;
        return <div key={i} style={{position: 'absolute', left: '50%', top: '42%', width: cell - 6, height: cell - 6, transform: `translate(${tx}px, ${ty}px) scale(${1 - 0.5 * k * (hue > 0.5 ? 1 : 0.2)}, ${1 - 0.72 * k})`, background: color, opacity: 0.45 + hue * 0.55, borderRadius: 6 * (1 - k)}}/>;
      })}
      <QaText style={{position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', fontFamily: bodyFont, fontWeight: 800, fontSize: 56, letterSpacing: 4, color: theme.accent, opacity: prog(frame, at(collapseCue) + 16, 10), fontVariantNumeric: 'tabular-nums'}}>{code}</QaText>
    </div>
  );
};

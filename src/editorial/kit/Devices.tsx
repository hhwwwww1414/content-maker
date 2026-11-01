import React from 'react';
import {random} from 'remotion';
import {bodyFont} from './fonts';
import {BACK, moving, prog, QaText, useScene} from './scene';
import type {Cue} from './types';

export type TvProps = {powerCue?: Cue; shots?: Cue[]; input?: string; inputCue?: Cue; scanCue?: Cue; shotLabel?: string};

// The "programme" is abstract moving shapes: no third-party footage or brand ever appears on screen.
const Programme: React.FC<{frame: number; on: number}> = ({frame, on}) => {
  const {theme} = useScene();
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: on, background: `linear-gradient(${120 + frame * 0.6}deg, ${theme.bg2}, ${theme.accent2}55, ${theme.bg2})`}}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{position: 'absolute', width: 170 + i * 50, height: 170 + i * 50, borderRadius: '50%', background: i % 2 ? theme.accent2 : theme.accent, opacity: 0.55, left: `${50 + 42 * Math.sin(frame / (34 + i * 9) + i * 2)}%`, top: `${50 + 34 * Math.cos(frame / (28 + i * 7) + i)}%`, transform: 'translate(-50%,-50%)'}}/>
      ))}
    </div>
  );
};

/** A TV that visibly captures its own screen: on each shot the frame flashes and a thumbnail leaves the panel. */
export const Tv: React.FC<TvProps> = ({powerCue, shots = [], input, inputCue, scanCue, shotLabel}) => {
  const {frame, at, theme} = useScene();
  const on = prog(frame, at(powerCue), 10);
  const lineOn = prog(frame, at(powerCue), 6);
  const scan = scanCue === undefined ? -1 : ((frame - at(scanCue)) / 26) % 1;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div data-qa-solid style={{position: 'absolute', left: 0, right: 0, top: 0, height: 460, background: '#04070B', border: `10px solid ${theme.line}`, borderRadius: 26, overflow: 'hidden', boxShadow: `0 0 ${on * 90}px ${theme.accent}44`}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 4, background: theme.ink, opacity: lineOn * (1 - on)}}/>
        <Programme frame={frame} on={on}/>
        {scan >= 0 && frame >= at(scanCue) && <div style={{position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 90, background: `linear-gradient(transparent, ${theme.accent}AA)`, borderBottom: `4px solid ${theme.accent}`}}/>}
        {shots.map((shot, i) => {
          const f = frame - at(shot);
          return f >= 0 && f < 10 ? <div key={i} style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.7 * (1 - f / 10)}}/> : null;
        })}
        {input && <QaText data-qa-allow-overlap="" style={{position: 'absolute', right: 26, top: 22, fontFamily: bodyFont, fontWeight: 800, fontSize: 36, color: theme.onAccent, background: theme.accent, borderRadius: 10, padding: '6px 16px', opacity: prog(frame, at(inputCue), 10)}}>{input}</QaText>}
      </div>
      <div style={{position: 'absolute', left: '42%', right: '42%', top: 460, height: 36, background: theme.line}}/>
      {shots.map((shot, i) => {
        const p = prog(frame, at(shot), 22, BACK);
        const seen = frame >= at(shot);
        const col = i % 2;
        return seen ? (
          <div key={i} data-qa-solid {...moving(p)} style={{position: 'absolute', left: col === 0 ? 30 : 420, top: 520, width: 350, height: 200, border: `6px solid ${theme.accent}`, borderRadius: 14, overflow: 'hidden', background: theme.surface, transform: `translateY(${(1 - p) * -300}px) scale(${0.6 + 0.4 * p}) rotate(${(col ? 2 : -2) * p}deg)`, opacity: Math.min(1, p * 2)}}>
            <Programme frame={at(shot)} on={1}/>
            {shotLabel && <QaText data-qa-allow-overlap="" style={{position: 'absolute', left: 12, bottom: 10, fontFamily: bodyFont, fontWeight: 800, fontSize: 32, color: theme.onAccent, background: theme.accent, borderRadius: 8, padding: '2px 12px'}}>{shotLabel} {i + 1}</QaText>}
          </div>
        ) : null;
      })}
    </div>
  );
};

type SettingRow = {label: string; on: boolean; offCue?: Cue; hot?: boolean; cue?: Cue};
export type PhoneProps = {
  title?: string; cue?: Cue; rows?: SettingRow[]; screen?: 'settings' | 'form' | 'call';
  fields?: Array<{label: string; value: string; cue?: Cue}>;
  caller?: string; hint?: string;
};

/** A generic phone with neutral UI. No real app's interface or logo is imitated. */
export const Phone: React.FC<PhoneProps> = ({title = 'Настройки', cue, rows = [], screen = 'settings', fields = [], caller}) => {
  const {frame, at, theme} = useScene();
  const p = prog(frame, at(cue), 18);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      <div data-qa-solid {...moving(p)} style={{position: 'relative', width: 680, height: '100%', background: '#05070A', borderRadius: 74, padding: 22, border: `6px solid ${theme.line}`, transform: `translateY(${(1 - p) * 420}px) rotate(${(1 - p) * -6}deg)`, opacity: Math.min(1, p * 2)}}>
        <div style={{width: '100%', height: '100%', borderRadius: 54, background: theme.bg2, overflow: 'hidden', padding: '76px 34px 34px', position: 'relative'}}>
          <div style={{position: 'absolute', left: '50%', top: 22, width: 170, height: 32, marginLeft: -85, borderRadius: 16, background: '#05070A'}}/>
          <QaText style={{fontFamily: bodyFont, fontWeight: 800, fontSize: 52, color: theme.ink, marginBottom: 26}}>{screen === 'call' ? caller : title}</QaText>
          {screen === 'settings' && rows.map((row, i) => {
            const appear = prog(frame, at(row.cue, at(cue) + 8 + i * 5), 12);
            const off = row.offCue === undefined ? 0 : prog(frame, at(row.offCue), 12);
            const hot = row.hot ? prog(frame, at(row.cue, 0), 12) : 0;
            const state = row.on ? 1 - off : off;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, padding: '26px 24px', marginBottom: 16, borderRadius: 22, background: theme.surface, opacity: appear, boxShadow: hot ? `0 0 0 ${hot * 5}px ${theme.accent}` : undefined}}>
                <QaText style={{fontFamily: bodyFont, fontWeight: 700, fontSize: 38, lineHeight: 1.14, color: theme.ink}}>{row.label}</QaText>
                <div style={{flexShrink: 0, width: 110, height: 62, borderRadius: 31, background: state > 0.5 ? theme.danger : theme.line, position: 'relative'}}>
                  <div style={{position: 'absolute', top: 6, left: 6 + state * 48, width: 50, height: 50, borderRadius: '50%', background: '#fff'}}/>
                </div>
              </div>
            );
          })}
          {screen === 'form' && fields.map((field, i) => {
            const on = prog(frame, at(field.cue, at(cue) + 8 + i * 6), 12);
            const shown = Math.floor(field.value.length * prog(frame, at(field.cue, at(cue) + 8 + i * 6), 16));
            return (
              <div key={i} style={{marginBottom: 20, opacity: on, background: theme.surface, borderRadius: 18, padding: '18px 22px'}}>
                <QaText style={{fontFamily: bodyFont, fontWeight: 700, fontSize: 30, color: theme.muted}}>{field.label}</QaText>
                <QaText style={{fontFamily: bodyFont, fontWeight: 800, fontSize: 40, color: theme.ink, minHeight: 48}}>{field.value.slice(0, shown) + (shown > 0 && shown < field.value.length ? '|' : '')}</QaText>
              </div>
            );
          })}
          {screen === 'call' && <Waves/>}
        </div>
      </div>
    </div>
  );
};

const Waves: React.FC = () => {
  const {frame, theme} = useScene();
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: 240, marginTop: 40}}>
      {Array.from({length: 17}, (_, i) => <div key={i} style={{width: 14, borderRadius: 7, background: theme.accent, height: 30 + 170 * Math.abs(Math.sin(frame / 6 + random(`w-${i}`) * 6))}}/>)}
    </div>
  );
};

import React from 'react';
import {bodyFont, displayFont} from './fonts';
import {BACK, moving, prog, QaText, useScene} from './scene';
import type {Cue} from './types';

type Side = {title: string; lines?: string[]; tone?: 'accent' | 'accent2' | 'danger'};
export type CompareProps = {left: Side; right: Side; leftCue?: Cue; rightCue?: Cue; winner?: 'left' | 'right'; winnerCue?: Cue; vs?: string; stacked?: boolean};

export const Compare: React.FC<CompareProps> = ({left, right, leftCue, rightCue, winner, winnerCue, stacked = true}) => {
  const {frame, at, theme} = useScene();
  const won = winnerCue === undefined ? 0 : prog(frame, at(winnerCue), 14);
  const card = (side: Side, cue: Cue | undefined, dir: number, isWinner: boolean) => {
    const p = prog(frame, at(cue), 18);
    const tone = theme[side.tone ?? 'accent'];
    return (
      <div data-qa-solid {...moving(p)} style={{flex: 1, minHeight: 0, transform: `translateX(${(1 - p) * dir * 900}px) scale(${1 + (isWinner ? won * 0.03 : -won * 0.05)})`, opacity: isWinner ? 1 : 1 - won * 0.55, background: theme.surface, border: `5px solid ${tone}`, borderRadius: theme.radius, padding: '26px 34px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: isWinner ? `0 0 ${won * 70}px ${tone}` : undefined}}>
        <QaText style={{fontFamily: displayFont(theme), fontWeight: theme.displayWeight, fontSize: 72, lineHeight: 1.06, color: tone}}>{side.title}</QaText>
        {(side.lines ?? []).map((line, i) => <QaText key={i} style={{fontFamily: bodyFont, fontWeight: 700, fontSize: 46, lineHeight: 1.16, color: theme.ink, marginTop: 16}}>{line}</QaText>)}
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: stacked ? 'column' : 'row', gap: 34}}>
      {card(left, leftCue, -1, winner === 'left')}
      {card(right, rightCue, 1, winner === 'right')}
    </div>
  );
};

export type ChecklistProps = {items: Array<{text: string; mark: 'check' | 'cross' | 'clock'; cue: Cue}>; size?: number};

export const Checklist: React.FC<ChecklistProps> = ({items, size = 46}) => {
  const {frame, at, theme} = useScene();
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 34}}>
      {items.map((item, i) => {
        const start = at(item.cue);
        const p = prog(frame, start, 14);
        const tick = prog(frame, start + 8, 12);
        const tone = {check: theme.accent2, cross: theme.danger, clock: theme.accent2}[item.mark];
        return (
          <div key={i} data-qa-solid {...moving(p)} style={{display: 'flex', alignItems: 'center', gap: 28, opacity: p, transform: `translateX(${(1 - p) * 70}px)`, background: theme.surface, borderRadius: theme.radius, border: `3px solid ${theme.line}`, padding: '26px 30px'}}>
            <svg viewBox="0 0 40 40" width={76} height={76} style={{flexShrink: 0}}>
              <circle cx={20} cy={20} r={18} fill="none" stroke={tone} strokeWidth={3}/>
              {item.mark === 'clock'
                ? <path d="M20 8V20L28 25" fill="none" stroke={tone} strokeWidth={3.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick}/>
                : <path d={item.mark === 'check' ? 'M11 21l6 6 12-14' : 'M13 13l14 14M27 13L13 27'} fill="none" stroke={tone} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick}/>}
            </svg>
            <QaText style={{fontFamily: bodyFont, fontWeight: 800, fontSize: size, lineHeight: 1.14, color: theme.ink}}>{item.text}</QaText>
          </div>
        );
      })}
    </div>
  );
};

export type PollProps = {question: string; questionCue?: Cue; options: Array<{text: string; cue: Cue}>};

export const Poll: React.FC<PollProps> = ({question, questionCue, options}) => {
  const {frame, at, theme} = useScene();
  const q = prog(frame, at(questionCue), 14);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40}}>
      <QaText style={{fontFamily: displayFont(theme), fontWeight: theme.displayWeight, fontSize: 80, lineHeight: 1.08, color: theme.ink, textAlign: 'center', opacity: q, transform: `translateY(${(1 - q) * 30}px)`}}>{question}</QaText>
      {options.map((option, i) => {
        const p = prog(frame, at(option.cue), 12, BACK);
        const color = i === 0 ? theme.accent : theme.accent2;
        return (
          <div key={i} data-qa-solid {...moving(p)} style={{transform: `scale(${0.8 + 0.2 * p})`, opacity: Math.min(1, p * 1.5), background: color, borderRadius: theme.radius, padding: '30px 40px', textAlign: 'center'}}>
            <QaText style={{fontFamily: bodyFont, fontWeight: 800, fontSize: 52, color: theme.onAccent}}>{option.text}</QaText>
          </div>
        );
      })}
    </div>
  );
};

export type StampProps = {text: string; cue?: Cue; tone?: 'accent' | 'danger' | 'accent2'; rotate?: number; size?: number};

/** Lands hard on its word, then the ink settles. */
export const Stamp: React.FC<StampProps> = ({text, cue, tone = 'danger', rotate = -8, size = 92}) => {
  const {frame, at, theme} = useScene();
  const start = at(cue);
  const p = prog(frame, start, 7);
  const ring = prog(frame, start + 6, 18);
  const color = theme[tone];
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: p > 0 ? 1 : 0}}>
      <div style={{position: 'absolute', width: '70%', height: '70%', borderRadius: '50%', border: `6px solid ${color}`, transform: `scale(${0.7 + ring * 0.9})`, opacity: ring > 0 ? (1 - ring) * 0.5 : 0}}/>
      <div data-qa-allow-overlap {...moving(p)} style={{transform: `rotate(${rotate}deg) scale(${2.2 - 1.2 * p})`, border: `10px solid ${color}`, borderRadius: 12, padding: '14px 34px', opacity: p}}>
        <QaText data-qa-allow-overlap="" style={{fontFamily: displayFont(theme), fontWeight: 800, fontSize: size, lineHeight: 1.05, color, whiteSpace: 'nowrap'}}>{text}</QaText>
      </div>
    </div>
  );
};

export type DocumentProps = {title: string; cue?: Cue; lines: Array<{text: string; cue?: Cue; mark?: boolean}>};

export const DocumentCard: React.FC<DocumentProps> = ({title, cue, lines}) => {
  const {frame, at, theme} = useScene();
  const p = prog(frame, at(cue), 18);
  return (
    <div data-qa-solid {...moving(p)} style={{position: 'absolute', inset: 0, background: theme.surface, borderRadius: theme.radius, border: `2px solid ${theme.line}`, boxShadow: '0 30px 60px rgba(0,0,0,.18)', padding: '44px 46px', transform: `translateY(${(1 - p) * 300}px) rotate(${(1 - p) * 4 - 1}deg)`, opacity: p}}>
      <QaText style={{fontFamily: displayFont(theme), fontWeight: theme.displayWeight, fontSize: 60, lineHeight: 1.1, color: theme.ink, marginBottom: 26}}>{title}</QaText>
      {lines.map((line, i) => {
        const on = prog(frame, at(line.cue, at(cue) + 6 + i * 5), 12);
        const mark = line.mark ? prog(frame, at(line.cue) + 8, 14) : 0;
        return (
          <div key={i} style={{position: 'relative', marginTop: 14, opacity: on}}>
            <div style={{position: 'absolute', left: -10, right: -10, top: 0, bottom: 0, background: theme.accent, opacity: 0.18, transform: `scaleX(${mark})`, transformOrigin: 'left'}}/>
            <QaText style={{position: 'relative', fontFamily: bodyFont, fontWeight: 700, fontSize: 44, lineHeight: 1.22, color: theme.ink}}>{line.text}</QaText>
          </div>
        );
      })}
    </div>
  );
};

export type TimelineProps = {items: Array<{date: string; label: string; cue: Cue; tone?: 'accent' | 'accent2' | 'danger'}>};

export const Timeline: React.FC<TimelineProps> = ({items}) => {
  const {frame, at, theme} = useScene();
  const rail = prog(frame, at(items[0].cue), Math.max(10, at(items[items.length - 1].cue) - at(items[0].cue)));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div style={{position: 'absolute', left: 30, top: 20, bottom: 20, width: 6, background: theme.line, transformOrigin: 'top', transform: `scaleY(${rail})`}}/>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around'}}>
        {items.map((item, i) => {
          const p = prog(frame, at(item.cue), 14, BACK);
          const tone = theme[item.tone ?? 'accent'];
          return (
            <div key={i} {...moving(p)} style={{display: 'flex', alignItems: 'center', gap: 40, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 50}px)`}}>
              <div style={{width: 66, height: 66, borderRadius: '50%', background: tone, flexShrink: 0, boxShadow: `0 0 26px ${tone}`}}/>
              <div>
                <QaText style={{fontFamily: bodyFont, fontWeight: 800, fontSize: 36, color: tone}}>{item.date}</QaText>
                <QaText style={{fontFamily: displayFont(theme), fontWeight: theme.displayWeight, fontSize: 50, lineHeight: 1.1, color: theme.ink}}>{item.label}</QaText>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type RosterProps = {items: string[]; cue?: Cue; until?: Cue; columns?: number; hot?: string; hotCue?: Cue};

/** Named parties appear as chips; one can be singled out when the voice reaches it. */
export const Roster: React.FC<RosterProps> = ({items, cue, until, columns = 2, hot, hotCue}) => {
  const {frame, at, theme} = useScene();
  const start = at(cue);
  const end = until === undefined ? start + 20 : Math.max(start + items.length, at(until));
  const lit = hotCue === undefined ? 0 : prog(frame, at(hotCue), 10);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 22, alignContent: 'center'}}>
      {items.map((item, i) => {
        const p = prog(frame, start + ((end - start) * i) / items.length, 10, BACK);
        const isHot = item === hot;
        return (
          <div key={item} data-qa-solid {...moving(p)} style={{transform: `scale(${(0.7 + 0.3 * p) * (isHot ? 1 + lit * 0.05 : 1)})`, opacity: Math.min(1, p * 1.5) * (isHot ? 1 : 1 - lit * 0.5), background: isHot && lit > 0.5 ? theme.accent : theme.surface, border: `3px solid ${isHot ? theme.accent : theme.line}`, borderRadius: theme.radius, padding: '20px 10px', textAlign: 'center'}}>
            <QaText style={{fontFamily: bodyFont, fontWeight: 800, fontSize: 40, color: isHot && lit > 0.5 ? theme.onAccent : theme.ink}}>{item}</QaText>
          </div>
        );
      })}
    </div>
  );
};

export type CalloutProps = {text: string; cue?: Cue; tone?: 'accent' | 'accent2' | 'danger'; size?: number; overlap?: boolean; exitCue?: Cue};

export const Callout: React.FC<CalloutProps> = ({text, cue, tone = 'accent', size = 42, overlap = false, exitCue}) => {
  const {frame, at, theme} = useScene();
  const p = prog(frame, at(cue), 12, BACK);
  const exit = exitCue === undefined ? 0 : prog(frame, at(exitCue), 8);
  const extra = overlap ? {'data-qa-allow-overlap': ''} : {};
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div data-qa-solid {...extra} {...moving(p)} style={{transform: `scale(${0.7 + 0.3 * p})`, opacity: Math.min(1, p * 1.5) * (1 - exit), background: theme[tone], borderRadius: theme.radius, padding: '16px 30px'}}>
        <QaText {...extra} style={{fontFamily: bodyFont, fontWeight: 800, fontSize: size, lineHeight: 1.12, color: theme.onAccent, textAlign: 'center'}}>{text}</QaText>
      </div>
    </div>
  );
};

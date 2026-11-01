import React from 'react';
import {displayFont, bodyFont} from './fonts';
import {BACK, parseAccent, prog, QaText, useScene} from './scene';
import {normWord} from './cue';
import type {Cue} from './types';

export type KineticProps = {
  text: string; cue?: Cue; mode?: 'rise' | 'mask' | 'punch' | 'slide' | 'track';
  size?: number; font?: 'display' | 'body'; align?: 'left' | 'center' | 'right'; tone?: 'ink' | 'accent' | 'muted';
  sync?: boolean; stagger?: number; exitCue?: Cue; lineHeight?: number;
};

// Each word enters on its own. With `sync`, a displayed word waits until that word is spoken.
export const Kinetic: React.FC<KineticProps> = ({text, cue, mode = 'rise', size = 92, font = 'display', align = 'left', tone = 'ink', sync = false, stagger = 3, exitCue, lineHeight = 1.08}) => {
  const {frame, at, theme, words, scene, fps} = useScene();
  const start = at(cue);
  const exit = exitCue === undefined ? 1 : 1 - prog(frame, at(exitCue), 10);
  const spokenAt = (word: string, fallback: number) => {
    const target = normWord(word);
    const hit = words.find((w) => target && (w.norm === target || w.norm.startsWith(target)));
    return hit ? Math.round((hit.startMs / 1000 - scene.start) * fps) : fallback;
  };
  const color = {ink: theme.ink, accent: theme.accent, muted: theme.muted}[tone];
  return (
    <QaText style={{width: '100%', height: '100%', textAlign: align, opacity: exit, fontFamily: font === 'display' ? displayFont(theme) : bodyFont, fontWeight: font === 'display' ? theme.displayWeight : 700, fontSize: size, lineHeight, letterSpacing: font === 'display' && theme.display === 'unbounded' ? -1.5 : -0.5, color}}>
      {parseAccent(text).map(({word, accent}, i) => {
        const begin = sync ? spokenAt(word, start + i * stagger) : start + i * stagger;
        const p = prog(frame, begin, mode === 'punch' ? 10 : 15, mode === 'punch' ? BACK : undefined);
        const motion = {
          rise: {transform: `translateY(${(1 - p) * 34}px)`, opacity: p},
          mask: {transform: `translateY(${(1 - p) * 112}%)`},
          punch: {transform: `scale(${0.55 + 0.45 * p})`, opacity: p > 0 ? 1 : 0},
          slide: {transform: `translateX(${(1 - p) * -70}px)`, opacity: p},
          track: {letterSpacing: `${(1 - p) * 26}px`, opacity: p},
        }[mode];
        return (
          <React.Fragment key={i}>
            <span style={{display: 'inline-block', overflow: mode === 'mask' ? 'hidden' : undefined, paddingBottom: '0.12em', marginBottom: '-0.12em', verticalAlign: 'top'}}>
              <span style={{display: 'inline-block', color: accent ? theme.accent : undefined, ...motion}}>{word}</span>
            </span>
            {' '}
          </React.Fragment>
        );
      })}
    </QaText>
  );
};

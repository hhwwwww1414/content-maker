import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {EASE_IN_OUT} from './scene';
import type {Theme} from './themes';

export type TransitionSpec = {type: string; frames: number; origin: [number, number]};
const clampP = (f: number, start: number, frames: number) => (frames <= 0 ? 1 : interpolate(f, [start, start + frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT}));

const blinds = (p: number, n = 7) => {
  const strip = 1080 / n;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = i * strip;
    pts.push(`${x}px 0px`, `${x}px 1920px`, `${x + strip * p}px 1920px`, `${x + strip * p}px 0px`, `${x}px 0px`);
  }
  return `polygon(${pts.join(',')},0px 0px)`;
};

const entering = (spec: TransitionSpec, p: number): React.CSSProperties => {
  const [ox, oy] = spec.origin;
  switch (spec.type) {
    case 'iris': return {clipPath: `circle(${p * 2300}px at ${ox * 1080}px ${oy * 1920}px)`};
    case 'whip': return {transform: `translateX(${(1 - p) * 1080}px)`, filter: `blur(${Math.sin(p * Math.PI) * 26}px)`};
    case 'diagonal': return {clipPath: `polygon(${-1500 + p * 3000}px 0px, ${-1500 + p * 3000 + 800}px 1920px, -10px 1920px, -10px 0px)`};
    case 'zoomThrough': return {transform: `scale(${0.82 + 0.18 * p})`, opacity: p};
    case 'blinds': return {clipPath: blinds(p)};
    case 'shutter': return {clipPath: `inset(${(1 - p) * 50}% 0 ${(1 - p) * 50}% 0)`};
    default: return {};
  }
};
const leaving = (spec: TransitionSpec, p: number): React.CSSProperties => {
  switch (spec.type) {
    case 'whip': return {transform: `translateX(${-p * 1080}px)`, filter: `blur(${Math.sin(p * Math.PI) * 26}px)`};
    case 'zoomThrough': return {transform: `scale(${1 + p * 0.7})`, opacity: 1 - p};
    case 'iris': case 'diagonal': case 'blinds': return {transform: `scale(${1 + p * 0.06})`};
    case 'shutter': return {transform: `scale(${1 - p * 0.08})`};
    default: return {};
  }
};

/**
 * One scene's shell across its transitions. The boundary is the scene's first
 * spoken word: the change is centred on it, so it stays locked to the voice.
 */
export const TransitionFrame: React.FC<{incoming: TransitionSpec | null; outgoing: TransitionSpec | null; preRoll: number; postRoll: number; total: number; theme: Theme; children: React.ReactNode}> = ({incoming, outgoing, preRoll, postRoll, total, theme, children}) => {
  const f = useCurrentFrame();
  const pIn = incoming ? clampP(f, 0, incoming.frames) : 1;
  const pOut = outgoing ? clampP(f, total - postRoll * 2, outgoing.frames) : 0;
  const inMotion = (incoming && f < incoming.frames) || (outgoing && f >= total - postRoll * 2);
  const inStyle = incoming && pIn < 1 ? entering(incoming, pIn) : {};
  const outStyle = outgoing && pOut > 0 ? leaving(outgoing, pOut) : {};
  // The accent plate in `shutter` reads as a physical blade passing over the seam.
  const blade = incoming?.type === 'shutter' && pIn > 0 && pIn < 1;
  return (
    <div data-qa-scene data-qa-settled={inMotion ? '0' : '1'} data-qa-preroll={preRoll} style={{position: 'absolute', inset: 0, overflow: 'hidden', ...inStyle, ...outStyle}}>
      {children}
      {blade && <>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 26, background: theme.accent}}/>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 26, background: theme.accent}}/>
      </>}
    </div>
  );
};

import React from 'react';
import {prog, useScene} from './scene';
import type {Cue} from './types';

export type LightProps = {kind?: 'sweep' | 'spot' | 'glow'; cue?: Cue; x?: number; y?: number; size?: number; tone?: 'accent' | 'accent2' | 'danger'; frames?: number};

/** Light never carries meaning alone: it directs the eye to the element the voice names. */
export const Light: React.FC<LightProps> = ({kind = 'glow', cue, x = 540, y = 760, size = 700, tone = 'accent', frames = 26}) => {
  const {frame, at, theme} = useScene();
  const start = at(cue);
  const color = theme[tone];
  if (kind === 'sweep') {
    const t = prog(frame, start, frames);
    return t > 0 && t < 1 ? <div style={{position: 'absolute', left: -600, top: -200, width: 2300, height: 2400, pointerEvents: 'none', mixBlendMode: 'screen', background: `linear-gradient(105deg, transparent 44%, ${color}55 50%, transparent 56%)`, transform: `translateX(${(t - 0.5) * 1800}px)`}}/> : null;
  }
  const on = prog(frame, start, 18);
  const breathe = 1 + Math.sin((frame - start) / 14) * 0.06;
  return <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', pointerEvents: 'none', opacity: on * (kind === 'spot' ? 0.5 : 0.32), transform: `scale(${breathe})`, background: `radial-gradient(circle, ${color} 0%, transparent 68%)`}}/>;
};

import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {TransitionSpec} from '../spec/schema';
import {clamp01, ease, lerp, morph, shapes, toPath, toPolygon} from '../motion/core';
import {format} from '../tokens';
import type {Palette} from '../themes';

// A transition is centred on the new scene's first spoken word. It overlaps the scenes visually,
// so it can never change the timeline: both scenes keep their voice-derived clocks throughout.

const W = format.width, H = format.height;
export const transitionFrames = (t: TransitionSpec | undefined, fps: number) => (!t || t.type === 'cut' ? 0 : Math.max(2, Math.round(t.seconds * fps)));

const directional = (id: string, x: number, y: number) => (x + y < 0.5 ? null : <svg width={0} height={0} style={{position: 'absolute'}}><filter id={id} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={`${x.toFixed(1)} ${y.toFixed(1)}`}/></filter></svg>);

/** Style for the arriving scene at transition progress p (0..1). */
const arriving = (t: TransitionSpec, p: number, id: string): {style: React.CSSProperties; defs?: React.ReactNode} => {
  switch (t.type) {
    case 'push': {
      const vertical = t.direction === 'up' || t.direction === 'down';
      const sign = t.direction === 'up' || t.direction === 'left' ? 1 : -1;
      const e = ease.expoInOut(p);
      const blur = Math.sin(p * Math.PI) * 42;
      const distance = (vertical ? H : W) * (1 - e) * sign;
      return {defs: directional(id, vertical ? 0 : blur, vertical ? blur : 0), style: {transform: vertical ? `translateY(${distance}px)` : `translateX(${distance}px)`, filter: blur >= 0.5 ? `url(#${id})` : undefined}};
    }
    case 'through': {
      const e = ease.expoInOut(p);
      const [ox, oy] = t.origin;
      // Arrives from past the lens rather than from small: a shrunken frame would show its own edges.
      return {style: {transform: `scale(${lerp(1.3, 1, e)})`, transformOrigin: `${ox * 100}% ${oy * 100}%`, opacity: clamp01((p - 0.3) / 0.3), filter: p < 1 ? `blur(${(1 - e) * 18}px)` : undefined}};
    }
    case 'mask': {
      const e = ease.expoInOut(p);
      const [ox, oy] = t.origin;
      const cx = ox * W, cy = oy * H;
      const far = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
      if (t.shape === 'circle') return {style: {clipPath: `circle(${e * far * 1.02}px at ${cx}px ${cy}px)`}};
      if (t.shape === 'diamond') return {style: {clipPath: toPolygon(shapes.diamond(cx, cy, e * (W + H) * 1.02, 16))}};
      if (t.shape === 'rise') return {style: {clipPath: `inset(${(1 - e) * 100}% 0 0 0)`, transform: `translateY(${(1 - e) * 180}px)`}};
      if (t.shape === 'diagonal') {
        const lead = -500 + e * (W + 1100);
        return {style: {clipPath: `polygon(0 0, ${lead + 500}px 0, ${lead}px ${H}px, 0 ${H}px)`}};
      }
      const n = 6;
      const pts: string[] = [];
      for (let i = 0; i < n; i++) {
        const delay = i * 0.07;
        const pi = ease.expoInOut(clamp01((p - delay) / (1 - 0.07 * (n - 1))));
        const y = (i * H) / n, h = H / n;
        pts.push(`0 ${y}px`, `${pi * W}px ${y}px`, `${pi * W}px ${y + h}px`, `0 ${y + h}px`, `0 ${y}px`);
      }
      return {style: {clipPath: `polygon(${pts.join(',')},0 0)`}};
    }
    case 'field': return {style: {opacity: p >= 0.58 ? 1 : 0}};
    case 'morph': return {style: {opacity: p >= 0.5 ? 1 : 0}};
    case 'glyph': return {style: {transform: `scale(${lerp(1.14, 1, ease.outSoft(p))})`}};
    case 'depth': {
      const e = ease.expoInOut(p);
      return {style: {transform: `scale(${lerp(1.42, 1, e)})`, opacity: clamp01(p / 0.5), filter: p < 1 ? `blur(${(1 - e) * 24}px)` : undefined}};
    }
    default: return {style: {}};
  }
};

/** Style for the leaving scene at transition progress p. */
const leaving = (t: TransitionSpec, p: number, id: string): {style: React.CSSProperties; defs?: React.ReactNode} => {
  switch (t.type) {
    case 'push': {
      const vertical = t.direction === 'up' || t.direction === 'down';
      const sign = t.direction === 'up' || t.direction === 'left' ? -1 : 1;
      const e = ease.expoInOut(p);
      const blur = Math.sin(p * Math.PI) * 42;
      const distance = (vertical ? H : W) * e * sign;
      return {defs: directional(id, vertical ? 0 : blur, vertical ? blur : 0), style: {transform: vertical ? `translateY(${distance}px)` : `translateX(${distance}px)`, filter: blur >= 0.5 ? `url(#${id})` : undefined}};
    }
    case 'through': {
      const [ox, oy] = t.origin;
      const e = ease.in(p);
      return {style: {transform: `scale(${lerp(1, 3.4, e)})`, transformOrigin: `${ox * 100}% ${oy * 100}%`, filter: p > 0 ? `blur(${e * 22}px)` : undefined}};
    }
    case 'mask': return {style: {transform: `scale(${lerp(1, 1.06, ease.outSoft(p))})`}};
    case 'depth': {
      const e = ease.expoInOut(p);
      return {style: {transform: `scale(${lerp(1, 0.78, e)})`, filter: `brightness(${lerp(1, 0.35, e)}) blur(${e * 10}px)`}};
    }
    case 'field': return {style: {transform: `scale(${lerp(1, 1.04, p)})`}};
    default: return {style: {}};
  }
};

export const TransitionShell: React.FC<{incoming: TransitionSpec | null; outgoing: TransitionSpec | null; preRoll: number; postRoll: number; total: number; id: string; children: React.ReactNode}> = ({incoming, outgoing, preRoll, postRoll, total, id, children}) => {
  const f = useCurrentFrame();
  const inFrames = preRoll * 2, outFrames = postRoll * 2;
  const pIn = incoming && inFrames ? clamp01(f / inFrames) : 1;
  const pOut = outgoing && outFrames ? clamp01((f - (total - outFrames)) / outFrames) : 0;
  const a = incoming && pIn < 1 ? arriving(incoming, pIn, `t-in-${id}`) : null;
  const b = outgoing && pOut > 0 ? leaving(outgoing, pOut, `t-out-${id}`) : null;
  const inMotion = (incoming && pIn < 1) || (outgoing && pOut > 0);
  return (
    <div data-qa-scene={id} data-qa-settled={inMotion ? '0' : '1'} data-qa-preroll={preRoll} style={{position: 'absolute', inset: 0, overflow: 'hidden', ...(b?.style ?? null), ...(a?.style ?? null)}}>
      {a?.defs}{b?.defs}
      {children}
    </div>
  );
};

/** The object that carries the eye across a boundary: a growing field of the next colour, a morphing shape, a letter. */
export const TransitionOverlay: React.FC<{spec: TransitionSpec; frames: number; prev: Palette; next: Palette; display: {family: string; weight: number}}> = ({spec, frames, prev, next, display}) => {
  const f = useCurrentFrame();
  const p = clamp01(f / Math.max(1, frames));
  if (spec.type === 'field') {
    const [ox, oy] = spec.origin;
    const cx = ox * W, cy = oy * H;
    const far = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
    const r = ease.expoInOut(clamp01(p / 0.62)) * far * 1.04;
    return <div style={{position: 'absolute', inset: 0, background: next.bg, clipPath: `circle(${r}px at ${cx}px ${cy}px)`, opacity: p > 0.6 ? clamp01((1 - p) / 0.4) : 1}}/>;
  }
  if (spec.type === 'morph') {
    const color = {accent: prev.accent, accent2: prev.accent2, ink: prev.ink, bg: next.bg}[spec.color];
    const full = shapes.rect(0, 0, W, H);
    const from = shapes.rect(...spec.from);
    const to = spec.to ? shapes.rect(...spec.to) : full;
    const opening = p < 0.5;
    const e = opening ? ease.expoInOut(p * 2) : ease.expoInOut((p - 0.5) * 2);
    const pts = opening ? morph(from, full, e) : morph(full, to, e);
    const fade = spec.to ? 1 : clamp01((1 - p) * 3.4);
    return <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: fade}}><path d={toPath(pts)} fill={color}/></svg>;
  }
  if (spec.type === 'glyph') {
    const e = ease.in(p) * 0.55 + ease.expoInOut(p) * 0.45;
    const scale = lerp(1, 58, e);
    const id = `glyph-${spec.glyph.charCodeAt(0)}-${frames}`;
    return (
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: p < 0.96 ? 1 : (1 - p) / 0.04}}>
        <defs><mask id={id}>
          <rect width={W} height={H} fill="#fff"/>
          <text x={W / 2} y={H * 0.46} textAnchor="middle" dominantBaseline="central" fontFamily={display.family} fontWeight={display.weight} fontSize={560} fill="#000" transform={`translate(${W / 2} ${H * 0.46}) scale(${scale}) translate(${-W / 2} ${-H * 0.46})`}>{spec.glyph}</text>
        </mask></defs>
        <rect width={W} height={H} fill={prev.bg} mask={`url(#${id})`}/>
      </svg>
    );
  }
  return null;
};

import React from 'react';
import type {z} from 'zod';
import {Backdrop} from '../Frame';
import {movingAttr, toneColor, useRegion, useShot} from '../context';
import {clamp01, lerp, sec, springFrom} from '../motion/core';
import {alpha, mix} from '../tokens';
import {Headline} from '../type/Headline';
import {measureWith} from '../type/measure';
import type {TimelineShot} from '../spec/schema';

type Spec = z.output<typeof TimelineShot>;
const FOCAL = 900, GAP = 1500;
const VANISH = {x: 540, y: 760};

/** Time as a corridor: each date is a doorway the viewer passes through on the word that names it. */
const Corridor: React.FC<{spec: Spec}> = ({spec}) => {
  const {art, palette, frame, fps, start, profile} = useShot();
  const region = useRegion();
  let z = -GAP * 0.65;
  let moving = false;
  spec.events.forEach((event, i) => {
    const s = start(event.cue);
    const p = springFrom(frame, s, fps, profile.camera === 'camera' ? 'soft' : profile.camera);
    if (frame >= s && frame < s + sec(1.4, fps)) moving = true;
    z = lerp(z, i * GAP, clamp01(p));
  });
  const project = (zw: number) => FOCAL / (FOCAL + zw - z);
  const floor = Array.from({length: 13}, (_, i) => -2400 + i * 400);
  const gates = spec.events.map((_, i) => i).reverse();
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {floor.map((x) => <line key={x} x1={VANISH.x + x * 0.04} y1={VANISH.y + 40} x2={VANISH.x + x} y2={1960} stroke={alpha(palette.ink, 0.13)} strokeWidth={2}/>)}
        {floor.map((x) => <line key={`t${x}`} x1={VANISH.x + x * 0.04} y1={VANISH.y - 40} x2={VANISH.x + x} y2={-40} stroke={alpha(palette.ink, 0.07)} strokeWidth={2}/>)}
      </svg>
      {gates.map((i) => {
        const event = spec.events[i];
        const zw = i * GAP;
        if (zw - z < -FOCAL * 0.72) return null;
        const k = project(zw);
        const distance = (zw - z) / GAP;
        const opacity = distance < 0 ? clamp01(1 + distance * 2.2) : clamp01(1.5 - distance * 0.9);
        const current = Math.abs(distance) < 0.04 && !moving;
        const dateRole = art.display;
        const size = Math.min(330, Math.floor((96 * region.width) / measureWith({...dateRole, tracking: 0})(event.date, 100)));
        const stack = size + 300;
        const top = Math.max(region.top, VANISH.y - stack / 2);
        return (
          <div key={i} {...movingAttr(!current)} style={{position: 'absolute', inset: 0, opacity, transformOrigin: '0 0', transform: `translate(${VANISH.x}px, ${VANISH.y}px) scale(${k}) translate(${-VANISH.x}px, ${-VANISH.y}px)`, filter: distance < -0.02 ? `blur(${-distance * 26}px)` : distance > 0.5 ? `blur(${Math.min(5, distance * 2.4)}px)` : undefined}}>
            <div style={{position: 'absolute', left: -120, right: -120, top: VANISH.y - 1180, height: 2360, border: `14px solid ${alpha(toneColor(palette, 'accent'), distance > 0.2 ? 0.3 : 0.2)}`, boxShadow: `inset 0 0 240px ${alpha(palette.bg, 0.6)}`}}/>
            <div style={{position: 'absolute', inset: 0, opacity: clamp01(1.5 - distance * 1.9)}}>
            <div data-qa={current ? 'text' : undefined} style={{position: 'absolute', left: region.left, width: region.width, top, height: size, fontFamily: dateRole.family, fontWeight: dateRole.weight, fontSize: size, lineHeight: `${size}px`, color: toneColor(palette, event.tone === 'ink' ? 'accent' : event.tone), whiteSpace: 'nowrap'}}>{event.date}</div>
            {current
              ? <Headline spec={{text: event.text, reveal: 'none', role: 'statement', tone: 'ink', align: 'left'}} box={{left: region.left, width: region.width, top: top + size + 26, height: 280}} maxSize={100} minSize={46}/>
              : <div style={{position: 'absolute', left: region.left, width: region.width, top: top + size + 26, fontFamily: art.statement.family, fontWeight: art.statement.weight, fontSize: 84, lineHeight: 1.05, color: palette.ink}}>{event.text.replace(/\*/g, '')}</div>}
            </div>
          </div>
        );
      })}
    </>
  );
};

/** Time as a descent: a line runs down the frame and the camera falls along it. */
const Rail: React.FC<{spec: Spec}> = ({spec}) => {
  const {art, palette, frame, fps, start, profile} = useShot();
  const region = useRegion();
  const STEP = 1240;
  let y = 0, moving = false;
  spec.events.forEach((event, i) => {
    const s = start(event.cue);
    if (frame >= s && frame < s + sec(1.2, fps)) moving = true;
    y = lerp(y, i * STEP, clamp01(springFrom(frame, s, fps, profile.camera === 'camera' ? 'soft' : profile.camera)));
  });
  const railX = 140;
  const originY = region.top + 90;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${-y}px)`}}>
      <div style={{position: 'absolute', left: railX - 4, width: 8, top: -1000, height: spec.events.length * STEP + 3000, background: `linear-gradient(to bottom, ${alpha(palette.accent, 0.35)}, ${palette.accent})`}}/>
      {spec.events.map((event, i) => {
        const here = originY + i * STEP;
        const on = springFrom(frame, start(event.cue), fps, 'pop');
        const current = Math.abs(y - i * STEP) < 6 && !moving;
        return (
          <div key={i} {...movingAttr(!current)} style={{position: 'absolute', left: 0, top: here, width: 1080}}>
            <div style={{position: 'absolute', left: railX - 26, top: 40, width: 52, height: 52, borderRadius: '50%', background: mix(palette.bg, palette.accent, clamp01(on)), border: `8px solid ${palette.accent}`}}/>
            <div data-qa={current ? 'text' : undefined} style={{position: 'absolute', left: railX + 60, width: 740, top: 0, fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 168, lineHeight: 1, whiteSpace: 'nowrap', color: palette.accent, height: 172}}>{event.date}</div>
            {current
              ? <Headline spec={{text: event.text, reveal: 'none', role: 'statement', tone: 'ink', align: 'left'}} box={{left: railX + 60, width: 740, top: 196, height: 360}} maxSize={92} minSize={46}/>
              : <div style={{position: 'absolute', left: railX + 60, width: 740, top: 196, fontFamily: art.statement.family, fontWeight: art.statement.weight, fontSize: 82, lineHeight: 1.06, color: palette.ink}}>{event.text.replace(/\*/g, '')}</div>}
          </div>
        );
      })}
    </div>
  );
};

export const TimelineScene: React.FC<{spec: Spec}> = ({spec}) => (
  <>
    <Backdrop light={[0.5, -0.22]}/>
    {spec.style === 'rail' ? <Rail spec={spec}/> : <Corridor spec={spec}/>}
  </>
);

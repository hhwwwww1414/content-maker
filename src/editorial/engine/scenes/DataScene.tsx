import React, {useMemo} from 'react';
import {random} from 'remotion';
import type {z} from 'zod';
import {Backdrop, Depth} from '../Frame';
import {movingAttr, planeGrowth, toneColor, useRegion, useShot} from '../context';
import {clamp01, lerp, range, sec, springFrom, tween} from '../motion/core';
import {alpha, mix} from '../tokens';
import {Headline} from '../type/Headline';
import {Label} from '../type/Label';
import {measureWith} from '../type/measure';
import type {DataShot} from '../spec/schema';

type Spec = z.output<typeof DataShot>;

const grouped = (n: number, decimals = 0) => {
  const [whole, frac] = Math.abs(n).toFixed(decimals).split('.');
  const body = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${n < 0 ? '−' : ''}${body}${frac ? `,${frac}` : ''}`;
};

/** A digit wheel: each place rolls on its own spring and lands in sequence, like a mechanical counter. */
const Wheel: React.FC<{digit: number; p: number; size: number; color: string; turns: number}> = ({digit, p, size, color, turns}) => {
  const offset = (digit + turns * 10) * p;
  const lh = size * 0.98;
  return (
    <span style={{display: 'inline-block', position: 'relative', height: lh, overflow: 'hidden', verticalAlign: 'top'}}>
      <span style={{visibility: 'hidden'}}>{digit}</span>
      <span style={{position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center', color, transform: `translateY(${-offset * lh}px)`}}>
        {Array.from({length: Math.ceil(digit + turns * 10) + 2}, (_, i) => <span key={i} style={{display: 'block', height: lh, lineHeight: `${lh}px`}}>{i % 10}</span>)}
      </span>
    </span>
  );
};

const Counter: React.FC<{spec: Extract<Spec, {mode: 'counter'}>}> = ({spec}) => {
  const {art, palette, frame, fps, start, spring, profile, direction} = useShot();
  const base = useRegion();
  const fitted = Math.floor(base.width / planeGrowth(direction.camera, -0.8));
  const region = {...base, width: fitted, left: base.left + (base.width - fitted) / 2};
  const begin = start(spec.cue);
  const land = start(spec.landCue, begin + sec(1.1, fps));
  const span = Math.max(sec(0.35, fps), land - begin);
  const text = grouped(spec.value, spec.decimals);
  const full = `${spec.prefix}${text}${spec.suffix}`;
  const role = art.display;
  const measure = measureWith({...role, tracking: 0});
  const size = Math.min(620, Math.floor((95 * region.width) / measure(full, 100)));
  const lh = size * 0.98;
  const unitRoom = spec.unit ? 170 : 0;
  const labelRoom = spec.label ? 190 : 0;
  const footRoom = spec.footnote ? 190 : 0;
  const stack = lh + unitRoom + labelRoom + footRoom;
  const free = region.height - stack;
  const top = region.top + (spec.anchor === 'top' ? 0 : spec.anchor === 'bottom' ? free : free / 2);
  const landed = frame >= land;
  const roll = (i: number, n: number) => clamp01((frame - begin - ((i / Math.max(1, n)) * span) * 0.2) / span);
  const eased = (p: number) => 1 - (1 - p) ** 4;
  const glyphs = [...full];
  const digits = glyphs.filter((g) => /\d/.test(g)).length;
  let di = 0;
  const hit = springFrom(frame, land, fps, profile.emphasis);
  const color = palette.accent;
  const live = spec.roll === 'count' ? grouped(lerp(spec.from, spec.value, eased(clamp01((frame - begin) / span))), spec.decimals) : text;
  return (
    <div {...movingAttr(!landed)}>
      <div data-qa="text" data-qa-size={size} data-qa-focal {...movingAttr(!landed)} style={{position: 'absolute', left: region.left, top, width: region.width, height: lh, fontFamily: role.family, fontWeight: role.weight, fontSize: size, lineHeight: `${lh}px`, whiteSpace: 'nowrap', color, fontFeatureSettings: '"tnum","lnum"', transform: `scale(${1 + 0.018 * (1 - clamp01(hit)) * (landed ? 1 : 0)})`, transformOrigin: '50% 50%', opacity: frame >= begin ? 1 : 0}}>
        {spec.roll === 'digits'
          ? glyphs.map((g, i) => {
              if (!/\d/.test(g)) return <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: clamp01((frame - land + sec(0.3, fps)) / sec(0.2, fps))}}>{g}</span>;
              const index = di++;
              return <Wheel key={i} digit={Number(g)} p={eased(roll(index, digits))} size={size} color={color} turns={digits - index}/>;
            })
          : `${spec.prefix}${live}${spec.suffix}`}
      </div>
      {spec.unit && <div data-qa="text" {...movingAttr(!landed)} style={{position: 'absolute', left: region.left, top: top + lh + 4, width: region.width, height: unitRoom - 20, fontFamily: art.statement.family, fontWeight: art.statement.weight, fontSize: 132, lineHeight: `${unitRoom - 20}px`, whiteSpace: 'nowrap', color: palette.ink, opacity: clamp01(spring(spec.landCue, undefined, 0, land))}}>{spec.unit}</div>}
      {spec.label && <Headline spec={{text: spec.label, reveal: 'lines', role: 'body', tone: 'muted', align: 'left', cue: spec.landCue ?? spec.cue}} box={{left: region.left, width: region.width - 40, top: top + lh + unitRoom + 26, height: labelRoom - 30}} maxSize={62} minSize={36}/>}
      {spec.footnote && <Headline spec={spec.footnote} box={{left: region.left, width: region.width, top: top + lh + unitRoom + labelRoom + 20, height: footRoom - 20}} maxSize={70} minSize={36}/>}
    </div>
  );
};

/** Bars stand on a ground line that runs edge to edge: proportions stay honest and the chart owns the frame. */
const Bars: React.FC<{spec: Extract<Spec, {mode: 'bars'}>}> = ({spec}) => {
  const {art, palette, frame, fps, start, profile} = useShot();
  const region = useRegion();
  const n = spec.items.length;
  const max = spec.max ?? Math.max(...spec.items.map((i) => i.value));
  const titleRoom = spec.title ? 300 : 0;
  const ground = 1384;
  const maxH = ground - (region.top + titleRoom + 30);
  const gap = 14;
  const width = (1080 - gap * (n - 1)) / n;
  return (
    <>
      {spec.title && <Headline spec={spec.title} box={{left: region.left, top: region.top, width: region.width, height: titleRoom - 30}} maxSize={110} minSize={46}/>}
      <div style={{position: 'absolute', left: 0, right: 0, top: ground, bottom: 0, background: mix(palette.bg, palette.ink, 0.1)}}/>
      {spec.items.map((item, i) => {
        const begin = start(item.cue, sec(0.2 + i * 0.25, fps));
        const p = springFrom(frame, begin, fps, profile.enter === 'settle' ? 'soft' : profile.enter);
        const h = (item.value / max) * maxH * p;
        const x = i * (width + gap);
        const fill = item.highlight ? palette.accent : mix(palette.bg, palette.ink, 0.2);
        const textLeft = Math.max(region.left, x + 22);
        const textRight = Math.min(region.right, x + width - 16);
        const textWidth = textRight - textLeft;
        const value = item.display ?? String(item.value);
        const size = Math.min(300, Math.floor((94 * textWidth) / measureWith({...art.display, tracking: 0})(value, 100)));
        const inside = (item.value / max) * maxH > size + 150;
        const color = inside ? (item.highlight ? palette.onAccent : palette.ink) : palette.ink;
        const y = inside ? ground - h + 22 : ground - h - size - 96;
        const moving = frame < begin + sec(1.3, fps);
        return (
          <React.Fragment key={i}>
            <div data-qa-focal={item.highlight ? '' : undefined} style={{position: 'absolute', left: x, width, top: ground - h, height: h, background: `linear-gradient(to bottom, ${fill}, ${mix(fill, palette.bg, 0.22)})`}}/>
            <div style={{position: 'absolute', left: textLeft, top: y, width: textWidth, opacity: clamp01(p * 2)}}>
              <div data-qa="text" {...movingAttr(moving)} style={{fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: size, lineHeight: 1.2, whiteSpace: 'nowrap', color, height: size * 1.22}}>{value}</div>
              <Label moving={moving} size={58} role="body" color={color} style={{marginTop: 8}}>{item.label}</Label>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

const PERSON = 'M12 2.2a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8ZM3.6 22c0-5.6 3.6-9.2 8.4-9.2s8.4 3.6 8.4 9.2H3.6Z';

/** A crowd that fills the frame. One figure in it is the whole argument. */
const Units: React.FC<{spec: Extract<Spec, {mode: 'units'}>}> = ({spec}) => {
  const {palette, frame, fps, start, profile, preRoll} = useShot();
  const region = useRegion();
  const titleTop = spec.titleAnchor === 'top';
  const titleRoom = spec.title ? 330 : 0;
  const top = titleTop ? region.top + titleRoom : -20;
  const bottom = titleTop ? 1960 : region.bottom - titleRoom;
  const columns = spec.columns ?? Math.max(2, Math.round(Math.sqrt((spec.total * 1080) / (bottom - top))));
  const cell = 1080 / columns;
  const rows = Math.ceil(spec.total / columns);
  const step = Math.min(cell, (bottom - top) / rows);
  const marked = useMemo(() => {
    const order = Array.from({length: spec.total}, (_, i) => i).sort((a, b) => random(`u${a}`) - random(`u${b}`));
    return new Set(order.slice(0, spec.highlight));
  }, [spec.total, spec.highlight]);
  // The crowd is already gathering as the transition opens: the reveal lands on people, not on an empty ground.
  const begin = Math.min(start(spec.cue), -preRoll);
  const hi = start(spec.highlightCue, begin + sec(1.2, fps));
  const dim = tween(frame, hi, 0.45, fps, 'out');
  const glyph = (x: number, y: number, s: number, color: string, opacity: number, key: number, scale: number) => {
    if (spec.glyph === 'dot') return <circle key={key} cx={x} cy={y} r={s * 0.36 * scale} fill={color} opacity={opacity}/>;
    if (spec.glyph === 'square') return <rect key={key} x={x - s * 0.38 * scale} y={y - s * 0.38 * scale} width={s * 0.76 * scale} height={s * 0.76 * scale} rx={s * 0.08} fill={color} opacity={opacity}/>;
    const k = (s * 0.86 * scale) / 24;
    return <path key={key} d={PERSON} transform={`translate(${x - 12 * k} ${y - 12 * k}) scale(${k})`} fill={color} opacity={opacity}/>;
  };
  const base = mix(palette.bg, palette.ink, 0.42);
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {Array.from({length: spec.total}, (_, i) => {
          const col = i % columns, row = Math.floor(i / columns);
          const x = col * cell + cell / 2;
          // A crowd is never perfectly still: each figure breathes on its own phase.
          const y = top + row * step + step / 2 + Math.sin(frame / fps * 1.4 + i * 1.7) * step * 0.05;
          const d = Math.hypot(x - 540, y - 800) / 1100;
          const p = springFrom(frame, begin + sec(d * 0.7, fps), fps, profile.enter);
          const isHot = marked.has(i);
          const hot = isHot ? springFrom(frame, hi + sec(random(`h${i}`) * 0.25, fps), fps, 'pop') : 0;
          const color = isHot && dim > 0 ? palette.accent : base;
          const opacity = clamp01(p) * (isHot ? 1 : lerp(0.9, 0.34, dim));
          return glyph(x, y, step, color, opacity, i, clamp01(p) * (1 + hot * 0.18 + (isHot ? Math.sin(frame / fps * 3 + i) * 0.07 : 0)));
        })}
      </svg>
      {spec.title && <Headline spec={spec.title} box={titleTop ? {left: region.left, top: region.top, width: region.width, height: titleRoom - 30} : {left: region.left, top: bottom + 30, width: region.width, height: titleRoom - 40}} maxSize={230} minSize={46} anchor={titleTop ? 'top' : 'bottom'}/>}
    </>
  );
};

/** The camera rides the tip of the line, then pulls back to show the whole curve. */
const Line: React.FC<{spec: Extract<Spec, {mode: 'line'}>}> = ({spec}) => {
  const {art, palette, frame, fps, start, durationFrames} = useShot();
  const region = useRegion();
  const titleRoom = spec.title ? 300 : 0;
  const box = {left: 0, right: 1080, top: region.top + titleRoom + 60, bottom: region.bottom - 40};
  const begin = start(spec.cue);
  const seconds = spec.seconds ?? Math.max(1.2, (durationFrames - begin) / fps - 1);
  const p = clamp01((frame - begin) / sec(seconds, fps));
  const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
  const min = Math.min(...spec.points), max = Math.max(...spec.points);
  const pts = spec.points.map((v, i): [number, number] => [box.left + 60 + ((box.right - box.left - 160) * i) / (spec.points.length - 1), box.bottom - ((v - min) / (max - min || 1)) * (box.bottom - box.top)]);
  const lengths = pts.map((pt, i) => (i ? Math.hypot(pt[0] - pts[i - 1][0], pt[1] - pts[i - 1][1]) : 0));
  const total = lengths.reduce((a, b) => a + b, 0);
  let left = eased * total, tip = pts[0];
  const drawn: Array<[number, number]> = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (left >= lengths[i]) { drawn.push(pts[i]); left -= lengths[i]; tip = pts[i]; continue; }
    const k = left / (lengths[i] || 1);
    tip = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    drawn.push(tip);
    break;
  }
  const d = drawn.map((pt, i) => `${i ? 'L' : 'M'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join('');
  const zoom = lerp(1.5, 1, range(eased, [0.55, 1], [0, 1], 'inOut'));
  const camX = (540 - tip[0]) * (zoom - 1) / zoom, camY = (900 - tip[1]) * (zoom - 1) / zoom;
  return (
    <>
      {spec.title && <Headline spec={spec.title} box={{left: region.left, top: region.top, width: region.width, height: titleRoom - 30}} maxSize={110} minSize={46}/>}
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom}) translate(${camX}px, ${camY}px)`, transformOrigin: '50% 47%'}}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={-400} x2={1500} y1={box.bottom - f * (box.bottom - box.top)} y2={box.bottom - f * (box.bottom - box.top)} stroke={alpha(palette.ink, 0.12)} strokeWidth={2}/>)}
          {spec.area && <path d={`${d}L${tip[0]} 2200L${pts[0][0]} 2200Z`} fill={alpha(palette.accent, 0.18)}/>}
          <path d={d} fill="none" stroke={palette.accent} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round"/>
          <circle cx={tip[0]} cy={tip[1]} r={26} fill={palette.bg} stroke={palette.accent} strokeWidth={11}/>
        </svg>
      </div>
      {spec.labels.map((label, i) => {
        const at = pts[Math.min(label.at, pts.length - 1)];
        const screen = {x: 540 + (at[0] + camX - 540) * zoom, y: 902 + (at[1] + camY - 902) * zoom};
        const q = springFrom(frame, start(label.cue, begin + sec((label.at / spec.points.length) * seconds, fps)), fps, 'snap');
        return <Label key={i} moving={q < 0.98 || p < 1} size={44} color={palette.ink} style={{position: 'absolute', left: Math.max(80, Math.min(600, screen.x - 150)), top: Math.max(region.top, screen.y - 104), width: 340, opacity: clamp01(q), transform: `translateY(${(1 - q) * 16}px)`}}>{label.text}</Label>;
      })}
      {spec.end && (() => {
        const q = springFrom(frame, begin + sec(seconds, fps), fps, 'pop');
        const x = 540 + (tip[0] + camX - 540) * zoom, y = 902 + (tip[1] + camY - 902) * zoom;
        return <div data-qa="text" {...movingAttr(p < 1 || q < 0.98)} style={{position: 'absolute', left: Math.min(600, x - 300), width: 320, top: Math.max(region.top + titleRoom, y - 190), textAlign: 'right', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 118, lineHeight: 1, color: toneColor(palette, 'accent'), opacity: clamp01(q), transform: `scale(${0.8 + 0.2 * q})`, whiteSpace: 'nowrap'}}>{spec.end}</div>;
      })()}
    </>
  );
};

export const DataScene: React.FC<{spec: Spec}> = ({spec}) => (
  <>
    <Backdrop/>
    <Depth z={-0.85}>
      {spec.mode === 'counter' && <Counter spec={spec}/>}
      {spec.mode === 'bars' && <Bars spec={spec}/>}
      {spec.mode === 'units' && <Units spec={spec}/>}
      {spec.mode === 'line' && <Line spec={spec}/>}
    </Depth>
  </>
);

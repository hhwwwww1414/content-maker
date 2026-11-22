import React from 'react';
import {Backdrop} from '../../Frame';
import {movingAttr, useRegion, useShot} from '../../context';
import {lerp, range} from '../../motion/core';
import {alpha, mix} from '../../tokens';
import {Headline, textDefaults} from '../../type/Headline';
import {Label} from '../../type/Label';

type Box = {cx: number; bottom: number; width: number; height: number};

/** A tumbler in soft perspective: thick glass base, a wave on the surface, light caught on the left wall. */
const Glass: React.FC<{id: string; box: Box; level: number; water: string; straw?: number}> = ({id, box, level, water, straw = 0}) => {
  const {t, palette} = useShot();
  const {cx, bottom, width, height} = box;
  const rimY = bottom - height;
  const halfTop = width / 2, halfBase = width * 0.42;
  const ry = width * 0.075;
  const edgeAt = (y: number) => lerp(halfBase, halfTop, (bottom - y) / height);
  const base = bottom - ry * 0.9;
  const usable = base - (rimY + ry * 1.4);
  const surface = base - usable * Math.max(0, level);
  const half = edgeAt(surface) - 5;
  const shell = `M${cx - halfTop} ${rimY} L${cx - halfBase} ${bottom} A${halfBase} ${ry} 0 0 0 ${cx + halfBase} ${bottom} L${cx + halfTop} ${rimY} A${halfTop} ${ry} 0 0 0 ${cx - halfTop} ${rimY} Z`;
  const wave = Array.from({length: 25}, (_, i) => {
    const u = i / 24;
    const x = cx - half + u * half * 2;
    return `${x.toFixed(1)} ${(surface + Math.sin(u * 7 + t * 3.1) * 3.2 + Math.sin(u * 15 - t * 2.3) * 1.6).toFixed(1)}`;
  }).join(' L');
  const body = `M${wave} L${cx + edgeAt(base) - 6} ${base} A${edgeAt(base) - 6} ${ry * 0.9} 0 0 1 ${cx - edgeAt(base) + 6} ${base} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={mix(water, '#ffffff', 0.18)}/><stop offset="1" stopColor={mix(water, '#000018', 0.28)}/></linearGradient>
        <linearGradient id={`${id}g`} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#fff" stopOpacity=".62"/><stop offset=".16" stopColor="#fff" stopOpacity=".1"/><stop offset=".84" stopColor="#fff" stopOpacity=".04"/><stop offset="1" stopColor="#fff" stopOpacity=".42"/></linearGradient>
        <radialGradient id={`${id}s`}><stop offset="0" stopColor={alpha(mix(water, '#000', 0.25), 0.42)}/><stop offset="1" stopColor={alpha(water, 0)}/></radialGradient>
      </defs>
      <ellipse cx={cx + width * 0.1} cy={bottom + ry * 1.3} rx={width * 0.74} ry={ry * 1.9} fill={`url(#${id}s)`}/>
      {straw > 0 && <line x1={cx + width * 0.06} y1={base - 12} x2={cx + width * 0.27} y2={rimY - 70 * straw} stroke={palette.accent2} strokeWidth={Math.max(10, width * 0.034)} strokeLinecap="round" opacity={straw}/>}
      {level > 0.004 && <path d={body} fill={`url(#${id}w)`}/>}
      {level > 0.004 && <ellipse cx={cx} cy={surface} rx={half} ry={ry * 0.72} fill={mix(water, '#ffffff', 0.34)} opacity={0.86}/>}
      {level > 0.04 && Array.from({length: 9}, (_, i) => {
        const rise = ((t * (0.22 + i * 0.031) + i * 0.137) % 1);
        const y = base - (base - surface - 14) * rise;
        const x = cx + Math.sin(i * 2.4 + rise * 5) * (edgeAt(y) - 30) * 0.86;
        return <circle key={i} cx={x} cy={y} r={3 + (i % 3) * 2} fill="#fff" opacity={0.42 * (1 - rise)}/>;
      })}
      <path d={shell} fill={`url(#${id}g)`} stroke={alpha(palette.ink, 0.42)} strokeWidth={3}/>
      <ellipse cx={cx} cy={rimY} rx={halfTop} ry={ry} fill="none" stroke={alpha(palette.ink, 0.5)} strokeWidth={3}/>
      <path d={`M${cx - halfTop + width * 0.08} ${rimY + height * 0.12} L${cx - halfBase + width * 0.07} ${bottom - height * 0.14}`} stroke="#fff" strokeOpacity=".72" strokeWidth={width * 0.022} strokeLinecap="round"/>
    </g>
  );
};

const Coin: React.FC<{x: number; y: number; size: number}> = ({x, y, size}) => {
  const {t, palette, art} = useShot();
  const turn = t * 4.2;
  const side = Math.cos(turn * Math.PI);
  return <div style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 34% 28%, ${mix(palette.accent2, '#ffffff', 0.32)}, ${palette.accent2})`, transform: `scaleX(${Math.max(0.08, Math.abs(side)).toFixed(3)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: art.display.family, fontWeight: 900, fontSize: size * 0.56, color: '#fff'}}>{side > 0 ? '1' : '2'}</div>;
};

const Percent: React.FC<{value: number; p: number; left: number; width: number; top: number; color: string; size: number}> = ({value, p, left, width, top, color, size}) => {
  const {art} = useShot();
  if (p <= 0) return null;
  return <div data-qa="text" data-qa-focal {...movingAttr(p < 1)} style={{position: 'absolute', left, top, width, textAlign: 'center', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: size, lineHeight: 1, letterSpacing: art.display.tracking * (size / 100), color, fontFeatureSettings: '"tnum"', opacity: Math.min(1, p * 3)}}>{Math.round(value * p)}%</div>;
};

/** Proof: the real experiment, staged. One glass drunk down to a line, then the same glass as a measure of who finished. */
export const WaterTest: React.FC<{title: string; drinkCue: string; leftCue: string; rightCue: string; landCue: string; left: {value: number; label: string}; right: {value: number; label: string}; note: string}> = ({title, drinkCue, leftCue, rightCue, landCue, left, right, note}) => {
  const {palette, frame, fps, start, spring, tween} = useShot();
  const region = useRegion();
  const beginLeft = start(leftCue);
  // Act one: one glass, drunk down. Act two: it steps aside and becomes the left measure.
  const drink = range(frame, [start(drinkCue), beginLeft - Math.round(0.15 * fps)], [0, 1], 'inOut');
  const aside = tween(leftCue, 0.75, 'inOut', -0.12);
  const fillLeft = spring(leftCue, 'soft', 0.42);
  const enterRight = spring(rightCue, 'snap', -0.05);
  const fillRight = spring(landCue, 'soft', -0.25);
  const scale = {cx: lerp(540, 300, aside), bottom: lerp(1400, 1290, aside), width: lerp(470, 370, aside), height: lerp(760, 650, aside)};
  const levelLeft = aside < 1 ? lerp(lerp(0.96, 0.08, drink), 0, aside) : 0;
  const leftLevel = levelLeft + Math.min(1, fillLeft) * (left.value / 100);
  const titleOut = 1 - aside;
  const labelsIn = Math.min(1, aside);
  const rightX = lerp(1320, 780, Math.min(1.04, enterRight));
  const numberP = (p: number) => Math.min(1, Math.max(0, p));
  return (
    <>
      <Backdrop/>
      {titleOut > 0.01 && <div style={{opacity: titleOut}}><Headline spec={textDefaults(title, {reveal: 'lines', cue: drinkCue, emphasis: 'box'})} box={{left: region.left, top: region.top, width: region.width, height: 250}} maxSize={104} minSize={60} anchor="top"/></div>}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <Glass id="wl" box={scale} level={leftLevel} water={mix(palette.accent, palette.muted, 0.55)} straw={titleOut}/>
        {enterRight > 0.01 && <Glass id="wr" box={{cx: rightX, bottom: 1290, width: 370, height: 650}} level={Math.min(1, fillRight) * (right.value / 100)} water={palette.accent}/>}
      </svg>
      <Percent value={left.value} p={numberP(fillLeft)} left={100} width={400} top={414} color={palette.muted} size={150}/>
      <Percent value={right.value} p={numberP(fillRight)} left={580} width={360} top={384} color={palette.accent} size={180}/>
      {labelsIn > 0.6 && <Label role="body" moving={labelsIn < 1} size={34} color={palette.ink} style={{position: 'absolute', left: 90, width: 420, top: 1338, textAlign: 'center', whiteSpace: 'nowrap', opacity: labelsIn}}>{left.label}</Label>}
      {enterRight > 0.6 && <>
        <Coin x={590} y={1330} size={56}/>
        <Label role="body" moving={enterRight < 0.98} size={34} color={palette.ink} style={{position: 'absolute', left: 656, width: 280, top: 1338, whiteSpace: 'nowrap', opacity: Math.min(1, enterRight)}}>{right.label}</Label>
      </>}
      {fillRight > 0.5 && <Label moving={fillRight < 0.98} size={30} color={palette.muted} style={{position: 'absolute', left: region.left, width: region.width, top: 1408, textAlign: 'center', opacity: Math.min(1, fillRight)}}>{note}</Label>}
    </>
  );
};

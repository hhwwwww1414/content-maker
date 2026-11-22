import React from 'react';
import {Img, Sequence} from 'remotion';
import {Video} from '@remotion/media';
import type {z} from 'zod';
import {Depth, Scrim} from '../Frame';
import {movingAttr, toneColor, useRegion, useShot, type AssetEntry} from '../context';
import {assetUrl} from '../library';
import {clamp01, lerp, range, sec, springFrom, tween} from '../motion/core';
import {alpha} from '../tokens';
import {Headline} from '../type/Headline';
import {Label} from '../type/Label';
import type {MediaShot} from '../spec/schema';

type Spec = z.output<typeof MediaShot>;
type PlateSpec = Spec['plates'][number];

const W = 1080, H = 1920;

const GRADES: Record<Spec['grade'], React.CSSProperties> = {
  none: {},
  mono: {filter: 'grayscale(1) contrast(1.12)'},
  warm: {filter: 'saturate(.85) sepia(.18) contrast(1.06)'},
  cold: {filter: 'saturate(.78) hue-rotate(-8deg) contrast(1.08) brightness(.95)'},
  noir: {filter: 'grayscale(1) contrast(1.32) brightness(.82)'},
  duotone: {filter: 'grayscale(1) contrast(1.15)'},
};

/** Maps image coordinates (0..1) to frame pixels for a focus and zoom, so annotations track the picture. */
const framing = (entry: AssetEntry, focus: [number, number], zoom: number) => {
  const iw = entry.width ?? W, ih = entry.height ?? H;
  const cover = Math.max(W / iw, H / ih) * zoom;
  const dw = iw * cover, dh = ih * cover;
  const x = Math.min(0, Math.max(W - dw, W / 2 - focus[0] * dw));
  const y = Math.min(0, Math.max(H - dh, H / 2 - focus[1] * dh));
  return {x, y, dw, dh, project: (u: number, v: number): [number, number] => [x + u * dw, y + v * dh], cover};
};

const PlateView: React.FC<{plate: PlateSpec; grade: Spec['grade']; from: number; until: number}> = ({plate, grade, from, until}) => {
  const {assets, frame, fps, palette, camera, durationFrames} = useShot();
  const entry = assets[plate.asset];
  if (!entry) throw new Error(`Asset "${plate.asset}" is not resolved. Run node studio/assets.mjs check.`);
  const progress = clamp01((frame - from) / Math.max(1, Math.min(until, durationFrames + sec(1, fps)) - from));
  const focus: [number, number] = [lerp(plate.focus[0], (plate.endFocus ?? plate.focus)[0], progress), lerp(plate.focus[1], (plate.endFocus ?? plate.focus)[1], progress)];
  const zoom = lerp(plate.zoom, plate.endZoom ?? plate.zoom + 0.08, progress) * camera.scale;
  const f = framing(entry, focus, zoom);
  const style: React.CSSProperties = {position: 'absolute', left: f.x + camera.x * 0.6, top: f.y + camera.y * 0.6, width: f.dw, height: f.dh, maxWidth: 'none', ...GRADES[grade]};
  const isVideo = entry.kind === 'video';
  return (
    <>
      {isVideo
        ? <Sequence from={from} layout="none"><Video src={assetUrl(entry)} muted style={style}/></Sequence>
        : <Img src={assetUrl(entry)} style={style}/>}
      {grade === 'duotone' && <div style={{position: 'absolute', inset: 0, background: palette.accent, mixBlendMode: 'color', opacity: 0.8}}/>}
      {plate.callouts.map((callout, i) => <Callout key={i} callout={callout} at={f.project(callout.at[0], callout.at[1])} offsetX={camera.x * 0.6} offsetY={camera.y * 0.6}/>)}
    </>
  );
};

/** A label tied to a point in the picture: it follows the image through the camera move. */
const Callout: React.FC<{callout: PlateSpec['callouts'][number]; at: [number, number]; offsetX: number; offsetY: number}> = ({callout, at, offsetX, offsetY}) => {
  const {spring, tween: tw, palette, frame, start, fps} = useShot();
  const p = spring(callout.cue, 'snap');
  const ring = tw(callout.cue, 0.5);
  const color = toneColor(palette, callout.tone);
  const x = at[0] + offsetX, y = at[1] + offsetY;
  const reach = 150 * clamp01(p);
  const dx = callout.side === 'right' ? reach : callout.side === 'left' ? -reach : 0;
  const dy = callout.side === 'above' ? -reach : callout.side === 'below' ? reach : -reach * 0.35;
  const lx = x + dx, ly = y + dy;
  const width = 430;
  const left = Math.max(84, Math.min(936 - width, callout.side === 'left' ? lx - width : callout.side === 'right' ? lx + 16 : lx - width / 2));
  const moving = frame < start(callout.cue) + sec(0.8, fps) || p < 0.98;
  return (
    <>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <circle cx={x} cy={y} r={lerp(70, 26, ring)} fill="none" stroke={color} strokeWidth={6} opacity={clamp01(ring * 2)}/>
        <circle cx={x} cy={y} r={7} fill={color} opacity={clamp01(ring * 2)}/>
        <line x1={x} y1={y} x2={lx} y2={ly} stroke={color} strokeWidth={4} opacity={clamp01(p)}/>
      </svg>
      <Label moving={moving} size={44} role="body" color="#FFFFFF" style={{position: 'absolute', left, top: ly - 34, width, opacity: clamp01(p), padding: '10px 18px', background: 'rgba(0,0,0,.72)', borderLeft: `6px solid ${color}`, fontWeight: 600}}>{callout.text.replace(/\*/g, '')}</Label>
    </>
  );
};

/** Full-bleed imagery with a graded look and tracked annotations. The picture is the composition. */
export const MediaScene: React.FC<{spec: Spec}> = ({spec}) => {
  const {frame, fps, start, palette, spring, durationFrames, direction, preRoll} = useShot();
  const region = useRegion();
  const plates = spec.plates.map((plate, i) => ({plate, from: i === 0 ? -preRoll : start(plate.cue, 0)}));
  const open = spec.reveal === 'none' ? 1 : tween(frame, 0, 0.9, fps, 'inOut');
  const clip = spec.reveal === 'iris' ? `circle(${open * 1200}px at 50% 42%)` : spec.reveal === 'wipe' ? `inset(0 ${(1 - open) * 100}% 0 0)` : spec.reveal === 'rise' ? `inset(${(1 - open) * 100}% 0 0 0)` : spec.reveal === 'blinds' ? `polygon(${Array.from({length: 7}, (_, i) => { const y = (i * H) / 7, h = (H / 7) * open; return `0 ${y}px, ${W}px ${y}px, ${W}px ${y + h}px, 0 ${y + h}px, 0 ${y}px`; }).join(',')},0 0)` : undefined;
  void range; void springFrom; void movingAttr; void spring; void alpha;
  const titleTop = spec.titleAnchor === 'top';
  const hasTitle = !!spec.title || spec.plates.some((plate) => plate.title);
  const fg = spec.foreground;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: palette.bg}}/>
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', clipPath: clip}}>
        {plates.map(({plate, from}, i) => {
          const until = plates[i + 1]?.from ?? durationFrames + sec(1, fps);
          if (frame < from || frame >= until + 1) return null;
          const enter = i === 0 ? 1 : tween(frame, from, 0.5, fps, 'inOut');
          return (
            <div key={i} style={{position: 'absolute', inset: 0, clipPath: enter < 1 ? `inset(0 0 ${(1 - enter) * 100}% 0)` : undefined}}>
              <PlateView plate={plate} grade={spec.grade} from={from} until={until}/>
            </div>
          );
        })}
        {fg && <Depth z={fg.depth}><FgLayer id={fg.asset} box={fg.box}/></Depth>}
      </div>
      <Scrim side="top" to={direction.captions.zone === 'high' ? 760 : hasTitle && titleTop ? 900 : 560} strength={hasTitle && titleTop ? 0.92 : 0.62}/>
      {spec.title && !titleTop && <Scrim side="bottom" from={420} to={900} strength={0.9}/>}
      {!(spec.title && !titleTop) && <Scrim side="bottom" to={560} strength={0.7}/>}
      {plates.map(({plate, from}, i) => {
        const until = plates[i + 1]?.from ?? Infinity;
        return plate.title && frame >= from && frame < until ? <Headline key={i} spec={{...plate.title, cue: plate.title.cue ?? from / fps}} box={{left: region.left, top: titleTop ? region.top : region.bottom - 560, width: region.width, height: 560}} anchor={titleTop ? 'top' : 'bottom'} maxSize={210} minSize={46} color={plate.title.tone === 'ink' ? '#F7F3EA' : undefined}/> : null;
      })}
      {spec.title && <Headline spec={spec.title} box={{left: region.left, top: titleTop ? region.top : region.bottom - 560, width: region.width, height: 560}} anchor={titleTop ? 'top' : 'bottom'} maxSize={210} minSize={46} color={spec.title.tone === 'ink' ? '#F7F3EA' : undefined}/>}
    </>
  );
};

const FgLayer: React.FC<{id: string; box: [number, number, number, number]}> = ({id, box}) => {
  const {assets} = useShot();
  const entry = assets[id];
  if (!entry) throw new Error(`Asset "${id}" is not resolved`);
  return <Img src={assetUrl(entry)} style={{position: 'absolute', left: box[0], top: box[1], width: box[2], height: box[3], objectFit: 'contain'}}/>;
};

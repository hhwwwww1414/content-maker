import React from 'react';
import {Img, random} from 'remotion';
import type {z} from 'zod';
import {Backdrop} from '../Frame';
import {movingAttr, toneColor, useShot} from '../context';
import {assetUrl} from '../library';
import {clamp01, lerp, parallaxStyle, sec, springFrom, tween, wander} from '../motion/core';
import {alpha, elevation, mix} from '../tokens';
import {Headline} from '../type/Headline';
import type {CollageShot} from '../spec/schema';

type Spec = z.output<typeof CollageShot>;
type PieceSpec = Spec['pieces'][number];

/** Torn paper and pressed ink come from turbulence displacement, seeded so every frame is the same. */
const Filters: React.FC<{scene: string}> = ({scene}) => (
  <svg width={0} height={0} style={{position: 'absolute'}}>
    <filter id={`torn-${scene}`} x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="4" seed="7"/><feDisplacementMap in="SourceGraphic" scale="20"/></filter>
    <filter id={`ink-${scene}`} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.3" result="holes"/>
      <feComposite in="SourceGraphic" in2="holes" operator="in"/>
    </filter>
  </svg>
);

const PieceBody: React.FC<{piece: PieceSpec; p: number}> = ({piece, p}) => {
  const {art, palette, assets, frame, fps, start, spring} = useShot();
  const [, , w, h] = piece.box;
  const color = toneColor(palette, piece.tone, palette.ink);
  const paper = mix(palette.surface, '#ffffff', 0.25);
  const box = {left: 0, top: 0, width: w, height: h};
  const inset = (n: number) => ({left: n, top: n * 0.9, width: w - n * 2, height: h - n * 1.8});
  switch (piece.kind) {
    case 'photo': {
      const entry = piece.asset ? assets[piece.asset] : null;
      return <div style={{...box, position: 'absolute', background: '#FFFDF6', padding: 16, boxShadow: elevation.mid}}>
        {entry && <Img src={assetUrl(entry)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.82) contrast(1.05)'}}/>}
      </div>;
    }
    case 'paper':
      return <div style={{...box, position: 'absolute', background: piece.tone ? color : palette.bg2}}/>;
    case 'tape':
      return <div style={{...box, position: 'absolute', background: alpha(palette.accent2, 0.35), backdropFilter: 'brightness(1.08)'}}/>;
    case 'word':
      return <Headline spec={{text: piece.text ?? '', reveal: 'none', role: 'display', tone: (piece.tone ?? 'ink') as 'ink', align: 'left'}} box={box} maxSize={piece.size ?? 260} minSize={40} color={color}/>;
    case 'note':
      return <div style={{...box, position: 'absolute', background: mix(palette.accent, '#ffffff', 0.74), boxShadow: elevation.low, padding: 0}}>
        <Headline spec={{text: piece.text ?? '', reveal: 'none', role: 'statement', tone: 'ink', align: 'left'}} box={inset(34)} maxSize={piece.size ?? 110} minSize={34} color="#17120C"/>
      </div>;
    case 'stamp': {
      const stampColor = piece.tone ? color : palette.danger;
      return <div data-qa-allow-overlap style={{...box, position: 'absolute', border: `${Math.max(8, h * 0.06)}px solid ${stampColor}`, borderRadius: Math.min(24, h * 0.14), display: 'block'}}>
        <Headline spec={{text: piece.text ?? '', reveal: 'none', role: 'display', tone: 'ink', align: 'center'}} box={inset(Math.max(20, h * 0.12))} layout="stack" maxSize={piece.size ?? 170} minSize={34} anchor="center" color={stampColor}/>
      </div>;
    }
    case 'receipt':
    case 'document': {
      const lines = piece.lines ?? [];
      const titleH = piece.text ? Math.min(h * 0.26, 180) : 0;
      const lineH = Math.min(116, (h - titleH - 96) / Math.max(1, lines.length));
      const fs = Math.floor(lineH * 0.46);
      const mark = tween(frame, start(piece.markCue, sec(0.3, fps)), 0.5, fps, 'out');
      return <div data-qa-group-root={piece.text} style={{...box, position: 'absolute', background: paper, boxShadow: elevation.high}}>
        {piece.text && <Headline spec={{text: piece.text, reveal: 'none', role: 'display', tone: 'ink', align: 'left'}} box={{left: 44, top: 44, width: w - 88, height: titleH}} maxSize={96} minSize={34} color="#17120C"/>}
        {lines.map((line, i) => (
          <div key={i} style={{position: 'absolute', left: 44, right: 44, top: 44 + titleH + 10 + i * lineH, height: lineH, borderBottom: `2px solid ${alpha('#17120C', 0.14)}`}}>
            {piece.markLine === i && <div style={{position: 'absolute', left: -10, top: 6, bottom: 8, right: -10, background: alpha(palette.accent, 0.3), transformOrigin: '0 50%', transform: `scaleX(${mark})`}}/>}
            <div data-qa="text" data-qa-group={piece.text} style={{position: 'relative', fontFamily: art.body.family, fontWeight: 600, fontSize: Math.max(30, fs), lineHeight: `${lineH}px`, color: '#17120C', whiteSpace: 'nowrap', overflow: 'hidden', height: lineH}}>{line}</div>
          </div>
        ))}
      </div>;
    }
    default:
      void p; void spring;
      return null;
  }
};

/** Physical paper on a table. Pieces land on spoken words and settle with weight. */
export const CollageScene: React.FC<{spec: Spec}> = ({spec}) => {
  const {frame, fps, start, profile, camera, scene, t} = useShot();
  const impact = spec.impactCue !== undefined ? clamp01((frame - start(spec.impactCue)) / sec(0.32, fps)) : 1;
  const shake = impact < 1 ? (1 - impact) ** 2 : 0;
  const shakeX = shake * Math.sin(frame * 2.7) * 16, shakeY = shake * Math.cos(frame * 3.3) * 22;
  return (
    <>
      <Backdrop/>
      <Filters scene={scene.id}/>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${shakeX}px, ${shakeY}px)`}}>
        {spec.pieces.map((piece, i) => {
          const begin = start(piece.cue, sec(i * profile.lineStagger, fps));
          const stampLike = piece.kind === 'stamp';
          const p = springFrom(frame, begin, fps, stampLike ? 'snap' : profile.enter === 'settle' ? 'soft' : profile.enter);
          const [left, top, width, height] = piece.box;
          const seed = random(`${scene.id}${i}`);
          const tilt = lerp((seed - 0.5) * 18, 0, clamp01(p));
          const fall = stampLike ? {transform: `scale(${lerp(2.3, 1, clamp01(p))})`, opacity: frame >= begin ? clamp01(p * 3) : 0} : {transform: `translate(${(seed - 0.5) * 240 * (1 - p)}px, ${-(1 - p) * 520}px)`, opacity: frame >= begin ? clamp01(p * 4) : 0};
          const settled = frame > begin + sec(1, fps);
          const float = wander(t * 0.6, i * 3.1) * 1.5;
          const needsPaint = stampLike ? `url(#ink-${scene.id})` : piece.torn ? `url(#torn-${scene.id})` : undefined;
          return (
            <div key={i} style={{position: 'absolute', inset: 0, ...parallaxStyle(camera, piece.depth)}}>
              <div {...movingAttr(!settled)} style={{position: 'absolute', left, top, width, height, ...fall}}>
                <div style={{position: 'absolute', inset: 0, transform: `rotate(${piece.rotate + tilt + float * 0.12}deg)`, filter: needsPaint}}>
                  <PieceBody piece={piece} p={p}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

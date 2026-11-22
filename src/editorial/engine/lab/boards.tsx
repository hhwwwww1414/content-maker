import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FontGate} from '../fonts';
import {entrance, profiles, springs, type EnterName, type SpringName} from '../motion/core';
import {artDirections, artIds, type ArtDirection} from '../themes';
import {contrastRatio, elevation, radius, space, typeScale} from '../tokens';

const Shell: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
  <FontGate><AbsoluteFill style={{background: '#101114', color: '#F0F0F0', fontFamily: 'Onest', padding: 56}}>
    <div style={{fontSize: 52, fontWeight: 700, marginBottom: 28}}>{title}</div>
    {children}
  </AbsoluteFill></FontGate>
);

const Swatch: React.FC<{art: ArtDirection}> = ({art}) => (
  <div style={{marginBottom: 22}}>
    <div style={{fontSize: 30, fontWeight: 700, marginBottom: 8}}>{art.label} <span style={{opacity: .55, fontWeight: 400, fontSize: 24}}>{art.motion} · {art.field}</span></div>
    {(['base', 'inverse', 'block'] as const).map((v) => {
      const p = art.palettes[v];
      return <div key={v} style={{display: 'flex', height: 86, marginBottom: 4, background: p.bg, alignItems: 'center', padding: '0 18px', gap: 14}}>
        <span style={{fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 56, color: p.ink}}>Аа</span>
        <span style={{fontFamily: art.italic.family, fontStyle: 'italic', fontSize: 50, color: p.accent}}>Акцент</span>
        <span style={{flex: 1}}/>
        {[p.surface, p.line, p.accent, p.accent2, p.danger].map((c, i) => <span key={i} style={{width: 42, height: 42, borderRadius: 8, background: c, border: '1px solid rgba(128,128,128,.4)'}}/>)}
        <span style={{fontSize: 22, color: p.ink, fontFamily: 'JetBrains Mono', width: 86, textAlign: 'right'}}>{contrastRatio(p.ink, p.bg).toFixed(1)}</span>
      </div>;
    })}
  </div>
);

export const TokensBoard: React.FC = () => (
  <Shell title="Токены и арт-направления">
    {artIds.map((id) => <Swatch key={id} art={artDirections[id]}/>)}
    <div style={{display: 'flex', gap: 14, alignItems: 'flex-end', marginTop: 6}}>
      {Object.values(space).map((v) => <div key={v} style={{width: v, height: v, background: '#6C7CFF'}}/>)}
      {Object.values(radius).slice(1, 5).map((v) => <div key={v} style={{width: 90, height: 90, borderRadius: v, background: '#E0DCD0'}}/>)}
      {Object.values(elevation).slice(1).map((v, i) => <div key={i} style={{width: 90, height: 90, background: '#F5F5F5', boxShadow: v}}/>)}
    </div>
  </Shell>
);

export const TypeBoard: React.FC = () => (
  <Shell title="Типографика: кириллица">
    {artIds.map((id) => {
      const a = artDirections[id];
      return <div key={id} style={{marginBottom: 26}}>
        <div style={{fontSize: 24, opacity: .6}}>{a.label}: {a.display.family} / {a.italic.family} / {a.body.family}</div>
        <div style={{fontFamily: a.display.family, fontWeight: a.display.weight, fontSize: typeScale.title, lineHeight: a.display.leading, letterSpacing: a.display.tracking * (typeScale.title / 100)}}>Съешь ещё этих мягких</div>
        <div style={{fontFamily: a.italic.family, fontStyle: 'italic', fontSize: typeScale.lead}}>французских булок, ЁЩЭЖ № 187 — «да»</div>
        <div style={{fontFamily: a.body.family, fontWeight: a.body.weight, fontSize: typeScale.body}}>Да выпей же чаю: 1 234 567 ₽ и 85 %</div>
      </div>;
    })}
  </Shell>
);

const ENTRANCES: EnterName[] = ['rise', 'mask', 'pop', 'slideL', 'slideR', 'drop', 'blur', 'fade', 'track', 'unfold'];
export const MotionBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const loop = frame % Math.round(durationInFrames / 2);
  const names = Object.keys(springs) as SpringName[];
  return (
    <Shell title={`Движение: ${fps} fps, те же секунды`}>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 28px', marginBottom: 40}}>
        {ENTRANCES.map((name, i) => {
          const p = spring({frame: loop - i * 2, fps, config: springs.soft});
          return <div key={name} style={{height: 110, overflow: 'hidden', borderBottom: '1px solid #333'}}>
            <div style={{fontSize: 22, opacity: .5}}>{name}</div>
            <div style={{fontFamily: 'Geologica', fontWeight: 700, fontSize: 56, ...entrance(name, p)}}>Сцена</div>
          </div>;
        })}
      </div>
      {names.map((name) => {
        const p = spring({frame: loop, fps, config: springs[name]});
        return <div key={name} style={{display: 'flex', alignItems: 'center', height: 74, gap: 18}}>
          <div style={{width: 130, fontSize: 26}}>{name}</div>
          <div style={{flex: 1, position: 'relative', height: 2, background: '#333'}}><div style={{position: 'absolute', left: `${p * 82}%`, top: -22, width: 46, height: 46, borderRadius: 23, background: '#EAA63F'}}/></div>
        </div>;
      })}
      <div style={{fontSize: 24, opacity: .6, marginTop: 20}}>Профили: {Object.keys(profiles).join(', ')}</div>
    </Shell>
  );
};

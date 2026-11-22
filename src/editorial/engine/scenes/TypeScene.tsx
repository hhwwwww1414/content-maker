import React from 'react';
import {Img} from 'remotion';
import type {z} from 'zod';
import {Backdrop, Depth} from '../Frame';
import {movingAttr, planeGrowth, roleOf, useRegion as useBaseRegion, useShot} from '../context';
import {assetUrl} from '../library';
import {clamp01, lerp} from '../motion/core';
import {alpha, mix} from '../tokens';
import {Headline, SetText, useSetting} from '../type/Headline';
import {Label} from '../type/Label';
import type {TypeShot} from '../spec/schema';

type Spec = z.output<typeof TypeShot>;

const TEXT_PLANE = -0.45;
/** Text fills the width of the frame, so it is fitted to the width it reaches at the peak of the camera move. */
const useRegion = () => {
  const {direction} = useShot();
  const region = useBaseRegion();
  const width = Math.floor(region.width / planeGrowth(direction.camera, TEXT_PLANE));
  return {...region, width, left: region.left + (region.width - width) / 2, right: region.left + (region.width + width) / 2};
};

/** One large mass behind the type. It occupies the part of the frame the text leaves free. */
const Mass: React.FC<{spec: Spec}> = ({spec}) => {
  const {palette, spring, t} = useShot();
  if (spec.shape === 'none') return null;
  const p = spring(spec.shapeCue, 'heavy');
  const low = spec.anchor === 'top';
  if (spec.shape === 'disc') {
    // Nothing before its word: a seed of the disc would float on the stage as a stray dot.
    if (p <= 0) return null;
    const size = 1180 * clamp01(p) + 40;
    const cy = low ? 1420 : 330;
    return <div style={{position: 'absolute', left: 760 - size / 2 + Math.sin(t * 0.4) * 10, top: cy - size / 2, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 34% 28%, ${mix(palette.accent, '#ffffff', 0.22)} 0%, ${palette.accent} 42%, ${mix(palette.accent, '#000000', 0.34)} 100%)`, boxShadow: `0 60px 140px ${alpha(palette.accent, 0.3)}`}}/>;
  }
  if (spec.shape === 'band') {
    const h = 620 * clamp01(p);
    const top = low ? 1160 : spec.anchor === 'bottom' ? 180 : 700;
    return <div style={{position: 'absolute', left: -200, right: -200, top: top - h / 2 + 200, height: h, background: palette.accent, transform: 'rotate(-9deg)'}}/>;
  }
  const w = 640 * clamp01(p);
  return <div style={{position: 'absolute', right: -40, top: 0, bottom: 0, width: w, background: palette.bg2}}/>;
};

const Ghost: React.FC<{text: string}> = ({text}) => {
  const {art, palette, tween} = useShot();
  const size = 1040 / Math.max(1.6, text.length * 0.54);
  return <div style={{position: 'absolute', left: -30, right: -30, top: 720 - size / 2, textAlign: 'center', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: Math.min(1100, size * 1.7), lineHeight: 1, whiteSpace: 'nowrap', color: mix(palette.bg, palette.ink, 0.075), opacity: tween(0, 0.6)}}>{text}</div>;
};

const Window: React.FC<{spec: Spec}> = ({spec}) => {
  const {assets, tween, t, durationFrames, fps, frame} = useShot();
  const region = useRegion();
  const set = useSetting(spec.headline, {width: region.width, height: region.height - 40, layout: 'poster', maxSize: 620, minSize: 90});
  const entry = spec.fill ? assets[spec.fill] : null;
  const p = tween(spec.headline.cue, 0.4, 'out', -0.1);
  const progress = clamp01(frame / durationFrames);
  void t; void fps;
  const free = region.height - set.setting.height;
  const top = region.top + (spec.anchor === 'top' ? 0 : spec.anchor === 'bottom' ? free : free / 2);
  const role = set.role;
  return (
    <>
    {/* A CSS background is invisible to the renderer's wait: without this, frames can capture half-painted letters. */}
    {entry && <Img src={assetUrl(entry)} style={{position: 'absolute', width: 1, height: 1, opacity: 0}}/>}
    <div data-qa="text" data-qa-window data-qa-size={Math.min(...set.setting.lines.map((l) => l.size))} data-qa-slack={Math.round(Math.max(...set.setting.lines.map((l) => l.size)) * 0.3)} {...movingAttr(p < 1)} style={{position: 'absolute', left: region.left, top, width: region.width, height: set.setting.height, fontFamily: role.family, fontWeight: role.weight, color: 'transparent', opacity: p, transform: `scale(${lerp(1.05, 1, p)})`, backgroundImage: entry ? `url(${assetUrl(entry)})` : undefined, backgroundSize: `${lerp(150, 175, progress)}% auto`, backgroundPosition: `${lerp(35, 65, progress)}% 50%`, WebkitBackgroundClip: 'text', backgroundClip: 'text'}}>
      {set.setting.lines.map((line, i) => <div key={i} style={{fontSize: line.size, lineHeight: `${line.size * set.setting.leading}px`, whiteSpace: 'nowrap', letterSpacing: role.tracking * (line.size / 100)}}>{line.words.map((w) => w.text).join(' ')}</div>)}
    </div>
    </>
  );
};

export const TypeScene: React.FC<{spec: Spec}> = ({spec}) => {
  const {art, spring, palette} = useShot();
  const region = useRegion();
  const kickerRoom = spec.kicker ? 86 : 0;
  const subRoom = spec.sub ? 240 : 0;
  const box = {left: region.left, width: region.width, top: region.top + kickerRoom, height: region.height - kickerRoom - subRoom};
  const poster = spec.layout === 'poster';
  const set = useSetting(spec.headline, {width: box.width, height: box.height, layout: poster ? 'poster' : 'stack', maxSize: poster ? 440 : spec.layout === 'spoken' ? 178 : 196, minSize: 54});
  const free = box.height - set.setting.height;
  const top = box.top + (spec.anchor === 'top' ? 0 : spec.anchor === 'bottom' ? free : free / 2);
  const kicker = spring(undefined, undefined, 0.05);
  const subRole = spec.sub ? roleOf(art, spec.sub.role) : null;
  void subRole;
  return (
    <>
      <Backdrop/>
      <Depth z={-0.25}><Mass spec={spec}/></Depth>
      {spec.ghost && <Depth z={-0.35}><Ghost text={spec.ghost}/></Depth>}
      <Depth z={TEXT_PLANE}>
        {spec.layout === 'window' ? <Window spec={spec}/> : <SetText spec={spec.headline} set={set} left={box.left} top={top} width={box.width}/>}
        {spec.kicker && <Label moving={kicker < 0.98} color={palette.accent} size={36} style={{position: 'absolute', left: box.left, width: box.width, top: top - 74, opacity: Math.min(1, kicker)}}>{spec.kicker}</Label>}
        {spec.sub && <Headline spec={{...spec.sub, role: spec.sub.role === 'display' ? 'body' : spec.sub.role, tone: spec.sub.tone === 'ink' ? 'muted' : spec.sub.tone}} box={{left: box.left, width: box.width - 40, top: top + set.setting.height + 30, height: Math.max(120, subRoom - 40)}} maxSize={spec.sub.maxSize ?? 54} minSize={34}/>}
      </Depth>
    </>
  );
};

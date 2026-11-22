import React from 'react';
import {Img} from 'remotion';
import type {z} from 'zod';
import {Field} from '../fx/Field';
import {movingAttr, PaletteScope, useRegion, useShot} from '../context';
import {assetUrl} from '../library';
import {clamp01, lerp, sec} from '../motion/core';
import {SetText, useSetting} from '../type/Headline';
import {Label} from '../type/Label';
import {measureWith} from '../type/measure';
import type {SplitShot} from '../spec/schema';
import type {Palette} from '../themes';

type Spec = z.output<typeof SplitShot>;
type PaneSpec = Spec['a'];

const PaneBody: React.FC<{pane: PaneSpec; palette: Palette; box: {left: number; top: number; width: number; height: number}; visible: number; moving: boolean}> = ({pane, palette, box, visible, moving}) => {
  const {art, frame, durationFrames} = useShot();
  // A slow settle keeps a held decision alive; it ends at full size, so nothing crosses the safe area.
  const settle = 0.965 + 0.035 * clamp01(frame / Math.max(1, durationFrames));
  const size = pane.value ? Math.min(420, Math.floor((100 * box.width) / measureWith({...art.display, tracking: 0})(pane.value, 100))) : 0;
  const kicker = pane.kicker ? 70 : 0, note = pane.note ? 120 : 0;
  const valueRoom = size * 1.2;
  const wordRoom = pane.word ? Math.min(560, box.height - kicker - note - valueRoom) : 0;
  const word = useSetting({text: pane.word ?? ' ', reveal: 'none', role: 'display', tone: 'ink', align: 'left'}, {width: box.width, height: Math.max(120, wordRoom), maxSize: 230, minSize: 54});
  const wordHeight = pane.word ? word.setting.height : 0;
  const stack = kicker + valueRoom + wordHeight + note;
  let y = box.top + Math.max(0, (box.height - stack) / 2);
  const kickerY = y; y += kicker;
  const valueY = y; y += valueRoom;
  const wordY = y; y += wordHeight;
  const noteY = y + 10;
  return (
    <PaletteScope palette={palette}>
      <div {...movingAttr(moving)} style={{position: 'absolute', inset: 0, opacity: clamp01((visible - 0.16) / 0.14), transform: `scale(${settle})`, transformOrigin: `${box.left}px ${box.top + box.height / 2}px`}}>
        {pane.kicker && <Label moving={moving} size={46} role="body" color={palette.muted} style={{position: 'absolute', left: box.left, top: kickerY, width: box.width}}>{pane.kicker}</Label>}
        {pane.value && <div data-qa="text" {...movingAttr(moving)} style={{position: 'absolute', left: box.left, top: valueY, width: box.width, height: size * 1.2, fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: size, lineHeight: 1.2, whiteSpace: 'nowrap', color: palette.accent}}>{pane.value}</div>}
        {pane.word && <SetText spec={{text: pane.word, reveal: 'none', role: 'display', tone: 'ink', align: 'left'}} set={word} left={box.left} top={wordY} width={box.width} color={palette.ink}/>}
        {pane.note && <Label moving={moving} size={44} role="body" color={palette.ink} style={{position: 'absolute', left: box.left, top: noteY, width: box.width}}>{pane.note}</Label>}
      </div>
    </PaletteScope>
  );
};

/**
 * Two worlds share one frame. The seam is the actor: it moves on spoken words, one side takes over the other,
 * and the text in each half keeps its place while the window onto it slides.
 */
export const SplitScene: React.FC<{spec: Spec}> = ({spec}) => {
  const {art, variant, frame, fps, start, profile, assets, camera, scene} = useShot();
  const region = useRegion();
  const pal = (v: PaneSpec['variant'], fallback: 'base' | 'inverse' | 'block') => art.palettes[v ?? fallback];
  const paletteA = pal(spec.a.variant, variant);
  const paletteB = pal(spec.b.variant, variant === 'base' ? 'inverse' : 'base');
  let seam = spec.start;
  let moving = false;
  for (const key of spec.keys) {
    const s = start(key.cue);
    const p = frame < s ? 0 : (() => { const d = (frame - s) / sec(0.9, fps); return 1 - (1 - clamp01(d)) ** 4; })();
    if (frame >= s && p < 0.999) moving = true;
    seam = lerp(seam, key.at, p);
  }
  void profile;
  const H = 1920, W = 1080;
  const vertical = spec.axis === 'vertical';
  const slant = spec.axis === 'diagonal' ? 180 : 0;
  const seamPx = (vertical ? W : H) * seam;
  const clipA = vertical ? `inset(0 ${W - seamPx}px 0 0)` : `polygon(0 0, ${W}px 0, ${W}px ${seamPx - slant}px, 0 ${seamPx + slant}px)`;
  const clipB = vertical ? `inset(0 0 0 ${seamPx}px)` : `polygon(0 ${seamPx + slant}px, ${W}px ${seamPx - slant}px, ${W}px ${H}px, 0 ${H}px)`;
  const fullHeight = region.height;
  // Each pane's text is laid out for the half of the frame it finally owns.
  const final = spec.keys[spec.keys.length - 1].at;
  const aShare = Math.max(final, 0.3), bShare = Math.max(1 - final, 0.3);
  const aBox = vertical
    ? {left: region.left, top: region.top, width: W * aShare - region.left - 30, height: fullHeight}
    : {left: region.left, top: region.top, width: region.width, height: Math.max(380, Math.min(H * aShare, region.bottom) - region.top - slant - 30)};
  const bLeft = W * (1 - bShare) + 30;
  const bTop = Math.max(H * (1 - bShare) + slant + 40, region.top);
  const bBox = vertical
    ? {left: bLeft, top: region.top, width: region.right - bLeft, height: fullHeight}
    : {left: region.left, top: bTop, width: region.width, height: Math.max(380, region.bottom - bTop)};
  const fieldOf = art.field;
  const image = (pane: PaneSpec) => pane.asset && assets[pane.asset] ? <Img src={assetUrl(assets[pane.asset])} style={{position: 'absolute', inset: -30, width: 'calc(100% + 60px)', height: 'calc(100% + 60px)', objectFit: 'cover', transform: `scale(${camera.scale})`}}/> : null;
  const visA = vertical ? seam : seam;
  const visB = 1 - seam;
  const lineStyle: React.CSSProperties = vertical
    ? {left: seamPx - 3, top: 0, width: 6, height: H}
    : {left: -60, width: W + 120, top: seamPx - 3, height: 6, transform: `rotate(${(Math.atan2(-2 * slant, W) * 180) / Math.PI}deg)`, transformOrigin: '50% 50%'};
  return (
    <>
      <div style={{position: 'absolute', inset: 0, clipPath: clipA}}>
        <Field kind={fieldOf} palette={paletteA} seed={`${scene.id}a`}/>
        {image(spec.a)}
        <PaneBody pane={spec.a} palette={paletteA} box={aBox} visible={visA} moving={moving}/>
      </div>
      <div style={{position: 'absolute', inset: 0, clipPath: clipB}}>
        <Field kind={fieldOf} palette={paletteB} seed={`${scene.id}b`}/>
        {image(spec.b)}
        <PaneBody pane={spec.b} palette={paletteB} box={bBox} visible={visB} moving={moving}/>
      </div>
      {seam > 0.01 && seam < 0.99 && <div style={{position: 'absolute', background: paletteA.accent, ...lineStyle}}/>}
    </>
  );
};

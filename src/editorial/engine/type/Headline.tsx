import React, {useMemo} from 'react';
import {interpolate} from 'remotion';
import {movingAttr, roleOf, toneColor, useShot} from '../context';
import {clamp01, entrance, sec, springFrom, tween, type EnterName} from '../motion/core';
import type {TextSpec} from '../spec/schema';
import type {EmphasisKind, FontRole} from '../themes';
import {measureWith, trackingOf} from './measure';
import {fitPoster, fitText, NBSP, type Setting, type SetWord} from './typeset';
import {normWord} from '../../kit/cue';

const MASK_PAD = 0.24;

export type SetOptions = {width: number; height: number; layout?: 'stack' | 'poster'; maxSize?: number; minSize?: number; leading?: number; maxLines?: number};

/** Fits text to a box with real font metrics. Text that cannot fit fails the render and names itself. */
export const useSetting = (spec: TextSpec, o: SetOptions): {setting: Setting; role: FontRole; italicRole: FontRole; accentItalic: boolean} => {
  const {art} = useShot();
  const role = roleOf(art, spec.role);
  const emphasis = spec.emphasis ?? art.emphasis;
  const accentItalic = emphasis === 'italic';
  const italicRole = accentItalic ? art.italic : role;
  const setting = useMemo(() => {
    const plain = measureWith(role);
    const accented = measureWith(italicRole, accentItalic);
    const measure = (text: string, size: number, accent: boolean) => (accent ? accented : plain)(text, size);
    const fit = o.layout === 'poster' ? fitPoster : fitText;
    const result = fit(spec.text, measure, {width: o.width, height: o.height, maxSize: o.maxSize ?? spec.maxSize ?? 200, minSize: o.minSize ?? 34, leading: o.leading ?? role.leading, maxLines: o.maxLines});
    if (!result) throw new Error(`Text does not fit: "${spec.text}" in ${o.width}x${Math.round(o.height)} (${o.layout ?? 'stack'}, min ${o.minSize ?? 34}px). Shorten it or give it more room.`);
    return result;
  }, [spec.text, spec.maxSize, role, italicRole, accentItalic, o.width, o.height, o.layout, o.maxSize, o.minSize, o.leading, o.maxLines]);
  return {setting, role, italicRole, accentItalic};
};

const Emphasized: React.FC<{word: SetWord; kind: EmphasisKind; p: number; size: number; color: string; role: FontRole; italicRole: FontRole; children: React.ReactNode}> = ({word, kind, p, size, color, children, role, italicRole}) => {
  const {palette} = useShot();
  const c = clamp01(p);
  const common: React.CSSProperties = {position: 'relative', display: 'inline-block'};
  if (kind === 'marker') {
    return <span style={common}>
      <span style={{position: 'absolute', left: -size * 0.07, right: -size * 0.07, top: size * 0.08, bottom: size * 0.0, background: palette.accent, transformOrigin: '0 50%', transform: `scaleX(${c})`, borderRadius: size * 0.06}}/>
      <span style={{position: 'relative', color: c > 0.45 ? palette.onAccent : color}}>{children}</span>
    </span>;
  }
  if (kind === 'underline') {
    return <span style={{...common, color}}>{children}
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{position: 'absolute', left: 0, width: '100%', bottom: -size * 0.1, height: size * 0.16, overflow: 'visible'}}>
        <path d="M1 7 C 22 2, 42 9, 62 5 S 90 3, 99 6" fill="none" stroke={palette.accent} strokeWidth={Math.max(2, size * 0.022)} vectorEffect="non-scaling-stroke" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - c}/>
      </svg></span>;
  }
  if (kind === 'strike') {
    return <span style={{...common, color: palette.muted}}>{children}
      <span style={{position: 'absolute', left: -size * 0.04, right: -size * 0.04, top: '54%', height: Math.max(5, size * 0.07), background: palette.danger, transformOrigin: '0 50%', transform: `scaleX(${c})`}}/></span>;
  }
  if (kind === 'box') {
    return <span style={{...common, color: palette.accent}}>
      <span style={{position: 'absolute', inset: `${size * 0.04}px ${-size * 0.1}px ${-size * 0.02}px`, border: `${Math.max(4, size * 0.035)}px solid ${palette.accent}`, borderRadius: size * 0.12, clipPath: `inset(0 ${(1 - c) * 100}% 0 0)`}}/>
      {children}</span>;
  }
  if (kind === 'italic') {
    return <span style={{...common, color: palette.accent, fontFamily: italicRole.family, fontWeight: italicRole.weight, fontStyle: 'italic'}}>{children}</span>;
  }
  void word; void role;
  return <span style={{...common, color: palette.accent}}>{children}</span>;
};

/** Renders a fitted setting with its reveal and emphasis. All frames derive from the scene clock. */
export const SetText: React.FC<{spec: TextSpec; set: ReturnType<typeof useSetting>; left: number; top: number; width: number; color?: string; qa?: boolean; shadow?: string}> = ({spec, set, left, top, width, color, qa = true, shadow}) => {
  const {frame, fps, palette, art, profile, start, words, scene} = useShot();
  const {setting, role, italicRole} = set;
  const kind = spec.emphasis ?? art.emphasis;
  const base = color ?? toneColor(palette, spec.tone);
  // Picture leads the voice by a blink: on a hard cut the type is already arriving on the first frame, never a bare ground.
  const begin = start(spec.cue) - (spec.reveal === 'spoken' ? 0 : Math.round(0.1 * fps));
  const spokenFrames = useMemo(() => {
    if (spec.reveal !== 'spoken') return [] as number[];
    let cursor = 0;
    return setting.lines.flatMap((line) => line.words).map((word) => {
      const target = normWord(word.text);
      const index = words.findIndex((w, i) => i >= cursor && target && w.norm.startsWith(target.slice(0, Math.max(3, target.length - 2))));
      if (index < 0) return null;
      cursor = index + 1;
      return Math.round((words[index].startMs / 1000 - scene.start) * fps) - Math.round(0.1 * fps);
    }).map((value, i, all) => value ?? (all.slice(0, i).reverse().find((v) => v !== null) ?? 0));
  }, [spec.reveal, setting, words, scene.start, fps]);

  const preset: EnterName = spec.reveal === 'lines' ? 'mask' : 'rise';
  let wordIndex = 0;
  let settled = begin;
  const exit = spec.exitCue !== undefined ? 1 - tween(frame, start(spec.exitCue), 0.25, fps, 'out') : 1;
  const punch = spec.reveal === 'punch' ? springFrom(frame, begin, fps, 'pop') : 1;
  const trackedPx = trackingOf(role, setting.size);

  const lines = setting.lines.map((line, li) => {
    const lineStart = begin + sec(li * profile.lineStagger, fps);
    const pLine = spec.reveal === 'lines' ? springFrom(frame, lineStart, fps, profile.enter) : 1;
    if (spec.reveal === 'lines') settled = Math.max(settled, lineStart + sec(1, fps));
    const lineHeight = line.size * setting.leading;
    const pad = line.size * MASK_PAD;
    const space = measureWith(role)(NBSP, line.size);
    const rendered = line.words.map((word, wi) => {
      const index = wordIndex++;
      let wordStyle: React.CSSProperties = {};
      if (spec.reveal === 'words' || spec.reveal === 'spoken') {
        const s = spec.reveal === 'spoken' ? spokenFrames[index] ?? begin : begin + sec(index * profile.stagger, fps);
        const p = springFrom(frame, s, fps, spec.reveal === 'spoken' ? 'snap' : profile.enter);
        settled = Math.max(settled, s + sec(0.8, fps));
        wordStyle = spec.reveal === 'spoken' ? {...entrance('rise', p, 26), visibility: frame < s ? 'hidden' : 'visible'} : entrance('rise', p, 44);
      }
      const chars = spec.reveal === 'chars' ? [...word.text].map((ch, ci) => {
        const s = begin + sec((index * 4 + ci) * profile.stagger * 0.4, fps);
        settled = Math.max(settled, s + sec(0.8, fps));
        const p = springFrom(frame, s, fps, profile.enter);
        return <span key={ci} style={{display: 'inline-block', whiteSpace: 'pre', ...entrance('rise', p, 40)}}>{ch}</span>;
      }) : word.text;
      const emphasisStart = spec.emphasisCue !== undefined ? start(spec.emphasisCue) : (spec.reveal === 'spoken' ? spokenFrames[index] ?? begin : begin) + sec(0.2, fps);
      const content = word.accent
        ? <Emphasized word={word} kind={kind} p={tween(frame, emphasisStart, 0.45, fps, 'out')} size={line.size} color={base} role={role} italicRole={italicRole}>{chars}</Emphasized>
        : chars;
      return <span key={wi} style={{display: 'inline-block', whiteSpace: 'pre', marginRight: wi < line.words.length - 1 ? space : 0, ...wordStyle}}>{content}</span>;
    });
    return (
      <div key={li} style={{height: lineHeight + pad * 2, marginTop: li === 0 ? -pad : -pad * 2, overflow: spec.reveal === 'lines' ? 'hidden' : 'visible', paddingTop: pad, paddingLeft: pad * 0.5, paddingRight: pad * 0.5, marginLeft: -pad * 0.5, marginRight: -pad * 0.5, textAlign: spec.align, fontSize: line.size, lineHeight: `${lineHeight}px`, letterSpacing: trackingOf(role, line.size), whiteSpace: 'nowrap', position: 'relative', zIndex: 1}}>
        <div style={spec.reveal === 'lines' ? {...entrance(preset, pLine), willChange: 'transform'} : undefined}>{rendered}</div>
      </div>
    );
  });
  void trackedPx;
  // Spoken type keeps its layout from the first word: hidden words already hold their place.
  const moving = (spec.reveal !== 'spoken' && frame < settled) || (spec.reveal === 'spoken' && frame < begin) || exit < 1 || (spec.reveal === 'punch' && frame < begin + sec(0.9, fps));
  const minLine = Math.min(...setting.lines.map((l) => l.size));
  return (
    <div {...(qa ? {'data-qa': 'text'} : {})} data-qa-size={minLine} data-qa-slack={Math.round(Math.max(...setting.lines.map((l) => l.size)) * 0.55)} {...movingAttr(moving)} style={{position: 'absolute', left, top, width, height: setting.height, fontFamily: role.family, fontWeight: role.weight, color: base, opacity: exit, textShadow: shadow, transform: spec.reveal === 'punch' ? `scale(${interpolate(punch, [0, 1], [1.28, 1])})` : undefined, transformOrigin: '50% 50%', ...(spec.reveal === 'punch' ? {visibility: frame < begin ? 'hidden' : 'visible'} : null)}}>
      {lines}
    </div>
  );
};

/** A text block anchored in a region. The default way to put a headline on screen. */
export const Headline: React.FC<{spec: TextSpec; box: {left: number; top: number; width: number; height: number}; layout?: 'stack' | 'poster'; anchor?: 'top' | 'center' | 'bottom'; maxSize?: number; minSize?: number; color?: string; shadow?: string}> = ({spec, box, layout, anchor = 'top', maxSize, minSize, color, shadow}) => {
  const set = useSetting(spec, {width: box.width, height: box.height, layout, maxSize, minSize});
  const free = box.height - set.setting.height;
  const top = box.top + (anchor === 'top' ? 0 : anchor === 'center' ? free / 2 : free);
  return <SetText spec={spec} set={set} left={box.left} top={top} width={box.width} color={color} shadow={shadow}/>;
};

export const textDefaults = (text: string, partial: Partial<TextSpec> = {}): TextSpec => ({text, reveal: 'lines', role: 'display', tone: 'ink', align: 'left', ...partial});

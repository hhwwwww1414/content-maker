import React from 'react';
import {Img, OffthreadVideo, interpolate} from 'remotion';
import {Backdrop, Depth} from '../../Frame';
import {movingAttr, useRegion, useShot} from '../../context';
import {assetUrl} from '../../library';
import {clamp01, ease, entrance, lerp, sec, springFrom, tween} from '../../motion/core';
import {alpha} from '../../tokens';
import {measureWith} from '../../type/measure';
import {PHONE, PhoneBody} from '../../ui/Phone';
import type {FontRole, Palette} from '../../themes';

// Keynote shots (docs/KEYNOTE_DIRECTION.md). Each is one hero under one light, with motion that lands without bounce.

type Cue = string | number;
const plain = (text: string) => text.replace(/\*/g, '');
const tracking = (role: FontRole, size: number) => role.tracking * (size / 100);

/** One word in the reel's gradient. `p` sweeps it from ink to gradient, left to right. */
const GradientWord: React.FC<{p: number; palette: Palette; children: React.ReactNode; size: number}> = ({p, palette, children, size}) => (
  <span style={{display: 'inline-block', backgroundImage: `linear-gradient(100deg, ${palette.accent} 0%, ${palette.accent2} 46%, ${palette.ink} 54%, ${palette.ink} 100%)`, backgroundSize: '200% 100%', backgroundPosition: `${(1 - clamp01(p)) * 100}% 0`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: size * 0.12, marginBottom: -size * 0.12}}>{children}</span>
);

/** A line of markup where *words* take the gradient. */
const Marked: React.FC<{text: string; p: number; palette: Palette; size: number}> = ({text, p, palette, size}) => (
  <>{text.split(/(\*[^*]+\*)/).filter(Boolean).map((part, i) => part.startsWith('*')
    ? <GradientWord key={i} p={p} palette={palette} size={size}>{part.slice(1, -1)}</GradientWord>
    : <React.Fragment key={i}>{part}</React.Fragment>)}</>
);

type Beat = {text: string; cue: Cue; size?: number; invert?: boolean; hero?: boolean; role?: 'display' | 'statement' | 'body'; asset?: string; under?: string};

/**
 * Fast type in the manner of a product film: one word or phrase fills the frame and hard-cuts to the next on its
 * spoken word (5–7 frames per word in "Don't Blink"). An `invert` beat flips to the light palette as a pattern break;
 * a `hero` beat settles on a spring and sweeps its *accent* into the gradient. "/" breaks a line.
 */
export const KeynoteBlink: React.FC<{beats: Beat[]}> = ({beats}) => {
  const {art, frame, fps, start, palette, assets} = useShot();
  const region = useRegion();
  // Type leads the voice by a blink, so a cut never shows a bare stage.
  const starts = beats.map((b) => start(b.cue) - Math.round(0.1 * fps));
  let index = 0;
  starts.forEach((s, k) => { if (frame >= s) index = k; });
  const beat = beats[index];
  const local = frame - starts[index];
  const p = beat.invert ? art.palettes.inverse : palette;
  const role = beat.role === 'body' ? art.body : beat.role === 'statement' ? art.statement : art.display;
  const lines = beat.text.split('/').map((s) => s.trim());
  const width = region.width - 40;
  const measure = measureWith(role);
  const max = beat.size ?? 320;
  const leading = role.leading;
  const fitW = Math.min(...lines.map((l) => (max * width) / Math.max(1, measure(plain(l), max))));
  const fitH = (region.height - 60) / (lines.length * leading);
  const size = Math.floor(Math.min(max, fitW, fitH));
  const settle = beat.hero ? springFrom(frame, starts[index], fps, 'smooth') : clamp01(local / sec(0.2, fps));
  const scale = beat.hero ? 1.1 - 0.1 * settle : 1.035 - 0.035 * settle;
  const sweep = tween(frame, starts[index] + sec(0.25, fps), 0.7, fps, 'inOut');
  const height = lines.length * size * leading;
  return (
    <>
      {beat.invert ? <div style={{position: 'absolute', inset: 0, background: p.bg}}/> : <Backdrop/>}
      <Depth z={-0.6}>
      {beat.asset ? (() => {
        // A wordmark beat: the logo settles under the light, with an optional line beneath it.
        const entry = assets[beat.asset!];
        if (!entry) throw new Error(`keynoteBlink: asset "${beat.asset}" is not in this project's assets`);
        const w = region.width - 120, h = (w * (entry.height ?? 1)) / (entry.width ?? 1);
        const under = beat.under ? tween(frame, starts[index] + sec(0.45, fps), 0.73, fps, 'quint') : 0;
        const cy = region.top + region.height / 2 - (beat.under ? 70 : 0);
        return <>
          <Img src={assetUrl(entry)} data-qa-focal {...movingAttr(settle < 0.99)} style={{position: 'absolute', left: 540 - w / 2, top: cy - h / 2, width: w, height: h, transform: `scale(${scale})`, ...entrance('focus', clamp01(settle), 120)}}/>
          {beat.under && <div data-qa="text" data-qa-size={72} {...movingAttr(under < 1)} style={{position: 'absolute', left: region.left, width: region.width, top: cy + h / 2 + 64, textAlign: 'center', fontFamily: art.statement.family, fontWeight: art.statement.weight, fontSize: 72, lineHeight: 1.15, letterSpacing: tracking(art.statement, 72), color: p.ink, ...entrance('focus', under, 72)}}><Marked text={beat.under} p={tween(frame, starts[index] + sec(1.0, fps), 0.8, fps, 'inOut')} palette={p} size={72}/></div>}
        </>;
      })() : <div data-qa="text" data-qa-size={size} data-qa-slack={Math.round(size * 0.4)} {...movingAttr(settle < 0.99)} style={{position: 'absolute', left: region.left + 20, width, top: region.top + (region.height - height) / 2, height, textAlign: 'center', fontFamily: role.family, fontWeight: role.weight, fontSize: size, lineHeight: `${size * leading}px`, letterSpacing: tracking(role, size), color: p.ink, transform: `scale(${scale})`, whiteSpace: 'nowrap'}}>
        {lines.map((line, i) => <div key={i}><Marked text={line} p={sweep} palette={p} size={size}/></div>)}
      </div>}
      </Depth>
    </>
  );
};

/** Words that come out of focus one by one (shotcraft typography/blur-slide). */
const FocusWords: React.FC<{text: string; begin: number; size: number; stagger?: number}> = ({text, begin, size, stagger = 0.133}) => {
  const {frame, fps} = useShot();
  return <>{text.split(/\s+/).map((w, i) => {
    const p = tween(frame, begin + sec(i * stagger, fps), 0.73, fps, 'quint');
    return <span key={i} style={{display: 'inline-block', marginRight: '0.26em', ...entrance('focus', p, size)}}>{w}</span>;
  })}</>;
};

const formatNumber = (n: number, decimals: number) => n.toLocaleString('ru-RU', {minimumFractionDigits: decimals, maximumFractionDigits: decimals}).replace(/\s/g, ' ');

/**
 * A figure on a glass card under coloured light. The number rolls in on `cue` and lands on `landCue`
 * without overshoot; the label comes out of focus after it.
 */
export const KeynoteStat: React.FC<{kicker?: string; value: number; from?: number; decimals?: number; prefix?: string; unit?: string; label?: string; cue?: Cue; landCue?: Cue; note?: string; noteCue?: Cue}> = ({kicker, value, from = 0, decimals = 0, prefix = '', unit, label, cue, landCue, note, noteCue}) => {
  const {art, palette, frame, fps, start, t} = useShot();
  const region = useRegion();
  const s0 = start(cue);
  const land = landCue !== undefined ? Math.max(s0 + sec(0.6, fps), start(landCue)) : s0 + sec(1.2, fps);
  const roll = interpolate(frame, [s0, land], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease.quint});
  const card = springFrom(frame, s0 - sec(0.15, fps), fps, 'hero');
  const shown = formatNumber(lerp(from, value, roll), decimals);
  const finalText = prefix + formatNumber(value, decimals);
  const role = art.display;
  const inner = region.width - 40 - 2 * 64;
  const unitRatio = 0.5;
  const unitGap = 0.18;
  const max = 400;
  const natural = measureWith(role)(finalText, max) + (unit ? (measureWith(art.statement)(unit, max * unitRatio) + max * unitGap) : 0);
  const size = Math.floor(Math.min(max, (max * inner * 0.93) / natural));
  const labelBegin = land - sec(0.2, fps);
  const wordsDone = (text?: string, begin = 0) => (text ? begin + sec((text.split(/\s+/).length - 1) * 0.133 + 0.73, fps) : 0);
  const noteBegin = noteCue !== undefined ? start(noteCue) : labelBegin + sec(0.6, fps);
  const cardH = 72 + 76 + (kicker ? 62 : 0) + size + (label ? 104 : 0) + (note ? 70 : 0);
  const cardTop = region.top + Math.max(0, (region.height - cardH) / 2 - 20);
  return (
    <>
      <Backdrop/>
      <Depth z={-0.6}>
      <div style={{position: 'absolute', width: 620, height: 520, left: 420 + Math.sin(t * 0.5) * 30, top: cardTop - 120 + Math.cos(t * 0.4) * 24, borderRadius: '50%', background: palette.accent, filter: 'blur(140px)', opacity: 0.4 * clamp01(card)}}/>
      <div style={{position: 'absolute', width: 560, height: 480, left: 40 + Math.cos(t * 0.45) * 30, top: cardTop + 300 + Math.sin(t * 0.35) * 24, borderRadius: '50%', background: palette.accent2, filter: 'blur(140px)', opacity: 0.32 * clamp01(card)}}/>
      <div data-qa-focal {...movingAttr(card < 0.99 || roll < 1)} style={{position: 'absolute', left: region.left + 20, width: region.width - 40, top: cardTop, padding: '72px 64px 76px', borderRadius: art.radius + 16, background: `linear-gradient(${alpha('#FFFFFF', 0.08)}, ${alpha('#FFFFFF', 0.04)}), ${alpha(palette.bg, 0.5)}`, backdropFilter: 'blur(40px) saturate(140%)', boxShadow: `inset 0 2px 0 ${alpha('#FFFFFF', 0.22)}, inset 0 0 0 2px ${alpha('#FFFFFF', 0.08)}, 0 40px 120px rgba(0,0,0,.35)`, opacity: clamp01(card * 1.4), transform: `translateY(${(1 - card) * 90}px) scale(${0.95 + 0.05 * card})`}}>
        {kicker && <div data-qa="text" style={{fontFamily: art.label2.family, fontWeight: art.label2.weight, fontSize: 34, letterSpacing: '0.12em', textTransform: 'uppercase', color: palette.muted}}>{kicker}</div>}
        <div data-qa="text" data-qa-size={size} style={{marginTop: kicker ? 28 : 0, fontFamily: role.family, fontWeight: role.weight, fontSize: size, lineHeight: 1, letterSpacing: tracking(role, size), color: palette.ink, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>
          {prefix}{shown}{unit && <span style={{fontFamily: art.statement.family, fontWeight: art.statement.weight, fontSize: size * unitRatio, marginLeft: size * unitGap, letterSpacing: tracking(art.statement, size * unitRatio), color: roll >= 1 ? 'transparent' : palette.muted}}>{roll >= 1 ? <GradientWord p={tween(frame, land, 0.7, fps, 'inOut')} palette={{...palette, ink: palette.muted}} size={size * unitRatio}>{unit}</GradientWord> : unit}</span>}
        </div>
        {label && <div data-qa="text" data-qa-size={56} {...movingAttr(frame < wordsDone(label, labelBegin))} style={{marginTop: 36, fontFamily: art.statement.family, fontWeight: art.statement.weight, fontSize: 56, lineHeight: 1.12, letterSpacing: tracking(art.statement, 56), color: palette.ink}}><FocusWords text={label} begin={labelBegin} size={56}/></div>}
        {note && <div data-qa="text" data-qa-size={40} {...movingAttr(frame < wordsDone(note, noteBegin))} style={{marginTop: 22, fontFamily: art.body.family, fontWeight: art.body.weight, fontSize: 40, lineHeight: 1.3, color: palette.muted}}><FocusWords text={note} begin={noteBegin} size={40}/></div>}
      </div>
      </Depth>
    </>
  );
};

type Chip = {label: string; value: string; cue: Cue; side?: 'left' | 'right'; y: number; strike?: boolean; hero?: boolean};

/**
 * A real screen in a phone, lit like a product shot (shotcraft opening/spotlight-hero-card, adapted to 9:16):
 * the phone rises on a no-bounce spring, a rim light runs round it once, the camera can push into one part
 * of the screen, and glass chips carry the numbers the voice says.
 */
export const KeynotePhone: React.FC<{asset: string; enterCue?: Cue; focus?: {cue: Cue; at: [number, number]; scale: number; y?: number}; chips?: Chip[]; scale?: number; top?: number}> = ({asset, enterCue, focus, chips = [], scale = 0.7, top = 270}) => {
  const {art, palette, frame, fps, start, assets, durationFrames} = useShot();
  const entry = assets[asset];
  if (!entry) throw new Error(`keynotePhone: asset "${asset}" is not in this project's assets`);
  const s0 = start(enterCue) - sec(0.25, fps);
  const rise = springFrom(frame, s0, fps, 'hero');
  const w = PHONE.width * scale, h = PHONE.height * scale;
  const left = 540 - w / 2;
  const rim = tween(frame, s0 + sec(0.9, fps), 1.3, fps, 'inOut');
  const zoom = focus ? springFrom(frame, start(focus.cue), fps, 'glide') : 0;
  const at = focus?.at ?? [0.5, 0.5];
  const fx = left + (PHONE.bezel + at[0] * (PHONE.width - 2 * PHONE.bezel)) * scale;
  const fy = top + (PHONE.bezel + at[1] * (PHONE.height - 2 * PHONE.bezel)) * scale;
  const k = focus ? lerp(1, focus.scale, zoom) : 1;
  const creep = 1 + 0.03 * ease.camera(clamp01(frame / durationFrames));
  const target = {x: 540, y: focus?.y ?? 720};
  const media = entry.kind === 'video'
    ? <OffthreadVideo src={assetUrl(entry)} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%'}}/>
    : <Img src={assetUrl(entry)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%'}}/>;
  return (
    <>
      <Backdrop light={[0.5, -0.25]}/>
      <div style={{position: 'absolute', inset: 0, transformOrigin: `${fx}px ${fy}px`, transform: `translate(${lerp(0, target.x - fx, zoom)}px, ${lerp(0, target.y - fy, zoom)}px) scale(${k * creep})`}}>
        <div style={{position: 'absolute', left: left + w * 0.1, width: w * 0.8, top: top + h - 10, height: 60, borderRadius: '50%', background: `radial-gradient(closest-side, ${alpha('#000000', 0.7)}, transparent)`, opacity: clamp01(rise), transform: `scaleX(${0.6 + 0.4 * clamp01(rise)})`}}/>
        <div {...movingAttr(rise < 0.99 || (zoom > 0 && zoom < 0.99))} style={{position: 'absolute', left, top, width: w, height: h, opacity: clamp01(rise * 2), transform: `translateY(${(1 - rise) * 520}px)`}}>
          <div style={{transform: `scale(${scale})`, transformOrigin: '0 0'}}>
            <PhoneBody glare={0.35}>{media}</PhoneBody>
          </div>
          <svg viewBox={`0 0 ${PHONE.width} ${PHONE.height}`} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', opacity: Math.sin(Math.PI * rim)}}>
            <rect x={2} y={2} width={PHONE.width - 4} height={PHONE.height - 4} rx={PHONE.radius} fill="none" stroke="#FFE2BD" strokeWidth={5} pathLength={100} strokeDasharray="14 86" strokeDashoffset={-100 * rim} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 10px rgba(255,214,160,.9))'}}/>
          </svg>
        </div>
      </div>
      {chips.map((chip, i) => {
        const p = springFrom(frame, start(chip.cue) - sec(0.1, fps), fps, 'crisp');
        const right = chip.side === 'right';
        const sweep = tween(frame, start(chip.cue) + sec(0.3, fps), 0.7, fps, 'inOut');
        return (
          <div key={i} data-qa="text" data-qa-size={30} {...movingAttr(p < 0.99)} style={{position: 'absolute', top: chip.y, ...(right ? {right: 1080 - 940 + 10} : {left: 90}), padding: '22px 34px 26px', borderRadius: 30, background: alpha(palette.surface, 0.88), backdropFilter: 'blur(28px) saturate(160%)', boxShadow: `inset 0 1.5px 0 ${alpha('#FFFFFF', 0.18)}, 0 24px 60px rgba(0,0,0,.45)`, ...entrance('focus', clamp01(p), 60), transform: `translateY(${(1 - clamp01(p)) * 30}px) scale(${0.96 + 0.04 * clamp01(p)})`}}>
            <div style={{fontFamily: art.label2.family, fontWeight: art.label2.weight, fontSize: 30, color: palette.muted, letterSpacing: '0.02em'}}>{chip.label}</div>
            <div style={{marginTop: 6, fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 60, lineHeight: 1.05, letterSpacing: tracking(art.display, 60), color: chip.strike ? palette.muted : palette.ink, textDecoration: chip.strike ? 'line-through' : undefined, textDecorationThickness: 5, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>
              {chip.hero ? <GradientWord p={sweep} palette={palette} size={60}>{chip.value}</GradientWord> : chip.value}
            </div>
          </div>
        );
      })}
    </>
  );
};

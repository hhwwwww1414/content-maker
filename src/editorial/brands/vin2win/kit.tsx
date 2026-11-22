// vin2win brand kit, ported from vin2win/output/viral-compare/src/lib (the 21–22.11.2026 promos the owner approved).
// The look is the app's own design system: near-black stage, green key light, Manrope, the yellow "Выгода" badge,
// a phone with real production screens. Marketplaces are shown as a neutral grey scheme with a plain-text name:
// no logos and no copy of their interface.
// Differences from the original: Manrope comes from the engine's vendored fonts, files come from public/private/vin2win
// (git-ignored: production screens and Mixkit audio), and text carries data-qa attributes for the layout gates.
import React from 'react';
import {Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {EASE, Grain, Vignette, mix, ramp} from './Polish';
import {toUnits} from './typeset';

export {EASE, mix, ramp};

export const C = {
  bg: '#0a0a0a', ink: '#f4f7f7', surface: '#181c1f', card: '#0f1214', muted: '#a6b4b4', line: '#ffffff1c',
  green: '#15803d', greenText: '#22c55e', soft: '#16a34a29', benefit: '#ffd800', onBenefit: '#1f1600',
};
export const FONT = 'Manrope, -apple-system, "Helvetica Neue", sans-serif';
const SYS = '-apple-system, "Helvetica Neue", Manrope, sans-serif';
const PRIVATE = 'private/vin2win';
export const realFile = (src: string) => staticFile(`${PRIVATE}/real/${src}`);
export const LOGO = () => staticFile(`${PRIVATE}/logo-white.svg`);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** The app's dark theme as a stage: green key light from above that breathes, vignette and grain. */
export const Stage: React.FC<{light?: {x: number; y: number}; strength?: number; children?: React.ReactNode}> = ({light = {x: 0.5, y: 0.1}, strength = 1, children}) => {
  const f = useCurrentFrame();
  const breathe = 1 + 0.06 * Math.sin(f / 40);
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #0d100f 0%, #090a0a 55%, #060707 100%)'}}>
      <div style={{position: 'absolute', inset: 0, background:
        `radial-gradient(ellipse 75% 45% at ${light.x * 100}% ${light.y * 100}%, rgba(21,128,61,${(0.34 * strength * breathe).toFixed(3)}) 0%, rgba(21,128,61,0) 72%),` +
        `radial-gradient(ellipse 60% 35% at 50% 100%, rgba(34,197,94,${(0.08 * strength).toFixed(3)}) 0%, rgba(34,197,94,0) 70%)`}}/>
      {children}
      <Vignette strength={0.55} color="#000000" inner={0.42}/>
      <Grain opacity={0.08} blend="soft-light"/>
    </div>
  );
};

// ── type: «*word*» green, «_word_» yellow (benefit), «~word~» grey (marketplaces) ──
const markColor = (m: string, base: string) => (m === 'g' ? C.greenText : m === 'y' ? C.benefit : m === 's' ? '#8a9393' : base);
/** Headline in the safe width (80–940). Words pop in with a small overshoot and leave upwards. */
export const Headline: React.FC<{text: string; at: number; out?: number; y?: number; size?: number; color?: string; stagger?: number}> = ({text, at, out, y = 230, size = 78, color = C.ink, stagger = 2}) => {
  const f = useCurrentFrame();
  if (f < at - 1 || (out !== undefined && f > out + 5)) return null;
  const units = toUnits(text);
  const leave = out === undefined ? 0 : ramp(f, out, 5, EASE.out);
  const settled = f >= at + units.length * stagger + 12 && leave === 0;
  return (
    <div data-qa="text" data-qa-size={size} data-qa-slack={Math.round(size * 0.4)} {...(settled ? {} : {'data-qa-moving': ''})} style={{position: 'absolute', left: 100, top: y, width: 820, textAlign: 'center', font: `800 ${size}px/1.1 ${FONT}`, letterSpacing: '-0.03em', color, opacity: 1 - leave, transform: `translateY(${(-40 * leave).toFixed(1)}px)`, textShadow: '0 6px 30px rgba(0,0,0,0.55)', textWrap: 'balance'} as React.CSSProperties}>
      {units.map((u, i) => {
        const k = ramp(f, at + i * stagger, 12, EASE.overshoot);
        return (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span style={{display: 'inline-block', whiteSpace: 'nowrap', opacity: Math.min(1, k * 1.6), transform: `translateY(${mix(34, 0, k).toFixed(1)}px) scale(${mix(0.9, 1, Math.min(1, k)).toFixed(3)})`}}>
              {u.map((t, j) => <span key={j} style={{color: markColor(t.mark, color)}}>{j > 0 && !/^[?!.,:;»)]+$/.test(t.w) ? ' ' : ''}{t.w}</span>)}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── phone: a camera puts screen point (sx, sy) at frame point (fx, fy) with scale k ──
export const SW = 390, SH = 844, STATUS = 47, BEZEL = 13;
export type Cam = {sx: number; sy: number; k: number; fx: number; fy: number};
export type CamKey = Cam & {at: number};
export const camAt = (frame: number, keys: CamKey[], ease = EASE.smooth): Cam => {
  if (frame <= keys[0].at) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame <= b.at) {
      const t = ease((frame - a.at) / Math.max(1, b.at - a.at));
      return {sx: mix(a.sx, b.sx, t), sy: mix(a.sy, b.sy, t), k: Math.exp(mix(Math.log(a.k), Math.log(b.k), t)), fx: mix(a.fx, b.fx, t), fy: mix(a.fy, b.fy, t)};
    }
  }
  return keys[keys.length - 1];
};
export const REST: Cam = {sx: SW / 2, sy: SH / 2, k: 1.55, fx: 540, fy: 1180};
export const PT = 390 / 402;
export const pt = (v: number) => v * PT;
export type PBox = {x: number; y: number; w: number; h: number};
export const ptCam = (x: number, y: number, k: number, fx = 540, fy = 1100): Cam => ({sx: pt(x), sy: pt(y), k, fx, fy});

/** A neutral device body around the screen; one soft glare clipped by the screen radius. */
export const DeviceFrame: React.FC<{children: React.ReactNode; glare?: number}> = ({children, glare = 0}) => (
  <div style={{position: 'relative', width: SW + BEZEL * 2, height: SH + BEZEL * 2, borderRadius: 55 + BEZEL, background: 'linear-gradient(145deg, #3a3f42 0%, #1b1e20 22%, #0b0c0d 50%, #1d2023 78%, #44494c 100%)', boxShadow: 'inset 0 0 0 1.2px rgba(255,255,255,0.18), inset 0 0 0 3px #050606, 0 60px 120px -30px rgba(0,0,0,0.9), 0 30px 60px -20px rgba(0,0,0,0.7), 0 0 90px -10px rgba(21,128,61,0.35)'}}>
    {[[-3, 170, 62], [-3, 248, 62], [-3, 118, 32]].map(([x, y, h], i) => <div key={i} style={{position: 'absolute', left: x, top: y, width: 4, height: h, borderRadius: 2, background: 'linear-gradient(90deg,#55595c,#2a2d30)'}}/>)}
    <div style={{position: 'absolute', right: -3, top: 210, width: 4, height: 96, borderRadius: 2, background: 'linear-gradient(90deg,#2a2d30,#55595c)'}}/>
    <div style={{position: 'absolute', left: BEZEL, top: BEZEL, width: SW, height: SH, borderRadius: 55, overflow: 'hidden', background: C.bg}}>
      {children}
      <div style={{position: 'absolute', left: SW / 2 - 63, top: 11, width: 126, height: 37, borderRadius: 19, background: '#000', zIndex: 40}}/>
      {glare > 0 && <div style={{position: 'absolute', inset: 0, zIndex: 41, pointerEvents: 'none', background: `linear-gradient(115deg, rgba(255,255,255,0) ${(-30 + glare * 130).toFixed(1)}%, rgba(255,255,255,0.10) ${(-15 + glare * 130).toFixed(1)}%, rgba(255,255,255,0) ${(glare * 130).toFixed(1)}%)`}}/>}
    </div>
  </div>
);

const RIM = 13;
/** The phone in 3D: rotations around the camera's anchor, zoom (not scale) so screen text stays sharp. */
export const Phone: React.FC<{cam: Cam; ry?: number; rx?: number; rz?: number; opacity?: number; glare?: number; children: React.ReactNode}> = ({cam, ry = 0, rx = 0, rz = 0, opacity = 1, glare = 0, children}) => (
  <div style={{position: 'absolute', inset: 0, perspective: 2600, perspectiveOrigin: `${cam.fx}px ${cam.fy}px`, opacity}}>
    <div data-qa-focal style={{position: 'absolute', left: cam.fx - (cam.sx + RIM) * cam.k, top: cam.fy - (cam.sy + RIM) * cam.k, width: (SW + RIM * 2) * cam.k, height: (SH + RIM * 2) * cam.k, transformOrigin: `${(cam.sx + RIM) * cam.k}px ${(cam.sy + RIM) * cam.k}px`, transform: `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`, filter: 'drop-shadow(0 60px 80px rgba(0,0,0,0.75))'}}>
      <div style={{zoom: cam.k}}><DeviceFrame glare={glare}>{children}</DeviceFrame></div>
    </div>
  </div>
);

/** A real production screen (iPhone 402×874 pt) or screen recording. Children use the same point coordinates. */
export const Real: React.FC<{src: string; video?: boolean; trim?: number; rate?: number; children?: React.ReactNode; dim?: number}> = ({src, video, trim = 0, rate = 1, children, dim = 0}) => (
  <div style={{position: 'absolute', inset: 0, background: '#000', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 402, height: 874, transform: `scale(${PT})`, transformOrigin: '0 0'}}>
      {video
        ? <OffthreadVideo src={realFile(src)} trimBefore={trim} playbackRate={rate} muted style={{position: 'absolute', inset: 0, width: 402, height: 874}}/>
        : <Img src={realFile(src)} style={{position: 'absolute', inset: 0, width: 402, height: 874}}/>}
      {children}
    </div>
    {dim > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})`}}/>}
  </div>
);

/** Highlight on a real screen: the rest dims, the box gets a green ring and glow. */
export const RSpot: React.FC<{box: PBox; t: number; color?: string; r?: number; dim?: number}> = ({box, t, color = C.greenText, r = 14, dim = 0.55}) => {
  if (t <= 0) return null;
  const pad = 5;
  return <div style={{position: 'absolute', left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2, borderRadius: r, boxShadow: `0 0 0 3000px rgba(0,0,0,${(dim * t).toFixed(3)}), 0 0 0 ${(2.5 * t).toFixed(2)}px ${color}, 0 0 ${(26 * t).toFixed(1)}px ${color}`, pointerEvents: 'none'}}/>;
};

/** Covers part of a real screen (a count that changes, an author's name). */
export const RCover: React.FC<{box: PBox; label?: string; bg?: string}> = ({box, label = '', bg = '#2b3134'}) => (
  <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 8, background: bg, display: 'grid', placeItems: 'center', font: `800 16px ${FONT}`, color: '#a6b4b4', letterSpacing: '0.2em'}}>{label}</div>
);

/** The yellow benefit badge, slapped on with a shake. */
export const BenefitChip: React.FC<{text: string; at: number; x?: number; y?: number; size?: number; rot?: number; out?: number}> = ({text, at, x = 540, y = 960, size = 96, rot = -4, out}) => {
  const f = useCurrentFrame();
  if (f < at || (out !== undefined && f > out + 10)) return null;
  const k = ramp(f, at, 14, EASE.overshoot);
  const leave = out === undefined ? 0 : ramp(f, out, 8, EASE.exit);
  const shake = f - at < 8 ? Math.sin((f - at) * 2.6) * (8 - (f - at)) * 0.9 : 0;
  return (
    <div data-qa="text" data-qa-size={size} {...(k < 0.99 || leave > 0 ? {'data-qa-moving': ''} : {})} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) translate(${shake.toFixed(1)}px,0) rotate(${rot}deg) scale(${(mix(2.2, 1, k) * (1 - leave * 0.4)).toFixed(3)})`, opacity: Math.min(1, k * 2) * (1 - leave), padding: `${size * 0.16}px ${size * 0.34}px`, borderRadius: size * 0.22, background: C.benefit, color: C.onBenefit, font: `800 ${size}px ${FONT}`, letterSpacing: '-0.03em', whiteSpace: 'nowrap', boxShadow: '0 20px 60px rgba(255,216,0,0.35), 0 10px 30px rgba(0,0,0,0.5)'}}>{text}</div>
  );
};

/** Darkens the top of the frame so a headline reads over a pushed-in screen. */
export const TopScrim: React.FC<{t: number; h?: number}> = ({t, h = 620}) =>
  t <= 0 ? null : <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: h, opacity: t, background: 'linear-gradient(180deg, rgba(6,7,7,0.96) 0%, rgba(6,7,7,0.85) 55%, rgba(6,7,7,0) 100%)', pointerEvents: 'none'}}/>;

export const Flash: React.FC<{at: number; dur?: number; max?: number}> = ({at, dur = 8, max = 0.7}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  return <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: max * (1 - (f - at) / dur), pointerEvents: 'none'}}/>;
};

/** A hit on the frame: amp px, decays over dur frames. */
export const shakeAt = (f: number, hits: number[], amp = 14, dur = 10) => {
  let x = 0, y = 0;
  for (const h of hits) {
    const d = f - h;
    if (d >= 0 && d < dur) { const a = amp * (1 - d / dur); x += Math.sin(d * 2.9) * a; y += Math.cos(d * 3.7) * a * 0.6; }
  }
  return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
};

// ── neutral marketplace card: grey scheme, the marketplace name as plain text ──
export const GRAY = {card: '#e4e7e8', line: '#c4cacc', ink: '#2c3234', sub: '#6b7477', photo: '#b7bec1'};
export const CarGlyph: React.FC<{color?: string; style?: React.CSSProperties}> = ({color = '#9aa3a6', style}) => (
  <svg viewBox="0 0 200 90" style={{position: 'absolute', left: '12%', width: '76%', bottom: '10%', ...style}}>
    <path d="M14 64c0-10 6-14 18-16l26-4 22-18c5-4 11-6 18-6h34c8 0 14 3 19 8l16 16 18 4c8 2 12 7 12 14v6c0 3-2 5-5 5h-12a18 18 0 0 0-36 0H74a18 18 0 0 0-36 0H19c-3 0-5-2-5-5z" fill={color}/>
    <circle cx="56" cy="72" r="13" fill={color}/><circle cx="146" cy="72" r="13" fill={color}/>
  </svg>
);
export const BoardCard: React.FC<{w: number; h: number; label?: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({w, h, label, children, style}) => (
  <div style={{position: 'absolute', width: w, height: h, borderRadius: 26, background: GRAY.card, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.7)', ...style}}>
    {label && (
      <div style={{height: 70, background: '#d3d8da', display: 'flex', alignItems: 'center', padding: '0 26px', gap: 14}}>
        {[0, 1, 2].map((i) => <div key={i} style={{width: 16, height: 16, borderRadius: 8, background: GRAY.line}}/>)}
        <div style={{marginLeft: 14, padding: '6px 22px', borderRadius: 12, background: GRAY.card, font: `700 32px ${FONT}`, color: GRAY.ink}}>{label}</div>
      </div>
    )}
    <div style={{margin: 24, height: h * 0.42, borderRadius: 18, background: GRAY.photo, position: 'relative', overflow: 'hidden'}}><CarGlyph color="#9aa3a6"/></div>
    <div style={{margin: '0 24px', height: 26, width: '62%', borderRadius: 8, background: GRAY.line}}/>
    <div style={{margin: '14px 24px', height: 20, width: '40%', borderRadius: 8, background: GRAY.line}}/>
    {children}
  </div>
);

/** Logo, slogan and address, as in every vin2win promo. */
export const Outro: React.FC<{at: number; line?: string; lineAt?: number[]}> = ({at, line = 'Пока другие ищут —|*Вы закрываете сделки!*', lineAt}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const k = ramp(f, at, 16, EASE.snappy);
  const parts = line.split('|');
  const last = lineAt?.[parts.length - 1] ?? at + 8 + (parts.length - 1) * 8;
  const k2 = ramp(f, last + 6, 14, EASE.out);
  // The frame keeps living after the lockup: a slow push on the mark and a breathing glow on the address.
  const push = 1 + 0.025 * ramp(f, at, 150, EASE.smooth);
  const glow = 0.35 + 0.2 * Math.sin((f - at) / 9);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${push.toFixed(4)})`, transformOrigin: '540px 960px'}}>
      <div data-qa-focal style={{position: 'absolute', left: 540 - 410, top: 750, width: 820, height: Math.round((820 * 140) / 744), opacity: k, transform: `scale(${mix(1.25, 1, k).toFixed(3)})`, filter: `blur(${((1 - k) * 10).toFixed(1)}px)`}}>
        <Img src={LOGO()} style={{width: '100%', height: '100%', display: 'block'}}/>
      </div>
      {parts.map((part, i) => <Headline key={i} text={part} at={lineAt?.[i] ?? at + 8 + i * 8} y={940 + i * 84} size={68}/>)}
      <div style={{position: 'absolute', left: 0, right: 0, top: parts.length > 1 ? 1170 : 1110, display: 'flex', justifyContent: 'center', opacity: k2}}>
        <div data-qa="text" data-qa-size={46} style={{padding: '18px 44px', borderRadius: 999, background: C.green, color: '#fff', font: `800 46px ${FONT}`, letterSpacing: '-0.01em', boxShadow: `0 0 60px rgba(34,197,94,${glow.toFixed(3)})`, transform: `scale(${mix(0.8, 1, k2).toFixed(3)})`}}>vin2win.ru</div>
      </div>
    </div>
  );
};

export {interpolate, SYS};

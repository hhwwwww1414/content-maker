import React from 'react';
import {AlertTriangle, Banknote, CircleHelp, Coins, CreditCard, Eye, Gavel, Globe, Hand, House, Landmark, Link2, Lock, Mail, Phone, Search, ShieldCheck, Cpu, Tv, User, Wallet, type LucideIcon} from 'lucide-react';
import type {z} from 'zod';
import {Backdrop} from '../Frame';
import {movingAttr, toneColor, useRegion, useShot} from '../context';
import {clamp01, lerp, sec, springFrom, tween} from '../motion/core';
import {alpha, mix} from '../tokens';
import {Headline} from '../type/Headline';
import type {JourneyShot} from '../spec/schema';

type Spec = z.output<typeof JourneyShot>;
const ICONS: Record<string, LucideIcon> = {user: User, wallet: Wallet, card: CreditCard, bank: Landmark, phone: Phone, mail: Mail, lock: Lock, shield: ShieldCheck, alert: AlertTriangle, money: Coins, chain: Link2, gavel: Gavel, house: House, eye: Eye, globe: Globe, search: Search, chip: Cpu, tv: Tv, hand: Hand, cash: Banknote, question: CircleHelp};

const STEP = 1060, SWAY = 250;
const place = (route: Spec['route'], i: number): [number, number] => {
  if (route === 'descend') return [540 + (i % 2 ? SWAY * 0.55 : -SWAY * 0.55), i * STEP];
  if (route === 'climb') return [540 + (i % 2 ? -SWAY * 0.55 : SWAY * 0.55), -i * STEP];
  return [i * 1000 + 540, (i % 2 ? -1 : 1) * 200];
};

/** A camera that follows the money. The world is larger than the frame and the viewer travels through it. */
export const JourneyScene: React.FC<{spec: Spec}> = ({spec}) => {
  const {palette, frame, fps, start, profile, art} = useShot();
  const region = useRegion();
  const focus = {x: 540, y: region.top + 380};
  const positions = spec.nodes.map((_, i) => place(spec.route, i));
  const stops = spec.nodes.map((node) => start(node.cue));
  let cam: [number, number] = positions[0];
  let moving = false;
  const camSpring = profile.camera === 'camera' ? 'soft' : profile.camera;
  spec.nodes.forEach((_, i) => {
    const p = clamp01(springFrom(frame, stops[i] - sec(0.25, fps), fps, camSpring));
    if (i && frame >= stops[i] - sec(0.25, fps) && frame < stops[i] + sec(1, fps)) moving = true;
    cam = [lerp(cam[0], positions[i][0], i ? p : 1), lerp(cam[1], positions[i][1], i ? p : 1)];
  });
  const xs = positions.map((p) => p[0]), ys = positions.map((p) => p[1]);
  const over = spec.overviewCue !== undefined ? tween(frame, start(spec.overviewCue), 1.1, fps, 'inOut') : 0;
  const overviewScale = Math.min(780 / (Math.max(...xs) - Math.min(...xs) + 480), (region.height - 240) / (Math.max(...ys) - Math.min(...ys) + 480));
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2, centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const scale = lerp(1, overviewScale, over);
  const cx = lerp(cam[0], centerX, over), cy = lerp(cam[1], centerY, over);
  const focusY = lerp(focus.y, (region.top + region.bottom) / 2, over);
  // The route is drawn up to the current position of the traveller.
  const segments = positions.slice(1).map((pos, i) => {
    const a = positions[i];
    const p = tween(frame, stops[i + 1] - sec(0.55, fps), 0.75, fps, 'inOut');
    const mid = spec.route === 'zigzag' ? [(a[0] + pos[0]) / 2, (a[1] + pos[1]) / 2 + (i % 2 ? -220 : 220)] : [(a[0] + pos[0]) / 2 + (i % 2 ? -220 : 220), (a[1] + pos[1]) / 2];
    return {d: `M${a[0]} ${a[1]}Q${mid[0]} ${mid[1]} ${pos[0]} ${pos[1]}`, p};
  });
  return (
    <>
      <Backdrop light={[0.3, -0.22]}/>
      {spec.title && <Headline spec={spec.title} box={{left: region.left, top: region.top, width: region.width, height: 240}} maxSize={96} minSize={44}/>}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translate(${focus.x}px, ${focusY}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`, transformOrigin: '0 0'}}>
        <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
          {segments.map((s, i) => <React.Fragment key={i}>
            <path d={s.d} fill="none" stroke={alpha(palette.ink, 0.14)} strokeWidth={10} strokeDasharray="4 26" strokeLinecap="round"/>
            <path d={s.d} fill="none" stroke={palette.accent} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - s.p}/>
          </React.Fragment>)}
        </svg>
        {spec.nodes.map((node, i) => {
          const [x, y] = positions[i];
          const on = springFrom(frame, stops[i], fps, 'pop');
          const color = toneColor(palette, node.tone, palette.accent);
          const Icon = node.icon ? ICONS[node.icon] : null;
          const lit = clamp01(on);
          const R = 250;
          const textVisible = over < 0.02 && (i + 1 >= spec.nodes.length || frame < stops[i + 1] - sec(0.3, fps));
          const reached = frame >= stops[i];
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
              <div data-qa-focal={reached && !moving ? '' : undefined} style={{position: 'absolute', left: -R, top: -R, width: R * 2, height: R * 2, borderRadius: '50%', transform: `scale(${0.82 + 0.18 * on})`, background: reached ? `radial-gradient(circle at 36% 30%, ${mix(color, '#ffffff', 0.18)}, ${color} 60%, ${mix(color, '#000000', 0.22)})` : mix(palette.bg, palette.ink, 0.1), boxShadow: reached ? `0 40px 90px ${alpha(palette.bg === '#000000' ? '#000000' : mix(color, '#000000', 0.5), 0.45)}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {Icon && <Icon size={R * 1.04} strokeWidth={1.7} color={reached ? palette.onAccent : mix(palette.bg, palette.ink, 0.4)}/>}
                {!Icon && node.value && <div style={{fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 130, color: reached ? palette.onAccent : palette.muted}}>{node.value}</div>}
              </div>
              {reached && textVisible && (
                <div {...movingAttr(moving)} style={{position: 'absolute', left: -390, width: 780, top: R + 34, opacity: lit}}>
                  <Headline spec={{text: node.text, reveal: 'none', role: 'statement', tone: 'ink', align: 'center'}} box={{left: 0, top: 0, width: 780, height: 300}} maxSize={124} minSize={46}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

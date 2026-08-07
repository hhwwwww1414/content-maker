import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {LayoutRegistryProvider} from './layout/LayoutRegistry';
import {SafeZoneOverlay} from './layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Check} from '../components/vpn-explainer/parts';

/**
 * Shared scaffold for the "explainer" reel series (updated pipeline): a dark
 * tinted backdrop, timing helpers bound to a timeline, a non-overlapping headline
 * stack, and the standard GhostPepe CTA block. Compositions only provide their
 * own scene diagrams + BEATS, keeping every reel consistent.
 */

export const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
export const AMBER = '#FFC24B';

type Segment = {id: string; startMs: number; endMs: number; durationMs: number};
type Timeline = {fps: number; durationInFrames: number; segments: Segment[]};

export type Timing = {
  fps: number;
  total: number;
  start: (id: string) => number;
  end: (id: string) => number;
  appear: (frame: number, from: number, dur?: number) => number;
  /** Fade a scene in at its first segment, out right after its last — no two
   *  scene diagrams overlap during a crossfade (boundaries carry long pauses). */
  sceneOpacity: (frame: number, firstId: string, lastId: string) => number;
};

export const makeTiming = (timeline: Timeline): Timing => {
  const fps = timeline.fps;
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
  const seg = (id: string) => timeline.segments.find((s) => s.id === id);
  const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);
  const end = (id: string) => toFrame(seg(id)?.endMs ?? 0);
  return {
    fps,
    total: timeline.durationInFrames,
    start,
    end,
    appear: (frame, from, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out}),
    sceneOpacity: (frame, firstId, lastId) =>
      interpolate(frame, [start(firstId) - 2, start(firstId) + 8, end(lastId), end(lastId) + 10], [0, 1, 1, 0], CLAMP),
  };
};

export const Backdrop: React.FC<{tint: string; total: number}> = ({tint, total}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, total], [0, 40], CLAMP);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, ${tint}22, rgba(6,11,12,0.6) 46%, #05090A 78%)`}} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          backgroundPosition: `0 ${drift}px`,
          maskImage: 'radial-gradient(ellipse at 50% 44%, #000 40%, transparent 78%)',
          opacity: 0.5,
        }}
      />
    </>
  );
};

export type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode; size?: number};

/** Sequential headlines, each fully gone before the next appears. `stopId` is the
 *  segment where headlines end (usually the CTA question). */
export const HeadlineStack: React.FC<{T: Timing; beats: Beat[]; stopId: string}> = ({T, beats, stopId}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {beats.map((beat, i) => {
        const s = T.start(beat.id);
        const next = i < beats.length - 1 ? T.start(beats[i + 1].id) : T.start(stopId);
        const opacity = interpolate(frame, [s, s + 7, Math.max(s + 8, next - 11), Math.max(s + 9, next - 4)], [0, 1, 1, 0], CLAMP);
        if (opacity <= 0.001) return null;
        return (
          <div key={beat.id} style={{position: 'absolute', left: 90, top: 250, width: 900, opacity, translate: `0 ${interpolate(opacity, [0, 1], [10, 0], CLAMP)}px`, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 40}}>
            {beat.kicker ? (
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <span style={{width: 34, height: 3, borderRadius: 3, background: beat.color, boxShadow: `0 0 12px ${beat.color}`}} />
                <span style={{...typo.kicker, color: beat.color}}>{beat.kicker}</span>
              </div>
            ) : null}
            <div style={{...typo.display, fontSize: beat.size ?? 60, textShadow: '0 14px 40px rgba(0,0,0,0.6)'}}>{beat.node}</div>
          </div>
        );
      })}
    </>
  );
};

/** Standard closing CTA: mascot + payoff headline + GhostPepe card + button.
 *  Driven by the conventional cta_q / cta_brand / cta_tap segment ids. */
export const CtaBlock: React.FC<{T: Timing; children: React.ReactNode}> = ({T, children}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [T.start('cta_q') - 8, T.start('cta_q') + 16], [0, 1], {...CLAMP, easing: ease.out});
  const btn = T.appear(frame, T.start('cta_brand'));
  const tap = T.appear(frame, T.start('cta_tap'));
  const float = Math.sin(frame / 40) * 6;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, zIndex: 30}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 520, height: 520, borderRadius: '50%', background: C.vpn, filter: 'blur(150px)', opacity: 0.22, position: 'absolute', top: -40}} />
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain', translate: `0 ${float}px`, filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))'}} />
        <div style={{...typo.display, fontSize: 58, textAlign: 'center', marginTop: 8}}>{children}</div>
        <div style={{marginTop: 22, ...card(C.vpn), padding: '20px 30px', display: 'flex', alignItems: 'center', gap: 16, opacity: btn, transform: `scale(${interpolate(btn, [0, 1], [0.92, 1], CLAMP)})`}}>
          <Check size={40} color={C.vpn} t={btn} />
          <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 40, color: C.white}}>GhostPepe</span>
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 30, color: C.muted}}>· VPN в Telegram</span>
        </div>
        <div style={{marginTop: 20, padding: '20px 46px', borderRadius: 999, background: `linear-gradient(180deg, #8CFFE9, ${C.vpn})`, color: '#06110F', fontFamily: unbounded, fontWeight: 800, fontSize: 38, opacity: tap, boxShadow: `0 20px 60px ${C.vpn}55`}}>Подключить в пару нажатий</div>
      </div>
    </div>
  );
};

/** Full reel wrapper: registry, background audio, voiceover, safe-zone overlay. */
export const ReelRoot: React.FC<{voice: string; children: React.ReactNode}> = ({voice, children}) => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      {children}
      <Audio src={staticFile(voice)} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

export {Accent, C};

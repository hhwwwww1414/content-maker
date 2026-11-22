import React, {createContext, useContext} from 'react';
import {useScene} from '../kit/scene';
import {cameraAt, profiles, springFrom, tween, type CameraState, type EaseName, type MotionProfile, type SpringName} from './motion/core';
import {artDirections, type ArtDirection, type Palette, type Variant} from './themes';
import type {DirectionSpec} from './spec/schema';
import {captionZones, safe} from './tokens';

export type AssetEntry = {id: string; kind: string; path: string; width?: number; height?: number; focus?: [number, number]; license: string; attribution?: string};
type Ctx = {art: ArtDirection; palette: Palette; variant: Variant; profile: MotionProfile; direction: DirectionSpec; assets: Record<string, AssetEntry>; camera: CameraState};
const ShotCtx = createContext<Ctx | null>(null);

export const ShotProvider: React.FC<{direction: DirectionSpec; mainArt: string; projectMotion?: string; assets: Record<string, AssetEntry>; children: React.ReactNode}> = ({direction, mainArt, projectMotion, assets, children}) => {
  const {frame, fps, at, durationFrames} = useScene();
  const art = artDirections[direction.art.direction ?? mainArt];
  if (!art) throw new Error(`Unknown art direction ${direction.art.direction ?? mainArt}`);
  const profile = profiles[(direction.art.motion ?? projectMotion ?? art.motion) as keyof typeof profiles];
  const camera = cameraAt({
    frame, fps, durationFrames, move: direction.camera.move, keys: direction.camera.keys,
    resolve: (cue) => at(cue), defaultSpring: profile.camera,
    handheld: direction.camera.handheld ?? profile.handheld,
  });
  return <ShotCtx.Provider value={{art, palette: art.palettes[direction.art.variant], variant: direction.art.variant, profile, direction, assets, camera}}>{children}</ShotCtx.Provider>;
};

/** A part of the frame in another palette: everything inside resolves colours from it. */
export const PaletteScope: React.FC<{palette: Palette; children: React.ReactNode}> = ({palette, children}) => {
  const ctx = useContext(ShotCtx);
  if (!ctx) throw new Error('PaletteScope outside a directed scene');
  return <ShotCtx.Provider value={{...ctx, palette}}>{children}</ShotCtx.Provider>;
};

/** The whole shot clock and art direction. `frame` is 0 on the scene's first spoken word. */
export const useShot = () => {
  const ctx = useContext(ShotCtx);
  if (!ctx) throw new Error('useShot outside a directed scene');
  const scene = useScene();
  const {frame, fps} = scene;
  const start = (cue: string | number | undefined, fallback = 0) => scene.at(cue, fallback);
  return {
    ...ctx, ...scene, start,
    t: frame / fps,
    /** Spring progress from a word, in this story's pacing unless a preset is named. */
    spring: (cue: string | number | undefined, preset?: SpringName, delaySeconds = 0, fallback = 0) => springFrom(frame, start(cue, fallback) + Math.round(delaySeconds * fps), fps, preset ?? ctx.profile.enter),
    tween: (cue: string | number | undefined, seconds: number, easing: EaseName = 'out', delaySeconds = 0, fallback = 0) => tween(frame, start(cue, fallback) + Math.round(delaySeconds * fps), seconds, fps, easing),
  };
};

/** Where this scene's text may live: above the captions, or below them when they sit high. */
export const useRegion = () => {
  const {direction} = useShot();
  const zone = direction.captions.mode === 'off' ? null : direction.captions.zone;
  const top = zone === 'high' ? captionZones.high.top + captionZones.high.height + 24 : safe.top + 58;
  const bottom = zone === 'low' ? captionZones.low.top - 16 : safe.bottom - 10;
  // A small inset keeps full-width text inside the safe area while the camera drifts or pushes.
  const inset = 14;
  return {left: safe.left + inset, right: safe.right - inset, width: safe.width - inset * 2, top, bottom, height: bottom - top};
};

/** Marks a layer as still animating: the layout guard judges it once it has landed. */
/** Largest size a plane reaches under this scene's camera: text fitted to `width / k` stays in the safe area all the way. */
export const planeGrowth = (camera: DirectionSpec['camera'], z: number) => {
  const peak = Math.max(1, ...camera.keys.map((key) => key.scale ?? 1), ({pushIn: 1.07, pullOut: 1.09, panLeft: 1.06, panRight: 1.06, tiltUp: 1.06, tiltDown: 1.06, driftUp: 1.03, creep: 1.04, still: 1} as Record<string, number>)[camera.move]);
  return 1 + (peak - 1) * Math.max(0, 1 + z);
};

export const movingAttr = (moving: boolean): {'data-qa-moving'?: string} => (moving ? {'data-qa-moving': ''} : {});

export const toneColor = (p: Palette, tone: string | undefined, fallback = p.ink) => ({ink: p.ink, accent: p.accent, accent2: p.accent2, muted: p.muted, danger: p.danger} as Record<string, string>)[tone ?? ''] ?? fallback;

export const roleOf = (art: ArtDirection, role: string) => ({display: art.display, statement: art.statement, italic: art.italic, body: art.body, label: art.label2, mono: art.mono} as Record<string, ArtDirection['display']>)[role] ?? art.display;

import React, {createContext, useContext, useMemo} from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {cueSeconds, normWord, type TimedWord} from './cue';
import type {Theme} from './themes';
import type {Cue, Project, Scene} from './types';

type Ctx = {scene: Scene; words: TimedWord[]; theme: Theme; preRoll: number; durationFrames: number};
const SceneCtx = createContext<Ctx | null>(null);

export const SceneProvider: React.FC<{project: Project; scene: Scene; theme: Theme; preRoll: number; durationFrames: number; children: React.ReactNode}> = ({project, scene, theme, preRoll, durationFrames, children}) => {
  // By word count, not time: scene starts are snapped to frames and could misfile a boundary word.
  const words = useMemo(() => {
    const countOf = (s: Scene) => s.voice.trim().split(/\s+/).length;
    const index = project.scenes.findIndex((s) => s.id === scene.id);
    const offset = project.scenes.slice(0, index).reduce((sum, s) => sum + countOf(s), 0);
    return project.captions.slice(offset, offset + countOf(scene)).map((w) => ({text: w.text, norm: normWord(w.text), startMs: w.startMs, endMs: w.endMs}));
  }, [project.captions, project.scenes, scene]);
  return <SceneCtx.Provider value={{scene, words, theme, preRoll, durationFrames}}>{children}</SceneCtx.Provider>;
};

/** Scene clock: `frame` is 0 at the scene's first spoken word, negative during the incoming transition. */
export const useScene = () => {
  const ctx = useContext(SceneCtx);
  if (!ctx) throw new Error('useScene outside a scene');
  const raw = useCurrentFrame();
  const {fps} = useVideoConfig();
  const at = (cue: Cue | undefined, fallback = 0) => (cue === undefined ? fallback : Math.round(cueSeconds(cue, ctx.words, ctx.scene.start) * fps));
  return {...ctx, frame: raw - ctx.preRoll, fps, at};
};

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);
export const prog = (frame: number, start: number, frames = 14, easing = EASE_OUT) =>
  interpolate(frame, [start, start + frames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Marks an element mid-entrance: LayoutGuard judges size, bounds and overlap once it has landed. */
export const moving = (p: number): {'data-qa-moving'?: string} => (p < 1 ? {'data-qa-moving': ''} : {});

/** Inline accent markup: "Он *снял* кадр". */
export const parseAccent = (text: string) => text.split(/\s+/).map((word) => ({word: word.replace(/\*/g, ''), accent: word.includes('*')}));

export const QaText: React.FC<React.HTMLAttributes<HTMLDivElement> & {min?: number}> = ({min, ...props}) => <div data-qa="text" data-qa-min={min} {...props}/>;

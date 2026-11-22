import React, {useMemo, useRef} from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {Frame, enter} from './Design';
import {visuals} from './Scenes';
import {Captions} from './Captions';
import {LayoutGuard} from './LayoutGuard';
import {WordCaptions} from './kit/Captions';
import {CustomScene, VisualScene} from './kit/SceneView';
import {ensureKitFonts} from './kit/fonts';
import {SceneProvider} from './kit/scene';
import {TransitionFrame, type TransitionSpec} from './kit/Transition';
import {themes} from './kit/themes';
import type {Project, Scene} from './kit/types';
import {ShotProvider, type AssetEntry} from './engine/context';
import {FontGate} from './engine/fonts';
import {Finish} from './engine/fx/Finish';
import {ShotView, parseDirection} from './engine/ShotView';
import {duckedVolume} from './engine/sound';
import {transitionFrames, TransitionOverlay, TransitionShell} from './engine/transitions/Transitions';
import {displayWords, EngineCaptions} from './engine/type/Captions';
import {artDirections} from './engine/themes';
import {cueSeconds, normWord} from './kit/cue';
import {staticFile as assetFile} from 'remotion';
import type {DirectionSpec, TransitionSpec as EngineTransition} from './engine/spec/schema';

// Original template scenes (the GPS project): unchanged look, frame and captions.
const TemplateContent: React.FC<{template: string; duration: number}> = ({template, duration}) => {
  const f = useCurrentFrame();
  const Graphic = visuals[template];
  return <div style={{position: 'absolute', inset: 0, opacity: Math.min(.35 + .65 * enter(f, 0, 10), .35 + .65 * enter(duration - 1 - f, 0, 7))}}><Graphic/></div>;
};

const specOf = (scene: Scene | undefined): TransitionSpec | null => {
  const t = scene?.visual?.transition;
  if (!t || t.type === 'cut') return null;
  return {type: t.type, frames: t.frames ?? 14, origin: t.origin ?? [0.5, 0.42]};
};

// A directed scene: the validated spec goes to the scene systems, under the voice-derived clock.
const DirectedScene: React.FC<{project: Project; scene: Scene; direction: DirectionSpec; incoming: EngineTransition | null; outgoing: EngineTransition | null; from: number; end: number; preRoll: number; postRoll: number}> = ({project, scene, direction, incoming, outgoing, end, from, preRoll, postRoll}) => {
  const total = end - from + preRoll + postRoll;
  return (
    <TransitionShell incoming={incoming} outgoing={outgoing} preRoll={preRoll} postRoll={postRoll} total={total} id={scene.id}>
      <SceneProvider project={project} scene={scene} theme={themes.signal} preRoll={preRoll} durationFrames={end - from}>
        <ShotProvider direction={direction} mainArt={project.art!.direction} projectMotion={project.art?.motion} assets={(project.assets ?? {}) as Record<string, AssetEntry>}>
          <ShotView/>
        </ShotProvider>
      </SceneProvider>
    </TransitionShell>
  );
};

const DirectedVideo: React.FC<{project: Project}> = ({project}) => {
  const root = useRef<HTMLDivElement>(null);
  const {fps, scenes} = project;
  const total = Math.round(project.durationSeconds * fps);
  const main = artDirections[project.art!.direction];
  if (!main) throw new Error(`Unknown art direction ${project.art!.direction}`);
  // Parsed once at the boundary, defaults included: every part below reads the validated spec.
  const directions = useMemo(() => scenes.map((s) => parseDirection(s.id, s.direction)), [scenes]);
  const transitionAt = (i: number) => (directions[i]?.transition ?? null) as EngineTransition | null;
  const bounds = scenes.map((s, i) => ({from: Math.round(s.start * fps), end: i + 1 < scenes.length ? Math.round(scenes[i + 1].start * fps) : total}));
  const wordsOf = (index: number) => {
    const count = (s: Scene) => s.voice.trim().split(/\s+/).length;
    const offset = scenes.slice(0, index).reduce((sum, s) => sum + count(s), 0);
    return project.captions.slice(offset, offset + count(scenes[index])).map((w) => ({text: w.text, norm: normWord(w.text), startMs: w.startMs, endMs: w.endMs}));
  };
  const sounds = scenes.flatMap((scene, i) => directions[i].sound.map((sound) => ({at: Math.round((scene.start + cueSeconds(sound.cue, wordsOf(i), scene.start)) * fps), sound})));
  const library = (project.assets ?? {}) as Record<string, AssetEntry>;
  const music = project.art?.music;
  const musicEntry = music ? library[music.asset] : null;
  return (
    <FontGate>
      <AbsoluteFill data-qa-root data-qa-kit="1" data-qa-engine="1" ref={root} style={{background: main.palettes.base.bg, overflow: 'hidden'}}>
        {scenes.map((scene, i) => {
          const {from, end} = bounds[i];
          const incoming = i > 0 ? transitionAt(i) : null;
          const outgoing = transitionAt(i + 1);
          const inFrames = transitionFrames(incoming ?? undefined, fps), outFrames = transitionFrames(outgoing ?? undefined, fps);
          const preRoll = Math.floor(inFrames / 2), postRoll = Math.ceil(outFrames / 2);
          return (
            <Sequence key={scene.id} name={scene.id} from={from - preRoll} durationInFrames={end - from + preRoll + postRoll}>
              <DirectedScene project={project} scene={scene} direction={directions[i]} incoming={incoming} outgoing={outgoing} from={from} end={end} preRoll={preRoll} postRoll={postRoll}/>
            </Sequence>
          );
        })}
        {scenes.map((scene, i) => {
          const t = i > 0 ? transitionAt(i) : null;
          if (!t || !['field', 'morph', 'glyph'].includes(t.type)) return null;
          const frames = transitionFrames(t, fps);
          const direction = directions[i];
          const prevDirection = directions[i - 1];
          const artOf = (d: DirectionSpec) => artDirections[d.art.direction ?? project.art!.direction];
          const paletteOf = (d: DirectionSpec) => artOf(d).palettes[d.art.variant];
          return (
            <Sequence key={`t-${scene.id}`} name={`transition ${scene.id}`} from={bounds[i].from - Math.floor(frames / 2)} durationInFrames={frames} layout="none">
              <TransitionOverlay spec={t} frames={frames} prev={paletteOf(prevDirection)} next={paletteOf(direction)} display={artOf(prevDirection).display}/>
            </Sequence>
          );
        })}
        <EngineCaptions words={displayWords(project.captions, project.captionDisplay)} art={main} scenes={scenes}/>
        <Finish art={main}/>
        <LayoutGuard root={root}/>
        {/* Headroom for the mix: music and effects sum on top of a voice mastered to -1.5 dBTP. */}
        {project.audio.voicePath && <Audio src={staticFile(project.audio.voicePath)} volume={(project.audio.volume ?? 1) * (musicEntry || sounds.length ? 0.82 : 1)}/>}
        {project.audio.mode === 'music' && project.audio.musicPath && <Audio src={staticFile(project.audio.musicPath)} volume={project.audio.volume ?? 1}/>}
        {musicEntry && <Audio src={assetFile(musicEntry.path)} loop loopVolumeCurveBehavior="extend" volume={(f) => duckedVolume(f, {fps, words: project.captions, base: music!.volume, duck: music!.duck, totalFrames: total})}/>}
        {sounds.map(({at, sound}, i) => {
          const entry = library[sound.sfx];
          if (!entry) throw new Error(`Sound "${sound.sfx}" is not resolved. Run node studio/assets.mjs check.`);
          return <Sequence key={i} from={at} layout="none"><Audio src={assetFile(entry.path)} volume={sound.volume}/></Sequence>;
        })}
      </AbsoluteFill>
    </FontGate>
  );
};

export const EditorialVideo: React.FC<{project: Project}> = ({project}) => {
  if (project.scenes.some((s) => s.direction)) return <DirectedVideo project={project}/>;
  return <LegacyVideo project={project}/>;
};

const LegacyVideo: React.FC<{project: Project}> = ({project}) => {
  ensureKitFonts();
  const root = useRef<HTMLDivElement>(null);
  const {fps, scenes} = project;
  const usesKit = scenes.some((s) => s.visual || s.component);
  const theme = themes[project.theme ?? 'signal'];
  const totalFrames = Math.round(project.durationSeconds * fps);
  const music = project.audio.musicPath;
  const effects = project.audio.sfx ?? [];
  return (
    <AbsoluteFill data-qa-root data-qa-kit={usesKit ? '1' : '0'} ref={root} style={usesKit ? {background: theme.bg} : undefined}>
      {scenes.map((scene, i) => {
        const from = Math.round(scene.start * fps);
        const end = i + 1 < scenes.length ? Math.round(scenes[i + 1].start * fps) : totalFrames;
        if (scene.template && !scene.visual && !scene.component) {
          return (
            <Sequence key={scene.id} name={scene.id} from={from} durationInFrames={end - from}>
              <Frame label={scene.onScreen} index={i + 1}><TemplateContent template={scene.template} duration={end - from}/></Frame>
            </Sequence>
          );
        }
        const incoming = i > 0 ? specOf(scene) : null;
        const outgoing = specOf(scenes[i + 1]);
        const preRoll = incoming ? Math.floor(incoming.frames / 2) : 0;
        const postRoll = outgoing ? Math.ceil(outgoing.frames / 2) : 0;
        const total = end - from + preRoll + postRoll;
        return (
          <Sequence key={scene.id} name={scene.id} from={from - preRoll} durationInFrames={total}>
            <TransitionFrame incoming={incoming} outgoing={outgoing} preRoll={preRoll} postRoll={postRoll} total={total} theme={theme}>
              <SceneProvider project={project} scene={scene} theme={theme} preRoll={preRoll} durationFrames={end - from}>
                {scene.component ? <CustomScene name={scene.component}/> : <VisualScene visual={scene.visual!} project={project}/>}
              </SceneProvider>
            </TransitionFrame>
          </Sequence>
        );
      })}
      {usesKit ? <WordCaptions words={project.captions} theme={theme} variant={project.captionStyle}/> : <Captions project={project}/>}
      <LayoutGuard root={root}/>
      {project.audio.voicePath && <Audio src={staticFile(project.audio.voicePath)} volume={project.audio.volume ?? 1}/>}
      {music && <Audio src={staticFile(music)} loop loopVolumeCurveBehavior="extend" volume={(f) => .1 * Math.min(1, f / 24, Math.max(0, (project.durationSeconds * fps - f) / 24))}/>}
      {effects.map((effect, i) => <Sequence key={i} from={Math.round(effect.start * fps)}><Audio src={staticFile(effect.path)} volume={effect.volume}/></Sequence>)}
    </AbsoluteFill>
  );
};

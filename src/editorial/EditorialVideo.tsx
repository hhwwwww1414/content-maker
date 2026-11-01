import React, {useRef} from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {Frame, enter} from './Design';
import {visuals} from './Scenes';
import {Captions} from './Captions';
import {LayoutGuard} from './LayoutGuard';
import {WordCaptions} from './kit/Captions';
import {CustomScene, VisualScene} from './kit/SceneView';
import {SceneProvider} from './kit/scene';
import {TransitionFrame, type TransitionSpec} from './kit/Transition';
import {themes} from './kit/themes';
import type {Project, Scene} from './kit/types';

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

export const EditorialVideo: React.FC<{project: Project}> = ({project}) => {
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

import React, {useRef} from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import project from '../../studio/gps-offline.json';
import {Frame, enter} from './Design';
import {visuals} from './Scenes';
import {Captions} from './Captions';
import {LayoutGuard} from './LayoutGuard';

const SceneContent:React.FC<{template:string;duration:number}>=({template,duration})=>{
  const f=useCurrentFrame();
  const Graphic=visuals[template];
  return <div style={{position:'absolute',inset:0,opacity:Math.min(.35+.65*enter(f,0,10),.35+.65*enter(duration-1-f,0,7))}}><Graphic/></div>;
};

const music=project.audio.musicPath as string|null;
const effects=project.audio.sfx as Array<{path:string;start:number;volume:number;license:string}>;
export const GpsVideo:React.FC=()=> {
  const root=useRef<HTMLDivElement>(null);
  return <AbsoluteFill data-qa-root ref={root}>
  {project.scenes.map((scene,i)=>{
    const from=Math.round(scene.start*project.fps);
    const end=i+1<project.scenes.length?Math.round(project.scenes[i+1].start*project.fps):Math.round(project.durationSeconds*project.fps);
    return <Sequence key={scene.id} name={scene.id} from={from} durationInFrames={end-from}>
      <Frame label={scene.onScreen} index={i+1}><SceneContent template={scene.template} duration={end-from}/></Frame>
    </Sequence>;
  })}
  <Captions/>
  <LayoutGuard root={root}/>
  {project.audio.voicePath&&<Audio src={staticFile(project.audio.voicePath)} volume={project.audio.volume}/>}
  {music&&<Audio src={staticFile(music)} loop loopVolumeCurveBehavior="extend" volume={f=>.1*Math.min(1,f/24,Math.max(0,(project.durationSeconds*project.fps-f)/24))}/>}
  {effects.map((effect,i)=><Sequence key={i} from={Math.round(effect.start*project.fps)}><Audio src={staticFile(effect.path)} volume={effect.volume}/></Sequence>)}
</AbsoluteFill>;
};

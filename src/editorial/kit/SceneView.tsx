import React from 'react';
import {interpolate} from 'remotion';
import {customScenes} from '../custom';
import {Backdrop} from './Backdrop';
import {layerRegistry} from './registry';
import {EASE_IN_OUT, useScene} from './scene';
import type {CameraKey, Layer, Project, Visual} from './types';

const useCamera = (keys: CameraKey[] = []) => {
  const {frame, at, durationFrames} = useScene();
  // A slow base push keeps the world alive between beats.
  const drift = interpolate(frame, [0, durationFrames], [1, 1.025]);
  let state = {scale: 1, x: 0, y: 0};
  for (const key of keys) {
    const start = at(key.cue);
    const p = interpolate(frame, [start, start + (key.frames ?? 24)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT});
    state = {scale: state.scale + ((key.scale ?? state.scale) - state.scale) * p, x: state.x + ((key.x ?? state.x) - state.x) * p, y: state.y + ((key.y ?? state.y) - state.y) * p};
  }
  return {...state, scale: state.scale * drift};
};

const LayerView: React.FC<{layer: Layer}> = ({layer}) => {
  const Component = layerRegistry[layer.type];
  if (!Component) throw new Error('Unknown layer ' + layer.type);
  const {type: _type, box, fixed: _fixed, ...props} = layer;
  const [left, top, width, height] = box ?? [110, 250, 800, 1030];
  if (layer.type === 'light') return <Component {...props}/>;
  return <div style={{position: 'absolute', left, top, width, height}}><Component {...props}/></div>;
};

export const VisualScene: React.FC<{visual: Visual; project: Project}> = ({visual, project}) => {
  const {theme} = useScene();
  const camera = useCamera(visual.camera);
  return (
    <>
      <Backdrop kind={visual.backdrop ?? project.backdrop ?? theme.backdrop} camX={camera.x} camY={camera.y}/>
      <div style={{position: 'absolute', inset: 0, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`, transformOrigin: '50% 40%'}}>
        {visual.layers.filter((l) => !l.fixed).map((layer, i) => <LayerView key={i} layer={layer}/>)}
      </div>
      {visual.layers.filter((l) => l.fixed).map((layer, i) => <LayerView key={i} layer={layer}/>)}
    </>
  );
};

/** Hand-made scenes (`scene.component`) get the same clock, backdrop and QA as generated ones. */
export const CustomScene: React.FC<{name: string}> = ({name}) => {
  const Component = customScenes[name];
  if (!Component) throw new Error('Unknown custom scene ' + name);
  return <Component/>;
};

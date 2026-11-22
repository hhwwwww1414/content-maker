import React from 'react';
import {useShot} from './context';
import {Field} from './fx/Field';
import {parallaxStyle} from './motion/core';

/** A layer on its own plane: depth < 0 is further away, depth > 0 is nearer the lens. */
export const Depth: React.FC<{z?: number; origin?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({z = 0, origin, children, style}) => {
  const {camera} = useShot();
  return <div style={{position: 'absolute', inset: 0, ...parallaxStyle(camera, z, origin), ...style}}>{children}</div>;
};

/** The lit surface behind a shot, from the scene's art direction. */
export const Backdrop: React.FC<{seed?: string; light?: [number, number]}> = ({seed, light}) => {
  const {art, palette, direction, scene, camera} = useShot();
  const kind = direction.art.field ?? art.field;
  return (
    <div style={{position: 'absolute', inset: -40, ...parallaxStyle(camera, -0.5)}}>
      <Field kind={kind} palette={palette} seed={seed ?? scene.id} light={direction.art.light ?? light ?? [0.68, -0.22]}/>
    </div>
  );
};

/** Darkens the top or bottom of an image so type sits on a controlled surface. */
export const Scrim: React.FC<{from?: number; to?: number; side: 'top' | 'bottom'; strength?: number; color?: string}> = ({from = 0, to = 760, side, strength = 0.82, color = '0,0,0'}) => (
  <div style={{position: 'absolute', left: 0, right: 0, top: side === 'top' ? from : undefined, bottom: side === 'bottom' ? from : undefined, height: to, background: `linear-gradient(${side === 'top' ? 'to bottom' : 'to top'}, rgba(${color},${strength}) 0%, rgba(${color},${strength * 0.72}) 45%, rgba(${color},0) 100%)`}}/>
);

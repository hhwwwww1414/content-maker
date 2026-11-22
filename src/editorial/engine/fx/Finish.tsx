import React from 'react';
import {Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ArtDirection} from '../themes';

/** The last pass of every frame: lens falloff and film grain. Grain also hides gradient banding after encoding. */
export const Finish: React.FC<{art: ArtDirection; dark?: boolean}> = ({art}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // Grain changes 15 times a second regardless of the output frame rate.
  const tick = Math.floor((frame / fps) * 15);
  const x = Math.floor(random(`gx${tick}`) * 512), y = Math.floor(random(`gy${tick}`) * 512);
  return (
    <>
      {art.vignette > 0 && <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 85% 75% at 50% 46%, transparent 42%, rgba(0,0,0,${art.vignette}) 100%)`}}/>}
      {/* CSS backgrounds are invisible to the renderer's wait: this keeps the frame from being captured before the tile loads. */}
      {art.grain > 0 && <Img src={staticFile('library/textures/grain-512.png')} style={{position: 'absolute', width: 1, height: 1, opacity: 0}}/>}
      {/* eslint-disable-next-line @remotion/no-background-image -- a tiled, offset noise needs a CSS tile; the Img above makes the renderer wait for it. */}
      {art.grain > 0 && <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'overlay', opacity: 0.22 * art.grain, backgroundImage: `url(${staticFile('library/textures/grain-512.png')})`, backgroundSize: '512px 512px', backgroundPosition: `${x}px ${y}px`}}/>}
    </>
  );
};

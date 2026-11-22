import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {EditorialVideo} from '../../EditorialVideo';
import type {Project} from '../../kit/types';
import {safe} from '../tokens';

/** How a 9:16 reel survives another aspect ratio, and where the safe area falls. The engine itself only ships 9:16. */
export const CropPreview: React.FC<{project: Project; showSafe?: boolean}> = ({project, showSafe}) => {
  const {width, height} = useVideoConfig();
  const k = Math.max(width / 1080, height / 1920);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: (width - 1080 * k) / 2, top: (height - 1920 * k) / 2, width: 1080, height: 1920, transform: `scale(${k})`, transformOrigin: '0 0'}}>
        <EditorialVideo project={project}/>
        {showSafe && <div style={{position: 'absolute', left: safe.left, top: safe.top, width: safe.width, height: safe.height, border: '4px dashed #ff3b6b'}}/>}
      </div>
    </AbsoluteFill>
  );
};

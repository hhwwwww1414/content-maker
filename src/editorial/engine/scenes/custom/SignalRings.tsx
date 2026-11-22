import React from 'react';
import {Backdrop} from '../../Frame';
import {useRegion, useShot} from '../../context';
import {clamp01} from '../../motion/core';
import {alpha} from '../../tokens';
import {Headline, textDefaults} from '../../type/Headline';

/** Reference custom scene: range circles from several stations that meet at one point. Props are plain data. */
export const SignalRings: React.FC<{title: string; cue?: string; stations?: Array<[number, number]>; target?: [number, number]}> = ({title, cue, stations = [[180, 620], [900, 700], [320, 1240]], target = [560, 900]}) => {
  const {frame, fps, start, palette} = useShot();
  const region = useRegion();
  const begin = start(cue);
  return (
    <>
      <Backdrop/>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {stations.map(([x, y], i) => {
          const r = Math.hypot(target[0] - x, target[1] - y);
          const p = clamp01((frame - begin - i * 0.35 * fps) / (0.8 * fps));
          return <g key={i}><circle cx={x} cy={y} r={r * p} fill={alpha(palette.accent, 0.07)} stroke={palette.accent} strokeWidth={6}/><circle cx={x} cy={y} r={18} fill={palette.accent2}/></g>;
        })}
        <circle cx={target[0]} cy={target[1]} r={34 * clamp01((frame - begin - 1.3 * fps) / (0.3 * fps))} fill={palette.ink}/>
      </svg>
      <Headline spec={textDefaults(title, {cue})} box={{left: region.left, top: region.top, width: region.width, height: 260}} maxSize={118} minSize={46}/>
    </>
  );
};

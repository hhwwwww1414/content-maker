import React from 'react';
import type {z} from 'zod';
import {Backdrop, Depth} from '../Frame';
import {movingAttr, useRegion, useShot} from '../context';
import {clamp01, lerp, range, springFrom} from '../motion/core';
import {alpha} from '../tokens';
import {Headline} from '../type/Headline';
import {PHONE, PhoneBody} from '../ui/Phone';
import {ScreenView} from '../ui/screens';
import type {DeviceShot} from '../spec/schema';

type Spec = z.output<typeof DeviceShot>;
type Pose = {rx: number; ry: number; rz: number; scale: number; x: number; y: number};

/** Each layout is a different camera position on the same object, not a different template. */
const POSES: Record<Spec['layout'], Pose> = {
  hero: {rx: 6, ry: -12, rz: 2, scale: 0.84, x: 0, y: -50},
  rise: {rx: 10, ry: 0, rz: 0, scale: 0.8, x: 0, y: 260},
  macro: {rx: 0, ry: 0, rz: 0, scale: 1.16, x: 0, y: 150},
  offset: {rx: 5, ry: -20, rz: 4, scale: 0.92, x: 130, y: 150},
};

export const DeviceScene: React.FC<{spec: Spec}> = ({spec}) => {
  const {frame, fps, start, profile, spring, t, palette, scene, preRoll} = useShot();
  const region = useRegion();
  const camSpring = profile.camera === 'camera' ? 'soft' : profile.camera;
  let pose = {...POSES[spec.layout]};
  for (const key of spec.poses) {
    const p = clamp01(springFrom(frame, start(key.cue), fps, camSpring));
    pose = {rx: lerp(pose.rx, key.rx ?? pose.rx, p), ry: lerp(pose.ry, key.ry ?? pose.ry, p), rz: lerp(pose.rz, key.rz ?? pose.rz, p), scale: lerp(pose.scale, key.scale ?? pose.scale, p), x: lerp(pose.x, key.x ?? pose.x, p), y: lerp(pose.y, key.y ?? pose.y, p)};
  }
  const posing = spec.poses.some((key) => frame >= start(key.cue) && frame < start(key.cue) + Math.round(1.4 * fps));
  // Without its own cue the device is already there as the transition opens, so the reveal never shows an empty ground.
  const enter = spring(spec.enterCue, profile.enter === 'settle' ? 'soft' : profile.enter, 0, -preRoll - Math.round(0.3 * fps));
  // The first frame of a reel is its thumbnail: an opening device is already in place, only settling.
  const opening = scene.start === 0 && spec.enterCue === undefined;
  const lift = opening ? (1 - clamp01(enter)) * 40 : (1 - enter) * 620;
  const breathe = Math.sin(t * 0.8) * 1.1;
  return (
    <>
      <Backdrop light={[0.5, -0.22]}/>
      {/* A rim of light separates the object from the ground: without it a dark phone vanishes on a dark frame. */}
      <div style={{position: 'absolute', left: 540 + pose.x - 760, top: 960 + pose.y + lift - 900, width: 1520, height: 1800, opacity: (opening ? 1 : clamp01(enter)) * 0.55, background: `radial-gradient(closest-side, ${alpha(palette.accent, 0.5)} 0%, ${alpha(palette.accent, 0.14)} 58%, transparent 100%)`}}/>
      <Depth z={0.05}>
        <div {...movingAttr(posing || enter < 0.98)} style={{position: 'absolute', left: 540 - PHONE.width / 2 + pose.x, top: 960 - PHONE.height / 2 + pose.y + lift, width: PHONE.width, height: PHONE.height, transform: `perspective(2600px) rotateX(${pose.rx}deg) rotateY(${pose.ry + breathe}deg) rotateZ(${pose.rz}deg) scale(${pose.scale})`, opacity: pose.y > 1400 && !posing ? 0 : opening ? 1 : range(enter, [0, 0.25], [0, 1])}}>
          <PhoneBody><ScreenView screen={spec.screen}/></PhoneBody>
        </div>
      </Depth>
      {spec.title && (spec.titleStage === 'poster'
        ? <Headline spec={spec.title} box={{left: region.left, top: region.top, width: region.width, height: region.height}} layout="poster" anchor="center" maxSize={440} minSize={54}/>
        : <Headline spec={spec.title} box={{left: region.left, top: region.top, width: region.width, height: spec.layout === 'rise' ? 400 : 320}} maxSize={126} minSize={46}/>)}
    </>
  );
};

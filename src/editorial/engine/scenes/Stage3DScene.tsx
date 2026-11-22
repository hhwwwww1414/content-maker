import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {cancelRender, continueRender, delayRender, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {z} from 'zod';
import {Backdrop} from '../Frame';
import {useRegion, useShot} from '../context';
import {assetUrl} from '../library';
import {addFloor, addLights, buildBerg, buildObject, createStage, gloss, type ModelTheme, type Stage} from '../fx/three-kit';
import {clamp01, ease, lerp, range, sec, springFrom, tween} from '../motion/core';
import {mix} from '../tokens';
import {SetText, useSetting} from '../type/Headline';
import {Label} from '../type/Label';
import type {Stage3DShot} from '../spec/schema';

type Spec = z.output<typeof Stage3DShot>;
type Clock = {frame: number; fps: number; start: (cue: string | number | undefined, fallback?: number) => number; t: number};
/** Built once per scene: returns a per-frame pose function and named anchors for tracked labels. */
type Built = {update: (c: Clock) => void; anchors: THREE.Object3D[]; camera: (c: Clock) => {pos: [number, number, number]; look: [number, number, number]; fov?: number}};

const buildDominoes = (scene: THREE.Scene, spec: Extract<Spec, {preset: 'dominoes'}>, t: ModelTheme): Built => {
  const pieces: Array<{pivot: THREE.Group}> = [];
  const anchors: THREE.Object3D[] = [];
  const spacing = 1.34;
  for (let i = 0; i < spec.count; i++) {
    const pivot = new THREE.Group();
    const angle = i * 0.2;
    pivot.position.set(Math.sin(angle) * 2.4 - 0.6, 0, -i * spacing);
    pivot.rotation.y = Math.cos(angle) * 0.28;
    const safe = spec.stopAt !== undefined && i === spec.stopAt;
    const mesh = spec.piece
      ? buildObject(spec.piece, {...t, primary: safe ? t.secondary : t.primary})
      : (() => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.8, 0.34), gloss(i === 0 ? t.secondary : safe ? t.secondary : t.primary)); m.geometry.translate(0, 1.4, 0); m.castShadow = true; m.receiveShadow = true; const line = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.36), gloss(t.light)); line.position.y = 1.4; g.add(m, line); return g; })();
    pivot.add(mesh);
    const anchor = new THREE.Object3D(); anchor.position.y = 3.2; pivot.add(anchor);
    scene.add(pivot);
    pieces.push({pivot});
    anchors.push(anchor);
  }
  return {
    anchors,
    update: ({frame, fps, start}) => {
      const begin = start(spec.startCue);
      const stop = spec.stopAt ?? spec.count;
      pieces.forEach(({pivot}, i) => {
        const at = begin + sec((i / spec.count) * spec.seconds, fps);
        const fallen = i < stop ? ease.in(clamp01((frame - at) / sec(0.34, fps))) : 0;
        const wobble = i === stop ? Math.sin(clamp01((frame - at) / sec(0.8, fps)) * Math.PI * 3) * (1 - clamp01((frame - at) / sec(0.8, fps))) * 0.09 : 0;
        pivot.rotation.x = -fallen * 1.32 * (i < stop ? 1 : 0) - wobble;
      });
    },
    camera: ({frame, fps, start}) => {
      const begin = start(spec.startCue);
      const p = range((frame - begin) / sec(spec.seconds + 0.6, fps), [0, 1], [0, 1], 'inOut');
      const z = lerp(-1, -spec.count * spacing * 0.5, p);
      return {pos: [lerp(6, 8.5, p), lerp(8, 11, p), z + lerp(16, 22, p)], look: [0.4, lerp(3.2, 3.4, p), z - 2]};
    },
  };
};

const buildTower = (scene: THREE.Scene, spec: Extract<Spec, {preset: 'tower'}>, t: ModelTheme): Built => {
  const heightOf = spec.piece === 'coin' ? 0.18 : spec.piece === 'book' ? 0.36 : 1.82;
  const pieces: THREE.Group[] = [];
  for (let i = 0; i < spec.count; i++) {
    const obj = buildObject(spec.piece, {...t, primary: i % 7 === 6 ? t.secondary : t.primary});
    scene.add(obj);
    pieces.push(obj);
  }
  const top = new THREE.Object3D(); scene.add(top);
  const H = spec.count * heightOf;
  const offsets = pieces.map((_, i) => [Math.sin(i * 12.9898) * 0.05, Math.sin(i * 78.233) * 0.05, Math.sin(i * 37.1) * 0.9]);
  return {
    anchors: [top],
    update: ({frame, fps, start, t: time}) => {
      const begin = start(spec.buildCue);
      const hit = spec.collapseCue !== undefined ? clamp01((frame - start(spec.collapseCue)) / sec(1.1, fps)) : 0;
      pieces.forEach((p, i) => {
        const at = begin + sec((i / spec.count) * spec.seconds, fps);
        const landed = clamp01(springFrom(frame, at, fps, 'snap'));
        const base = i * heightOf;
        const y = lerp(base + 7, base, landed);
        p.visible = frame >= at;
        if (hit > 0) {
          const fall = hit * hit;
          const dir = offsets[i][2];
          p.position.set(offsets[i][0] + dir * fall * (1 + i * 0.09), Math.max(i * 0.01, y - fall * base * 1.05), offsets[i][1] + Math.cos(i * 3.1) * fall * 2);
          p.rotation.set(fall * dir * 1.6, i * 0.7, fall * dir * 2.1);
        } else {
          p.position.set(offsets[i][0], y, offsets[i][1]);
          p.rotation.y = i * 0.7 + time * 0.02;
        }
      });
      top.position.y = lerp(0, H, clamp01((frame - begin) / sec(spec.seconds, fps))) + 0.55;
    },
    camera: ({frame, fps, start}) => {
      const p = clamp01((frame - start(spec.buildCue)) / sec(spec.seconds + 0.4, fps));
      const e = ease.inOut(p);
      const h = Math.max(2.4, H * e);
      return {pos: [3.4, h * 0.62 + 2.6, h * 1.5 + 13], look: [0, h * 0.5 + 1.2, 0]};
    },
  };
};

const buildBalance = (scene: THREE.Scene, spec: Extract<Spec, {preset: 'balance'}>, t: ModelTheme): Built => {
  const metalMat = gloss(t.dark, {roughness: 0.24, metalness: 0.75});
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 0.3, 64), metalMat); base.position.y = 0.15; base.castShadow = true; scene.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 4.6, 32), metalMat); post.position.y = 2.45; post.castShadow = true; scene.add(post);
  const beam = new THREE.Group(); beam.position.y = 4.75; scene.add(beam);
  const bar = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 5.6, 8, 24), metalMat); bar.rotation.z = Math.PI / 2; bar.castShadow = true; beam.add(bar);
  const pans = [-2.8, 2.8].map((x, side) => {
    const hang = new THREE.Group(); hang.position.set(x, 0, 0); beam.add(hang);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8), metalMat); rod.position.y = -1.1; hang.add(rod);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.3, 0.14, 64), metalMat); pan.position.y = -2.26; pan.castShadow = true; pan.receiveShadow = true; hang.add(pan);
    const load = side === 0 ? spec.left : spec.right, count = side === 0 ? spec.leftCount : spec.rightCount;
    for (let i = 0; i < count; i++) {
      const object = buildObject(load, {...t, primary: side === 0 ? t.primary : t.secondary});
      object.scale.setScalar(load === 'coin' ? 1.25 : 0.95);
      object.position.set((i - (count - 1) / 2) * 0.95, -2.2 + (load === 'coin' ? i * 0.26 : load === 'book' ? i * 0.34 : 0), 0);
      if (load === 'coin' || load === 'book') object.position.x = 0;
      hang.add(object);
    }
    return hang;
  });
  const anchors = pans.map((hang) => { const a = new THREE.Object3D(); a.position.y = -2.9; hang.add(a); return a; });
  return {
    anchors,
    update: ({frame, fps, start, t: time}) => {
      let tilt = 0;
      for (const key of spec.tilts) tilt = lerp(tilt, key.tilt, springFrom(frame, start(key.cue), fps, 'bounce'));
      beam.rotation.z = -tilt + Math.sin(time * 0.9) * 0.006;
      pans.forEach((h) => { h.rotation.z = -beam.rotation.z; });
    },
    camera: ({t: time, frame, fps, start}) => {
      const push = spec.pushCue !== undefined ? tween(frame, start(spec.pushCue), 2.4, fps, 'inOut') : 0;
      return {pos: [lerp(Math.sin(time * 0.12) * 2, 2.6, push), lerp(8.5, 5.2, push), lerp(spec.pushCue !== undefined ? 34 : 29, 25, push)], look: [lerp(0, 0.5, push), lerp(spec.pushCue !== undefined ? 3.9 : 5.2, 4.2, push), 0]};
    },
  };
};

const buildIceberg = (scene: THREE.Scene, spec: Extract<Spec, {preset: 'iceberg'}>): Built => {
  const whole = new THREE.Group();
  // Ice stays ice in every art direction: its colour is what makes the metaphor readable.
  const upper = buildBerg(2.1, 1.75, 1.3, '#F4F8FA'); upper.position.y = 0.2; upper.castShadow = true; whole.add(upper);
  const lower = buildBerg(4.4, 6.3, 2.7, '#CFE4EE'); lower.position.y = -5.4; whole.add(lower);
  scene.add(whole);
  // The sea is a tinted volume: the frame gets a horizon and whatever is below it reads as submerged.
  const water = new THREE.Mesh(new THREE.BoxGeometry(400, 60, 400), new THREE.MeshBasicMaterial({color: '#0C3B55', transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide}));
  water.position.y = -30;
  scene.add(water);
  const top = new THREE.Object3D(); top.position.y = 2; scene.add(top);
  const under = new THREE.Object3D(); under.position.y = -5.4; scene.add(under);
  return {
    anchors: [top, under],
    update: ({frame, fps, start, t: time}) => {
      whole.rotation.y = time * 0.05;
      whole.position.y = Math.sin(time * 0.7) * 0.05;
      (water.material as THREE.MeshBasicMaterial).opacity = lerp(0.62, 0.36, tween(frame, start(spec.diveCue), 1.2, fps, 'inOut'));
    },
    camera: ({frame, fps, start}) => {
      const p = tween(frame, start(spec.diveCue), 1.5, fps, 'inOut');
      return {pos: [0, lerp(2.4, -3.4, p), lerp(25, 36, p)], look: [0, lerp(1.6, -4.4, p), 0]};
    },
  };
};

const buildOrbit = (scene: THREE.Scene, spec: Extract<Spec, {preset: 'orbit'}>, t: ModelTheme, texture: THREE.Texture | null): Built => {
  const globeMaterial = texture
    ? new THREE.MeshStandardMaterial({map: texture, roughness: 0.82, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.1})
    : gloss(t.primary, {roughness: 0.6});
  const globe = new THREE.Mesh(new THREE.SphereGeometry(3, 128, 96), globeMaterial);
  scene.add(globe);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(3.14, 96, 64), new THREE.MeshBasicMaterial({color: '#8FC8FF', transparent: true, opacity: 0.14, side: THREE.BackSide}));
  scene.add(atmosphere);
  const sats = Array.from({length: spec.satellites}, (_, i) => {
    const g = new THREE.Group();
    const bus = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.32), gloss(t.light, {metalness: 0.6, roughness: 0.3}));
    const wings = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.02, 0.2), gloss(t.secondary, {roughness: 0.2, metalness: 0.8}));
    g.add(bus, wings);
    scene.add(g);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({color: t.secondary}));
    scene.add(line);
    return {g, line, phase: (i / spec.satellites) * Math.PI * 2, tilt: 0.42 + i * 0.3, radius: 4.8 + (i % 2) * 0.6};
  });
  const [lat, lon] = spec.pin ?? [30, 30];
  const phi = ((90 - lat) * Math.PI) / 180, theta = ((lon + 180) * Math.PI) / 180;
  const R = 3.03;
  const local = new THREE.Vector3(-R * Math.sin(phi) * Math.cos(theta), R * Math.cos(phi), R * Math.sin(phi) * Math.sin(theta));
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 24), new THREE.MeshBasicMaterial({color: t.primary}));
  marker.position.copy(local);
  globe.add(marker);
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 48), new THREE.MeshBasicMaterial({color: t.primary, side: THREE.DoubleSide, transparent: true}));
  halo.position.copy(local);
  halo.lookAt(local.clone().multiplyScalar(2));
  globe.add(halo);
  const anchor = new THREE.Object3D();
  anchor.position.copy(local);
  globe.add(anchor);
  const worldPin = new THREE.Vector3();
  // Rotates the globe so the pin faces the lens as the lock completes.
  const faced = Math.atan2(local.x, local.z);
  return {
    anchors: [anchor, ...sats.map((s) => s.g)],
    update: ({frame, fps, start, t: time}) => {
      const lock = spec.lockCue !== undefined ? tween(frame, start(spec.lockCue), 1.4, fps, 'inOut') : 0;
      globe.rotation.y = lerp(-faced - 1.1 + time * 0.05, -faced, lock);
      globe.updateMatrixWorld(true);
      anchor.getWorldPosition(worldPin);
      const signal = spec.signalCue !== undefined ? tween(frame, start(spec.signalCue), 0.9, fps, 'inOut') : 1;
      const pulse = spec.lockCue !== undefined ? springFrom(frame, start(spec.lockCue), fps, 'pop') : 1;
      sats.forEach((s, i) => {
        const a = s.phase + time * 0.12;
        s.g.position.set(Math.cos(a) * s.radius, Math.sin(a) * Math.sin(s.tilt) * s.radius * 0.65 + 2, Math.sin(a) * Math.cos(s.tilt) * s.radius);
        s.g.lookAt(0, 0, 0);
        const reach = clamp01(signal * spec.satellites - i);
        (s.line.geometry as THREE.BufferGeometry).setFromPoints([s.g.position, s.g.position.clone().lerp(worldPin, reach)]);
        s.line.visible = reach > 0;
      });
      marker.scale.setScalar(0.6 + 1.1 * pulse);
      halo.scale.setScalar(1 + ((time * 0.8) % 1) * 3 * pulse);
      (halo.material as THREE.MeshBasicMaterial).opacity = (1 - ((time * 0.8) % 1)) * pulse;
    },
    camera: ({frame, fps, start, t: time}) => {
      const lock = spec.lockCue !== undefined ? tween(frame, start(spec.lockCue), 1.4, fps, 'inOut') : 0;
      const pin = worldPin;
      return {pos: [lerp(Math.sin(time * 0.07) * 1.2, pin.x * 2.2, lock), lerp(1.2, pin.y * 2.2, lock), lerp(26, pin.z * 4.4, lock)], look: [lerp(0, pin.x, lock), lerp(0.2, pin.y, lock), lerp(0, pin.z, lock)]};
    },
  };
};

const buildSpotlight = (scene: THREE.Scene, spec: Extract<Spec, {preset: 'spotlight'}>, t: ModelTheme): Built => {
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, 0.8, 96), gloss(t.dark, {roughness: 0.42, clearcoat: 0.2}));
  plinth.position.y = 0.4; plinth.receiveShadow = true; plinth.castShadow = true; scene.add(plinth);
  const holder = new THREE.Group(); holder.position.y = 0.8; scene.add(holder);
  const object = buildObject(spec.object, t);
  object.scale.setScalar(1.7);
  holder.add(object);
  const spot = new THREE.SpotLight('#fff', 0, 0, 0.42, 0.7, 0);
  spot.position.set(2.2, 13, 5);
  spot.target = holder;
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  spot.shadow.radius = 9;
  scene.add(spot);
  const anchor = new THREE.Object3D(); anchor.position.y = 4.8; scene.add(anchor);
  return {
    anchors: [anchor],
    update: ({frame, fps, start, t: time}) => {
      const on = spec.lightCue !== undefined ? tween(frame, start(spec.lightCue), 0.55, fps, 'out') : 1;
      spot.intensity = 5 * on;
      const spin = spec.spinCue !== undefined ? springFrom(frame, start(spec.spinCue), fps, 'soft') * Math.PI * 2 : 0;
      holder.rotation.y = -0.45 + time * 0.1 + spin;
      if (spec.breakCue !== undefined) {
        const b = clamp01((frame - start(spec.breakCue)) / sec(0.8, fps));
        holder.rotation.z = -b * b * 0.5;
        holder.position.y = 0.8 - b * b * 0.2;
      }
    },
    camera: ({t: time, frame, fps, start}) => {
      const push = tween(frame, start(spec.lightCue), 3.2, fps, 'outSoft');
      return {pos: [Math.sin(time * 0.1) * 1.4 + 2.6, 6, lerp(25, 22, push)], look: [0, 2.9, 0]};
    },
  };
};

const useTexture = (url: string | null) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => (url ? delayRender('Loading 3D texture') : null));
  useEffect(() => {
    if (!url || handle === null) return;
    new THREE.TextureLoader().load(url, (tex: THREE.Texture) => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; setTexture(tex); continueRender(handle); }, undefined, (e: unknown) => cancelRender(new Error(`Texture failed: ${url}: ${String(e)}`)));
  }, [url, handle]);
  return texture;
};

/** Real perspective, light and shadow. A DOM label can track any piece through the camera move. */
export const Stage3DScene: React.FC<{spec: Spec}> = ({spec}) => {
  const {frame, fps, start, palette, t, assets, spring, art} = useShot();
  const {width, height} = useVideoConfig();
  const region = useRegion();
  const ref = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const built = useRef<Built | null>(null);
  const textureId = spec.preset === 'orbit' ? spec.texture : undefined;
  const textureEntry = textureId ? assets[textureId] : null;
  const texture = useTexture(textureEntry ? assetUrl(textureEntry) : null);
  const titleTop = spec.titleAnchor === 'top';
  const titleSet = useSetting(spec.title ?? {text: ' ', reveal: 'none', role: 'display', tone: 'ink', align: 'left'}, {width: region.width, height: 420, maxSize: 140, minSize: 46});
  const titleHeight = spec.title ? titleSet.setting.height : 0;
  const titleY = titleTop ? region.top : region.bottom - titleHeight;
  // Tracked labels may roam the frame but never onto the title.
  const labelArea = titleTop ? {top: titleY + titleHeight + 24, bottom: region.bottom} : {top: region.top, bottom: titleY - 24};
  const clock: Clock = {frame, fps, start: (cue, fallback = 0) => start(cue, fallback), t};
  const models: ModelTheme = useMemo(() => ({primary: palette.accent, secondary: palette.accent2, dark: mix(palette.bg, '#101014', 0.6), light: mix(palette.surface, '#ffffff', 0.5)}), [palette]);

  useLayoutEffect(() => {
    if (!ref.current || (textureId && !texture)) return;
    if (!stage.current) {
      const s = createStage(ref.current, {width, height});
      addLights(s.scene, '#FFF4E4', palette.accent2);
      if (spec.floor && spec.preset !== 'iceberg' && spec.preset !== 'orbit') addFloor(s.scene);
      stage.current = s;
      const b = spec.preset === 'dominoes' ? buildDominoes(s.scene, spec, models)
        : spec.preset === 'tower' ? buildTower(s.scene, spec, models)
        : spec.preset === 'balance' ? buildBalance(s.scene, spec, models)
        : spec.preset === 'iceberg' ? buildIceberg(s.scene, spec)
        : spec.preset === 'orbit' ? buildOrbit(s.scene, spec, models, texture)
        : buildSpotlight(s.scene, spec, models);
      built.current = b;
    }
    const b = built.current!, s = stage.current;
    b.update(clock);
    const c = b.camera(clock);
    const swing = spec.orbit * (frame / fps / 8);
    const cos = Math.cos(swing), sin = Math.sin(swing);
    const dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
    s.camera.position.set(c.look[0] + dx * cos - dz * sin, c.pos[1], c.look[2] + dx * sin + dz * cos);
    s.camera.lookAt(c.look[0], c.look[1], c.look[2]);
    s.camera.updateMatrixWorld(true);
    s.scene.updateMatrixWorld(true);
    s.renderer.render(s.scene, s.camera);
    // Project tracked labels after the pose is final, and write them straight to the DOM of this frame.
    spec.labels.forEach((label, i) => {
      const el = document.getElementById(`${scene3dId(spec)}-${i}`);
      const anchor = typeof label.target === 'number' ? b.anchors[label.target] : b.anchors[0];
      if (!el || !anchor) return;
      const v = anchor.getWorldPosition(new THREE.Vector3()).project(s.camera);
      const x = (v.x * 0.5 + 0.5) * width, y = (-v.y * 0.5 + 0.5) * height;
      const w = el.offsetWidth, h = el.offsetHeight;
      el.style.left = `${Math.max(region.left, Math.min(region.right - w, x - w / 2))}px`;
      el.style.top = `${Math.max(labelArea.top, Math.min(labelArea.bottom - h, y - h - 20))}px`;
    });
  });
  useEffect(() => () => { stage.current?.dispose(); stage.current = null; built.current = null; }, []);

  return (
    <>
      <Backdrop light={[0.55, -0.22]}/>
      <canvas ref={ref} width={width} height={height} data-qa-focal style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}/>
      {spec.title && <SetText spec={spec.title} set={titleSet} left={region.left} top={titleY} width={region.width}/>}
      {(!textureId || texture) && spec.labels.map((label, i) => {
        const p = spring(label.cue, 'snap');
        return <Label key={i} moving={p < 0.98 || frame < start(label.cue) + sec(0.8, fps)} size={46} color={palette.ink} style={{position: 'absolute', left: 0, top: 0, maxWidth: 520, padding: '12px 22px', background: palette.bg, opacity: clamp01(p), borderRadius: art.radius, boxShadow: '0 14px 36px rgba(0,0,0,.28)', fontFamily: art.body.family, fontWeight: 700}} id={`${scene3dId(spec)}-${i}`}>{label.text}</Label>;
      })}
    </>
  );
};

const scene3dId = (spec: Spec) => `label3d-${spec.preset}`;

import React, {useEffect, useLayoutEffect, useRef} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {movingAttr, useRegion, useShot} from '../../context';
import {createStage, type Stage} from '../../fx/three-kit';
import {clamp01, ease, lerp, range, springFrom} from '../../motion/core';
import {Headline, textDefaults} from '../../type/Headline';

// The world of "gambling-loss-trap": one phone standing like a monolith, a corridor of debt, a fall through glass.
// Every pose is a pure function of the frame, so any frame renders alone. Text the viewer must read is DOM and
// measured by the guard; text on a 3D surface is scenery or doubled by the captions.

const COAL = '#050304';
const OFF_WHITE = '#F2EBDF';
const AMBER = '#E3A54A';
const BURGUNDY = '#7C1F33';
const RED = '#E8604F';
const SANS = 'Onest';
const COND = 'Sofia Sans Extra Condensed';

const texture = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
};

const softDisc = () => texture(256, 256, (c) => {
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,.42)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
});

const glow = (map: THREE.Texture, color: string, scale: [number, number], opacity = 1) => {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map, color, blending: THREE.AdditiveBlending, transparent: true, opacity, depthWrite: false, fog: false, toneMapped: false}));
  sprite.scale.set(scale[0], scale[1], 1);
  return sprite;
};

/** Seeded dust. Slow drift gives the dark room depth and keeps a held shot alive without moving the subject. */
const buildDust = (scene: THREE.Scene, map: THREE.Texture, count: number, box: [number, number, number], center: [number, number, number], color = '#E9C9A0') => {
  const geometry = new THREE.BufferGeometry();
  const seeds = Array.from({length: count}, (_, i) => [Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1, Math.abs(Math.sin(i * 78.233) * 12543.123) % 1, Math.abs(Math.sin(i * 37.719) * 9631.17) % 1]);
  const positions = new Float32Array(count * 3);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({map, color, size: 0.13, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false})));
  return (t: number) => {
    seeds.forEach(([a, b, c], i) => {
      positions[i * 3] = center[0] + (a - 0.5) * box[0] + Math.sin(t * (0.12 + c * 0.2) + i) * 0.4;
      positions[i * 3 + 1] = center[1] + ((b + t * (0.006 + c * 0.012)) % 1 - 0.5) * box[1];
      positions[i * 3 + 2] = center[2] + (c - 0.5) * box[2];
    });
    geometry.attributes.position.needsUpdate = true;
  };
};

/** One WebGL stage for a shot. `build` runs once and returns the per-frame pose. */
const useWorld = (build: (s: Stage) => () => void) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const pose = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (!stage.current) {
      stage.current = createStage(ref.current, {width: 1080, height: 1920});
      stage.current.renderer.setClearColor(COAL, 1);
    }
    pose.current = build(stage.current);
    pose.current();
    stage.current.scene.updateMatrixWorld(true);
    stage.current.renderer.render(stage.current.scene, stage.current.camera);
  });
  useEffect(() => () => { stage.current?.dispose(); stage.current = null; }, []);
  return ref;
};

/** Build a world once, and keep its pose callable with the closure of the current frame. */
const useOnce = <T,>(make: (s: Stage) => T) => {
  const made = useRef<T | null>(null);
  return (s: Stage) => {
    if (made.current === null) made.current = make(s);
    return made.current;
  };
};

const Canvas = React.forwardRef<HTMLCanvasElement>((_, ref) => <canvas ref={ref} width={1080} height={1920} data-qa-focal style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}/>);
Canvas.displayName = 'Canvas';

const fitCanvasText = (c: CanvasRenderingContext2D, text: string, weight: number, family: string, size: number, maxWidth: number) => {
  c.font = `${weight} ${size}px "${family}"`;
  const width = c.measureText(text).width;
  if (width > maxWidth) c.font = `${weight} ${Math.floor((size * maxWidth) / width)}px "${family}"`;
};

// --- The phone -----------------------------------------------------------------------------------------------

const PHONE = {w: 5.2, h: 10.6, d: 0.44, r: 0.5};
const SCREEN = {w: 1040, h: 2120};

const drawScreen = (c: CanvasRenderingContext2D, amount: string, hot: boolean) => {
  const {w, h} = SCREEN;
  const ground = c.createLinearGradient(0, 0, 0, h);
  ground.addColorStop(0, '#1A0D10');
  ground.addColorStop(1, '#070405');
  c.fillStyle = ground;
  c.fillRect(0, 0, w, h);
  c.fillStyle = '#B9AEA2';
  c.font = `600 56px "${SANS}"`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('23:47', w / 2, 118);
  c.fillStyle = '#21130F';
  c.strokeStyle = hot ? '#8E2F3F' : '#5C4A3A';
  c.lineWidth = 4;
  c.beginPath();
  c.roundRect(60, 300, w - 120, 800, 58);
  c.fill();
  c.stroke();
  c.fillStyle = '#D8CCBE';
  c.font = `600 66px "${SANS}"`;
  c.fillText('Ставка не сыграла', w / 2, 430);
  c.fillStyle = hot ? RED : OFF_WHITE;
  fitCanvasText(c, amount, 800, COND, 400, w - 180);
  c.fillText(amount, w / 2, 690);
  c.fillStyle = '#B9AEA2';
  c.font = `500 58px "${SANS}"`;
  c.fillText('рублей', w / 2, 960);
  const button = c.createLinearGradient(0, 1540, 0, 1900);
  button.addColorStop(0, '#F2BC65');
  button.addColorStop(1, '#C9842F');
  c.fillStyle = button;
  c.beginPath();
  c.roundRect(90, 1560, w - 180, 340, 80);
  c.fill();
  c.fillStyle = '#1A0F05';
  c.font = `800 210px "${COND}"`;
  c.fillText('Ещё раз', w / 2, 1736);
};

const roundedPlane = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const g = new THREE.ShapeGeometry(s, 16);
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return g;
};

/** The monolith on a wet floor. A flipped copy under a dark translucent floor makes the reflection. */
const buildPhoneRoom = (s: Stage, amount: string) => {
  const {scene} = s;
  const disc = softDisc();
  scene.fog = new THREE.FogExp2(COAL, 0.012);
  scene.environmentIntensity = 0.5;
  const canvas = document.createElement('canvas');
  canvas.width = SCREEN.w;
  canvas.height = SCREEN.h;
  const ctx = canvas.getContext('2d')!;
  drawScreen(ctx, amount, false);
  const screenTex = new THREE.CanvasTexture(canvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 16;
  const screen = new THREE.MeshBasicMaterial({map: screenTex, toneMapped: false, side: THREE.DoubleSide});
  const body = new THREE.MeshStandardMaterial({color: '#23211F', metalness: 1, roughness: 0.3, side: THREE.DoubleSide});
  const glass = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, map: texture(256, 512, (c) => {
    const g = c.createLinearGradient(0, 0, 256, 512);
    g.addColorStop(0, '#2B211D');
    g.addColorStop(0.42, '#100C0C');
    g.addColorStop(1, '#050404');
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 512);
  })});
  const makePhone = () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new RoundedBoxGeometry(PHONE.w + 0.3, PHONE.h + 0.3, PHONE.d, 8, PHONE.r * 0.5), body));
    const plane = new THREE.Mesh(roundedPlane(PHONE.w, PHONE.h, PHONE.r), screen);
    plane.position.z = PHONE.d / 2 + 0.004;
    g.add(plane);
    const off = new THREE.Mesh(roundedPlane(PHONE.w, PHONE.h, PHONE.r), glass);
    off.position.z = PHONE.d / 2 + 0.008;
    g.add(off);
    return g;
  };
  const phone = makePhone();
  phone.position.y = PHONE.h / 2 + 0.16;
  const mirror = makePhone();
  mirror.position.y = -PHONE.h / 2 - 0.16;
  mirror.scale.y = -1;
  scene.add(phone, mirror);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({color: '#070506', roughness: 0.34, metalness: 0.3, transparent: true, opacity: 0.8}));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const rimL = new THREE.PointLight(BURGUNDY, 0, 40, 1.2);
  rimL.position.set(-6, 9, -3);
  const rimR = new THREE.PointLight(AMBER, 0, 40, 1.2);
  rimR.position.set(6.5, 3, -2.5);
  const front = new THREE.PointLight('#FFE4BE', 0, 24, 1.4);
  front.position.set(0, 3, 6);
  scene.add(rimL, rimR, front);
  const back = glow(disc, BURGUNDY, [34, 26], 0.7);
  back.position.set(0, 6.5, -6);
  scene.add(back);
  const buttonGlow = glow(disc, AMBER, [9.5, 4.2], 0.3);
  buttonGlow.position.set(0, 1.85, 0.6);
  scene.add(buttonGlow);
  const spill = glow(disc, '#FFD9A8', [13, 3.4], 0.2);
  spill.position.set(0, 0.03, 2.6);
  scene.add(spill);
  const dust = buildDust(scene, disc, 160, [16, 14, 12], [0, 6, 3]);
  let current = `${amount}|false`;
  return {
    screen, glass, body, back, buttonGlow, spill, rimL, rimR, front, dust, disc,
    setAmount: (value: string, hot: boolean) => {
      const key = `${value}|${hot}`;
      if (key === current) return;
      current = key;
      drawScreen(ctx, value, hot);
      screenTex.needsUpdate = true;
    },
  };
};

/** Opening. The phone already burns in the first frame; the room dies around it as the sum grows in the sentence. */
export const LossPhone: React.FC<{darkCue: string; tenCue: string; buttonCue: string}> = ({darkCue, tenCue, buttonCue}) => {
  const {frame, fps, t, start, tween, durationFrames} = useShot();
  const make = useOnce((s: Stage) => buildPhoneRoom(s, '−1 000'));
  const dark = tween(darkCue, 1.5, 'inOut');
  const hit = frame - start(tenCue);
  const ten = hit >= 0;
  const button = tween(buttonCue, 0.7, 'outSoft');
  const ref = useWorld((s) => () => {
    const w = make(s);
    // A slow creep, then the rush arrives with the word: the push is the blow.
    const p = 0.14 * clamp01(frame / durationFrames) + 0.86 * tween(tenCue, 0.95, 'inOut', -0.28);
    const shake = ten ? Math.exp(-hit / (fps * 0.16)) * 0.1 : 0;
    w.setAmount(ten ? '−10 000' : '−1 000', ten);
    s.camera.position.set(lerp(1.5, 0.15, p) + Math.sin(frame * 2.1) * shake, lerp(1.9, 7.2, p) + Math.cos(frame * 1.7) * shake, lerp(26, 17, p));
    s.camera.lookAt(0, lerp(4.4, 7.1, p), 0);
    w.rimL.intensity = lerp(70, 8, dark);
    w.rimR.intensity = lerp(55, 5, dark);
    w.front.intensity = lerp(9, 2, dark);
    w.back.material.opacity = lerp(0.8, 0.16, dark) + (ten ? Math.exp(-hit / (fps * 0.4)) * 0.5 : 0);
    w.buttonGlow.material.opacity = 0.22 + button * (0.6 + Math.sin(t * 7) * 0.08);
    w.spill.material.opacity = 0.2 + button * 0.2;
    w.dust(t);
  });
  return <><Canvas ref={ref}/><div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 66% 52% at 50% 44%, transparent 44%, rgba(3,1,2,${(0.25 + dark * 0.6).toFixed(3)}) 100%)`}}/></>;
};

// --- The corridor --------------------------------------------------------------------------------------------

const debtWall = (seed: number) => texture(2048, 1024, (c) => {
  c.fillStyle = '#0D0708';
  c.fillRect(0, 0, 2048, 1024);
  c.textBaseline = 'middle';
  const sums = ['−1 000', '−2 000', '−5 000', '−10 000', '−3 000', '−7 000', '−20 000', '−500'];
  for (let row = 0; row < 7; row++) {
    const y = 74 + row * 146;
    let x = -((row * 173 + seed * 61) % 300);
    let i = row * 3 + seed;
    while (x < 2048) {
      const value = sums[i % sums.length];
      const bright = Math.abs(Math.sin(i * 9.17 + seed)) ;
      c.font = `800 ${118 + (i % 3) * 14}px "${COND}"`;
      c.fillStyle = bright > 0.82 ? '#E8A64E' : bright > 0.4 ? '#7A2C35' : '#40191E';
      c.fillText(value, x, y);
      x += c.measureText(value).width + 58;
      i += 1;
    }
  }
});

const zeroSign = () => texture(512, 512, (c) => {
  c.clearRect(0, 0, 512, 512);
  c.fillStyle = '#FFF4DF';
  c.font = `800 500px "${COND}"`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('0', 256, 276);
});

/** A wall as a grid of (u, v) mapped through a function, so it can taper with depth. */
const sheetOf = (fn: (u: number, v: number) => [number, number, number], material: THREE.Material, repeat: number) => {
  const nu = 50;
  const positions: number[] = [], uvs: number[] = [], index: number[] = [];
  for (let i = 0; i <= nu; i++) for (const v of [0, 1]) {
    const [x, y, z] = fn(i / nu, v);
    positions.push(x, y, z);
    uvs.push((i / nu) * repeat, v);
  }
  for (let i = 0; i < nu; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  return new THREE.Mesh(g, material);
};

/** You walk towards zero and it walks away. The counter is the only thing that gets closer. */
export const ZeroCorridor: React.FC<{amounts: string[]; cues: string[]; farCue: string; costCue: string}> = ({amounts, cues, farCue, costCue}) => {
  const {frame, fps, t, start, art, palette, durationFrames} = useShot();
  const region = useRegion();
  const make = useOnce((s: Stage) => {
    const {scene} = s;
    const disc = softDisc();
    scene.fog = new THREE.FogExp2('#0B0406', 0.016);
    const LENGTH = 340;
    const taper = (u: number) => lerp(1, 0.42, u);
    const group = new THREE.Group();
    scene.add(group);
    const wall = (seed: number) => {
      const map = debtWall(seed);
      map.wrapS = THREE.RepeatWrapping;
      return new THREE.MeshBasicMaterial({map, side: THREE.DoubleSide});
    };
    const leftMat = wall(1), rightMat = wall(4), roofMat = wall(7), floorMat = wall(10);
    floorMat.color.setRGB(0.34, 0.3, 0.3);
    const HW = 4.2, HH = 6.4;
    group.add(sheetOf((u, v) => [-HW * taper(u), (v - 0.5) * 2 * HH * taper(u), -u * LENGTH], leftMat, 22));
    group.add(sheetOf((u, v) => [HW * taper(u), (v - 0.5) * 2 * HH * taper(u), -u * LENGTH], rightMat, 22));
    group.add(sheetOf((u, v) => [(v - 0.5) * 2 * HW * taper(u), HH * taper(u), -u * LENGTH], roofMat, 22));
    group.add(sheetOf((u, v) => [(v - 0.5) * 2 * HW * taper(u), -HH * taper(u), -u * LENGTH], floorMat, 22));
    // Ribs pass the lens and sell the speed; they are the only hard light in the corridor.
    const ribMat = new THREE.MeshBasicMaterial({color: '#C24A4F', toneMapped: false});
    for (let i = 0; i < 34; i++) {
      const u = (i + 1) / 36, z = -u * LENGTH;
      const w = HW * taper(u), h = HH * taper(u);
      const add = (bw: number, bh: number, x: number, y: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.12), ribMat); m.position.set(x, y, z); group.add(m); };
      add(w * 2, 0.07, 0, h - 0.04);
      add(0.07, h * 2, -w + 0.04, 0);
      add(0.07, h * 2, w - 0.04, 0);
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({map: zeroSign(), transparent: true, fog: false, toneMapped: false, depthWrite: false}));
    scene.add(sign);
    const halo = glow(disc, '#FFD9A0', [1, 1], 0.9);
    scene.add(halo);
    return {group, sign, halo, leftMat, rightMat, roofMat, ribMat};
  });
  const hits = cues.map((cue) => start(cue));
  const reached = hits.filter((h) => frame >= h).length;
  const amount = amounts[reached] ?? amounts[amounts.length - 1];
  const pop = reached ? springFrom(frame, hits[reached - 1], fps, 'pop') : 1;
  const far = range(frame, [start(farCue), start(costCue)], [0, 1], 'inOut');
  const crawl = range(frame, [start(costCue), durationFrames], [0, 1], 'outSoft');
  const ref = useWorld((s) => () => {
    const w = make(s);
    // Forward at full tilt on the promise, then every sum brakes it. By the last word it barely moves.
    const hope = range(frame, [hits[0] - fps * 2.1, hits[0]], [0, 1], 'in');
    let z = -hope * 46;
    hits.forEach((h) => { z -= springFrom(frame, h, fps, 'heavy') * 16; });
    z -= far * 9 + crawl * 1.2 + frame * 0.012;
    const squeeze = hits.reduce((v, h) => v * lerp(1, 0.82, springFrom(frame, h, fps, 'heavy')), 1);
    w.group.scale.set(lerp(squeeze, squeeze * 0.86, far), lerp(squeeze, squeeze * 0.92, far), 1);
    const impact = hits.reduce((v, h) => (frame >= h ? v + Math.exp(-(frame - h) / (fps * 0.12)) : v), 0);
    s.camera.fov = 44 + impact * 7;
    s.camera.updateProjectionMatrix();
    s.camera.position.set(Math.sin(t * 0.7) * 0.18 + Math.sin(frame * 2.3) * impact * 0.1, Math.sin(t * 0.5) * 0.12 + Math.cos(frame * 1.9) * impact * 0.08, z);
    s.camera.lookAt(s.camera.position.x * 0.4, 0.15, z - 40);
    s.camera.up.set(Math.sin(t * 0.33) * 0.02 + crawl * 0.03, 1, 0);
    // The zero: near on the promise, shoved away by each sum, a pinprick at the end.
    const near = lerp(62, 15, hope);
    const distance = hits.reduce((d, h, i) => lerp(d, [34, 62, 96][i], springFrom(frame, h, fps, 'soft')), near) + far * 130;
    const size = 8.4;
    w.sign.position.set(0, 0.15, z - distance);
    w.sign.scale.set(size, size, 1);
    w.halo.position.copy(w.sign.position);
    const haloSize = size * 3 + far * 32;
    w.halo.scale.set(haloSize, haloSize, 1);
    w.halo.material.opacity = lerp(0.9, 0.55, far);
    const burn = clamp01(impact * 0.8);
    w.ribMat.color.set(new THREE.Color('#A83B45').lerp(new THREE.Color('#FF6A54'), burn));
    const level = 0.9 + burn * 0.6;
    for (const m of [w.leftMat, w.rightMat, w.roofMat]) m.color.setRGB(level, level * 0.92, level * 0.9);
  });
  const size = 300;
  return (
    <>
      <Canvas ref={ref}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 760, background: 'linear-gradient(to bottom, rgba(5,3,4,.82) 0%, rgba(5,3,4,.5) 58%, rgba(5,3,4,0) 100%)'}}/>
      <div data-qa="text" {...movingAttr(pop < 0.98)} style={{position: 'absolute', left: region.left, width: region.width, top: region.top + 40, textAlign: 'center', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: size, lineHeight: 1, whiteSpace: 'nowrap', color: reached ? RED : palette.ink, transform: `scale(${lerp(1.34, 1, Math.min(1.1, pop)).toFixed(3)})`, transformOrigin: '50% 40%', textShadow: '0 6px 60px rgba(0,0,0,.9)', opacity: reached ? 1 : range(frame, [0, fps * 0.3], [0.86, 1])}}>{amount}</div>
    </>
  );
};

// --- The fall ------------------------------------------------------------------------------------------------

const SHEET = {w: 15, h: 26};
const COLS = 7, ROWS = 12;

const glassFace = (text: string) => texture(1024, 1776, (c) => {
  c.clearRect(0, 0, 1024, 1776);
  c.fillStyle = 'rgba(92,18,38,.34)';
  c.fillRect(0, 0, 1024, 1776);
  const sheen = c.createLinearGradient(0, 0, 1024, 1776);
  sheen.addColorStop(0.2, 'rgba(255,240,220,0)');
  sheen.addColorStop(0.46, 'rgba(255,240,220,.16)');
  sheen.addColorStop(0.56, 'rgba(255,240,220,0)');
  c.fillStyle = sheen;
  c.fillRect(0, 0, 1024, 1776);
  c.strokeStyle = 'rgba(255,214,170,.65)';
  c.lineWidth = 10;
  c.strokeRect(6, 6, 1012, 1764);
  c.fillStyle = '#F4E6D2';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fitCanvasText(c, text, 800, COND, 130, 340);
  c.fillText(text, 512, 888);
});

/** A pane cut into jittered triangles. Before its hit it is one sheet; after, the triangles fly apart. */
const buildPane = (scene: THREE.Scene, face: THREE.Texture, y: number, seed: number) => {
  const jitter = (i: number, j: number, k: number) => (i === 0 || i === COLS || j === 0 || j === ROWS ? 0 : (Math.sin((i * 12.9 + j * 78.2 + seed) * (k + 1)) * 43758.5) % 1 * 0.34);
  const vertex = (i: number, j: number): [number, number] => [(i + jitter(i, j, 0)) / COLS, (j + jitter(i, j, 1)) / ROWS];
  const tris: Array<[[number, number], [number, number], [number, number]]> = [];
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const a = vertex(i, j), b = vertex(i + 1, j), c = vertex(i + 1, j + 1), d = vertex(i, j + 1);
    tris.push([a, b, c], [a, c, d]);
  }
  const positions = new Float32Array(tris.length * 9);
  const uvs = new Float32Array(tris.length * 6);
  const colors = new Float32Array(tris.length * 9);
  const shards = tris.map((tri, n) => {
    const cu = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cv = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
    tri.forEach(([u, v], k) => {
      uvs[n * 6 + k * 2] = u;
      uvs[n * 6 + k * 2 + 1] = v;
      const shade = 0.72 + Math.abs(Math.sin(n * 7.3)) * 0.42;
      colors.set([shade, shade, shade], n * 9 + k * 3);
    });
    const center = new THREE.Vector3((cu - 0.5) * SHEET.w, 0, (0.5 - cv) * SHEET.h);
    const local = tri.map(([u, v]) => new THREE.Vector3((u - 0.5) * SHEET.w, 0, (0.5 - v) * SHEET.h).sub(center));
    return {center, local, axis: new THREE.Vector3(Math.sin(n * 3.1), Math.cos(n * 1.7), Math.sin(n * 5.3)).normalize(), spin: 2 + Math.abs(Math.sin(n * 2.9)) * 5, speed: 0.7 + Math.abs(Math.sin(n * 4.7)) * 1.1};
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: face, vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false}));
  mesh.position.y = y;
  mesh.frustumCulled = false;
  scene.add(mesh);
  const q = new THREE.Quaternion(), v = new THREE.Vector3();
  return (b: number) => {
    shards.forEach((shard, n) => {
      q.setFromAxisAngle(shard.axis, b * shard.spin);
      const spread = 1 + b * 2.4 * shard.speed;
      const drop = -b * b * 34 * shard.speed;
      shard.local.forEach((p, k) => {
        v.copy(p).applyQuaternion(q);
        positions[n * 9 + k * 3] = shard.center.x * spread + v.x;
        positions[n * 9 + k * 3 + 1] = drop + v.y;
        positions[n * 9 + k * 3 + 2] = shard.center.z * spread + v.z;
      });
    });
    geometry.attributes.position.needsUpdate = true;
    mesh.material.opacity = 1 - clamp01((b - 0.45) / 0.55);
    mesh.visible = mesh.material.opacity > 0;
  };
};

/** Dull bronze with a stamped sum: a thing that costs, not a prize. Each face carries the next thousand. */
const buildCoin = () => {
  const g = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({color: '#7C6134', metalness: 1, roughness: 0.42});
  const R = 2.2;
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.42, 96), bronze));
  for (const side of [1, -1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R - 0.09, 0.1, 16, 96), bronze);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = side * 0.21;
    g.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(R - 0.16, 72), new THREE.MeshStandardMaterial({metalness: 0.9, roughness: 0.5, map: texture(512, 512, (c) => {
      c.fillStyle = '#6A5129';
      c.fillRect(0, 0, 512, 512);
      c.fillStyle = '#E8CF9C';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `800 190px "${COND}"`;
      c.fillText('1 000', 256, 262);
    })}));
    face.rotation.x = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    face.position.y = side * 0.215;
    g.add(face);
  }
  return g;
};

/** The object falls and the promise it passes through breaks on each word. The last pane holds. */
export const DecisionFall: React.FC<{panes: string[]; hits: string[]; planCue: string; betCue: string; plan: string; bet: string}> = ({panes, hits, planCue, betCue, plan, bet}) => {
  const {frame, fps, t, start, tween} = useShot();
  const region = useRegion();
  const STEP = 22;
  const hitFrames = hits.map((cue) => start(cue));
  const make = useOnce((s: Stage) => {
    const {scene} = s;
    const disc = softDisc();
    scene.fog = new THREE.FogExp2('#150609', 0.018);
    s.camera.fov = 38;
    s.camera.updateProjectionMatrix();
    scene.environmentIntensity = 0.9;
    const key = new THREE.DirectionalLight('#FFE3BC', 3.2);
    key.position.set(3, 8, 2);
    const rim = new THREE.DirectionalLight('#FF5B5B', 2.2);
    rim.position.set(-4, -6, -3);
    scene.add(key, rim);
    const breaks = panes.map((text, i) => buildPane(scene, glassFace(text), -(i + 1) * STEP, i * 3 + 1));
    const coin = buildCoin();
    scene.add(coin);
    // Long threads of light along the fall: they stay put while the camera drops past them.
    const threads = Array.from({length: 46}, (_, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 30, 0.03), new THREE.MeshBasicMaterial({color: i % 3 ? '#7C1F33' : '#C9842F', transparent: true, opacity: 0.55, toneMapped: false}));
      const a = i * 2.4, r = 7 + (i % 7) * 1.6;
      m.position.set(Math.cos(a) * r, -((i * 13) % 150) + 10, Math.sin(a) * r * 1.5);
      scene.add(m);
      return m;
    });
    void threads;
    const below = glow(disc, '#E3762F', [50, 50], 0.5);
    scene.add(below);
    // The pane that holds: it takes the coin and cracks from the point of contact.
    const crack = new THREE.Mesh(new THREE.PlaneGeometry(SHEET.w, SHEET.h), new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false, toneMapped: false, map: texture(1024, 1776, (c) => {
      c.clearRect(0, 0, 1024, 1776);
      c.strokeStyle = 'rgba(255,235,210,.92)';
      c.lineCap = 'round';
      for (let i = 0; i < 17; i++) {
        let a = (i / 17) * Math.PI * 2 + Math.sin(i * 5.1) * 0.2;
        let x = 512, y = 888;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x, y);
        for (let k = 0; k < 9; k++) {
          const step = 60 + Math.abs(Math.sin(i * 3.7 + k * 1.9)) * 130;
          a += Math.sin(i * 7.3 + k * 2.3) * 0.3;
          x += Math.cos(a) * step;
          y += Math.sin(a) * step;
          c.lineTo(x, y);
        }
        c.stroke();
      }
    })}));
    crack.rotation.x = -Math.PI / 2;
    crack.position.set(0, -panes.length * STEP + 0.02, 3.1);
    scene.add(crack);
    return {breaks, coin, below, crack};
  });
  const planP = tween(planCue, 0.5, 'out', -0.75);
  const betP = springFrom(frame, start(betCue), fps, 'pop');
  const betOn = frame >= start(betCue);
  const ref = useWorld((s) => () => {
    const w = make(s);
    // The object accelerates into each pane and hits it exactly on the word, then drops on to the next.
    const stops = [-fps * 0.6, ...hitFrames];
    let depth = 0;
    for (let i = 0; i < stops.length - 1; i++) depth += ease.in(clamp01((frame - stops[i]) / (stops[i + 1] - stops[i]))) * STEP;
    const coinY = -depth + 0.55;
    const impact = hitFrames.reduce((v, h) => (frame >= h ? Math.max(v, Math.exp(-(frame - h) / (fps * 0.13))) : v), 0);
    // It drifts off the centre on the last drop, so the last promise stays readable above where it lands.
    const aside = range(frame, [hitFrames[hitFrames.length - 2], hitFrames[hitFrames.length - 1]], [0, 3.1], 'inOut');
    w.coin.position.set(Math.sin(t * 2.3) * 0.32, coinY, Math.cos(t * 1.9) * 0.32 + aside);
    // On the last word it stops tumbling and lies flat, the sum upward.
    const land = frame >= hitFrames[hitFrames.length - 1] ? ease.outSoft(clamp01((frame - hitFrames[hitFrames.length - 1]) / (fps * 0.32))) : 0;
    w.coin.rotation.set(lerp(1.05 + t * 2.2, Math.round((1.05 + t * 2.2) / (Math.PI * 2)) * Math.PI * 2, land), lerp(t * 0.7, 0, land), lerp(t * 1.6, 0, land));
    w.crack.material.opacity = land * 0.62;
    w.breaks.forEach((apply, i) => {
      const last = i === panes.length - 1;
      const b = !last && frame >= hitFrames[i] ? clamp01((frame - hitFrames[i]) / (fps * 0.95)) : 0;
      apply(b);
    });
    const camY = coinY + 19 + land * (0.6 + (frame - hitFrames[hitFrames.length - 1]) * 0.012) + Math.sin(frame * 2.7) * impact * 0.5;
    s.camera.position.set(Math.sin(t * 0.8) * 0.5 + Math.sin(frame * 2.1) * impact * 0.4, camY, Math.cos(t * 0.6) * 0.5);
    s.camera.up.set(Math.sin(t * 0.3) * 0.5, 0, -1);
    s.camera.lookAt(0, camY - 20, aside * 0.25);
    w.below.position.set(0, coinY - 34, 0);
    w.below.material.opacity = lerp(0.42, 0.8, impact);
  });
  const size = 138;
  return (
    <>
      <Canvas ref={ref}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 700, background: 'linear-gradient(to bottom, rgba(10,3,5,.86) 0%, rgba(10,3,5,.6) 56%, rgba(10,3,5,0) 100%)'}}/>
      {!betOn && planP > 0 && <div data-qa="text" {...movingAttr(planP < 1)} style={{position: 'absolute', left: region.left, width: region.width, top: region.top + 40, textAlign: 'center', fontFamily: 'Sofia Sans Extra Condensed', fontWeight: 800, fontSize: size * 1.2, lineHeight: 1, color: OFF_WHITE, opacity: planP, transform: `translateY(${(1 - planP) * 30}px)`, whiteSpace: 'nowrap'}}>{plan}</div>}
      {betOn && <div data-qa="text" {...movingAttr(betP < 0.98)} style={{position: 'absolute', left: region.left, width: region.width, top: region.top + 30, textAlign: 'center', fontFamily: 'Sofia Sans Extra Condensed', fontWeight: 800, fontSize: size * 1.06, lineHeight: 1, color: RED, transform: `scale(${lerp(1.22, 1, Math.min(1.08, betP)).toFixed(3)})`, whiteSpace: 'nowrap'}}>{bet}</div>}
    </>
  );
};

// --- The quiet -----------------------------------------------------------------------------------------------

/** The opening shot in reverse: the finger comes, the finger stops, the screen goes dark, the room gets its light back. */
export const QuietButton: React.FC<{stopCue: string; leaveCue: string; offCue: string; lineCue: string; line: string}> = ({stopCue, leaveCue, offCue, lineCue, line}) => {
  const {frame, fps, t, tween, durationFrames} = useShot();
  const region = useRegion();
  const make = useOnce((s: Stage) => {
    const w = buildPhoneRoom(s, '−10 000');
    w.setAmount('−10 000', true);
    // A shadow, not a model: a fingertip on a lit screen reads by the light it takes away.
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 8), new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false, toneMapped: false, map: texture(230, 800, (c) => {
      c.clearRect(0, 0, 230, 800);
      c.filter = 'blur(13px)';
      c.fillStyle = '#000';
      c.beginPath();
      c.roundRect(48, 40, 134, 900, 67);
      c.fill();
    })}));
    shade.rotation.z = 0.12;
    shade.position.z = PHONE.d / 2 + 0.03;
    s.scene.add(shade);
    const dawn = glow(w.disc, '#D98A53', [46, 20], 0);
    dawn.position.set(0, 3.2, -9);
    s.scene.add(dawn);
    return {...w, shade, dawn};
  });
  const come = range(frame, [0, fps * 1.05], [0, 1], 'inOut');
  const stop = tween(stopCue, 0.5, 'outSoft');
  const leave = tween(leaveCue, 1.2, 'inOut');
  const off = tween(offCue, 0.9, 'inOut');
  const lineP = tween(lineCue, 0.9, 'outSoft', 0.42);
  const near = lerp(come, 0.9, stop) * (1 - leave);
  const ref = useWorld((s) => () => {
    const w = make(s);
    const p = ease.inOut(clamp01((frame + fps * 0.4) / durationFrames));
    // The tip climbs the screen, stops over the button and never takes it.
    w.shade.position.x = lerp(1.5, 0.48, near) + stop * (1 - leave) * Math.sin(t * 9) * 0.012;
    w.shade.position.y = lerp(-5.5, -1, near);
    (w.shade.material as THREE.MeshBasicMaterial).opacity = clamp01(near * 2.2) * 0.86 * (1 - off);
    // Screen: full, then a black mirror. The glass layer takes over as the picture goes.
    const level = 1 - off;
    w.screen.color.setRGB(level, level, level);
    w.glass.opacity = off;
    w.buttonGlow.material.opacity = (0.55 + Math.sin(t * 5) * 0.05 - near * 0.2) * level;
    w.spill.material.opacity = 0.3 * level;
    w.back.material.opacity = 0.14 * level;
    w.dawn.material.opacity = off * lerp(0.56, 0.86, clamp01(frame / durationFrames));
    w.rimL.intensity = off * 26;
    w.rimL.color.set('#E08F5C');
    w.rimR.intensity = off * 34;
    w.rimR.color.set('#E8A567');
    w.front.intensity = 1.2 + off * 2.4;
    s.camera.position.set(lerp(0.3, -0.5, p), lerp(2.5, 2.1, p), lerp(19, 28, ease.inOut(off * 0.82 + p * 0.18)) + clamp01(frame / durationFrames) * 1.6);
    s.camera.lookAt(0, lerp(3.6, 4.6, off), 0);
    w.dust(t);
  });
  return (
    <>
      <Canvas ref={ref}/>
      {lineP > 0 && <div style={{opacity: lineP}}><Headline spec={textDefaults(line, {cue: lineCue, reveal: 'none', role: 'italic', tone: 'ink', align: 'center', emphasis: 'color'})} box={{left: region.left + 20, top: region.top + 30, width: region.width - 40, height: 340}} anchor="top" maxSize={120} minSize={72}/></div>}
    </>
  );
};

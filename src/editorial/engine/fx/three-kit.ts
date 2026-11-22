import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

// Shared studio and procedural models. Every model is built in code, so it carries no third-party licence.

export type Stage = {renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; dispose: () => void};

export const createStage = (canvas: HTMLCanvasElement, opts: {floorColor?: string; width: number; height: number; fov?: number}): Stage => {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true, alpha: true});
  renderer.setPixelRatio(1);
  renderer.setSize(opts.width, opts.height, false);
  // Neutral keeps art-direction colours true; filmic curves would wash a brand yellow out.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 28, opts.width / opts.height, 0.1, 200);
  return {renderer, scene, camera, dispose: () => { env.dispose(); pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss(); }};
};

/** Key, rim and fill: the three-point setup that gives objects form instead of a flat render. */
export const addLights = (scene: THREE.Scene, key: string, rim: string) => {
  const k = new THREE.DirectionalLight(key, 2.1);
  k.position.set(5, 9, 6);
  k.castShadow = true;
  k.shadow.mapSize.set(2048, 2048);
  k.shadow.bias = -0.0004;
  k.shadow.radius = 7;
  Object.assign(k.shadow.camera, {left: -18, right: 18, top: 18, bottom: -18, near: 0.5, far: 60});
  scene.add(k);
  const r = new THREE.DirectionalLight(rim, 1.5);
  r.position.set(-6, 4, -7);
  scene.add(r);
  const f = new THREE.HemisphereLight('#ffffff', '#222222', 0.28);
  scene.add(f);
  return {key: k, rim: r, fill: f};
};

export const addFloor = (scene: THREE.Scene, y = 0, opacity = 0.34) => {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({opacity}));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
};

export const gloss = (color: string, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => new THREE.MeshPhysicalMaterial({color, roughness: 0.36, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.3, ...o});
const metal = (color: string, roughness = 0.28) => new THREE.MeshStandardMaterial({color, roughness, metalness: 1});

const shadow = <T extends THREE.Object3D>(o: T): T => {
  o.traverse((c: THREE.Object3D) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  return o;
};
const box = (w: number, h: number, d: number, r: number, mat: THREE.Material) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 6, r), mat);

export type ModelTheme = {primary: string; secondary: string; dark: string; light: string};

/** Procedural objects; each stands about 2 units tall with its base on y = 0. */
export const buildObject = (kind: string, t: ModelTheme): THREE.Group => {
  const g = new THREE.Group();
  const p = gloss(t.primary), d = gloss(t.dark, {roughness: 0.5}), l = gloss(t.light);
  switch (kind) {
    case 'house': {
      const body = box(2, 1.3, 1.7, 0.05, l); body.position.y = 0.65; g.add(body);
      const roofShape = new THREE.Shape(); roofShape.moveTo(-1.22, 0); roofShape.lineTo(0, 0.98); roofShape.lineTo(1.22, 0); roofShape.closePath();
      const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, {depth: 1.9, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3}), p);
      roof.position.set(0, 1.28, -0.95); g.add(roof);
      const door = box(0.42, 0.78, 0.06, 0.02, d); door.position.set(-0.42, 0.39, 0.86); g.add(door);
      const win = box(0.54, 0.46, 0.06, 0.02, gloss(t.secondary, {roughness: 0.1, emissive: t.secondary, emissiveIntensity: 0.25})); win.position.set(0.42, 0.74, 0.86); g.add(win);
      break;
    }
    case 'card': {
      const body = box(2.5, 1.6, 0.09, 0.04, p); body.position.y = 0.8; g.add(body);
      const stripe = box(2.5, 0.3, 0.1, 0.01, d); stripe.position.set(0, 1.18, 0.002); g.add(stripe);
      const chip = box(0.4, 0.3, 0.11, 0.03, metal(t.secondary, 0.34)); chip.position.set(-0.74, 0.74, 0.01); g.add(chip);
      break;
    }
    case 'coin': {
      const gold = '#D9B45B';
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.16, 96), metal(gold, 0.3)); c.position.y = 0.08; g.add(c);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.05, 16, 96), metal(gold, 0.22)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.16; g.add(rim);
      break;
    }
    case 'phone': {
      const body = box(1.1, 2.2, 0.12, 0.05, metal('#34353B', 0.24)); body.position.y = 1.1; g.add(body);
      const screen = box(1.0, 2.08, 0.02, 0.009, gloss('#0B0C10', {roughness: 0.08, emissive: t.primary, emissiveIntensity: 0.32})); screen.position.set(0, 1.1, 0.06); g.add(screen);
      break;
    }
    case 'tv': {
      const body = box(3, 1.8, 0.12, 0.03, gloss('#121318', {roughness: 0.25})); body.position.y = 1.2; g.add(body);
      const panel = box(2.88, 1.68, 0.02, 0.009, gloss('#0B0C10', {roughness: 0.1, emissive: t.primary, emissiveIntensity: 0.5})); panel.position.set(0, 1.2, 0.06); g.add(panel);
      const stand = box(1.4, 0.05, 0.5, 0.02, metal('#55575D')); stand.position.y = 0.03; g.add(stand);
      const neck = box(0.18, 0.3, 0.08, 0.02, metal('#55575D')); neck.position.y = 0.17; g.add(neck);
      break;
    }
    case 'key': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.11, 24, 72), metal(t.primary)); ring.position.y = 1.72; g.add(ring);
      const shaft = box(0.2, 1.3, 0.14, 0.03, metal(t.primary)); shaft.position.y = 0.66; g.add(shaft);
      for (const y of [0.12, 0.36]) { const tooth = box(0.32, 0.14, 0.14, 0.02, metal(t.primary)); tooth.position.set(0.22, y, 0); g.add(tooth); }
      break;
    }
    case 'book': {
      const cover = box(1.8, 0.34, 2.4, 0.03, p); cover.position.y = 0.17; g.add(cover);
      const pages = box(1.68, 0.24, 2.3, 0.01, l); pages.position.set(0.05, 0.17, 0); g.add(pages);
      break;
    }
    case 'weight': {
      const iron = new THREE.MeshStandardMaterial({color: '#6A5C4E', metalness: 0.35, roughness: 0.5});
      const pts = [[0, 0], [1.12, 0], [1.16, 0.08], [0.98, 1.22], [0.72, 1.42], [0, 1.46]].map(([x, y]) => new THREE.Vector2(x, y));
      g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 72), iron));
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.09, 1.135, 0.12, 72), gloss(t.primary, {roughness: 0.3, emissive: t.primary, emissiveIntensity: 0.7})); band.position.y = 0.3; g.add(band);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.11, 18, 56), iron); handle.position.y = 1.68; g.add(handle);
      break;
    }
    case 'sphere': {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), p); ball.position.y = 1; g.add(ball);
      break;
    }
    default: {
      const b = box(1.8, 1.8, 1.8, 0.12, p); b.position.y = 0.9; g.add(b);
    }
  }
  return shadow(g);
};

/** Slightly faceted rock with an upper/lower split, used by the iceberg. */
export const buildBerg = (radius: number, height: number, seed: number, color: string) => {
  const geo = new THREE.IcosahedronGeometry(1, 5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 3.1 + seed) * Math.cos(v.y * 2.7 + seed) * Math.sin(v.z * 3.7) * 0.28 + Math.sin(v.x * 7.3 + seed * 2) * Math.sin(v.z * 8.1) * 0.08;
    v.multiplyScalar(1 + n);
    pos.setXYZ(i, v.x * radius, v.y * height, v.z * radius);
  }
  const flat = geo.toNonIndexed();
  flat.computeVertexNormals();
  return new THREE.Mesh(flat, new THREE.MeshPhysicalMaterial({color, roughness: 0.42, clearcoat: 0.3, flatShading: true}));
};

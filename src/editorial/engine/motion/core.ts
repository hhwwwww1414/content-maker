import {Easing, interpolate, spring} from 'remotion';
import type {CSSProperties} from 'react';
import type {MotionPersonality} from '../themes';

// Frame-driven motion: everything derives from (frame, fps), nothing from wall-clock time.
// Durations are seconds, so the same choreography holds at 30 and 60 fps.

export const sec = (seconds: number, fps: number) => Math.round(seconds * fps);

export const ease = {
  linear: Easing.linear,
  out: Easing.bezier(0.16, 1, 0.3, 1),
  outSoft: Easing.bezier(0.33, 1, 0.68, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  expoInOut: Easing.bezier(0.87, 0, 0.13, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  anticipate: Easing.bezier(0.68, -0.4, 0.32, 1.2),
  /** Quint-out: the blur-slide reveal curve (video-shotcraft typography/blur-slide). */
  quint: Easing.bezier(0.22, 1, 0.36, 1),
  /** A long, even camera move: slow start, long settle. */
  camera: Easing.bezier(0.45, 0, 0.2, 1),
};
export type EaseName = keyof typeof ease;

/**
 * A spring described the way SwiftUI describes it (WWDC23 "Animate with springs"): a perceptual duration and a bounce.
 * Mass is 1, stiffness follows from the duration, damping from the bounce. Bounce 0 is critically damped: no overshoot.
 */
export const appleSpring = (duration: number, bounce = 0) => {
  const stiffness = (2 * Math.PI / duration) ** 2;
  const damping = bounce >= 0 ? (4 * Math.PI * (1 - bounce)) / duration : (4 * Math.PI) / ((1 + bounce) * duration);
  return {mass: 1, stiffness, damping};
};

/** Spring presets by physical feel. Controlled overshoot comes only from `pop`, `bounce` and `lively`. */
export const springs = {
  settle: {damping: 200, stiffness: 120, mass: 1},
  soft: {damping: 24, stiffness: 90, mass: 1},
  snap: {damping: 20, stiffness: 210, mass: 0.7},
  pop: {damping: 13, stiffness: 170, mass: 0.8},
  bounce: {damping: 9, stiffness: 120, mass: 0.8},
  heavy: {damping: 26, stiffness: 55, mass: 2.2},
  camera: {damping: 30, stiffness: 42, mass: 1.5},
  // Keynote family, from appleSpring(duration, bounce).
  smooth: appleSpring(0.5, 0),
  crisp: appleSpring(0.38, 0.12),
  lively: appleSpring(0.5, 0.3),
  hero: appleSpring(1.0, 0),
  glide: appleSpring(1.6, 0),
} as const;
export type SpringName = keyof typeof springs;

/** A story's pacing. An art direction names one; a scene may override it. */
export type MotionProfile = {enter: SpringName; emphasis: SpringName; camera: SpringName; stagger: number; lineStagger: number; drift: number; handheld: number};
export const profiles: Record<MotionPersonality, MotionProfile> = {
  fluid: {enter: 'soft', emphasis: 'pop', camera: 'camera', stagger: 0.05, lineStagger: 0.11, drift: 0.018, handheld: 0},
  snappy: {enter: 'snap', emphasis: 'pop', camera: 'soft', stagger: 0.035, lineStagger: 0.07, drift: 0.012, handheld: 0},
  weighty: {enter: 'heavy', emphasis: 'snap', camera: 'camera', stagger: 0.06, lineStagger: 0.14, drift: 0.03, handheld: 1},
  calm: {enter: 'settle', emphasis: 'soft', camera: 'camera', stagger: 0.07, lineStagger: 0.16, drift: 0.022, handheld: 0},
  // Words 4 frames apart at 30 fps, lines a breath apart, no handheld (shotcraft Q3).
  keynote: {enter: 'smooth', emphasis: 'lively', camera: 'glide', stagger: 0.133, lineStagger: 0.2, drift: 0.01, handheld: 0},
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Progress of a timed tween: 0 before `start` (frames), 1 after `start + seconds`. */
export const tween = (frame: number, start: number, seconds: number, fps: number, easing: EaseName = 'out') =>
  interpolate(frame, [start, start + Math.max(1, sec(seconds, fps))], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease[easing]});

/** Spring progress from a start frame. Can exceed 1 for overshoot presets. */
export const springFrom = (frame: number, start: number, fps: number, preset: SpringName = 'soft') =>
  frame < start ? 0 : spring({frame: frame - start, fps, config: springs[preset]});

/** Start frames for n items, spread evenly, either per item or to fit a total. */
export const staggerStart = (i: number, start: number, fps: number, each: number) => start + sec(i * each, fps);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clampedRange = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const range = (v: number, from: [number, number], to: [number, number], easing?: EaseName) => interpolate(v, from, to, {...clampedRange, easing: easing ? ease[easing] : undefined});

/** Named entrances: progress in, CSS out. Keeps choreography as data rather than scattered inline maths. */
export type EnterName = 'rise' | 'mask' | 'pop' | 'slideL' | 'slideR' | 'drop' | 'blur' | 'fade' | 'track' | 'unfold' | 'focus';
export const entrance = (name: EnterName, p: number, distance = 60): CSSProperties => {
  const c = clamp01(p);
  switch (name) {
    case 'rise': return {transform: `translateY(${(1 - p) * distance}px)`, opacity: c};
    case 'mask': return {transform: `translateY(${(1 - p) * 118}%)`};
    case 'pop': return {transform: `scale(${0.6 + 0.4 * p})`, opacity: Math.min(1, c * 3)};
    case 'slideL': return {transform: `translateX(${(1 - p) * -distance * 2}px)`, opacity: c};
    case 'slideR': return {transform: `translateX(${(1 - p) * distance * 2}px)`, opacity: c};
    case 'drop': return {transform: `translateY(${(1 - p) * -distance * 3}px) rotate(${(1 - p) * -5}deg)`, opacity: Math.min(1, c * 4)};
    case 'blur': return {filter: c < 1 ? `blur(${(1 - c) * 24}px)` : undefined, opacity: c, transform: `scale(${1.06 - 0.06 * p})`};
    case 'track': return {letterSpacing: `${(1 - c) * 0.34}em`, opacity: c};
    // Out of focus into place: y, blur and opacity on one progress. `distance` is the font size.
    case 'focus': return {transform: `translateY(${(1 - c) * distance * 0.38}px)`, filter: c < 1 ? `blur(${((1 - c) * distance * 0.1).toFixed(2)}px)` : undefined, opacity: c};
    case 'unfold': return {transform: `perspective(1400px) rotateX(${(1 - p) * -64}deg)`, transformOrigin: '50% 0%', opacity: c};
    default: return {opacity: c};
  }
};

/** Slow composite sines: deterministic, organic drift for a camera or floating object. */
export const wander = (t: number, seed = 0) => Math.sin(t * 0.73 + seed) * 0.6 + Math.sin(t * 1.31 + seed * 1.7) * 0.3 + Math.sin(t * 2.47 + seed * 2.3) * 0.1;

export type CameraState = {x: number; y: number; scale: number; rotate: number};
export type CameraKey = {cue: string | number; x?: number; y?: number; scale?: number; rotate?: number; seconds?: number; spring?: SpringName; ease?: EaseName};
export type CameraMove = 'still' | 'pushIn' | 'pullOut' | 'panLeft' | 'panRight' | 'tiltUp' | 'tiltDown' | 'driftUp' | 'creep';

const MOVES: Record<CameraMove, (p: number) => Partial<CameraState>> = {
  still: () => ({}),
  pushIn: (p) => ({scale: 1 + 0.07 * p}),
  pullOut: (p) => ({scale: 1.09 - 0.09 * p}),
  panLeft: (p) => ({x: 34 - 68 * p, scale: 1.06}),
  panRight: (p) => ({x: -34 + 68 * p, scale: 1.06}),
  tiltUp: (p) => ({y: -44 + 88 * p, scale: 1.06}),
  tiltDown: (p) => ({y: 44 - 88 * p, scale: 1.06}),
  driftUp: (p) => ({y: 18 - 36 * p, scale: 1 + 0.03 * p}),
  // The keynote camera: a 4% push on a long ease, never a constant-speed zoom.
  creep: (p) => ({scale: 1 + 0.04 * ease.camera(p)}),
};

/** One deterministic camera: a base move over the scene plus keyed moves on spoken words. */
export const cameraAt = (o: {
  frame: number; fps: number; durationFrames: number; move?: CameraMove; keys?: CameraKey[];
  resolve: (cue: string | number) => number; defaultSpring: SpringName; handheld?: number;
}): CameraState => {
  const base = MOVES[o.move ?? 'still'](clamp01(o.frame / Math.max(1, o.durationFrames)));
  let state: CameraState = {x: base.x ?? 0, y: base.y ?? 0, scale: base.scale ?? 1, rotate: 0};
  for (const key of o.keys ?? []) {
    const start = o.resolve(key.cue);
    const p = key.seconds !== undefined ? tween(o.frame, start, key.seconds, o.fps, key.ease ?? 'inOut') : springFrom(o.frame, start, o.fps, key.spring ?? o.defaultSpring);
    state = {x: lerp(state.x, key.x ?? state.x, p), y: lerp(state.y, key.y ?? state.y, p), scale: lerp(state.scale, key.scale ?? state.scale, p), rotate: lerp(state.rotate, key.rotate ?? state.rotate, p)};
  }
  if (o.handheld) {
    const t = o.frame / o.fps;
    state = {...state, x: state.x + wander(t, 1.2) * 5 * o.handheld, y: state.y + wander(t, 4.1) * 7 * o.handheld, rotate: state.rotate + wander(t, 7.7) * 0.12 * o.handheld};
  }
  return state;
};

/** Parallax: a layer at depth d moves (1 + d) times the camera. d < 0 is further away. */
export const parallaxStyle = (cam: CameraState, depth: number, origin = '50% 44%'): CSSProperties => {
  const k = 1 + depth;
  return {transform: `translate(${cam.x * k}px, ${cam.y * k}px) scale(${1 + (cam.scale - 1) * k}) rotate(${cam.rotate * k}deg)`, transformOrigin: origin};
};

// Shapes as resampled point rings, so any shape can morph into any other in frame-exact steps.
export type Pt = [number, number];
const ringOf = (n: number, at: (u: number) => Pt) => Array.from({length: n}, (_, i) => at(i / n));
const perimeter = (corners: Pt[]) => (u: number): Pt => {
  const lengths = corners.map((c, i) => Math.hypot(corners[(i + 1) % corners.length][0] - c[0], corners[(i + 1) % corners.length][1] - c[1]));
  let d = u * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < corners.length; i++) {
    if (d <= lengths[i]) {
      const t = d / (lengths[i] || 1), a = corners[i], b = corners[(i + 1) % corners.length];
      return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
    }
    d -= lengths[i];
  }
  return corners[0];
};
export const shapes = {
  circle: (cx: number, cy: number, r: number, n = 96): Pt[] => ringOf(n, (u) => [cx + r * Math.cos(2 * Math.PI * u - Math.PI / 2), cy + r * Math.sin(2 * Math.PI * u - Math.PI / 2)]),
  rect: (x: number, y: number, w: number, h: number, n = 96): Pt[] => ringOf(n, perimeter([[x + w / 2, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]])),
  diamond: (cx: number, cy: number, r: number, n = 96): Pt[] => ringOf(n, perimeter([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]])),
};
export const morph = (a: Pt[], b: Pt[], p: number): Pt[] => a.map((pt, i) => [lerp(pt[0], b[i][0], p), lerp(pt[1], b[i][1], p)]);
export const toPath = (pts: Pt[]) => `M${pts.map((pt) => `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join('L')}Z`;
export const toPolygon = (pts: Pt[]) => `polygon(${pts.map((pt) => `${pt[0].toFixed(1)}px ${pt[1].toFixed(1)}px`).join(',')})`;

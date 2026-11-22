import type {Caption} from '@remotion/captions';

/** A voice cue: a spoken word prefix ("снял", "кадр#2" for the second one) or seconds from scene start. */
export type Cue = string | number;
export type Layer = {type: string; box?: [number, number, number, number]; fixed?: boolean; [prop: string]: unknown};
export type CameraKey = {cue: Cue; scale?: number; x?: number; y?: number; frames?: number};
export type Visual = {
  backdrop?: string;
  camera?: CameraKey[];
  layers: Layer[];
  transition?: {type: string; frames?: number; origin?: [number, number]};
};
export type Scene = {
  id: string; start: number; duration: number; voice: string; onScreen: string; sources: string[];
  template?: string; component?: string; visual?: Visual;
  /** A directed scene: see src/editorial/engine/spec/schema.ts. */
  direction?: unknown;
};
export type Project = {
  id: string; fps: number; width: number; height: number; durationSeconds: number;
  theme?: string; captionStyle?: string; backdrop?: string;
  /** Art direction of a directed reel. */
  art?: {direction: string; motion?: string; music?: {asset: string; volume: number; duck: number}};
  /** Library entries this reel uses, inlined by studio/render.mjs. */
  assets?: Record<string, unknown>;
  scenes: Scene[]; captions: Caption[];
  sources: Array<{id: string; publisher: string}>;
  audio: {mode?: 'music'; voicePath?: string | null; musicPath?: string | null; volume?: number; sfx?: Array<{path: string; start: number; volume: number; license: string}>};
};

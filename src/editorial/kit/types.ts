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
};
export type Project = {
  id: string; fps: number; width: number; height: number; durationSeconds: number;
  theme?: string; captionStyle?: string; backdrop?: string;
  scenes: Scene[]; captions: Caption[];
  sources: Array<{id: string; publisher: string}>;
  audio: {voicePath?: string | null; musicPath?: string | null; volume?: number; sfx?: Array<{path: string; start: number; volume: number; license: string}>};
};

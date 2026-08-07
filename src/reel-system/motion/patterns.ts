export type MotionPatternCategory = 'camera' | 'reveals' | 'transitions' | 'typography' | 'environment';

export type MotionPattern = {
  id: string;
  category: MotionPatternCategory;
  description: string;
  semanticUse: string;
};

export const MOTION_PATTERNS: MotionPattern[] = [
  {id: 'camera.macro-pass', category: 'camera', description: 'Close camera passes across a hero surface', semanticUse: 'inspect physical detail'},
  {id: 'camera.orbit-reveal', category: 'camera', description: 'Controlled orbital reveal around a clear object', semanticUse: 'show depth and silhouette'},
  {id: 'camera.dolly-in', category: 'camera', description: 'Linear push toward the primary object', semanticUse: 'increase commitment'},
  {id: 'reveals.occlusion-reveal', category: 'reveals', description: 'Foreground object uncovers the hero', semanticUse: 'transition by physical blocking'},
  {id: 'reveals.depth-reveal', category: 'reveals', description: 'Separate depth layers with parallax', semanticUse: 'make spatial logic clear'},
  {id: 'transitions.match-cut', category: 'transitions', description: 'Cut by matched geometry', semanticUse: 'carry visual meaning between shots'},
  {id: 'transitions.line-continuation', category: 'transitions', description: 'Line exits one shot and enters next', semanticUse: 'connect cause to result'},
  {id: 'typography.static-hook', category: 'typography', description: 'Static headline locked to safe zone', semanticUse: 'front-load a claim'},
  {id: 'typography.mask-type-reveal', category: 'typography', description: 'Text appears through a meaningful mask', semanticUse: 'attach copy to object action'},
  {id: 'environment.parallax-track', category: 'environment', description: 'Layered background track with deterministic offset', semanticUse: 'show travel or scanning'},
];

export const recentPatternIds = (patternIds: string[], count = 3) => patternIds.slice(Math.max(0, patternIds.length - count));

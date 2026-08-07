export type StoryboardAssetType = 'HTML' | 'SVG' | 'R3F' | 'IMAGE' | 'RIVE';

export type HeroObjectPlan = {
  semanticName: string;
  visualDescription: string;
  assetType: StoryboardAssetType;
  silhouetteImportance: 'low' | 'medium' | 'high';
  referenceGeometry: string;
};

export type StoryboardShot = {
  id: string;
  start: number;
  end: number;
  purpose: string;
  hero: HeroObjectPlan;
  supportElements: string[];
  camera: string;
  framing: string;
  composition: string;
  text: string[];
  visualChange: string;
  transitionIn: string;
  transitionOut: string;
  transitionReason: string;
  background: string;
  depthLayers: string[];
  assetType: StoryboardAssetType;
};

export type Storyboard = {
  id: string;
  fps: number;
  width: number;
  height: number;
  shots: StoryboardShot[];
};

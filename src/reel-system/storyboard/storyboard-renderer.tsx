import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Storyboard, StoryboardShot} from './types';
import {HeroObject} from '../hero/HeroObject';
import {LAYERS} from '../layers';

const sampleStoryboard: Storyboard = {
  id: 'ghostpepe-storyboard-preview',
  fps: 30,
  width: 1080,
  height: 1920,
  shots: [
    {
      id: 'sample-01',
      start: 0,
      end: 90,
      purpose: 'Representative pipeline preview frame only',
      hero: {
        semanticName: 'asset strategy marker',
        visualDescription: 'simple geometric marker showing explicit hero strategy',
        assetType: 'SVG',
        silhouetteImportance: 'medium',
        referenceGeometry: 'hexagon badge',
      },
      supportElements: ['safe-zone frame'],
      camera: 'STATIC-MACRO',
      framing: 'center weighted',
      composition: 'hero centered, metadata below',
      text: ['STORYBOARD FIRST'],
      visualChange: 'static contact sheet sample',
      transitionIn: 'none',
      transitionOut: 'semantic handoff',
      transitionReason: 'preview frame, no final motion',
      background: 'dark neutral',
      depthLayers: ['background', 'hero', 'text'],
      assetType: 'SVG',
    },
  ],
};

const ShotCard: React.FC<{shot: StoryboardShot; index: number}> = ({shot, index}) => (
  <div
    style={{
      width: 480,
      height: 760,
      border: '2px solid rgba(125, 211, 252, 0.55)',
      borderRadius: 8,
      padding: 28,
      background: '#071014',
      color: '#f8fafc',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
    }}
  >
    <div style={{position: 'absolute', inset: 24, border: '1px dashed rgba(255,255,255,0.18)', zIndex: LAYERS.DEBUG}} />
    <div style={{fontSize: 20, color: '#7dd3fc'}}>SHOT {index + 1}</div>
    <div style={{fontSize: 38, fontWeight: 800, marginTop: 18, lineHeight: 1.05}}>{shot.text[0] ?? shot.purpose}</div>
    <div style={{height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <HeroObject plan={shot.hero} width={190} height={190} />
    </div>
    <div style={{fontSize: 24, lineHeight: 1.25, color: '#dbeafe'}}>{shot.hero.semanticName}</div>
    <div style={{fontSize: 18, marginTop: 12, color: '#94a3b8', lineHeight: 1.35}}>{shot.camera} / {shot.assetType}</div>
    <div style={{fontSize: 16, marginTop: 20, color: '#a7f3d0', lineHeight: 1.35}}>{shot.transitionReason}</div>
  </div>
);

export const StoryboardContactSheet: React.FC<{storyboard?: Storyboard}> = ({storyboard = sampleStoryboard}) => (
  <AbsoluteFill style={{background: '#020617', padding: 54, fontFamily: 'Arial, sans-serif'}}>
    <div style={{fontSize: 48, color: '#f8fafc', fontWeight: 800}}>GhostPepe Storyboard Preview</div>
    <div style={{fontSize: 24, color: '#94a3b8', marginTop: 8}}>Representative frames before motion implementation</div>
    <div style={{display: 'flex', gap: 28, marginTop: 44, flexWrap: 'wrap'}}>
      {storyboard.shots.map((shot, index) => <ShotCard key={shot.id} shot={shot} index={index} />)}
    </div>
  </AbsoluteFill>
);

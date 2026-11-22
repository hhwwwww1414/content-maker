import React from 'react';
import {Composition, Folder} from 'remotion';
import {EditorialVideo} from '../../EditorialVideo';
import type {Project} from '../../kit/types';
import {libraryFor} from './library-index';
import {MotionBoard, TokensBoard, TypeBoard} from './boards';
import {CropPreview} from './Crop';
import {stories, storyProject, transitionNames, transitionProject} from './stories';

const Video = EditorialVideo as unknown as React.FC<Record<string, unknown>>;
const Crop = CropPreview as unknown as React.FC<Record<string, unknown>>;
const size = {width: 1080, height: 1920, fps: 30};
const withAssets = (project: ReturnType<typeof storyProject> | ReturnType<typeof transitionProject>) => ({...project, assets: libraryFor(project)}) as unknown as Project;

/** The visual explorer: tokens, type, motion, every scene setting and every transition, in the real renderer. */
export const Lab: React.FC = () => (
  <Folder name="Lab">
    <Composition id="Lab-Tokens" component={TokensBoard} durationInFrames={30} {...size}/>
    <Composition id="Lab-Type" component={TypeBoard} durationInFrames={30} {...size}/>
    <Composition id="Lab-Motion" component={MotionBoard} durationInFrames={120} {...size}/>
    <Composition id="Lab-Motion-60" component={MotionBoard} durationInFrames={240} {...size} fps={60}/>
    <Folder name="Scenes">
      {stories.map((story) => <Composition key={story.id} id={`Lab-Scene-${story.id}`} component={Video} durationInFrames={Math.round(story.seconds * 30)} {...size} defaultProps={{project: withAssets(storyProject(story))}}/>)}
    </Folder>
    <Folder name="Transitions">
      {transitionNames.map((name, i) => <Composition key={name} id={`Lab-Transition-${name}`} component={Video} durationInFrames={150} {...size} defaultProps={{project: withAssets(transitionProject(i))}}/>)}
    </Folder>
    <Folder name="Aspect">
      <Composition id="Lab-Crop-4x5" component={Crop} durationInFrames={120} width={1080} height={1350} fps={30} defaultProps={{project: withAssets(storyProject(stories[0])), showSafe: true}}/>
      <Composition id="Lab-Crop-1x1" component={Crop} durationInFrames={120} width={1080} height={1080} fps={30} defaultProps={{project: withAssets(storyProject(stories[0])), showSafe: true}}/>
      <Composition id="Lab-Crop-16x9" component={Crop} durationInFrames={120} width={1920} height={1080} fps={30} defaultProps={{project: withAssets(storyProject(stories[0])), showSafe: true}}/>
    </Folder>
  </Folder>
);

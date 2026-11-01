import {registerRoot, Composition} from 'remotion';
import {EditorialVideo} from './EditorialVideo';
import type {Project} from './kit/types';
import gps from '../../studio/gps-offline.json';

// Any valid project renders through --props; GPS only supplies Studio's default preview.
const Root = () => (
  <Composition
    id="EditorialReel"
    component={EditorialVideo as unknown as React.FC<Record<string, unknown>>}
    defaultProps={{project: gps as unknown as Project}}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={1}
    calculateMetadata={({props}) => {
      const project = props.project as Project;
      return {durationInFrames: Math.round(project.durationSeconds * project.fps), fps: project.fps, width: project.width, height: project.height};
    }}
  />
);
registerRoot(Root);

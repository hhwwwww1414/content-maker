import {registerRoot, Composition} from 'remotion';
import {GpsVideo} from './GpsVideo';
import project from '../../studio/gps-offline.json';
const Root=()=> <Composition id="GpsOfflineEditorial" component={GpsVideo} width={project.width} height={project.height} fps={project.fps} durationInFrames={Math.round(project.durationSeconds*project.fps)}/>;
registerRoot(Root);

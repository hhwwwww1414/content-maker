import {Composition, registerRoot} from 'remotion';
import {EgoFreedomCover} from './EgoFreedomCover';

const CoverRoot = () => <Composition id="EgoFreedomCover" component={EgoFreedomCover} width={1080} height={1920} fps={30} durationInFrames={1} />;

registerRoot(CoverRoot);

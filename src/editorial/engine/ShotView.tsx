import React from 'react';
import {customShots} from './custom';
import {useShot} from './context';
import {CollageScene} from './scenes/CollageScene';
import {DataScene} from './scenes/DataScene';
import {DeviceScene} from './scenes/DeviceScene';
import {JourneyScene} from './scenes/JourneyScene';
import {MediaScene} from './scenes/MediaScene';
import {SplitScene} from './scenes/SplitScene';
import {Stage3DScene} from './scenes/Stage3DScene';
import {TimelineScene} from './scenes/TimelineScene';
import {TypeScene} from './scenes/TypeScene';
import {Direction, type DirectionSpec} from './spec/schema';

/** Parses at the boundary: invalid scene props fail the render here, with the scene named, and never draw garbage. */
export const parseDirection = (id: string, raw: unknown): DirectionSpec => {
  const parsed = Direction.safeParse(raw);
  if (!parsed.success) throw new Error(`Invalid direction in scene "${id}": ${parsed.error.issues.slice(0, 4).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  return parsed.data;
};

export const ShotView: React.FC = () => {
  const {direction} = useShot();
  const shot = direction.shot;
  const body = (() => {
    switch (shot.type) {
      case 'type': return <TypeScene spec={shot}/>;
      case 'media': return <MediaScene spec={shot}/>;
      case 'data': return <DataScene spec={shot}/>;
      case 'device': return <DeviceScene spec={shot}/>;
      case 'stage3d': return <Stage3DScene spec={shot}/>;
      case 'split': return <SplitScene spec={shot}/>;
      case 'timeline': return <TimelineScene spec={shot}/>;
      case 'collage': return <CollageScene spec={shot}/>;
      case 'journey': return <JourneyScene spec={shot}/>;
      case 'custom': {
        const Custom = customShots[shot.component];
        if (!Custom) throw new Error(`Custom shot "${shot.component}" is not registered in engine/custom.ts`);
        return <Custom {...shot.props}/>;
      }
    }
  })();
  return body;
};

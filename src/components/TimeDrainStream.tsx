import {TimeDigitParticle} from './TimeDigitParticle';

export const TimeDrainStream: React.FC<{frame: number; progress: number; frozen: number; opacity?: number}> = ({
  frame,
  progress,
  frozen,
  opacity = 1,
}) => (
  <div style={{position: 'absolute', left: 104, top: 255, width: 300, height: 510, overflow: 'hidden', opacity}}>
    {Array.from({length: 18}, (_, index) => (
      <TimeDigitParticle key={index} frame={frame} index={index} seed={2718} progress={progress} frozen={frozen} />
    ))}
  </div>
);


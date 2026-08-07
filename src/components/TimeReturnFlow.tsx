import {TimeDigitParticle} from './TimeDigitParticle';

export const TimeReturnFlow: React.FC<{frame: number; progress: number; opacity: number}> = ({frame, progress, opacity}) => (
  <div style={{position: 'absolute', left: 104, top: 255, width: 300, height: 510, overflow: 'hidden', opacity}}>
    {Array.from({length: 20}, (_, index) => (
      <TimeDigitParticle key={index} frame={frame} index={index} seed={8119} progress={progress} reverse opacity={opacity} />
    ))}
  </div>
);


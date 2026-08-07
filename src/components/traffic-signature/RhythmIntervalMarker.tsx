import {interpolate} from 'remotion';
import {CLAMP, OUT, tsColors} from './trafficSignatureConfig';
import {unbounded} from '../../theme/fonts';

/**
 * РИТМ — two marks showing the interval (timing gap) between two pulses, joined
 * by a bracket, with a label below the flow.
 */
export const RhythmIntervalMarker: React.FC<{
  x: number;
  y: number;
  gap: number;
  progress: number;
  label?: string;
}> = ({x, y, gap, progress, label = 'РИТМ'}) => {
  const draw = interpolate(progress, [0, 0.6], [0, 1], CLAMP);
  const labelOp = interpolate(progress, [0.45, 0.8], [0, 1], CLAMP);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: interpolate(progress, [0, 0.15, 0.9, 1], [0, 1, 1, 0], CLAMP)}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 2, height: 22, background: tsColors.mint, opacity: draw}} />
      <div style={{position: 'absolute', left: gap - 2, top: 0, width: 2, height: 22, background: tsColors.mint, opacity: interpolate(draw, [0.5, 1], [0, 1], CLAMP)}} />
      <div style={{position: 'absolute', left: 0, top: 20, width: gap * draw, height: 2, background: tsColors.mint, boxShadow: '0 0 10px rgba(34,240,208,.5)'}} />
      <div
        style={{
          position: 'absolute',
          left: gap / 2,
          top: 34,
          transform: 'translateX(-50%)',
          fontFamily: unbounded,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: 1,
          color: tsColors.white,
          opacity: labelOp,
          translate: `0 ${interpolate(labelOp, [0, 1], [-6, 0], OUT)}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
};

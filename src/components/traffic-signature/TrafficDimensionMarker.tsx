import {interpolate} from 'remotion';
import {CLAMP, OUT, tsColors} from './trafficSignatureConfig';
import {unbounded} from '../../theme/fonts';

/**
 * РАЗМЕР — a dimension line measuring one block of the flow: two end ticks,
 * a connecting line drawn left-to-right, and a small label above.
 */
export const TrafficDimensionMarker: React.FC<{
  x: number;
  y: number;
  width: number;
  progress: number;
  label?: string;
}> = ({x, y, width, progress, label = 'РАЗМЕР'}) => {
  const draw = interpolate(progress, [0, 0.6], [0, 1], CLAMP);
  const labelOp = interpolate(progress, [0.45, 0.8], [0, 1], CLAMP);
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: interpolate(progress, [0, 0.15, 0.9, 1], [0, 1, 1, 0], CLAMP)}}>
      <div style={{position: 'absolute', left: 0, top: -14, width: 2, height: 28, background: tsColors.amber, opacity: draw}} />
      <div style={{position: 'absolute', left: width - 2, top: -14, width: 2, height: 28, background: tsColors.amber, opacity: interpolate(draw, [0.6, 1], [0, 1], CLAMP)}} />
      <div style={{position: 'absolute', left: 0, top: -1, width: width * draw, height: 2, background: tsColors.amber, boxShadow: '0 0 10px rgba(242,180,90,.5)'}} />
      <div
        style={{
          position: 'absolute',
          left: width / 2,
          top: -52,
          transform: 'translateX(-50%)',
          fontFamily: unbounded,
          fontWeight: 700,
          fontSize: 26,
          letterSpacing: 1,
          color: tsColors.white,
          opacity: labelOp,
          translate: `0 ${interpolate(labelOp, [0, 1], [6, 0], OUT)}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
};

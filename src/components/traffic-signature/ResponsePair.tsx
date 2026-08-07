import {interpolate} from 'remotion';
import {CLAMP, OUT, tsColors} from './trafficSignatureConfig';
import {unbounded} from '../../theme/fonts';

/**
 * ОТВЕТ — one incoming impulse that receives a returning impulse. A request/
 * response pair travelling in opposite directions along a short baseline.
 */
export const ResponsePair: React.FC<{
  x: number;
  y: number;
  span: number;
  progress: number;
  label?: string;
}> = ({x, y, span, progress, label = 'ОТВЕТ'}) => {
  // out-going pulse travels right (0->0.5), reply travels left (0.5->1)
  const outT = interpolate(progress, [0.05, 0.5], [0, 1], CLAMP);
  const backT = interpolate(progress, [0.5, 0.9], [0, 1], CLAMP);
  const labelOp = interpolate(progress, [0.55, 0.85], [0, 1], CLAMP);
  const dot = (t: number, color: string, dir: 1 | -1) => (
    <div
      style={{
        position: 'absolute',
        left: dir === 1 ? t * span : span - t * span,
        top: dir === 1 ? -12 : 8,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        opacity: t > 0 && t < 1 ? 1 : t >= 1 ? 0.9 : 0,
        boxShadow: `0 0 12px ${color}`,
        transform: 'translate(-50%,-50%)',
      }}
    />
  );
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: interpolate(progress, [0, 0.12, 0.92, 1], [0, 1, 1, 0], CLAMP)}}>
      <div style={{position: 'absolute', left: 0, top: -14, width: span, height: 1, background: 'rgba(95,199,230,.3)'}} />
      <div style={{position: 'absolute', left: 0, top: 6, width: span, height: 1, background: 'rgba(34,240,208,.3)'}} />
      {dot(outT, tsColors.cyan, 1)}
      {dot(backT, tsColors.mint, -1)}
      <div
        style={{
          position: 'absolute',
          left: span / 2,
          top: -56,
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

import {Img, interpolate} from 'remotion';
import {CH, seeded} from './console';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const mix = (a: string, b: string, t: number) => {
  const pa = a.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const pb = b.match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/**
 * Equalizer reveal: vertical traffic bars that first show live levels, then calm
 * and open a head-shaped negative space in which the official mascot PNG fades
 * in. The bars recede; the mascot stays. The PNG is never masked or deformed.
 */
export const EqualizerMascotReveal: React.FC<{
  frame: number;
  progress: number; // 0..1
  left: number;
  top: number;
  width: number;
  height: number;
  mascotSrc: string;
  mascotSize: number;
}> = ({frame, progress, left, top, width, height, mascotSrc, mascotSize}) => {
  if (progress <= 0.001) return null;
  const nBars = 26;
  const step = width / nBars;
  const barW = step * 0.6;
  const centerX = left + width / 2;
  const baseY = top + height;

  const activity = interpolate(progress, [0, 0.35, 0.75, 1], [1, 1, 0.28, 0.14], CLAMP);
  const reveal = interpolate(progress, [0.34, 0.72], [0, 1], CLAMP);
  const barsOpacity = interpolate(progress, [0, 0.12, 0.82, 1], [0, 1, 1, 0.42], CLAMP);
  const mascotOpacity = interpolate(progress, [0.48, 0.86], [0, 1], CLAMP);
  const mascotBlur = interpolate(progress, [0.48, 0.86], [10, 0], CLAMP);
  const headHalf = mascotSize * 0.44;

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {/* mascot behind... no — bars behind, mascot in the cleared negative space in front */}
      {Array.from({length: nBars}).map((_, i) => {
        const xi = left + (i + 0.5) * step;
        const s = seeded(i * 5 + 3);
        const lvl =
          0.4 +
          0.34 * Math.sin(frame * 0.16 * (0.6 + s) + i * 0.9) * activity +
          0.14 * Math.sin(frame * 0.09 + i) * activity;
        const dist = Math.abs(xi - centerX);
        const inHead = Math.max(0, 1 - dist / headHalf);
        const heightFactor = 1 - inHead * reveal;
        const barH = Math.max(4, height * (0.12 + 0.62 * Math.max(0.08, lvl)) * heightFactor);
        const col = mix(CH.localCore.replace('#', ''), CH.worldCore.replace('#', ''), i / nBars);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: xi - barW / 2,
              top: baseY - barH,
              width: barW,
              height: barH,
              borderRadius: 4,
              background: `linear-gradient(180deg, ${col}, rgba(20,30,32,0.2))`,
              opacity: barsOpacity * (0.5 + 0.5 * Math.max(0.1, lvl)),
              boxShadow: `0 0 10px rgba(34,240,208,${0.25 * heightFactor})`,
            }}
          />
        );
      })}

      {/* official mascot in the cleared negative space */}
      <div
        style={{
          position: 'absolute',
          left: centerX - mascotSize / 2,
          top: baseY - height * 0.5 - mascotSize * 0.52,
          width: mascotSize,
          height: mascotSize,
          opacity: mascotOpacity,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '52%',
            width: mascotSize * 0.94,
            height: mascotSize * 0.94,
            transform: 'translate(-50%,-50%)',
            borderRadius: '50%',
            background: CH.worldCore,
            opacity: 0.14 * mascotOpacity,
            filter: 'blur(64px)',
          }}
        />
        <Img
          src={mascotSrc}
          style={{position: 'relative', width: mascotSize, height: mascotSize, objectFit: 'contain', filter: `blur(${mascotBlur}px)`}}
        />
      </div>
    </div>
  );
};

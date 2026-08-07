import {Easing, interpolate} from 'remotion';
import {manrope, unbounded} from '../../theme/fonts';
import {seededRange} from './seed';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;

const WIDTH = 1080;
const SYMBOLS = ['0', '1', '⟨', '⟩', '·', '+', '×', '/'];

/** Vertical offset of the ribbon at a given x — one shared wave so ribbon, glyphs
 * and rule lines all sit on exactly the same curve. */
const waveAt = (x: number, amplitude: number, period: number, phase: number) =>
  amplitude * Math.sin(x / period + phase);

/**
 * One spectral ribbon of data crossing the frame. Left of `fieldX` it carries its
 * own foreign structure (cool blue, uneven thickness, its own frequency); right of
 * `fieldX` it has taken on the local mint spectrum and moves on the same rules as
 * every other line.
 */
export const RoamingDataRibbon: React.FC<{
  frame: number;
  index: number;
  y: number;
  label?: string;
  /** x where the network rule field re-writes the ribbon's structure. */
  fieldX: number;
  /** 0 = no rewriting yet (field inactive), 1 = fully applied. */
  syncProgress: number;
  opacity?: number;
  /** Faint destination signal at the ribbon's end that may or may not continue. */
  continues?: boolean;
  thickness?: number;
}> = ({frame, index, y, label, fieldX, syncProgress, opacity = 1, continues = true, thickness = 16}) => {
  const amplitude = seededRange(index, 1, 12, 26);
  const period = seededRange(index, 2, 150, 260);
  const phase = seededRange(index, 3, 0, Math.PI * 2) + frame / seededRange(index, 4, 44, 78);
  const drift = frame * seededRange(index, 5, 1.6, 2.9);

  // Foreign side breathes at its own frequency; local side settles to a steady width.
  const foreignThickness = thickness * (1 + 0.3 * Math.sin(frame / seededRange(index, 6, 11, 19) + index));
  const localThickness = thickness * interpolate(syncProgress, [0, 1], [1.14, 0.94], EASE);

  const points = Array.from({length: 37}, (_, step) => {
    const x = (step / 36) * WIDTH;
    return `${x},${y + waveAt(x, amplitude, period, phase)}`;
  }).join(' ');

  const effectiveFieldX = interpolate(syncProgress, [0, 1], [WIDTH + 60, fieldX], EASE);

  const glyphs = Array.from({length: 7}, (_, step) => {
    const base = seededRange(index * 10 + step, 7, 0, WIDTH);
    const x = (base + drift) % WIDTH;
    const past = x > effectiveFieldX;
    return {
      key: step,
      x,
      y: y + waveAt(x, amplitude, period, phase) + 4,
      char: SYMBOLS[(index * 3 + step) % SYMBOLS.length],
      opacity: (past ? 0.5 : 0.66) * interpolate(x, [0, 70, WIDTH - 70, WIDTH], [0, 1, 1, 0], CLAMP),
      color: past ? 'rgba(140,255,233,.92)' : 'rgba(150,205,255,.92)',
    };
  });

  const tailFade = continues ? 1 : interpolate(syncProgress, [0.45, 1], [1, 0], EASE);

  return (
    <div style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
      <svg width={WIDTH} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id={`fs-clip-foreign-${index}`}>
            <rect x={0} y={0} width={effectiveFieldX} height={1920} />
          </clipPath>
          <clipPath id={`fs-clip-local-${index}`}>
            <rect x={effectiveFieldX} y={0} width={Math.max(0, WIDTH - effectiveFieldX)} height={1920} />
          </clipPath>
          <linearGradient id={`fs-foreign-${index}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(96,176,255,0)" />
            <stop offset="14%" stopColor="rgba(96,176,255,.62)" />
            <stop offset="72%" stopColor="rgba(126,214,255,.52)" />
            <stop offset="100%" stopColor="rgba(150,225,255,.44)" />
          </linearGradient>
          <linearGradient id={`fs-local-${index}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(34,240,208,.62)" />
            <stop offset="70%" stopColor="rgba(34,240,208,.44)" />
            <stop offset="100%" stopColor={`rgba(140,255,233,${0.3 * tailFade})`} />
          </linearGradient>
        </defs>

        {/* Foreign segment — its own structure and frequency */}
        <g clipPath={`url(#fs-clip-foreign-${index})`}>
          <polyline
            points={points}
            fill="none"
            stroke={`url(#fs-foreign-${index})`}
            strokeWidth={foreignThickness}
            strokeLinecap="round"
            opacity={0.5}
            style={{filter: 'blur(7px)'}}
          />
          <polyline
            points={points}
            fill="none"
            stroke={`url(#fs-foreign-${index})`}
            strokeWidth={foreignThickness * 0.34}
            strokeLinecap="round"
            strokeDasharray={`${18 + index * 5} ${9 + index * 3}`}
            strokeDashoffset={-drift}
          />
        </g>

        {/* Local segment — same rules as every other line in the network */}
        <g clipPath={`url(#fs-clip-local-${index})`}>
          <polyline
            points={points}
            fill="none"
            stroke={`url(#fs-local-${index})`}
            strokeWidth={localThickness}
            strokeLinecap="round"
            opacity={0.46 * tailFade}
            style={{filter: 'blur(7px)'}}
          />
          <polyline
            points={points}
            fill="none"
            stroke={`url(#fs-local-${index})`}
            strokeWidth={localThickness * 0.3}
            strokeLinecap="round"
            strokeDasharray="26 12"
            strokeDashoffset={-drift}
            opacity={tailFade}
          />
        </g>

        {/* Thin network-rule lines wrapping the ribbon once the field engages */}
        <g clipPath={`url(#fs-clip-local-${index})`} opacity={syncProgress * 0.6 * tailFade}>
          {Array.from({length: 9}, (_, step) => {
            const x = effectiveFieldX + 26 + step * 46;
            if (x > WIDTH) return null;
            const yy = y + waveAt(x, amplitude, period, phase);
            return (
              <line
                key={step}
                x1={x}
                y1={yy - localThickness * 0.9}
                x2={x}
                y2={yy + localThickness * 0.9}
                stroke="rgba(140,255,233,.5)"
                strokeWidth={1.4}
              />
            );
          })}
        </g>

        {/* Digital symbols travelling inside the stream */}
        {glyphs.map((glyph) => (
          <text
            key={glyph.key}
            x={glyph.x}
            y={glyph.y}
            fill={glyph.color}
            opacity={glyph.opacity}
            fontFamily={manrope}
            fontSize={15}
            fontWeight={700}
          >
            {glyph.char}
          </text>
        ))}
      </svg>

      {label ? (
        <div
          style={{
            position: 'absolute',
            left: 118,
            top: y + waveAt(118, amplitude, period, phase) - 34,
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: 3,
            color: 'rgba(178,226,255,.9)',
            textShadow: '0 0 16px rgba(96,176,255,.4)',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

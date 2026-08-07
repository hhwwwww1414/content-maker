import {Easing, interpolate} from 'remotion';
import {seededRange} from './seed';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

const SIZE = 190;
const RIDGES = 9;

/**
 * The new network fingerprint that forms on the SIM's face once its traffic follows
 * the local rules. Ridges draw themselves on line by line rather than fading in, so
 * it reads as something being written, not something being stamped.
 */
export const TrafficFingerprint: React.FC<{
  frame: number;
  /** 0 = blank surface, 1 = fingerprint fully written. */
  progress: number;
}> = ({frame, progress}) => {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{position: 'absolute', right: 26, bottom: 22, opacity: interpolate(progress, [0, 0.14], [0, 1], CLAMP)}}
    >
      <defs>
        <radialGradient id="fs-fp-glow">
          <stop offset="0%" stopColor="rgba(34,240,208,.28)" />
          <stop offset="100%" stopColor="rgba(34,240,208,0)" />
        </radialGradient>
      </defs>
      <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2} fill="url(#fs-fp-glow)" />

      {Array.from({length: RIDGES}, (_, index) => {
        // Each ridge starts a little after the previous one, so the print builds up.
        const localProgress = interpolate(progress, [index * 0.075, 0.42 + index * 0.06], [0, 1], OUT);
        if (localProgress <= 0) return null;

        const rx = 16 + index * 9.2;
        const ry = rx * seededRange(index, 11, 0.74, 0.96);
        const rotation = seededRange(index, 12, -22, 22);
        const gap = seededRange(index, 13, 34, 88);
        const circumference = Math.PI * (rx + ry) * 1.06;
        const drawn = circumference * localProgress;
        const shimmer = interpolate((frame + index * 9) % 84, [0, 42, 84], [0.58, 1, 0.58], CLAMP);

        return (
          <ellipse
            key={index}
            cx={SIZE / 2}
            cy={SIZE / 2}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="rgba(160,255,238,.95)"
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={0.5 + shimmer * 0.46}
            style={{filter: 'drop-shadow(0 0 6px rgba(34,240,208,.55))'}}
            transform={`rotate(${rotation} ${SIZE / 2} ${SIZE / 2})`}
            strokeDasharray={`${drawn} ${circumference + gap}`}
            strokeDashoffset={gap * 0.5}
          />
        );
      })}

      {/* Core node once the print has settled */}
      <circle
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={5.5}
        fill="rgba(34,240,208,.95)"
        opacity={interpolate(progress, [0.62, 0.9], [0, 1], OUT)}
      />
    </svg>
  );
};

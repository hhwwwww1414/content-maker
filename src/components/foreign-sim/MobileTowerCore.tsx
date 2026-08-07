import {Easing, interpolate} from 'remotion';
import {colors} from '../../theme/colors';
import {unbounded} from '../../theme/fonts';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;
const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

/** Ring antennas stacked up the mast: fixed sizes, never randomised. */
const RINGS = [
  {y: 40, rx: 118, tilt: 0.34},
  {y: 150, rx: 92, tilt: 0.36},
  {y: 250, rx: 66, tilt: 0.38},
];

/**
 * Abstract mobile tower: a graphite-metal mast wrapped in crystal-glass ring
 * antennas. Deliberately not photoreal — it reads as network infrastructure, not
 * as a photograph of a mast.
 */
export const MobileTowerCore: React.FC<{
  frame: number;
  /** 0 = fully in the haze of depth, 1 = fully materialised. */
  reveal: number;
  opacity?: number;
}> = ({frame, reveal, opacity = 1}) => {
  const rise = interpolate(reveal, [0, 1], [46, 0], OUT);
  const blur = interpolate(reveal, [0, 1], [16, 0], EASE);

  return (
    <div
      style={{
        position: 'absolute',
        width: 300,
        height: 470,
        opacity: opacity * reveal,
        translate: `0 ${rise}px`,
        filter: `blur(${blur}px)`,
      }}
    >
      {/* Depth bloom */}
      <div
        style={{
          position: 'absolute',
          left: -70,
          top: 20,
          width: 440,
          height: 440,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,240,208,.17), transparent 66%)',
          filter: 'blur(30px)',
        }}
      />

      <svg width={300} height={470} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="fs-mast" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(28,40,43,.96)" />
            <stop offset="46%" stopColor="rgba(74,96,100,.96)" />
            <stop offset="100%" stopColor="rgba(18,27,29,.96)" />
          </linearGradient>
          <linearGradient id="fs-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(140,255,233,.72)" />
            <stop offset="55%" stopColor="rgba(34,240,208,.30)" />
            <stop offset="100%" stopColor="rgba(140,255,233,.62)" />
          </linearGradient>
        </defs>

        {/* Mast */}
        <path d="M132 36 L168 36 L188 430 L112 430 Z" fill="url(#fs-mast)" opacity={0.94} />
        {/* Cross bracing — deterministic ladder */}
        {Array.from({length: 7}, (_, index) => {
          const t = index / 6;
          const y = 60 + t * 350;
          const halfWidth = 17 + t * 20;
          return (
            <g key={index} stroke="rgba(150,190,196,.34)" strokeWidth={2}>
              <line x1={150 - halfWidth} y1={y} x2={150 + halfWidth} y2={y + 44} />
              <line x1={150 + halfWidth} y1={y} x2={150 - halfWidth} y2={y + 44} />
            </g>
          );
        })}

        {/* Crystal-glass ring antennas */}
        {RINGS.map((ring, index) => {
          const pulse = interpolate((frame + index * 26) % 90, [0, 45, 90], [0.5, 1, 0.5], EASE);
          return (
            <ellipse
              key={ring.y}
              cx={150}
              cy={ring.y + 40}
              rx={ring.rx}
              ry={ring.rx * ring.tilt}
              fill="none"
              stroke="url(#fs-ring)"
              strokeWidth={3}
              opacity={0.4 + pulse * 0.42}
            />
          );
        })}

        {/* Emitter core */}
        <circle cx={150} cy={44} r={12} fill={colors.mint} opacity={0.85} />
        <circle
          cx={150}
          cy={44}
          r={interpolate(frame % 60, [0, 60], [12, 40], OUT)}
          fill="none"
          stroke={colors.mint}
          strokeWidth={2}
          opacity={interpolate(frame % 60, [0, 60], [0.55, 0], CLAMP)}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 436,
          width: 300,
          textAlign: 'center',
          fontFamily: unbounded,
          fontWeight: 700,
          fontSize: 17,
          letterSpacing: 3.2,
          color: colors.lightMint,
          opacity: 0.5 * reveal,
        }}
      >
        LOCAL NETWORK
      </div>
    </div>
  );
};

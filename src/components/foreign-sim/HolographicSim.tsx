import type {ReactNode} from 'react';
import {Easing, interpolate} from 'remotion';
import {colors} from '../../theme/colors';
import {manrope, unbounded} from '../../theme/fonts';

const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const CARD_W = 428;
const CARD_H = 336;

/** Contact pad layout of a SIM chip: fixed, hand-placed, never randomised. */
const PADS = [
  {x: 0, y: 0, w: 62, h: 40},
  {x: 74, y: 0, w: 62, h: 40},
  {x: 0, y: 52, w: 62, h: 40},
  {x: 74, y: 52, w: 62, h: 40},
  {x: 0, y: 104, w: 62, h: 40},
  {x: 74, y: 104, w: 62, h: 40},
];

/**
 * The hero object of the reel: a large graphite crystal-glass SIM card with a cold
 * glass contact chip. `syncProgress` slides its internal spectrum from the cool
 * international cyan/blue toward the local mint+graphite palette.
 */
export const HolographicSim: React.FC<{
  frame: number;
  opacity?: number;
  scale?: number;
  /** 0 = international spectrum, 1 = synced to the local mint/graphite spectrum. */
  syncProgress?: number;
  /** Overlay drawn on the card face, e.g. the traffic fingerprint. */
  faceOverlay?: ReactNode;
}> = ({frame, opacity = 1, scale = 1, syncProgress = 0, faceOverlay}) => {
  // Total travel stays inside the 4-6 degree budget: a slow -2.6 -> +2.6 drift.
  const tiltY = interpolate(frame, [0, 470], [-2.6, 2.6], EASE);
  const tiltX = interpolate(frame, [0, 470], [1.7, -1.4], EASE);

  // Light sweeping across the crystal edges and the contact chip.
  const sweep = (frame % 150) / 150;
  const sweepX = interpolate(sweep, [0, 1], [-40, 140], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const cool = `rgba(96,176,255,${0.34 * (1 - syncProgress)})`;
  const mintGlow = 0.2 + syncProgress * 0.24;

  return (
    <div
      style={{
        position: 'absolute',
        width: CARD_W,
        height: CARD_H,
        opacity,
        scale: String(scale),
        transform: `perspective(1400px) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Ambient bloom behind the card */}
      <div
        style={{
          position: 'absolute',
          inset: -110,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(34,240,208,${mintGlow * 0.5}), transparent 68%)`,
          filter: 'blur(38px)',
        }}
      />

      {/* Card body: graphite crystal glass with the classic cut corner */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 34,
          clipPath: 'polygon(0 0, 87% 0, 100% 12%, 100% 100%, 0 100%)',
          background:
            'linear-gradient(146deg, rgba(38,52,55,.96) 0%, rgba(19,28,30,.97) 42%, rgba(10,16,17,.98) 100%)',
          boxShadow: `0 34px 78px rgba(0,0,0,.66), inset 0 1px 0 rgba(214,255,246,.16), 0 0 60px rgba(34,240,208,${mintGlow * 0.35})`,
          overflow: 'hidden',
        }}
      >
        {/* Cool international reflection, fades out as the card syncs */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(118deg, transparent 18%, ${cool} 46%, transparent 72%)`,
          }}
        />
        {/* Mint digital reflection, strengthens as the card syncs */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(118deg, transparent 28%, rgba(34,240,208,${0.1 + syncProgress * 0.16}) 52%, transparent 78%)`,
          }}
        />
        {/* Moving highlight along the glass */}
        <div
          style={{
            position: 'absolute',
            top: -CARD_H,
            left: `${sweepX}%`,
            width: 120,
            height: CARD_H * 3,
            background: 'linear-gradient(90deg, transparent, rgba(214,255,246,.16), transparent)',
            transform: 'rotate(18deg)',
            filter: 'blur(6px)',
          }}
        />
        {/* Subtle binary texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.13,
            fontFamily: manrope,
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1.5,
            letterSpacing: 5,
            color: colors.lightMint,
            padding: '18px 20px',
            wordBreak: 'break-all',
            userSelect: 'none',
          }}
        >
          01001100 01010100 01000101 01010010 01001111 01000001 01001101 01001001
          01001110 01000111 01000100 01000001 01010100 01000001
        </div>

        {/* Contact chip */}
        <div style={{position: 'absolute', left: 46, top: 96, width: 136, height: 144}}>
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: 16,
              background:
                'linear-gradient(140deg, rgba(226,208,150,.30), rgba(150,196,196,.16) 48%, rgba(120,160,168,.24))',
              boxShadow: 'inset 0 0 22px rgba(255,240,200,.12)',
            }}
          />
          <svg width={136} height={144} style={{position: 'absolute', inset: 0}}>
            <defs>
              <linearGradient id="fs-pad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(238,224,176,.92)" />
                <stop offset="52%" stopColor="rgba(176,206,206,.72)" />
                <stop offset="100%" stopColor="rgba(126,166,172,.82)" />
              </linearGradient>
            </defs>
            {PADS.map((pad) => (
              <rect
                key={`${pad.x}-${pad.y}`}
                x={pad.x}
                y={pad.y}
                width={pad.w}
                height={pad.h}
                rx={7}
                fill="url(#fs-pad)"
                opacity={0.9}
              />
            ))}
            <path d="M68 20 L68 124" stroke="rgba(10,16,17,.85)" strokeWidth={5} />
          </svg>
          {/* Light reflecting off the chip */}
          <div
            style={{
              position: 'absolute',
              left: `${interpolate(sweep, [0, 1], [-60, 150], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`,
              top: -20,
              width: 46,
              height: 184,
              background: 'linear-gradient(90deg, transparent, rgba(255,252,236,.42), transparent)',
              transform: 'rotate(14deg)',
              filter: 'blur(4px)',
            }}
          />
        </div>

        {/* Card face label */}
        <div
          style={{
            position: 'absolute',
            left: 214,
            top: 118,
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 21,
            letterSpacing: 2.4,
            color: colors.lightMint,
            opacity: 0.86,
            textShadow: '0 0 14px rgba(140,255,233,.34)',
          }}
        >
          FOREIGN
          <br />
          SIM
        </div>

        {faceOverlay}
      </div>

      {/* Crystal rim */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 34,
          clipPath: 'polygon(0 0, 87% 0, 100% 12%, 100% 100%, 0 100%)',
          border: `1px solid rgba(140,255,233,${0.2 + syncProgress * 0.16})`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

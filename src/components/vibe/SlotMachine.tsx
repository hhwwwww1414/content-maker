import React from 'react';
import {interpolate} from 'remotion';
import {vibe} from './theme';
import {manrope, unbounded} from '../../theme/fonts';
import {useMs} from './primitives';

/** Reel strips. The last entry is where each reel settles. */
const STRIPS = [
  ['SPEC', 'IDEA', 'PROMPT'],
  ['DIFF', 'PATCH', 'CODE'],
  ['PROOF', 'TEST', 'HOPE'],
];

const ROW_HEIGHT = 74;
const SPIN_MS = 900;
const STAGGER_MS = 240;

const Reel: React.FC<{strip: string[]; startMs: number; index: number}> = ({strip, startMs, index}) => {
  const ms = useMs();
  const begin = startMs + index * STAGGER_MS;
  // Three full passes then a settle on the last row — deterministic, no randomness.
  const rows = strip.length;
  const travel = interpolate(ms, [begin, begin + SPIN_MS], [rows * 3 + rows - 1, rows - 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const offset = -(travel % rows) * ROW_HEIGHT;

  return (
    <div
      style={{
        flex: 1,
        height: ROW_HEIGHT,
        overflow: 'hidden',
        background: vibe.paper,
        borderRadius: 12,
        border: `2px solid ${vibe.line}`,
        position: 'relative',
      }}
    >
      <div style={{position: 'absolute', left: 0, right: 0, top: offset}}>
        {[...strip, ...strip, ...strip, ...strip].map((word, i) => (
          <div
            key={`${word}-${i}`}
            style={{
              height: ROW_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 28,
              letterSpacing: 0.5,
              color: vibe.ink,
            }}
          >
            {word}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SlotMachine: React.FC<{
  /** ms at which the lever is pulled and the reels start spinning */
  pullMs: number;
  /** ms at which the machine shrinks into a corner of the canvas */
  shrinkMs: number | null;
  /** ms at which it stops being a slot machine and becomes a plain AGENT block */
  morphMs: number | null;
}> = ({pullMs, shrinkMs, morphMs}) => {
  const ms = useMs();

  const shrink = shrinkMs === null
    ? 0
    : interpolate(ms, [shrinkMs, shrinkMs + 700], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const morph = morphMs === null
    ? 0
    : interpolate(ms, [morphMs, morphMs + 600], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Base geometry, then two keyframed moves. transform-origin is top-left so the
  // translate values are the final on-canvas offsets.
  const scale = interpolate(shrink, [0, 1], [1, 0.45]);
  const dx = interpolate(shrink, [0, 1], [0, 450]);
  const dy = interpolate(shrink, [0, 1], [0, -70]);

  const lever = interpolate(ms, [pullMs, pullMs + 320], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 2),
  });

  const entry = interpolate(ms, [pullMs - 500, pullMs - 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 250,
        top: 656,
        width: 560,
        transformOrigin: 'top left',
        transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
        opacity: entry,
      }}
    >
      <div
        style={{
          position: 'relative',
          boxSizing: 'border-box',
          padding: '26px 28px',
          borderRadius: 24,
          background: vibe.bgTint,
          border: `3px solid ${vibe.line}`,
        }}
      >
        <div style={{opacity: 1 - morph}}>
          <div
            style={{
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 19,
              letterSpacing: 2.4,
              color: vibe.inkSoft,
              marginBottom: 14,
            }}
          >
            VIBE CODING
          </div>
          <div style={{display: 'flex', gap: 12}}>
            {STRIPS.map((strip, i) => (
              <Reel key={strip[strip.length - 1]} strip={strip} startMs={pullMs} index={i} />
            ))}
          </div>
        </div>

        {/* AGENT block that the machine turns into once the trust system exists */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: morph,
          }}
        >
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 44, color: vibe.ink, letterSpacing: 1}}>
            AGENT
          </div>
          <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: vibe.inkSoft}}>исполнитель</div>
        </div>

        {/* Lever */}
        <div
          style={{
            position: 'absolute',
            right: -34,
            top: 46,
            width: 34,
            height: 118,
            opacity: 1 - morph,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: 0,
              width: 8,
              height: 92,
              borderRadius: 6,
              background: vibe.inkSoft,
              transformOrigin: 'bottom center',
              transform: `rotate(${interpolate(lever, [0, 1], [-18, 46])}deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 2,
              top: interpolate(lever, [0, 1], [-14, 44]),
              width: 28,
              height: 28,
              borderRadius: 999,
              background: vibe.danger,
              transform: `translateX(${interpolate(lever, [0, 1], [-10, 22])}px)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

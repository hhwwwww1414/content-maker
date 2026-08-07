import {Easing, Img, interpolate, staticFile} from 'remotion';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;
const OUT = {easing: Easing.out(Easing.cubic), ...CLAMP} as const;

/** Three mint waves sweep the frame; each one lights up the slice of the mascot it
 * crosses. The windows overlap slightly so the reveal never stalls. */
const WAVES = [
  {from: 0.0, to: 0.34, baseAfter: 0.2},
  {from: 0.28, to: 0.62, baseAfter: 0.48},
  {from: 0.56, to: 0.92, baseAfter: 1},
];

const BAND = 104;

/**
 * Reveals the official mascot PNG through passing radio waves instead of the smoke
 * dissolve used in earlier reels. The PNG itself is never scaled non-uniformly or
 * distorted — only its visibility is animated.
 */
export const SignalWaveReveal: React.FC<{
  /** 0 = nothing revealed, 1 = mascot fully visible with a calm glow. */
  progress: number;
  left: number;
  top: number;
  width: number;
  height: number;
}> = ({progress, left, top, width, height}) => {
  const travel = height + BAND * 2;

  const base = WAVES.reduce((accumulated, wave) => {
    const passed = interpolate(progress, [wave.to - 0.1, wave.to + 0.06], [0, 1], EASE);
    return Math.max(accumulated, passed * wave.baseAfter);
  }, 0);

  const settled = interpolate(progress, [0.82, 1], [0, 1], OUT);

  return (
    <div style={{position: 'absolute', left, top, width, height}}>
      {/* Calm glow that remains once the waves have gone */}
      <div
        style={{
          position: 'absolute',
          inset: -46,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,240,208,.24), transparent 68%)',
          filter: 'blur(34px)',
          opacity: settled,
        }}
      />

      {/* Base mascot, stepping up in visibility after each wave */}
      <Img
        src={staticFile('assets/mascot/ghostpepe-main.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width,
          height,
          objectFit: 'contain',
          opacity: base,
          filter: `drop-shadow(0 0 26px rgba(34,240,208,${0.16 + settled * 0.16}))`,
        }}
      />

      {WAVES.map((wave, index) => {
        const local = interpolate(progress, [wave.from, wave.to], [0, 1], EASE);
        if (local <= 0 || local >= 1) return null;
        const y = interpolate(local, [0, 1], [-BAND, travel - BAND], CLAMP);
        const intensity = interpolate(local, [0, 0.12, 0.88, 1], [0, 1, 1, 0], CLAMP);

        return (
          <div key={index} style={{position: 'absolute', inset: 0}}>
            {/* Slice of the mascot lit by this wave */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(${Math.max(0, y)}px 0 ${Math.max(0, height - y - BAND)}px 0)`,
              }}
            >
              <Img
                src={staticFile('assets/mascot/ghostpepe-main.png')}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width,
                  height,
                  objectFit: 'contain',
                  opacity: intensity * 0.92,
                  filter: 'drop-shadow(0 0 22px rgba(34,240,208,.5))',
                }}
              />
            </div>

            {/* The wave front itself */}
            <div
              style={{
                position: 'absolute',
                left: -110,
                top: y + BAND * 0.5,
                width: width + 220,
                height: 2.4,
                background: 'linear-gradient(90deg, transparent, rgba(140,255,233,.85), transparent)',
                boxShadow: '0 0 26px rgba(34,240,208,.6)',
                opacity: intensity,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: -110,
                top: y,
                width: width + 220,
                height: BAND,
                background: 'linear-gradient(180deg, transparent, rgba(34,240,208,.12), transparent)',
                opacity: intensity,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

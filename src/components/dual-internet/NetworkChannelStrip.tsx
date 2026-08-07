import {manrope} from '../../theme/fonts';
import {CH, faderY, MIXER, seeded} from './console';
import {TrafficWaveform} from './TrafficWaveform';
import {TrafficVuMeter} from './TrafficVuMeter';

const engrave = {
  fontFamily: manrope,
  fontWeight: 700,
  textShadow: '0 1px 0 rgba(255,255,255,.06), 0 -1px 2px rgba(0,0,0,.7)',
} as const;

/**
 * One illuminated channel strip of the console (LOCAL or WORLD). Physical
 * chassis with engraved labels, a waveform window, a mechanical fader on its
 * track, tick scale, a VU meter and a status LED. Everything driven by `level`
 * continuously — no boolean states.
 */
export const NetworkChannelStrip: React.FC<{
  frame: number;
  x: number;
  level: number; // 0..1 channel amplitude / fader position
  labels: string[];
  core: string;
  glow: string;
  seed: number;
  warn?: number; // 0..1 amber warning
}> = ({frame, x, level, labels, core, glow, seed, warn = 0}) => {
  const w = MIXER.stripW;
  const top = MIXER.panelTop + 28;
  const bottom = MIXER.panelBottom - 28;
  const knobY = faderY(level);
  const waveY = top + 118;

  return (
    <>
      {/* chassis */}
      <div
        style={{
          position: 'absolute',
          left: x - w / 2,
          top,
          width: w,
          height: bottom - top,
          borderRadius: 26,
          background: 'linear-gradient(180deg, rgba(26,36,38,0.96), rgba(15,22,24,0.98))',
          border: '1px solid rgba(140,255,233,0.12)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.05), inset 0 -18px 40px rgba(0,0,0,0.45), 0 24px 60px rgba(0,0,0,0.4)',
        }}
      />
      {/* engraved header labels */}
      <div style={{position: 'absolute', left: x - w / 2, top: top + 22, width: w, textAlign: 'center'}}>
        <div style={{...engrave, fontSize: 30, letterSpacing: 3, color: core, textShadow: `0 0 16px ${glow}`}}>
          {labels[0]}
        </div>
        {labels.slice(1).map((l, i) => (
          <div key={i} style={{...engrave, fontSize: 17, letterSpacing: 5, color: 'rgba(155,168,165,0.85)', marginTop: 6}}>
            {l}
          </div>
        ))}
      </div>

      {/* waveform window */}
      <div
        style={{
          position: 'absolute',
          left: x - w / 2 + 18,
          top: waveY - 52,
          width: w - 36,
          height: 104,
          borderRadius: 14,
          background: 'linear-gradient(180deg, rgba(6,12,13,0.9), rgba(9,16,17,0.95))',
          border: '1px solid rgba(140,255,233,0.1)',
          boxShadow: 'inset 0 0 24px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        <TrafficWaveform frame={frame} cx={x - (x - w / 2 + 18)} cy={52} width={w - 52} height={80} amplitude={level} core={core} glow={glow} seed={seed} />
      </div>

      {/* fader track */}
      <div
        style={{
          position: 'absolute',
          left: x - 3,
          top: MIXER.faderTop,
          width: 6,
          height: MIXER.faderBottom - MIXER.faderTop,
          borderRadius: 4,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.8)',
        }}
      />
      {/* lit portion of the track above the knob */}
      <div
        style={{
          position: 'absolute',
          left: x - 2,
          top: knobY,
          width: 4,
          height: Math.max(0, MIXER.faderBottom - knobY),
          borderRadius: 4,
          background: core,
          opacity: 0.5 + 0.4 * level,
          boxShadow: `0 0 10px ${glow}`,
        }}
      />
      {/* tick scale */}
      {Array.from({length: 9}).map((_, i) => {
        const ty = MIXER.faderTop + (i / 8) * (MIXER.faderBottom - MIXER.faderTop);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + 30,
              top: ty,
              width: i % 2 === 0 ? 14 : 8,
              height: 2,
              background: 'rgba(155,168,165,0.35)',
            }}
          />
        );
      })}
      {/* fader knob */}
      <div
        style={{
          position: 'absolute',
          left: x - 40,
          top: knobY - 17,
          width: 80,
          height: 34,
          borderRadius: 8,
          background: 'linear-gradient(180deg, #3a474a 0%, #222d2f 48%, #171f21 52%, #0f1516 100%)',
          border: '1px solid rgba(0,0,0,0.6)',
          boxShadow: `0 6px 14px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px ${glow}`,
        }}
      >
        <div style={{position: 'absolute', left: 8, right: 8, top: '50%', height: 2, transform: 'translateY(-50%)', background: core, opacity: 0.9, boxShadow: `0 0 8px ${glow}`}} />
      </div>

      {/* VU meter */}
      <TrafficVuMeter frame={frame} x={x - w / 2 + 22} bottom={bottom - 30} height={210} amplitude={level} core={core} warn={warn} seed={seed} />

      {/* status LED + screws */}
      <div
        style={{
          position: 'absolute',
          left: x + w / 2 - 34,
          top: bottom - 40,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: warn > 0.4 ? CH.amber : core,
          opacity: 0.5 + 0.5 * Math.max(level, warn),
          boxShadow: `0 0 12px ${warn > 0.4 ? CH.amberGlow : glow}`,
        }}
      />
      {[top + 12, bottom - 12].map((sy, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - w / 2 + (i === 0 ? 14 : w - 22),
            top: sy,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #4a565a, #10171a)',
            opacity: 0.6 + 0.2 * seeded(i + seed),
          }}
        />
      ))}
    </>
  );
};

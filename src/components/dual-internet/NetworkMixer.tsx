import {manrope} from '../../theme/fonts';
import {CH, MIXER, seeded} from './console';

/**
 * The outer console chassis that houses the channel strips: a large graphite
 * panel with a metallic header rail, engraved product line, tiny status LEDs and
 * side vents. Deterministic and static apart from a very slow LED breathing.
 */
export const NetworkMixer: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => {
  const w = MIXER.panelRight - MIXER.panelLeft;
  return (
    <div style={{position: 'absolute', inset: 0, opacity, pointerEvents: 'none'}}>
      {/* main panel */}
      <div
        style={{
          position: 'absolute',
          left: MIXER.panelLeft,
          top: MIXER.panelTop,
          width: w,
          height: MIXER.panelBottom - MIXER.panelTop,
          borderRadius: 34,
          background: 'linear-gradient(180deg, rgba(20,29,31,0.9), rgba(11,17,19,0.94))',
          border: '1px solid rgba(140,255,233,0.1)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.05), inset 0 -30px 70px rgba(0,0,0,0.5), 0 40px 90px rgba(0,0,0,0.5)',
        }}
      />
      {/* header rail */}
      <div
        style={{
          position: 'absolute',
          left: MIXER.panelLeft + 16,
          top: MIXER.panelTop - 4,
          width: w - 32,
          height: 2,
          background: 'linear-gradient(90deg, rgba(140,255,233,0), rgba(140,255,233,0.3), rgba(140,255,233,0))',
        }}
      />
      {/* side vents */}
      {[MIXER.panelLeft + 8, MIXER.panelRight - 12].map((vx, i) =>
        Array.from({length: 6}).map((_, j) => (
          <div
            key={`${i}-${j}`}
            style={{
              position: 'absolute',
              left: vx,
              top: MIXER.panelTop + 200 + j * 16,
              width: 4,
              height: 8,
              borderRadius: 2,
              background: 'rgba(0,0,0,0.4)',
            }}
          />
        )),
      )}
      {/* tiny status LEDs on the header */}
      {Array.from({length: 5}).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: MIXER.panelRight - 40 - i * 20,
            top: MIXER.panelTop + 18,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i % 2 === 0 ? CH.worldCore : CH.localCore,
            opacity: 0.35 + 0.4 * seeded(i + Math.floor(frame / 10)),
            boxShadow: `0 0 8px ${CH.worldGlow}`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: MIXER.panelLeft + 26,
          top: MIXER.panelTop + 14,
          fontFamily: manrope,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 4,
          color: 'rgba(155,168,165,0.6)',
        }}
      >
        NETWORK ROUTING
      </div>
    </div>
  );
};

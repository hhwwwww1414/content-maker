import {interpolate} from 'remotion';
import {manrope} from '../../theme/fonts';
import {CH, faderY, MIXER} from './console';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const engrave = {fontFamily: manrope, fontWeight: 800, textShadow: '0 1px 0 rgba(255,255,255,.06), 0 -1px 2px rgba(0,0,0,.7)'} as const;

/**
 * The single MASTER fader that, in the first half, forces both worlds to share
 * one control. Its housing is built as two halves so it can later open cleanly
 * (`split`). The engraved VPN ON / VPN OFF readout crossfades with the bias
 * instead of hard-switching.
 */
export const MasterNetworkFader: React.FC<{
  frame: number;
  bias: number; // 0 = LOCAL (down), 1 = WORLD (up)
  split: number; // 0 = intact, 1 = fully opened
  opacity: number;
}> = ({bias, split, opacity}) => {
  const mW = 178;
  const top = MIXER.panelTop + 14;
  const bottom = MIXER.panelBottom - 14;
  const cx = MIXER.masterX;
  const part = split * 52; // how far the halves separate
  const knobY = faderY(bias);
  const knobOpacity = interpolate(split, [0, 0.55], [1, 0], CLAMP);
  // Narrow crossfade zone so the VPN ON / VPN OFF readout never sits as a 50/50
  // blend for long (avoids the engraved sub-labels overlapping mid-travel).
  const onAmt = interpolate(bias, [0.47, 0.57], [0, 1], CLAMP);

  const half = (side: -1 | 1): React.CSSProperties => ({
    position: 'absolute',
    top,
    left: side === -1 ? cx - mW / 2 - part : cx - part * 0 + 2 + part,
    width: mW / 2 - 2,
    height: bottom - top,
    background: 'linear-gradient(180deg, rgba(30,41,44,0.97), rgba(16,24,26,0.98))',
    border: '1px solid rgba(140,255,233,0.16)',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.06), 0 26px 60px rgba(0,0,0,0.45)',
    borderRadius: side === -1 ? '28px 8px 8px 28px' : '8px 28px 28px 8px',
  });

  return (
    <div style={{opacity, position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <div style={half(-1)} />
      <div style={{...half(1), left: cx + 2 + part}} />

      {/* seam glow when opening */}
      <div
        style={{
          position: 'absolute',
          left: cx - 2,
          top: top + 10,
          width: 4,
          height: bottom - top - 20,
          background: CH.worldCore,
          opacity: split * 0.5,
          filter: 'blur(3px)',
          boxShadow: `0 0 16px ${CH.worldGlow}`,
        }}
      />

      {/* engraved MASTER header */}
      <div style={{position: 'absolute', left: cx - mW / 2, top: top + 20, width: mW, textAlign: 'center', opacity: 1 - split}}>
        <div style={{...engrave, fontSize: 22, letterSpacing: 8, color: 'rgba(200,214,211,0.9)'}}>MASTER</div>
      </div>

      {/* VPN ON / VPN OFF readout, engraved on the housing, crossfading with bias */}
      <div style={{position: 'absolute', left: cx - mW / 2, top: top + 62, width: mW, textAlign: 'center', opacity: 1 - split}}>
        <div style={{position: 'relative', height: 54}}>
          <div style={{position: 'absolute', inset: 0, opacity: onAmt}}>
            <div style={{...engrave, fontSize: 26, letterSpacing: 3, color: CH.worldCore, textShadow: `0 0 14px ${CH.worldGlow}`}}>VPN ON</div>
            <div style={{...engrave, fontSize: 15, letterSpacing: 4, color: 'rgba(155,168,165,0.85)', marginTop: 4}}>ОДНИ ПРАВИЛА</div>
          </div>
          <div style={{position: 'absolute', inset: 0, opacity: 1 - onAmt}}>
            <div style={{...engrave, fontSize: 26, letterSpacing: 3, color: CH.localCore, textShadow: '0 0 12px rgba(140,255,233,0.4)'}}>VPN OFF</div>
            <div style={{...engrave, fontSize: 15, letterSpacing: 4, color: 'rgba(155,168,165,0.85)', marginTop: 4}}>ДРУГИЕ ПРАВИЛА</div>
          </div>
        </div>
      </div>

      {/* master track */}
      <div style={{position: 'absolute', left: cx - 3, top: MIXER.faderTop, width: 6, height: MIXER.faderBottom - MIXER.faderTop, borderRadius: 4, background: 'rgba(0,0,0,0.55)', opacity: 1 - split}} />

      {/* master knob */}
      <div
        style={{
          position: 'absolute',
          left: cx - 62,
          top: knobY - 24,
          width: 124,
          height: 48,
          borderRadius: 10,
          opacity: knobOpacity,
          background: 'linear-gradient(180deg, #43514f 0%, #26312f 48%, #1a2221 52%, #0f1516 100%)',
          border: '1px solid rgba(0,0,0,0.6)',
          boxShadow: `0 8px 18px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14), 0 0 22px ${onAmt > 0.5 ? CH.worldGlow : 'rgba(140,255,233,0.4)'}`,
        }}
      >
        <div style={{position: 'absolute', left: 12, right: 12, top: '50%', height: 3, transform: 'translateY(-50%)', borderRadius: 3, background: onAmt > 0.5 ? CH.worldCore : CH.localCore, boxShadow: `0 0 10px ${onAmt > 0.5 ? CH.worldGlow : 'rgba(140,255,233,0.5)'}`}} />
      </div>
    </div>
  );
};

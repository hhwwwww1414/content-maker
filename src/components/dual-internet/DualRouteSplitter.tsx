import {interpolate} from 'remotion';
import {manrope} from '../../theme/fonts';
import {CH, faderY, MIXER} from './console';
import {LightPatchCable} from './LightPatchCable';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const engrave = {fontFamily: manrope, fontWeight: 700, textShadow: '0 1px 0 rgba(255,255,255,.05), 0 -1px 2px rgba(0,0,0,.7)'} as const;

const MiniFader: React.FC<{cx: number; bias: number; core: string; glow: string; appear: number; label: string}> = ({cx, bias, core, glow, appear, label}) => {
  const w = 60;
  const top = MIXER.faderTop - 12;
  const bottom = MIXER.faderBottom + 12;
  const knobY = faderY(bias);
  return (
    <div style={{opacity: appear}}>
      <div
        style={{
          position: 'absolute',
          left: cx - w / 2,
          top,
          width: w,
          height: bottom - top,
          borderRadius: 16,
          background: 'linear-gradient(180deg, rgba(30,41,44,0.97), rgba(15,22,24,0.98))',
          border: '1px solid rgba(140,255,233,0.16)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 42px rgba(0,0,0,0.4), 0 0 22px ${glow}`,
          transform: `scaleY(${appear})`,
          transformOrigin: '50% 40%',
        }}
      />
      <div style={{position: 'absolute', left: cx - 2, top: MIXER.faderTop, width: 4, height: MIXER.faderBottom - MIXER.faderTop, background: 'rgba(0,0,0,0.5)', borderRadius: 3, opacity: appear}} />
      <div
        style={{
          position: 'absolute',
          left: cx - 26,
          top: knobY - 14,
          width: 52,
          height: 28,
          borderRadius: 7,
          background: 'linear-gradient(180deg, #3a474a, #171f21)',
          border: '1px solid rgba(0,0,0,0.6)',
          boxShadow: `0 5px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 16px ${glow}`,
          opacity: appear,
        }}
      >
        <div style={{position: 'absolute', left: 8, right: 8, top: '50%', height: 2, transform: 'translateY(-50%)', background: core, boxShadow: `0 0 8px ${glow}`}} />
      </div>
      <div style={{position: 'absolute', left: cx - 70, top: top - 30, width: 140, textAlign: 'center', ...engrave, fontSize: 14, letterSpacing: 2, color: core, opacity: appear, textShadow: `0 0 12px ${glow}`}}>
        {label}
      </div>
    </div>
  );
};

/**
 * Scene 3 mechanical transformation: the one master control becomes two
 * independent mini-faders, each patched down to its own routing-bus lane. No
 * explosion — the parts appear and the light patch-lines draw themselves in.
 */
export const DualRouteSplitter: React.FC<{frame: number; progress: number; localBias: number; worldBias: number}> = ({progress, localBias, worldBias}) => {
  if (progress <= 0.001) return null;
  const appear = interpolate(progress, [0.05, 0.55], [0, 1], CLAMP);
  const cable = interpolate(progress, [0.45, 1], [0, 1], CLAMP);
  const mx1 = MIXER.masterX - 42;
  const mx2 = MIXER.masterX + 42;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <LightPatchCable x1={mx1} y1={MIXER.faderBottom + 14} x2={MIXER.localX} y2={MIXER.busTop + 34} progress={cable} color={CH.localCore} glow={CH.localGlow} sag={54} />
      <LightPatchCable x1={mx2} y1={MIXER.faderBottom + 14} x2={MIXER.worldX} y2={MIXER.busBottom - 34} progress={cable} color={CH.worldCore} glow={CH.worldGlow} sag={90} />
      <MiniFader cx={mx1} bias={localBias} core={CH.localCore} glow={CH.localGlow} appear={appear} label="LOCAL → DIRECT" />
      <MiniFader cx={mx2} bias={worldBias} core={CH.worldCore} glow={CH.worldGlow} appear={appear} label="WORLD → ROUTE" />
    </div>
  );
};

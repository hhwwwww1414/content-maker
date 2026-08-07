import {colors} from '../theme/colors';
import {manrope} from '../theme/fonts';

export const TOKEN_SIZE = 124;

/** One neutral domain token in the checkpoint queue: a crystal-glass plate carrying a
 * generic service name. Everything (glow, grey-out, refusal rim, stamp) is driven by
 * the parent's frame-derived values, so the token itself never makes a boolean jump. */
export const DomainToken: React.FC<{
  label: string;
  glow?: number;
  dim?: number;
  redRim?: number;
  stamp?: 'approve' | 'deny' | null;
  stampProgress?: number;
}> = ({label, glow = 0.25, dim = 0, redRim = 0, stamp = null, stampProgress = 0}) => {
  const [word, num] = label.split(' ');
  return (
    <div
      style={{
        position: 'relative',
        width: TOKEN_SIZE,
        height: TOKEN_SIZE,
        borderRadius: 26,
        background: 'linear-gradient(160deg, rgba(140,255,233,.14) 0%, rgba(21,27,29,.72) 46%, rgba(8,12,13,.85) 100%)',
        border: `1.5px solid rgba(140,255,233,${0.2 + 0.4 * glow})`,
        boxShadow: `0 0 ${14 + 34 * glow}px rgba(34,240,208,${0.12 + 0.32 * glow}), inset 0 1px 0 rgba(246,250,249,.18)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        filter: dim ? `grayscale(${dim}) brightness(${1 - 0.28 * dim})` : undefined,
        opacity: 1 - 0.22 * dim,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 26,
          border: `2px solid rgba(255,90,82,${0.75 * redRim})`,
          boxShadow: `0 0 ${26 * redRim}px rgba(255,90,82,${0.35 * redRim})`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 16,
          right: 16,
          height: 14,
          borderRadius: 10,
          background: 'linear-gradient(180deg, rgba(246,250,249,.22), rgba(246,250,249,0))',
        }}
      />
      <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: colors.white}}>{word}</div>
      <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: `rgba(140,255,233,${0.55 + 0.35 * glow})`}}>{num}</div>

      {stamp ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            translate: '-50% -50%',
            rotate: '-8deg',
            scale: 0.78 + 0.22 * stampProgress,
            opacity: stampProgress,
            padding: '8px 14px',
            borderRadius: 12,
            whiteSpace: 'nowrap',
            border: `3px solid ${stamp === 'approve' ? colors.mint : colors.errorRed}`,
            background: stamp === 'approve' ? 'rgba(8,12,13,.72)' : 'rgba(20,8,8,.78)',
            color: stamp === 'approve' ? colors.mint : colors.errorRed,
            fontFamily: manrope,
            fontWeight: 800,
            fontSize: stamp === 'approve' ? 26 : 20,
            letterSpacing: 3,
            boxShadow: `0 0 24px ${stamp === 'approve' ? 'rgba(34,240,208,.4)' : 'rgba(255,90,82,.35)'}`,
          }}
        >
          {stamp === 'approve' ? 'ДОПУСК' : 'НЕ В СПИСКЕ'}
        </div>
      ) : null}
    </div>
  );
};

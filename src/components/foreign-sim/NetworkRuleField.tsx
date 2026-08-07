import {Easing, interpolate} from 'remotion';
import {colors} from '../../theme/colors';
import {unbounded} from '../../theme/fonts';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;

/**
 * The rule field: a soft-edged crystal-glass lens standing in the light, not a gate
 * and not a barrier — it has no frame, no posts and no opening. Streams pass
 * straight through it; what changes is their structure on the far side.
 */
export const NetworkRuleField: React.FC<{
  frame: number;
  /** 0 = dormant glass, 1 = actively re-writing what passes through. */
  activity: number;
  opacity?: number;
  width?: number;
  height?: number;
}> = ({frame, activity, opacity = 1, width = 268, height = 880}) => {
  const shimmer = ((frame % 132) / 132) * 100;
  const breathe = interpolate((frame + 20) % 110, [0, 55, 110], [0.94, 1.04, 0.94], EASE);

  return (
    <div style={{position: 'absolute', width, height, opacity}}>
      {/* Field bloom */}
      <div
        style={{
          position: 'absolute',
          left: -110,
          top: -60,
          width: width + 220,
          height: height + 120,
          background: `radial-gradient(ellipse at center, rgba(34,240,208,${0.1 + activity * 0.13}), transparent 66%)`,
          filter: 'blur(42px)',
        }}
      />

      {/* Crystal-glass body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '46% 46% 46% 46% / 12% 12% 12% 12%',
          background:
            `linear-gradient(180deg, rgba(150,225,255,${0.05 + activity * 0.03}) 0%, rgba(34,240,208,${0.07 + activity * 0.07}) 46%, rgba(140,255,233,${0.04 + activity * 0.04}) 100%)`,
          border: `1px solid rgba(140,255,233,${0.2 + activity * 0.22})`,
          boxShadow: `inset 0 0 90px rgba(34,240,208,${0.09 + activity * 0.1}), 0 0 70px rgba(34,240,208,${activity * 0.14})`,
          overflow: 'hidden',
          scale: `1 ${breathe}`,
        }}
      >
        {/* Internal refraction bands — the light that passes gets bent here */}
        {Array.from({length: 15}, (_, index) => {
          const t = index / 14;
          const bend = interpolate(activity, [0, 1], [0, 16], EASE) * Math.sin(t * Math.PI * 2 + frame / 30);
          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: -18,
                top: `${t * 100}%`,
                width: width + 36,
                height: 1.4,
                background: `rgba(140,255,233,${0.1 + activity * 0.2})`,
                translate: `${bend}px 0`,
              }}
            />
          );
        })}

        {/* Vertical rule ticks */}
        {Array.from({length: 4}, (_, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${18 + index * 22}%`,
              top: '6%',
              width: 1,
              height: '88%',
              background: `linear-gradient(180deg, transparent, rgba(140,255,233,${0.14 + activity * 0.16}), transparent)`,
            }}
          />
        ))}

        {/* Moving highlight along the glass */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: `${shimmer - 30}%`,
            width: '100%',
            height: '30%',
            background: 'linear-gradient(180deg, transparent, rgba(214,255,246,.14), transparent)',
            filter: 'blur(10px)',
          }}
        />
      </div>

      {/* Field label, floating below the lens so it never crowds the headline */}
      <div
        style={{
          position: 'absolute',
          left: width / 2 - 150,
          top: height + 18,
          width: 300,
          textAlign: 'center',
          fontFamily: unbounded,
          fontWeight: 700,
          fontSize: 19,
          letterSpacing: 2.6,
          lineHeight: 1.35,
          color: colors.lightMint,
          opacity: 0.42 + activity * 0.44,
          textShadow: '0 0 18px rgba(34,240,208,.4)',
        }}
      >
        NETWORK
        <br />
        RULE FIELD
      </div>
    </div>
  );
};

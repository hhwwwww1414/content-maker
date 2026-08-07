import {colors} from '../theme/colors';

/** The crystal-glass turnstile itself: two pillars, a transparent door pane and a
 * three-arm rotor. A pass is expressed by `rotationDeg` growing another 120 degrees
 * (the rotor is 120-degree symmetric, so it settles into the identical closed pose);
 * a refusal is a soft red rim via `denyPulse`, never a flash. `lightSweepX` slides a
 * faint reflection across the glass so the surface reads as crystal. */
export const DigitalTurnstile: React.FC<{
  width?: number;
  height?: number;
  rotationDeg: number;
  denyPulse: number;
  lightSweepX: number;
}> = ({width = 380, height = 460, rotationDeg, denyPulse, lightSweepX}) => {
  const hubY = height * 0.56;
  const armLength = width * 0.36;

  return (
    <div style={{position: 'relative', width, height}}>
      {/* transparent door pane */}
      <div
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 14,
          bottom: 0,
          borderRadius: 24,
          background: 'linear-gradient(170deg, rgba(140,255,233,.10) 0%, rgba(21,27,29,.30) 55%, rgba(8,12,13,.42) 100%)',
          border: `1.5px solid rgba(140,255,233,.3)`,
          boxShadow: `inset 0 1px 0 rgba(246,250,249,.16), 0 0 ${18 + 40 * denyPulse}px rgba(255,90,82,${0.4 * denyPulse})`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            bottom: -20,
            width: 90,
            left: lightSweepX,
            rotate: '14deg',
            background: 'linear-gradient(90deg, rgba(246,250,249,0), rgba(246,250,249,.10), rgba(246,250,249,0))',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 24,
            border: `2px solid rgba(255,90,82,${0.7 * denyPulse})`,
          }}
        />
      </div>

      {/* pillars */}
      {[0, 1].map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            [side ? 'right' : 'left']: 0,
            top: 0,
            bottom: -8,
            width: 48,
            borderRadius: 18,
            background: 'linear-gradient(180deg, rgba(140,255,233,.16), rgba(16,23,25,.9) 40%, rgba(8,12,13,.95))',
            border: '1px solid rgba(140,255,233,.28)',
            boxShadow: 'inset 0 1px 0 rgba(246,250,249,.2)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 10,
              right: 10,
              top: 16,
              height: 8,
              borderRadius: 6,
              background: colors.mint,
              opacity: 0.4 + 0.4 * Math.max(0, 1 - denyPulse),
              boxShadow: '0 0 12px rgba(34,240,208,.5)',
            }}
          />
        </div>
      ))}

      {/* rotor */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: hubY,
          width: 0,
          height: 0,
          rotate: `${rotationDeg}deg`,
        }}
      >
        {[0, 120, 240].map((base) => (
          <div
            key={base}
            style={{
              position: 'absolute',
              left: 0,
              top: -7,
              width: armLength,
              height: 14,
              borderRadius: 10,
              transformOrigin: 'left center',
              rotate: `${base}deg`,
              background: 'linear-gradient(90deg, rgba(140,255,233,.55), rgba(140,255,233,.16))',
              border: '1px solid rgba(140,255,233,.4)',
              boxShadow: '0 0 14px rgba(34,240,208,.25)',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            left: -19,
            top: -19,
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, rgba(140,255,233,.75), rgba(21,27,29,.95))',
            border: '1.5px solid rgba(140,255,233,.5)',
            boxShadow: '0 0 20px rgba(34,240,208,.35)',
          }}
        />
      </div>
    </div>
  );
};

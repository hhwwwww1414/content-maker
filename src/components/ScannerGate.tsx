import {colors} from '../theme/colors';

/** The scan zone in front of the turnstile: four mint corner brackets around the token
 * slot and a horizontal light beam that sweeps down it vertically while a token is
 * being checked. `beamProgress` 0..1 moves the beam, `intensity` fades the whole rig. */
export const ScannerGate: React.FC<{
  width?: number;
  height?: number;
  intensity: number;
  beamProgress: number;
}> = ({width = 210, height = 250, intensity, beamProgress}) => {
  const bracket = (styles: React.CSSProperties) => (
    <div
      style={{
        position: 'absolute',
        width: 34,
        height: 34,
        borderColor: `rgba(34,240,208,${0.35 + 0.55 * intensity})`,
        borderStyle: 'solid',
        borderWidth: 0,
        ...styles,
      }}
    />
  );
  const beamY = 10 + beamProgress * (height - 26);

  return (
    <div style={{position: 'relative', width, height}}>
      <div
        style={{
          position: 'absolute',
          inset: 6,
          borderRadius: 20,
          background: `rgba(34,240,208,${0.05 * intensity})`,
          boxShadow: `inset 0 0 40px rgba(34,240,208,${0.12 * intensity})`,
        }}
      />
      {bracket({left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 12})}
      {bracket({right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 12})}
      {bracket({left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 12})}
      {bracket({right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 12})}

      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          top: beamY,
          height: 5,
          borderRadius: 5,
          background: `linear-gradient(90deg, rgba(34,240,208,0), ${colors.mint}, rgba(34,240,208,0))`,
          boxShadow: `0 0 18px rgba(34,240,208,${0.7 * intensity})`,
          opacity: intensity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top: Math.max(8, beamY - 46),
          height: 46,
          background: 'linear-gradient(180deg, rgba(34,240,208,0), rgba(34,240,208,.14))',
          opacity: intensity,
        }}
      />
    </div>
  );
};

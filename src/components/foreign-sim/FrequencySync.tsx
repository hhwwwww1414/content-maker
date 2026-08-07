import {Easing, interpolate} from 'remotion';
import {unbounded} from '../../theme/fonts';

const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const EASE = {easing: Easing.inOut(Easing.cubic), ...CLAMP} as const;

const SIZE = 760;
const CENTER = SIZE / 2;

/** Each ring starts on its own frequency and tilt, then converges on the shared one. */
const RINGS = [
  {label: 'LTE', rx: 342, ry: 118, rotation: -17, frequency: 5.4, amplitude: 11},
  {label: 'ROAMING', rx: 308, ry: 154, rotation: 13, frequency: 3.1, amplitude: 15},
  {label: 'GLOBAL', rx: 274, ry: 92, rotation: 31, frequency: 7.8, amplitude: 8},
];

const TARGET = {rx: 314, ry: 126, rotation: 4, frequency: 4.8, amplitude: 12};

/**
 * The international spectral rings around the SIM. They never snap off — their
 * tilts, radii and frequencies drift into alignment with the local network's, and
 * their colour resolves from cool blue into the mint spectrum.
 */
export const FrequencySync: React.FC<{
  frame: number;
  /** 0 = three independent international frequencies, 1 = one aligned local spectrum. */
  sync: number;
  opacity?: number;
}> = ({frame, sync, opacity = 1}) => {
  const mix = (from: number, to: number) => interpolate(sync, [0, 1], [from, to], EASE);
  const strokeFor = (alpha: number) =>
    `rgba(${Math.round(120 - 86 * sync)}, ${Math.round(196 + 44 * sync)}, ${Math.round(255 - 47 * sync)}, ${alpha})`;

  return (
    <div style={{position: 'absolute', width: SIZE, height: SIZE, opacity}}>
      <svg width={SIZE} height={SIZE} style={{position: 'absolute', inset: 0}}>
        {RINGS.map((ring, index) => {
          const rx = mix(ring.rx, TARGET.rx);
          const ry = mix(ring.ry, TARGET.ry);
          const rotation = mix(ring.rotation, TARGET.rotation);
          const frequency = mix(ring.frequency, TARGET.frequency);
          const amplitude = mix(ring.amplitude, TARGET.amplitude);
          const phase = frame / 34 + index * 0.9 * (1 - sync);

          // A frequency trace running around the ring: the wave rides the ellipse.
          const points = Array.from({length: 121}, (_, step) => {
            const angle = (step / 120) * Math.PI * 2;
            const wobble = amplitude * Math.sin(angle * frequency + phase);
            const x = Math.cos(angle) * (rx + wobble);
            const y = Math.sin(angle) * (ry + wobble * 0.42);
            const rad = (rotation * Math.PI) / 180;
            return `${CENTER + x * Math.cos(rad) - y * Math.sin(rad)},${CENTER + x * Math.sin(rad) + y * Math.cos(rad)}`;
          }).join(' ');

          return (
            <g key={ring.label}>
              <polyline
                points={points}
                fill="none"
                stroke={strokeFor(0.2)}
                strokeWidth={9}
                style={{filter: 'blur(8px)'}}
              />
              <polyline points={points} fill="none" stroke={strokeFor(0.62)} strokeWidth={1.9} />
            </g>
          );
        })}
      </svg>

      {RINGS.map((ring, index) => {
        const rx = mix(ring.rx, TARGET.rx);
        const ry = mix(ring.ry, TARGET.ry);
        const rotation = mix(ring.rotation, TARGET.rotation);
        // Park each label on its own ring so it travels as the ring realigns.
        const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 3);
        const rad = (rotation * Math.PI) / 180;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;
        const px = CENTER + x * Math.cos(rad) - y * Math.sin(rad);
        const py = CENTER + x * Math.sin(rad) + y * Math.cos(rad);

        return (
          <div
            key={ring.label}
            style={{
              position: 'absolute',
              left: px - 90,
              top: py - 14,
              width: 180,
              textAlign: 'center',
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 2.6,
              color: sync > 0.5 ? 'rgba(140,255,233,.9)' : 'rgba(168,218,255,.9)',
              opacity: interpolate(sync, [0, 0.72, 1], [0.86, 0.72, 0.34], EASE),
              textShadow: '0 0 16px rgba(34,240,208,.34)',
            }}
          >
            {ring.label}
          </div>
        );
      })}
    </div>
  );
};

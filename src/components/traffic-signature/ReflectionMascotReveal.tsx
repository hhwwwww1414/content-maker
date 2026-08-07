import {Img, interpolate} from 'remotion';
import {CLAMP, EASE, tsColors} from './trafficSignatureConfig';
import {EncryptedDataCapsule} from './EncryptedDataCapsule';

/**
 * REFLECTION REVEAL — a large encrypted capsule passes across the foreground.
 * For a moment the mascot appears as a reflection on its glossy face; as the
 * capsule continues, the real mascot PNG is physically there behind it. Reads
 * as a camera reveal, not a magic appearance.
 */
export const ReflectionMascotReveal: React.FC<{
  progress: number;
  mascotSrc: string;
  mascotCx: number;
  mascotCy: number;
  mascotSize: number;
  enterX: number;
  exitX: number;
  laneY: number;
}> = ({progress, mascotSrc, mascotCx, mascotCy, mascotSize, enterX, exitX, laneY}) => {
  const capsuleCx = interpolate(progress, [0, 1], [enterX, exitX], EASE);
  const capW = 300;
  const capH = 452;
  // proximity of the capsule face to the mascot column (0..1, 1 = overlapping)
  const proximity = interpolate(Math.abs(capsuleCx - mascotCx), [0, 260], [1, 0], CLAMP);
  const reflectionOpacity = proximity * interpolate(progress, [0.12, 0.4], [0, 1], CLAMP) * 0.85;
  // ground-glow reveal: appears once the capsule has moved past (to the left of) the
  // mascot column. inputRange must be increasing, so map the decreasing capsule x flipped.
  const reveal = interpolate(capsuleCx, [mascotCx - 200, mascotCx - 30], [1, 0], CLAMP);

  const reflectionNode = (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Img
        src={mascotSrc}
        style={{
          width: mascotSize * 0.82,
          height: 'auto',
          transform: 'scaleX(-1)',
          opacity: 0.9,
          filter: 'brightness(1.15) contrast(0.9)',
        }}
      />
    </div>
  );

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* soft mint ground-glow the mascot stands in */}
      <div
        style={{
          position: 'absolute',
          left: mascotCx - 190,
          top: mascotCy - 40,
          width: 380,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(34,240,208,.14), rgba(34,240,208,0) 68%)',
          opacity: reveal,
        }}
      />
      {/* NOTE: the real mascot is rendered by the composition as a single element so it
          can travel continuously into the finale (no duplicate mascot across scenes). */}
      {/* passing capsule with mascot reflection */}
      <EncryptedDataCapsule
        cx={capsuleCx}
        cy={laneY}
        w={capW}
        h={capH}
        opacity={interpolate(progress, [0, 0.06, 0.9, 1], [0, 1, 1, 0.85], CLAMP)}
        gloss={interpolate(progress, [0, 1], [0.15, 0.85], CLAMP)}
        reflection={reflectionNode}
        reflectionOpacity={reflectionOpacity}
      />
      {/* thin cyan pass highlight to sell the sweep */}
      <div
        style={{
          position: 'absolute',
          left: capsuleCx,
          top: laneY - capH / 2,
          width: 2,
          height: capH,
          transform: 'translateX(-50%)',
          background: `linear-gradient(180deg, rgba(95,199,230,0), ${tsColors.cyan}, rgba(95,199,230,0))`,
          opacity: interpolate(progress, [0.05, 0.2, 0.85, 0.95], [0, 0.5, 0.5, 0], CLAMP),
        }}
      />
    </div>
  );
};

import {random} from 'remotion';
import {colors} from '../theme/colors';

const STREAM_COUNT = 4;

/** The mint hall of allowed resources, seen through the turnstile glass: a deep
 * teal-to-mint room with slow upward data streams and soft digital fog. `glow`
 * brightens calmly after each successful pass instead of switching states. */
export const WhitelistHall: React.FC<{
  glow: number;
  frame: number;
  width?: number;
  height?: number;
}> = ({glow, frame, width = 330, height = 540}) => (
  <div
    style={{
      position: 'relative',
      width,
      height,
      borderRadius: 30,
      overflow: 'hidden',
      background: `linear-gradient(180deg, rgba(34,240,208,${0.05 + 0.1 * glow}) 0%, rgba(16,32,30,${0.5 + 0.25 * glow}) 55%, rgba(8,12,13,.9) 100%)`,
      border: '1px solid rgba(140,255,233,.22)',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '38%',
        translate: '-50% -50%',
        width: width * 0.9,
        height: width * 0.9,
        borderRadius: '50%',
        background: colors.mint,
        filter: 'blur(90px)',
        opacity: 0.12 + 0.22 * glow,
      }}
    />
    {Array.from({length: STREAM_COUNT}).map((_, i) => {
      const seed = `hall-stream-${i}`;
      const x = 26 + random(seed) * (width - 52);
      const speed = 0.5 + random(`${seed}-speed`) * 0.7;
      const len = 90 + random(`${seed}-len`) * 90;
      const cycle = height + len;
      const y = cycle - (((frame * speed + random(`${seed}-phase`) * cycle) % cycle) + len) + len / 2;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 3,
            height: len,
            borderRadius: 3,
            background: `linear-gradient(180deg, rgba(34,240,208,0), rgba(34,240,208,${0.3 + 0.4 * glow}), rgba(34,240,208,0))`,
          }}
        />
      );
    })}
    {[0, 1].map((i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: i ? '58%' : '8%',
          top: i ? '58%' : '20%',
          width: width * 0.55,
          height: width * 0.4,
          borderRadius: '50%',
          background: 'rgba(140,255,233,.16)',
          filter: 'blur(46px)',
          translate: `${Math.sin(frame / (90 + i * 30)) * 14}px ${Math.cos(frame / (110 + i * 25)) * 10}px`,
          opacity: 0.35 + 0.3 * glow,
        }}
      />
    ))}
  </div>
);

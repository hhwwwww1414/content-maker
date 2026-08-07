import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors} from '../theme/colors';

export type BinaryRainMode = 'error' | 'graveyard' | 'mint';

const COLUMN_COUNT = 18;

const buildDigits = (seed: string, length: number) =>
  Array.from({length}, (_, i) => (random(`${seed}-digit-${i}`) > 0.5 ? '1' : '0')).join('\n');

export const BinaryRain: React.FC<{mode: BinaryRainMode; intensity?: number}> = ({mode, intensity = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const color = mode === 'mint' ? colors.mint : mode === 'graveyard' ? '#B23A33' : colors.errorRed;

  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {Array.from({length: COLUMN_COUNT}).map((_, i) => {
        const seed = `binary-col-${i}`;
        const x = random(seed) * width;
        const isOuter = x < 230 || x > width - 230;
        const speed = 26 + random(`${seed}-speed`) * 46;
        const length = 24 + Math.floor(random(`${seed}-len`) * 18);
        const fontSize = 13 + random(`${seed}-size`) * 9;
        const opacity = (isOuter ? 0.5 : 0.15) * intensity;
        const digits = buildDigits(seed, length);
        const cycle = fontSize * 1.4 * length + height;
        const travel = ((frame * speed + random(`${seed}-phase`) * cycle) % cycle) - fontSize * 1.4 * length;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: travel,
              fontFamily: 'monospace',
              fontSize,
              lineHeight: 1.4,
              color,
              opacity,
              whiteSpace: 'pre',
              filter: fontSize < 17 ? 'blur(1px)' : 'none',
            }}
          >
            {digits}
          </div>
        );
      })}
    </div>
  );
};

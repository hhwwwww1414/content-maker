import type {TikTokPage} from '@remotion/captions';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {graveyardLayout} from '../theme/layout';

const DANGER_WORDS = new Set(['ПЯТЫЙ', 'УМЕР', 'ХВАТИТ']);

const normalize = (text: string) => text.trim().replace(/[.,!?—]/g, '').toUpperCase();

type CaptionLayout = {captionBottom: number; captionLeft: number; captionRight: number};

export const CaptionPage: React.FC<{page: TikTokPage; layout?: CaptionLayout; riseIn?: boolean; steadyWords?: boolean; fontSize?: number}> = ({
  page,
  layout = graveyardLayout,
  riseIn = false,
  steadyWords = false,
  fontSize = 56,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;
  const enter = interpolate(frame, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = riseIn ? interpolate(frame, [0, 10], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: layout.captionBottom,
        paddingLeft: layout.captionLeft,
        paddingRight: layout.captionRight,
        boxSizing: 'border-box',
        opacity: enter,
        translate: `0 ${rise}px`,
      }}
    >
      <div
        style={{
          fontFamily: unbounded,
          fontWeight: 700,
          fontSize,
          lineHeight: 1.18,
          textAlign: 'center',
          whiteSpace: 'pre-wrap',
          textTransform: 'uppercase',
          maxWidth: 780,
        }}
      >
        {page.tokens.map((token) => {
          const isActive = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          const isDanger = DANGER_WORDS.has(normalize(token.text));
          const scale = !steadyWords && isActive ? interpolate(absoluteTimeMs, [token.fromMs, (token.fromMs + token.toMs) / 2, token.toMs], [1, 1.04, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
          const color = isActive ? (isDanger ? colors.errorRed : colors.mint) : colors.white;
          return (
            <span
              key={token.fromMs}
              style={{
                color,
                display: 'inline-block',
                scale,
                textShadow: isActive ? `0 0 16px ${isDanger ? 'rgba(255,90,82,.45)' : 'rgba(34,240,208,.45)'}` : 'none',
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

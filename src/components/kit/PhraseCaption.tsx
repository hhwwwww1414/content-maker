import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {CaptionSafeArea} from '../../reel-system/layout/SafeArea';
import {colors} from '../../theme/colors';
import {beat, ease, elevation, radius as radii, riseY, space, type} from '../../theme/tokens';

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/** Balance a phrase onto at most two lines so the pill never gets lopsided. */
const balance = (text: string): React.ReactNode => {
  const words = text.trim().split(/\s+/);
  if (words.length <= 3) return text;
  const mid = Math.ceil(words.length / 2);
  return (
    <>
      {words.slice(0, mid).join(' ')}
      <br />
      {words.slice(mid).join(' ')}
    </>
  );
};

/**
 * Phrase-level caption in a glass pill, positioned in the caption safe slot.
 * No word-by-word karaoke (pipeline rule) — just a calm fade+rise, stable width.
 * Wrap in a <Sequence durationInFrames> and pass that duration to fade out.
 */
export const PhraseCaption: React.FC<{
  text: string;
  durationInFrames?: number;
  emphasize?: boolean;
}> = ({text, durationInFrames, emphasize = false}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, beat.base], [0, 1], {...CLAMP, easing: ease.out});
  const exit = durationInFrames
    ? interpolate(frame, [durationInFrames - beat.base, durationInFrames], [1, 0], CLAMP)
    : 1;
  const opacity = enter * exit;
  return (
    <CaptionSafeArea height={160}>
      <div
        style={{
          ...elevation.glass,
          borderRadius: radii.pill,
          padding: `${space.md}px ${space.lg}px`,
          maxWidth: 820,
          textAlign: 'center',
          opacity,
          translate: `0 ${riseY(enter, 12)}px`,
          border: emphasize ? `1px solid ${colors.mint}66` : elevation.glass.border,
        }}
      >
        <span style={{...type.caption, display: 'inline-block'}}>{balance(text)}</span>
      </div>
    </CaptionSafeArea>
  );
};

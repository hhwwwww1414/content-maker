import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {CaptionSafeArea} from '../../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../../theme/fonts';
import {BRAND, CLAMP} from './brand';
import type {CaptionPage} from './clock';

/**
 * Phrase-level subtitles for the batch reels.
 *
 * The *timing* logic is shared because it is a correctness concern (a caption may
 * never lead its own audio, never leave before the phrase ends, never overlap the
 * next page). The *look* is per reel: each composition picks its own frame style,
 * face and accent, so the six reels do not read as one template.
 */

export type CaptionFrame = 'pill' | 'rule' | 'plate' | 'bracket' | 'bubble' | 'band';

const MAX_LINES = 2;

/** Split into at most two balanced lines; never re-flow mid-page. */
const twoLines = (text: string): string[] => {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= 3) return [parts.join(' ')];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')].slice(0, MAX_LINES);
};

const frameStyle = (frameKind: CaptionFrame, accent: string): React.CSSProperties => {
  switch (frameKind) {
    case 'pill':
      return {
        borderRadius: 999,
        padding: '20px 40px',
        background: 'linear-gradient(180deg, rgba(20,28,30,0.88), rgba(10,16,18,0.88))',
        border: `1px solid ${accent}3a`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
      };
    case 'rule':
      return {
        borderRadius: 0,
        padding: '14px 10px 18px',
        borderBottom: `3px solid ${accent}`,
        background: 'transparent',
        textShadow: '0 6px 26px rgba(0,0,0,0.85)',
      };
    case 'plate':
      return {
        borderRadius: 10,
        padding: '20px 34px',
        background: 'rgba(6,10,11,0.82)',
        borderLeft: `5px solid ${accent}`,
      };
    case 'bracket':
      return {
        borderRadius: 4,
        padding: '18px 34px',
        background: 'rgba(5,9,10,0.66)',
        borderTop: `2px solid ${accent}66`,
        borderBottom: `2px solid ${accent}66`,
      };
    case 'bubble':
      return {
        borderRadius: 28,
        padding: '20px 36px',
        background: 'rgba(22,30,32,0.92)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 20px 48px rgba(0,0,0,0.5)',
      };
    case 'band':
    default:
      return {
        borderRadius: 0,
        padding: '18px 36px',
        background: 'rgba(4,8,9,0.86)',
        boxShadow: `inset 0 1px 0 ${accent}33, inset 0 -1px 0 ${accent}33`,
      };
  }
};

export const BatchCaption: React.FC<{
  pages: CaptionPage[];
  fps: number;
  frame?: CaptionFrame;
  face?: 'unbounded' | 'manrope';
  accent?: string;
  fontSize?: number;
  /** Slot height; keep constant inside one reel so the container never jumps. */
  slotHeight?: number;
}> = ({pages, fps, frame: frameKind = 'pill', face = 'unbounded', accent = BRAND.captionAccent, fontSize = 42, slotHeight = 190}) => {
  const frame = useCurrentFrame();
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);

  const active = pages
    .map((page, i) => {
      const from = toFrame(page.startMs);
      const to = toFrame(page.startMs + page.durationMs);
      return {page, i, from, to};
    })
    .find(({from, to}) => frame >= from - 5 && frame <= to + 5);

  if (!active) return null;

  // Fade only. No per-word scaling, no accent flicker, no container resize.
  const opacity = interpolate(
    frame,
    [active.from - 5, active.from + 4, active.to - 4, active.to + 4],
    [0, 1, 1, 0],
    CLAMP,
  );

  return (
    <CaptionSafeArea height={slotHeight}>
      <div
        style={{
          ...frameStyle(frameKind, accent),
          maxWidth: 860,
          textAlign: 'center',
          opacity,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            fontFamily: face === 'unbounded' ? unbounded : manrope,
            fontWeight: 700,
            fontSize,
            lineHeight: 1.16,
            letterSpacing: face === 'unbounded' ? -0.4 : 0,
            color: BRAND.caption,
            display: 'inline-block',
          }}
        >
          {twoLines(active.page.text).map((line, i) => (
            <React.Fragment key={line}>
              {i > 0 ? <br /> : null}
              {line}
            </React.Fragment>
          ))}
        </span>
      </div>
    </CaptionSafeArea>
  );
};

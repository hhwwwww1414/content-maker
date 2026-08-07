import React from 'react';
import {interpolate} from 'remotion';
import {slots, vibe} from './theme';
import {unbounded} from '../../theme/fonts';
import {useMs} from './primitives';

export type CaptionToken = {
  text: string;
  fromMs: number;
  toMs: number;
  highlight: boolean;
  /** colour key emitted by the caption builder ("mint" | "yellow" | "red" | "accent") */
  tone?: string | null;
};

/** Lets a reel restyle the captions without forking the component. */
export type CaptionPalette = {
  text: string;
  dimOpacity: number;
  tones: Record<string, string>;
  textShadow?: string;
  underline?: boolean;
};
export type CaptionCluster = {
  text: string;
  startMs: number;
  endMs: number;
  visibleUntilMs: number;
  twoLines: boolean;
  tokens: CaptionToken[];
};

const findActive = (clusters: CaptionCluster[], ms: number) => {
  // Clusters are ordered and non-overlapping; a linear scan is fine at 74 items.
  for (let i = clusters.length - 1; i >= 0; i--) {
    if (ms >= clusters[i].startMs && ms < clusters[i].visibleUntilMs) return clusters[i];
  }
  return null;
};

/** Uppercase Unbounded 800 runs at roughly 0.62 em per glyph. */
const GLYPH_RATIO = 0.62;

const fontSizeFor = (cluster: CaptionCluster, maxWidth: number) => {
  const longest = Math.max(...cluster.tokens.map((token) => token.text.length));
  const base = cluster.tokens.length >= 3 || longest > 12 ? 46 : longest > 9 ? 52 : 58;
  // A single long word cannot wrap, so it must be shrunk to fit the slot.
  const fits = Math.floor(maxWidth / (longest * GLYPH_RATIO));
  return Math.max(30, Math.min(base, fits));
};

/**
 * Kinetic clusters: 1-3 words at a time, timed from the real ElevenLabs
 * alignment. Sits to the right of the avatar and above the Instagram caption
 * strip, so it never fights the headline zone for attention.
 */
const PAPER_PALETTE: CaptionPalette = {
  text: vibe.ink,
  dimOpacity: 0.34,
  tones: {accent: vibe.mint, mint: vibe.mint},
  underline: true,
};

export const KineticCaptions: React.FC<{clusters: CaptionCluster[]; palette?: CaptionPalette}> = ({
  clusters,
  palette = PAPER_PALETTE,
}) => {
  const ms = useMs();
  const cluster = findActive(clusters, ms);
  if (!cluster) return null;

  const enter = interpolate(ms, [cluster.startMs, cluster.startMs + 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const leave = interpolate(ms, [cluster.visibleUntilMs - 110, cluster.visibleUntilMs], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fontSize = fontSizeFor(cluster, slots.captions.width);

  return (
    <div
      style={{
        position: 'absolute',
        left: slots.captions.x,
        top: slots.captions.y,
        width: slots.captions.width,
        height: slots.captions.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: enter * leave,
        transform: `translateY(${(1 - enter) * 12}px)`,
      }}
    >
      <div
        style={{
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.1,
          letterSpacing: -0.5,
          textAlign: 'center',
          textTransform: 'uppercase',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0 14px',
          maxWidth: slots.captions.width,
        }}
      >
        {cluster.tokens.map((token, i) => {
          const spoken = ms >= token.fromMs;
          const accent = token.highlight ? palette.tones[token.tone ?? 'accent'] ?? palette.tones.accent : null;
          return (
            <span
              key={`${token.text}-${i}`}
              style={{
                color: accent ?? palette.text,
                opacity: spoken ? 1 : palette.dimOpacity,
                display: 'inline-block',
                textShadow: palette.textShadow,
                borderBottom: accent && palette.underline ? `5px solid ${accent}` : 'none',
                paddingBottom: accent && palette.underline ? 2 : 0,
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

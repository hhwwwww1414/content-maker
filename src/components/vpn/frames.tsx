import React from 'react';
import {interpolate} from 'remotion';
import {night, slots} from '../vibe/theme';
import {manrope, unbounded} from '../../theme/fonts';
import {enterStyle, useEnter, useExit, useMs} from '../vibe/primitives';
import {Caption, Glass, NightChip} from './glass';

export const SourceBadge: React.FC<{label: string; atMs: number | null}> = ({label, atMs}) => {
  const enter = useEnter(atMs, {durationMs: 520, rise: 8});
  return (
    <div
      style={{
        position: 'absolute',
        left: slots.sourceBadge.x,
        top: slots.sourceBadge.y,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderRadius: 999,
        background: 'rgba(10,12,16,0.55)',
        border: `1.5px solid ${night.glassBorder}`,
        fontFamily: manrope,
        fontWeight: 700,
        fontSize: 20,
        color: night.textSoft,
        ...enterStyle(enter),
      }}
    >
      <span style={{width: 8, height: 8, borderRadius: 999, background: night.mint, display: 'inline-block'}} />
      {label}
    </div>
  );
};

/**
 * Chapter headline. `strikeWord` is struck through in place when the narration
 * debunks it — the myth stays on screen, visibly cancelled, instead of vanishing.
 */
export const ChapterHead: React.FC<{
  eyebrow: string;
  label: string;
  headline: string;
  atMs: number | null;
  instant?: boolean;
  strikeWord?: string;
  strikeAtMs?: number | null;
}> = ({eyebrow, label, headline, atMs, instant = false, strikeWord, strikeAtMs}) => {
  const ms = useMs();
  const enter = useEnter(instant ? null : atMs, {durationMs: 420, rise: 18});
  const lines = headline.split('\n');
  const longest = Math.max(...lines.map((line) => line.length));
  // Unbounded 800 uppercase runs ~0.95 em per glyph; long headlines must shrink
  // rather than wrap into the chip rail below.
  const fontSize = Math.max(40, Math.min(62, Math.floor((slots.eyebrow.width - 40) / (longest * 0.95))));
  const style = instant ? {opacity: 1, transform: 'none'} : enterStyle(enter);
  const strike =
    strikeAtMs == null
      ? 0
      : interpolate(ms, [strikeAtMs, strikeAtMs + 480], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <div style={{position: 'absolute', left: slots.eyebrow.x, top: slots.eyebrow.y, width: slots.eyebrow.width, ...style}}>
      <div
        style={{
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 3,
          color: night.textSoft,
          textTransform: 'uppercase',
          textShadow: night.shadow,
        }}
      >
        {eyebrow} · {label}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize,
          lineHeight: 1.04,
          letterSpacing: -1.2,
          color: night.text,
          textShadow: '0 4px 26px rgba(0,0,0,0.7)',
        }}
      >
        {lines.map((line) => (
          <div key={line} style={{display: 'block'}}>
            {line.split(' ').map((word, i) => {
              const hit = strikeWord && word === strikeWord;
              return (
                <span key={`${word}-${i}`} style={{position: 'relative', display: 'inline-block', marginRight: 18}}>
                  {word}
                  {hit ? (
                    <span
                      style={{
                        position: 'absolute',
                        left: -4,
                        right: -4,
                        top: '52%',
                        height: 8,
                        borderRadius: 4,
                        background: night.red,
                        transformOrigin: 'left center',
                        transform: `scaleX(${strike})`,
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Accumulated short verdicts. Chips enter once and stay for the rest of the reel. */
export const ChipRail: React.FC<{chips: {label: string; tone: 'danger' | 'mint' | 'warning'; atMs: number | null}[]}> = ({
  chips,
}) => {
  const ms = useMs();
  return (
    <div
      style={{
        position: 'absolute',
        left: slots.chipRail.x,
        top: slots.chipRail.y,
        width: slots.chipRail.width,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {chips.map((chip) => {
        const on = chip.atMs === null
          ? 0
          : interpolate(ms, [chip.atMs, chip.atMs + 380], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
        if (on <= 0.001) return null;
        return (
          <div key={chip.label} style={{opacity: on, transform: `translateY(${(1 - on) * 10}px)`}}>
            <NightChip label={chip.label} tone={chip.tone} size={24} />
          </div>
        );
      })}
    </div>
  );
};

/**
 * The screenshot frame: three verified takeaways, held still.
 * Sits below the chapter headline so the closing line stays readable above it.
 */
export const MemoryFrame: React.FC<{
  title: string;
  items: string[];
  atMs: number | null;
  untilMs: number | null;
  /** delay between items; > 0 keeps a long hold alive without moving the frame */
  staggerMs?: number;
}> = ({title, items, atMs, untilMs, staggerMs = 0}) => {
  const ms = useMs();
  const enter = useEnter(atMs, {durationMs: 460, rise: 16});
  const exit = useExit(untilMs, 380);
  if (enter.opacity * exit <= 0.001) return null;

  const itemOn = (index: number) => {
    if (staggerMs <= 0 || atMs === null) return 1;
    const from = atMs + 260 + index * staggerMs;
    return interpolate(ms, [from, from + 360], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  };

  return (
    <div style={{position: 'absolute', left: 70, top: 566, width: 940, ...enterStyle(enter, exit)}}>
      <Glass strong style={{padding: '38px 44px', borderRadius: 30, borderLeft: `2px solid ${night.glassBorder}`}}>
        <Caption style={{fontSize: 19, letterSpacing: 3}}>{title}</Caption>
        <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 26}}>
          {items.map((item, i) => (
            <div
              key={item}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                opacity: itemOn(i),
                transform: `translateX(${(1 - itemOn(i)) * 14}px)`,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  borderRadius: 12,
                  border: `2px solid ${night.mint}`,
                  background: 'rgba(63,224,168,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: manrope,
                  fontWeight: 800,
                  fontSize: 21,
                  color: night.mint,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: unbounded,
                  fontWeight: 700,
                  fontSize: 34,
                  lineHeight: 1.1,
                  color: night.text,
                  textShadow: night.shadow,
                }}
              >
                {item}
              </div>
            </div>
          ))}
        </div>
      </Glass>
    </div>
  );
};

/** One tappable-looking answer in the closing question. */
export type CtaOption = {label: string; tone: 'mint' | 'yellow' | 'red'; atMs: number | null};

const OPTION_TONES: Record<CtaOption['tone'], string> = {
  mint: night.mint,
  yellow: night.yellow,
  red: night.red,
};

/**
 * Closing question. Supply either the legacy `optionA`/`divider`/`optionB`
 * trio or an `options` list — the list wins and carries 0–3 answers, so a reel
 * with an open-ended question (no answers to pick) simply omits it.
 */
export const CtaFrame: React.FC<{
  prompt: string;
  optionA?: string;
  divider?: string;
  optionB?: string;
  options?: CtaOption[];
  comment: string;
  teaser: string;
  atMs: number | null;
  optionAAtMs?: number | null;
  optionBAtMs?: number | null;
  /** when the "write it in the comments" line lands; defaults to the last answer */
  commentAtMs?: number | null;
  teaserAtMs: number | null;
  teaserDetailAtMs: number | null;
}> = ({
  prompt,
  optionA,
  divider,
  optionB,
  options,
  comment,
  teaser,
  atMs,
  optionAAtMs = null,
  optionBAtMs = null,
  commentAtMs,
  teaserAtMs,
  teaserDetailAtMs,
}) => {
  const ms = useMs();
  const enter = useEnter(atMs, {durationMs: 440, rise: 20});
  const teaserEnter = useEnter(teaserAtMs, {durationMs: 420, rise: 14});
  const detailEnter = useEnter(teaserDetailAtMs, {durationMs: 420, rise: 10});

  // Options are rendered from a plain list rather than per-item hooks, so the
  // count can differ between reels without changing the hook order.
  const list: CtaOption[] =
    options ??
    (optionA && optionB
      ? [
          {label: optionA, tone: 'mint', atMs: optionAAtMs},
          {label: optionB, tone: 'red', atMs: optionBAtMs},
        ]
      : []);

  const on = (at: number | null) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + 380], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // The comment lands on its own cue when one is given, otherwise with the
  // final answer — or with the card itself when the question is open-ended.
  const settled =
    commentAtMs !== undefined && commentAtMs !== null
      ? on(commentAtMs)
      : list.length > 0
        ? on(list[list.length - 1].atMs)
        : enter.opacity;
  const fontSize = list.length >= 3 ? 44 : 52;
  const gap = list.length >= 3 ? 18 : 24;

  if (enter.opacity <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: 90, top: 616, width: 900, ...enterStyle(enter)}}>
      <Glass strong style={{padding: '32px 36px'}}>
        <Caption style={{fontSize: 24, letterSpacing: 2.4, color: night.text, lineHeight: 1.25}}>{prompt}</Caption>

        {list.length > 0 ? (
          <div style={{display: 'flex', alignItems: 'center', gap, marginTop: 26}}>
            {list.map((item, i) => {
              const progress = on(item.atMs);
              const color = OPTION_TONES[item.tone];
              return (
                <React.Fragment key={item.label}>
                  {i > 0 && divider && list.length === 2 ? (
                    <div
                      style={{
                        fontFamily: manrope,
                        fontWeight: 700,
                        fontSize: 28,
                        color: night.textSoft,
                        opacity: progress,
                      }}
                    >
                      {divider}
                    </div>
                  ) : null}
                  <div
                    style={{
                      padding: `22px ${fontSize >= 52 ? 44 : 32}px`,
                      borderRadius: 20,
                      background: 'rgba(10,12,16,0.62)',
                      border: `3px solid ${color}`,
                      fontFamily: unbounded,
                      fontWeight: 800,
                      fontSize,
                      color,
                      letterSpacing: 0,
                      textShadow: night.shadow,
                      opacity: progress,
                      transform: `translateY(${(1 - progress) * 12}px) scale(${0.92 + 0.08 * progress})`,
                    }}
                  >
                    {item.label}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 24,
            fontFamily: manrope,
            fontWeight: 700,
            fontSize: 28,
            color: night.text,
            opacity: settled,
            textShadow: night.shadow,
          }}
        >
          {comment}
        </div>

        <div style={{height: 2, background: 'rgba(255,255,255,0.14)', margin: '26px 0 20px', opacity: teaserEnter.opacity}} />
        <div style={{...enterStyle(teaserEnter)}}>
          <Caption style={{fontSize: 19, letterSpacing: 2.4}}>ДАЛЬШЕ</Caption>
          <div
            style={{
              marginTop: 8,
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1.15,
              color: night.yellow,
              textShadow: night.shadow,
              ...enterStyle(detailEnter),
            }}
          >
            {teaser}
          </div>
        </div>
      </Glass>
    </div>
  );
};

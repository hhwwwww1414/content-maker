import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import {night, nightTones} from '../../components/vibe/theme';
import {useMs} from '../../components/vibe/primitives';
import {AvatarZone} from '../../components/vibe/AvatarZone';
import {KineticCaptions, type CaptionCluster, type CaptionPalette} from '../../components/vibe/KineticCaptions';
import {LoopingBackground, MoodTint} from '../../components/vpn/Backdrop';
import {ChapterHead, ChipRail, CtaFrame, MemoryFrame, SourceBadge, type CtaOption} from '../../components/vpn/frames';
import {GrammarScene} from './grammars';
import type {GrammarSpec, ResolvedChapter, Tone} from './types';

/**
 * The reel engine: turns a resolved timeline into a finished composition.
 *
 * This is what makes the conveyor possible. Previously each reel shipped its own
 * 300–450 line component; now a reel is `content/<slug>-reel.json` plus one
 * generated three-line file that calls `createReel`. Nothing here is
 * reel-specific, and nothing computes timing — every millisecond arrives
 * already resolved from the measured ElevenLabs alignment.
 */

const CHAPTER_CROSSFADE_MS = 320;

const CAPTION_PALETTE: CaptionPalette = {
  text: night.text,
  dimOpacity: 0.3,
  tones: nightTones,
  textShadow: '0 3px 20px rgba(0,0,0,0.75)',
  underline: false,
};

type Cued = {atMs?: number | null};

export type ReelTimeline = {
  fps: number;
  width: number;
  height: number;
  audioSrc: string;
  /** True while the reel runs on estimated timings and no voiceover exists. */
  placeholder?: boolean;
  durationInFrames: number;
  background?: {file: string; overlayOpacity?: number; sourceSeconds?: number | null} | null;
  source?: {badge?: string | null} | null;
  chapters: ResolvedChapter[];
  avatarStates: {state: string; atMs: number | null}[];
  chips?: {label: string; tone?: Tone; atMs?: number | null}[] | null;
  mood?: {
    alarm?: {fromMs: number; toMs: number} | null;
    calm?: {fromMs: number; toMs: number} | null;
    split?: {fromMs: number; toMs: number} | null;
  } | null;
  memoryFrame?: {
    title: string;
    items: string[];
    startMs: number | null;
    endMs: number | null;
    staggerMs?: number;
  } | null;
  cta?: {
    prompt: string;
    divider?: string;
    comment: string;
    teaser: string;
    startMs: number | null;
    options?: {label: string; tone?: Tone; atMs?: number | null}[];
    hint?: Cued | null;
    teaserCue?: Cued | null;
    teaserDetailCue?: Cued | null;
  } | null;
};

/** Fallback loop length if the pre-render step could not measure the clip. */
const DEFAULT_BACKGROUND_SECONDS = 9.6;

const CTA_TONE = (tone?: Tone): CtaOption['tone'] =>
  tone === 'red' ? 'red' : tone === 'yellow' ? 'yellow' : 'mint';

const CHIP_TONE = (tone?: Tone): 'danger' | 'mint' | 'warning' =>
  tone === 'red' ? 'danger' : tone === 'yellow' ? 'warning' : 'mint';

/** Which chapter owns `ms`. Chapters are ordered and non-overlapping. */
const activeIndex = (chapters: ResolvedChapter[], ms: number) => {
  let index = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].startMs !== null && ms >= (chapters[i].startMs as number)) index = i;
  }
  return index;
};

const ChapterHeadline: React.FC<{chapters: ResolvedChapter[]}> = ({chapters}) => {
  const ms = useMs();
  const index = activeIndex(chapters, ms);
  const current = chapters[index];
  const previous = index > 0 ? chapters[index - 1] : null;
  // Chapter 1 is never crossfaded in: frame 0 must already carry the hook.
  const swap =
    index === 0
      ? 1
      : interpolate(ms, [current.startMs ?? 0, (current.startMs ?? 0) + CHAPTER_CROSSFADE_MS], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <>
      {previous && swap < 1 ? (
        <div style={{opacity: 1 - swap}}>
          <ChapterHead label={previous.label} headline={previous.headline} atMs={previous.startMs} instant />
        </div>
      ) : null}
      <div style={{opacity: swap}}>
        <ChapterHead
          label={current.label}
          headline={current.headline}
          atMs={current.startMs}
          instant={index === 0}
        />
      </div>
    </>
  );
};

/**
 * Body canvas. Only the active chapter's grammar is mounted, and it crossfades
 * with the previous one so the canvas evolves instead of cutting.
 */
const GrammarCanvas: React.FC<{chapters: ResolvedChapter[]}> = ({chapters}) => {
  const ms = useMs();
  const index = activeIndex(chapters, ms);
  const current = chapters[index];
  const previous = index > 0 ? chapters[index - 1] : null;
  const swap =
    index === 0
      ? 1
      : interpolate(ms, [current.startMs ?? 0, (current.startMs ?? 0) + CHAPTER_CROSSFADE_MS], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <>
      {previous?.grammar && swap < 1 ? (
        <AbsoluteFill style={{opacity: 1 - swap}}>
          <GrammarScene spec={previous.grammar as GrammarSpec} />
        </AbsoluteFill>
      ) : null}
      {current.grammar ? (
        <AbsoluteFill style={{opacity: swap}}>
          <GrammarScene spec={current.grammar as GrammarSpec} />
        </AbsoluteFill>
      ) : null}
    </>
  );
};

/**
 * Builds the finished reel component. Call it from a generated composition file:
 *
 *   export const FooReel = createReel(timeline, captions);
 */
export const createReel = (timeline: ReelTimeline, captions: unknown): React.FC => {
  const clusters = captions as CaptionCluster[];
  const loopFrames = Math.round(
    (timeline.background?.sourceSeconds ?? DEFAULT_BACKGROUND_SECONDS) * timeline.fps,
  );

  const ctaOptions: CtaOption[] = (timeline.cta?.options ?? []).map((option) => ({
    label: option.label,
    tone: CTA_TONE(option.tone),
    atMs: option.atMs ?? null,
  }));

  return () => {
    const ms = useMs();
    const memory = timeline.memoryFrame;
    const ctaStartMs = timeline.cta?.startMs ?? Infinity;

    // The cheat-sheet hands straight over to the closing question, so the body
    // dims once and stays dimmed — present behind, never competing.
    const dimFrom = Math.min(memory?.startMs ?? Infinity, ctaStartMs);
    const bodyDim = interpolate(ms, [dimFrom - 200, dimFrom + 150], [1, 0.16], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return (
      <AbsoluteFill style={{background: '#08090C'}}>
        {timeline.background ? (
          <LoopingBackground
            src={timeline.background.file}
            loopFrames={loopFrames}
            overlayOpacity={timeline.background.overlayOpacity}
          />
        ) : null}
        {timeline.mood ? (
          <MoodTint alarm={timeline.mood.alarm} calm={timeline.mood.calm} split={timeline.mood.split} />
        ) : null}

        {/* A placeholder reel has no track on disk yet — mounting it would 404. */}
        {timeline.placeholder ? null : <Audio src={staticFile(timeline.audioSrc)} volume={1} />}

        <AbsoluteFill>
          <ChapterHeadline chapters={timeline.chapters} />
          <SourceBadge label={timeline.source?.badge} atMs={null} />
          <ChipRail
            chips={(timeline.chips ?? []).map((chip) => ({
              label: chip.label,
              tone: CHIP_TONE(chip.tone),
              atMs: chip.atMs ?? null,
            }))}
          />
        </AbsoluteFill>

        <AbsoluteFill style={{opacity: bodyDim}}>
          <GrammarCanvas chapters={timeline.chapters} />
        </AbsoluteFill>

        {memory ? (
          <MemoryFrame
            title={memory.title}
            items={memory.items}
            atMs={memory.startMs}
            untilMs={memory.endMs}
            staggerMs={memory.staggerMs}
          />
        ) : null}

        {timeline.cta ? (
          <CtaFrame
            prompt={timeline.cta.prompt}
            divider={timeline.cta.divider}
            options={ctaOptions}
            comment={timeline.cta.comment}
            teaser={timeline.cta.teaser}
            atMs={timeline.cta.startMs}
            commentAtMs={timeline.cta.hint?.atMs ?? null}
            teaserAtMs={timeline.cta.teaserCue?.atMs ?? null}
            teaserDetailAtMs={timeline.cta.teaserDetailCue?.atMs ?? null}
          />
        ) : null}

        <AvatarZone states={timeline.avatarStates} sticker />
        <KineticCaptions clusters={clusters} palette={CAPTION_PALETTE} />
      </AbsoluteFill>
    );
  };
};

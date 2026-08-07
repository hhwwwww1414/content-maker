import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import timeline from '../generated/timeline-ai-cheated-test.json';
import captions from '../generated/captions-ai-cheated-test.json';
import {night, nightTones} from '../components/vibe/theme';
import {useMs} from '../components/vibe/primitives';
import {AvatarZone} from '../components/vibe/AvatarZone';
import {KineticCaptions, type CaptionCluster, type CaptionPalette} from '../components/vibe/KineticCaptions';
import {LoopingBackground, MoodTint} from '../components/vpn/Backdrop';
import {ChapterHead, ChipRail, CtaFrame, MemoryFrame, SourceBadge} from '../components/vpn/frames';
import {ExamScene, LiteralScene, RoomScene, RouteChain, StoppedScene} from '../components/aitest/scenes';

const clusters = captions as unknown as CaptionCluster[];

const lineAt = (id: string): number | null => timeline.lines.find((line) => line.id === id)?.startMs ?? null;
const action = (id: string) => timeline.actions.find((entry) => entry.id === id) ?? null;
const actionAt = (id: string): number | null => action(id)?.atMs ?? null;
const actionUntil = (id: string): number | null => action(id)?.untilMs ?? null;
const actionLabel = (id: string): string => action(id)?.label ?? '';
const railLabel = (id: string): string => action(id)?.railLabel ?? actionLabel(id);

/** The clip is measured once in the pre-render step; nothing probes at render time. */
const BACKGROUND_LOOP_FRAMES = Math.round((timeline.background?.sourceSeconds ?? 9.6) * timeline.fps);

const CHAPTER_CROSSFADE_MS = 320;

const CAPTION_PALETTE: CaptionPalette = {
  text: night.text,
  dimOpacity: 0.3,
  tones: nightTones,
  textShadow: '0 3px 20px rgba(0,0,0,0.75)',
  underline: false,
};

const ChapterHeadline: React.FC = () => {
  const ms = useMs();
  const chapters = timeline.chapters;

  let index = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].startMs !== null && ms >= (chapters[i].startMs as number)) index = i;
  }
  const current = chapters[index];
  const previous = index > 0 ? chapters[index - 1] : null;
  // Chapter 1 is never crossfaded in: frame 0 must already carry the hook.
  const swap = index === 0
    ? 1
    : interpolate(ms, [current.startMs ?? 0, (current.startMs ?? 0) + CHAPTER_CROSSFADE_MS], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  return (
    <>
      {previous && swap < 1 ? (
        <div style={{opacity: 1 - swap}}>
          <ChapterHead
            eyebrow={previous.eyebrow}
            label={previous.label}
            headline={previous.headline}
            atMs={previous.startMs}
            instant
          />
        </div>
      ) : null}
      <div style={{opacity: swap}}>
        <ChapterHead
          eyebrow={current.eyebrow}
          label={current.label}
          headline={current.headline}
          atMs={current.startMs}
          instant={index === 0}
        />
      </div>
    </>
  );
};

export const AiCheatedTestReel: React.FC = () => {
  const ms = useMs();
  const memory = timeline.memoryFrame;
  const ctaStartMs = timeline.cta.startMs ?? Infinity;

  // The cheat-sheet frame hands straight over to the closing question, so the
  // diagram dims once and stays dimmed — present behind, never competing.
  const dimFrom = Math.min(memory.startMs ?? Infinity, ctaStartMs);
  const bodyDim = interpolate(ms, [dimFrom - 200, dimFrom + 150], [1, 0.16], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: '#08090C'}}>
      <LoopingBackground
        src={timeline.background.file}
        loopFrames={BACKGROUND_LOOP_FRAMES}
        overlayOpacity={timeline.background.overlayOpacity}
      />
      <MoodTint
        alarm={{fromMs: lineAt('l11') ?? 0, toMs: lineAt('l14') ?? 0}}
        calm={{fromMs: lineAt('l30') ?? 0, toMs: lineAt('l33') ?? 0}}
        split={{fromMs: lineAt('l25') ?? 0, toMs: lineAt('l30') ?? 0}}
      />

      <Audio src={staticFile(timeline.audioSrc)} volume={1} />

      <AbsoluteFill>
        <ChapterHeadline />
        <SourceBadge label={timeline.source.badge} atMs={actionAt('sourceBadge')} />
        <ChipRail
          chips={[
            {label: railLabel('chipCheat'), tone: 'warning', atMs: actionAt('chipCheat')},
            {label: railLabel('chipHole'), tone: 'danger', atMs: actionAt('chipHole')},
            {label: railLabel('chipStopped'), tone: 'mint', atMs: actionAt('chipStopped')},
          ]}
        />
      </AbsoluteFill>

      {/* Persistent canvas body: the classroom story, one evolving diagram */}
      <AbsoluteFill style={{opacity: bodyDim}}>
        <ExamScene
          atMs={actionAt('examSheet')}
          untilMs={actionUntil('examSheet')}
          rowsAtMs={actionAt('examRows')}
          doorAtMs={actionAt('cheatDoor')}
          stampAtMs={actionAt('cheatStamp')}
          taskAtMs={actionAt('examTask')}
          taskMarkAtMs={actionAt('examTaskMark')}
          labels={{
            sheet: actionLabel('examSheet'),
            door: actionLabel('cheatDoor'),
            stamp: actionLabel('cheatStamp'),
            task: actionLabel('examTask'),
          }}
        />

        <RoomScene
          atMs={actionAt('roomFrame')}
          untilMs={actionUntil('roomFrame')}
          labelAtMs={actionAt('roomLabel')}
          noNetAtMs={actionAt('noNet')}
          outsideAtMs={actionAt('netOutside')}
          howOutAtMs={actionAt('howOut')}
          crackAtMs={actionAt('crack')}
          holeNoteAtMs={actionAt('holeNote')}
          arrowAtMs={actionAt('arrowOut')}
          labels={{
            label: actionLabel('roomLabel'),
            noNet: actionLabel('noNet'),
            howOut: actionLabel('howOut'),
            holeNote: actionLabel('holeNote'),
            arrow: actionLabel('arrowOut'),
            outside: actionLabel('netOutside'),
          }}
        />

        <RouteChain
          atMs={actionAt('chainFrame')}
          untilMs={actionUntil('chainFrame')}
          taskAtMs={actionAt('subTest')}
          whyAtMs={actionAt('whyBig')}
          whyUntilMs={actionUntil('whyBig')}
          answerAtMs={actionAt('whyAnswer')}
          labels={{task: actionLabel('subTest'), why: actionLabel('whyBig'), answer: actionLabel('whyAnswer')}}
          nodes={[
            {
              label: actionLabel('nodeClass'),
              atMs: actionAt('nodeClass'),
              sub: actionLabel('subClass'),
              subAtMs: actionAt('subClass'),
            },
            {
              label: actionLabel('nodeWindow'),
              atMs: actionAt('nodeWindow'),
              sub: actionLabel('subWindow'),
              subAtMs: actionAt('subWindow'),
            },
            {
              label: actionLabel('nodeStaff'),
              atMs: actionAt('nodeStaff'),
              sub: actionLabel('subStaff'),
              subAtMs: actionAt('subStaff'),
            },
            {
              label: actionLabel('nodeCheat'),
              atMs: actionAt('nodeCheat'),
              sub: actionLabel('subCheat'),
              subAtMs: actionAt('subCheat'),
              tone: 'danger',
            },
          ]}
        />

        <LiteralScene
          atMs={actionAt('meantCard')}
          untilMs={actionUntil('meantCard')}
          meantTextAtMs={actionAt('meantText')}
          notEvilAtMs={actionAt('notEvil')}
          chipAtMs={actionAt('literalChip')}
          heardAtMs={actionAt('heardCard')}
          heardTextAtMs={actionAt('heardText')}
          labels={{
            meant: actionLabel('meantCard'),
            meantText: actionLabel('meantText'),
            notEvil: actionLabel('notEvil'),
            chip: actionLabel('literalChip'),
            heard: actionLabel('heardCard'),
            heardText: actionLabel('heardText'),
          }}
        />

        <StoppedScene
          atMs={actionAt('stoppedCard')}
          untilMs={actionUntil('stoppedCard')}
          markAtMs={actionAt('stoppedMark')}
          hardenAtMs={actionAt('hardenNote')}
          footnoteAtMs={actionAt('factNote')}
          labels={{
            card: actionLabel('stoppedCard'),
            mark: actionLabel('stoppedMark'),
            harden: actionLabel('hardenNote'),
            footnote: actionLabel('factNote'),
          }}
        />
      </AbsoluteFill>

      <MemoryFrame
        title={memory.title}
        items={memory.items}
        atMs={memory.startMs}
        untilMs={memory.endMs}
        staggerMs={memory.staggerMs}
      />

      <CtaFrame
        prompt={timeline.cta.prompt}
        optionA={timeline.cta.optionA}
        divider={timeline.cta.divider}
        optionB={timeline.cta.optionB}
        comment={timeline.cta.comment}
        teaser={timeline.cta.teaser}
        atMs={timeline.cta.startMs}
        optionAAtMs={actionAt('ctaOptionA')}
        optionBAtMs={actionAt('ctaOptionB')}
        teaserAtMs={actionAt('nextTeaser')}
        teaserDetailAtMs={actionAt('teaserDetail')}
      />

      <AvatarZone states={timeline.avatarStates} sticker />
      <KineticCaptions clusters={clusters} palette={CAPTION_PALETTE} />
    </AbsoluteFill>
  );
};

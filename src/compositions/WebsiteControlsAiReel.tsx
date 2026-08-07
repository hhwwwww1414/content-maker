import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import timeline from '../generated/timeline-website-controls-ai.json';
import captions from '../generated/captions-website-controls-ai.json';
import {night, nightTones} from '../components/vibe/theme';
import {useMs} from '../components/vibe/primitives';
import {AvatarZone} from '../components/vibe/AvatarZone';
import {KineticCaptions, type CaptionCluster, type CaptionPalette} from '../components/vibe/KineticCaptions';
import {LoopingBackground, MoodTint} from '../components/vpn/Backdrop';
import {ChapterHead, ChipRail, CtaFrame, MemoryFrame, SourceBadge, type CtaOption} from '../components/vpn/frames';
import {
  BlurScene,
  CourierScene,
  GuardScene,
  HookScene,
  KeysScene,
  PageScene,
  TaskScene,
} from '../components/injection/scenes';

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

const CTA_OPTIONS: CtaOption[] = [
  {label: 'ПОЧТА', tone: 'mint', atMs: actionAt('ctaOptionA')},
  {label: 'ОБЛАКО', tone: 'yellow', atMs: actionAt('ctaOptionB')},
  {label: 'БАНК', tone: 'red', atMs: actionAt('ctaOptionC')},
];

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

export const WebsiteControlsAiReel: React.FC = () => {
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
        alarm={{fromMs: lineAt('l08') ?? 0, toMs: lineAt('l13') ?? 0}}
        split={{fromMs: lineAt('l13') ?? 0, toMs: lineAt('l19') ?? 0}}
        calm={{fromMs: lineAt('l31') ?? 0, toMs: lineAt('l37') ?? 0}}
      />

      <Audio src={staticFile(timeline.audioSrc)} volume={1} />

      <AbsoluteFill>
        <ChapterHeadline />
        <SourceBadge label={timeline.source.badge} atMs={actionAt('sourceBadge')} />
        <ChipRail
          chips={[
            {label: railLabel('chipForeign'), tone: 'danger', atMs: actionAt('chipForeign')},
            {label: railLabel('chipBoth'), tone: 'warning', atMs: actionAt('chipBoth')},
            {label: railLabel('chipRights'), tone: 'mint', atMs: actionAt('chipRights')},
          ]}
        />
      </AbsoluteFill>

      {/* Persistent canvas body: page -> hidden note -> merged context -> courier -> keys -> guard */}
      <AbsoluteFill style={{opacity: bodyDim}}>
        <HookScene
          atMs={actionAt('browserCard')}
          untilMs={actionUntil('browserCard')}
          agentAtMs={actionAt('agentNode')}
          seedAtMs={actionAt('hiddenSeed')}
          noClickAtMs={actionAt('noClick')}
          labels={{
            card: actionLabel('browserCard'),
            agent: actionLabel('agentNode'),
            seed: actionLabel('hiddenSeed'),
            noClick: actionLabel('noClick'),
          }}
        />

        <TaskScene
          atMs={actionAt('taskChain')}
          untilMs={actionUntil('taskChain')}
          noteAtMs={actionAt('ownerNote')}
          openAtMs={actionAt('pageOpen')}
          labels={{note: actionLabel('ownerNote'), open: actionLabel('pageOpen')}}
          nodes={[
            {label: actionLabel('nodeYou'), atMs: actionAt('nodeYou')},
            {label: actionLabel('nodeAgent'), atMs: actionAt('nodeAgent')},
            {label: actionLabel('nodeGoal'), atMs: actionAt('nodeGoal')},
          ]}
        />

        <PageScene
          atMs={actionAt('pageCard')}
          untilMs={actionUntil('pageCard')}
          noteAtMs={actionAt('hiddenNote')}
          quoteAAtMs={actionAt('quoteA')}
          quoteBAtMs={actionAt('quoteB')}
          unnoticedAtMs={actionAt('unnoticed')}
          labels={{
            card: actionLabel('pageCard'),
            note: actionLabel('hiddenNote'),
            quoteA: actionLabel('quoteA'),
            quoteB: actionLabel('quoteB'),
            unnoticed: actionLabel('unnoticed'),
          }}
        />

        <BlurScene
          atMs={actionAt('sheetsFrame')}
          untilMs={actionUntil('sheetsFrame')}
          dataAtMs={actionAt('sheetData')}
          commandAtMs={actionAt('sheetCommand')}
          sameAtMs={actionAt('sameLook')}
          mergeAtMs={actionAt('mergeBlock')}
          bothAtMs={actionAt('bothText')}
          termAtMs={actionAt('termCard')}
          termDefAtMs={actionAt('termDef')}
          labels={{
            data: actionLabel('sheetData'),
            command: actionLabel('sheetCommand'),
            same: actionLabel('sameLook'),
            merge: actionLabel('mergeBlock'),
            both: actionLabel('bothText'),
            term: actionLabel('termCard'),
            termDef: actionLabel('termDef'),
          }}
        />

        <CourierScene
          atMs={actionAt('courierFrame')}
          untilMs={actionUntil('courierFrame')}
          boxAtMs={actionAt('boxNode')}
          courierAtMs={actionAt('courierWalk')}
          ownerAtMs={actionAt('ownerTag')}
          strangerAtMs={actionAt('strangerTag')}
          quoteAtMs={actionAt('strangerQuote')}
          quoteBAtMs={actionAt('strangerQuoteB')}
          labels={{
            box: actionLabel('boxNode'),
            courier: actionLabel('courierWalk'),
            owner: actionLabel('ownerTag'),
            stranger: actionLabel('strangerTag'),
            quote: actionLabel('strangerQuote'),
            quoteB: actionLabel('strangerQuoteB'),
          }}
        />

        <KeysScene
          atMs={actionAt('keysFrame')}
          untilMs={actionUntil('keysFrame')}
          linkAtMs={actionAt('dangerLink')}
          actionAtMs={actionAt('realAction')}
          labels={{
            card: actionLabel('keysFrame'),
            link: actionLabel('dangerLink'),
            action: actionLabel('realAction'),
          }}
          keys={[
            {label: actionLabel('keyMail'), atMs: actionAt('keyMail')},
            {label: actionLabel('keyCloud'), atMs: actionAt('keyCloud')},
            {label: actionLabel('keyFiles'), atMs: actionAt('keyFiles')},
            {label: actionLabel('keyMoney'), atMs: actionAt('keyMoney')},
          ]}
        />

        <GuardScene
          atMs={actionAt('guardFrame')}
          untilMs={actionUntil('guardFrame')}
          shieldAtMs={actionAt('shieldMark')}
          labels={{card: actionLabel('guardFrame'), shield: actionLabel('shieldMark')}}
          steps={[
            {
              label: actionLabel('stepRights'),
              atMs: actionAt('stepRights'),
              detail: actionLabel('onlyNeeded'),
              detailAtMs: actionAt('onlyNeeded'),
            },
            {
              label: actionLabel('stepConfirm'),
              atMs: actionAt('stepConfirm'),
              detail: actionLabel('confirmList'),
              detailAtMs: actionAt('confirmList'),
            },
            {label: actionLabel('stepData'), atMs: actionAt('stepData')},
          ]}
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
        options={CTA_OPTIONS}
        comment={timeline.cta.comment}
        teaser={timeline.cta.teaser}
        atMs={timeline.cta.startMs}
        teaserAtMs={actionAt('nextTeaser')}
        teaserDetailAtMs={actionAt('teaserDetail')}
      />

      <AvatarZone states={timeline.avatarStates} sticker />
      <KineticCaptions clusters={clusters} palette={CAPTION_PALETTE} />
    </AbsoluteFill>
  );
};

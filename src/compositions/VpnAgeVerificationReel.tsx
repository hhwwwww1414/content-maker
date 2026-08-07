import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import timeline from '../generated/timeline-vpn-age-verification.json';
import captions from '../generated/captions-vpn-age-verification.json';
import {night, nightTones} from '../components/vibe/theme';
import {useMs} from '../components/vibe/primitives';
import {AvatarZone} from '../components/vibe/AvatarZone';
import {KineticCaptions, type CaptionCluster, type CaptionPalette} from '../components/vibe/KineticCaptions';
import {LoopingBackground, MoodTint} from '../components/vpn/Backdrop';
import {ChapterHead, ChipRail, CtaFrame, MemoryFrame, SourceBadge} from '../components/vpn/frames';
import {AgeAnswerCard, BypassChain, ConflictScale, DocumentCard, EuropeMap, LoopholeQuote} from '../components/vpn/scenes';

const clusters = captions as unknown as CaptionCluster[];

const lineAt = (id: string): number | null => timeline.lines.find((line) => line.id === id)?.startMs ?? null;
const action = (id: string) => timeline.actions.find((entry) => entry.id === id) ?? null;
const actionAt = (id: string): number | null => action(id)?.atMs ?? null;
const actionUntil = (id: string): number | null => action(id)?.untilMs ?? null;
const actionLabel = (id: string): string => action(id)?.label ?? '';
const railLabel = (id: string): string => action(id)?.railLabel ?? actionLabel(id);
const chapterAt = (id: string): number | null =>
  timeline.chapters.find((chapter) => chapter.id === id)?.startMs ?? null;

/** Source clip is 9.6 s; at 30 fps that is exactly 288 composition frames. */
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
            strikeWord="ЗАПРЕТЯТ"
            strikeAtMs={actionAt('strikeBan')}
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
          strikeWord="ЗАПРЕТЯТ"
          strikeAtMs={actionAt('strikeBan')}
        />
      </div>
    </>
  );
};

export const VpnAgeVerificationReel: React.FC = () => {
  const ms = useMs();
  const memory = timeline.memoryFrame;
  const ctaStartMs = timeline.cta.startMs ?? Infinity;

  // The persistent map anchors the metaphor; it steps aside once the chapters
  // need the full body area, and never competes with the memory frame or CTA.
  const mapUntil = chapterAt('document');

  // The cheat-sheet hands straight over to the closing question, so the diagram
  // dims once and stays dimmed — present behind the overlays, never competing.
  const dimFrom = Math.min(memory.startMs ?? Infinity, ctaStartMs);
  const overlayDim = interpolate(ms, [dimFrom - 200, dimFrom + 150], [1, 0.16], {
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
        alarm={{fromMs: lineAt('l02') ?? 0, toMs: lineAt('l04') ?? 0}}
        calm={{fromMs: lineAt('l15') ?? 0, toMs: lineAt('l18') ?? 0}}
        split={{fromMs: actionAt('tintSplit') ?? 0, toMs: actionUntil('tintSplit') ?? 0}}
      />

      <Audio src={staticFile(timeline.audioSrc)} volume={1} />

      <AbsoluteFill>
        <ChapterHeadline />
        <SourceBadge label={timeline.source.badge} atMs={actionAt('sourceBadge')} />
        <ChipRail
          chips={[
            {label: railLabel('chipMyth'), tone: 'danger', atMs: actionAt('chipMyth')},
            {label: railLabel('chipNoBan'), tone: 'mint', atMs: actionAt('chipNoBan')},
            {label: railLabel('chipIdea'), tone: 'mint', atMs: actionAt('chipIdea')},
          ]}
        />
      </AbsoluteFill>

      {/* Persistent canvas body */}
      <AbsoluteFill style={{opacity: overlayDim}}>
        <EuropeMap atMs={actionAt('euMap')} untilMs={mapUntil} />
        <LoopholeQuote
          label={actionLabel('loopholeQuote')}
          atMs={actionAt('loopholeQuote')}
          untilMs={actionUntil('loopholeQuote')}
        />

        <DocumentCard
          atMs={actionAt('docCard')}
          untilMs={actionUntil('docCard')}
          subAtMs={actionAt('docSub')}
          quoteAtMs={actionAt('docQuoteOpen')}
          says1AtMs={actionAt('docSays')}
          says2AtMs={actionAt('docSays2')}
          takeawayAtMs={actionAt('chipNoBan')}
          labels={{
            sub: actionLabel('docSub'),
            quote: actionLabel('docQuoteOpen'),
            says1: actionLabel('docSays'),
            says2: actionLabel('docSays2'),
            takeaway: actionLabel('chipNoBan'),
          }}
        />

        <AgeAnswerCard
          atMs={actionAt('ageCard')}
          untilMs={actionUntil('ageCard')}
          answerAtMs={actionAt('ageAnswer')}
          crossed={[
            {label: actionLabel('crossName'), atMs: actionAt('crossName')},
            {label: actionLabel('crossHistory'), atMs: actionAt('crossHistory')},
            {label: actionLabel('crossPassport'), atMs: actionAt('crossPassport')},
          ]}
          takeawayAtMs={actionAt('chipIdea')}
          takeaway={actionLabel('chipIdea')}
        />

        <BypassChain
          untilMs={actionUntil('nodeUser')}
          nodes={[
            {label: actionLabel('nodeUser'), atMs: actionAt('nodeUser')},
            {label: actionLabel('nodeVpn'), atMs: actionAt('nodeVpn')},
            {label: actionLabel('nodeRegion'), atMs: actionAt('nodeRegion')},
            {label: actionLabel('nodeNoGate'), atMs: actionAt('nodeNoGate'), tone: 'danger'},
          ]}
        />

        <ConflictScale
          atMs={actionAt('scaleFrame')}
          untilMs={actionUntil('scaleFrame')}
          sides={[
            {
              title: 'ЗАЩИТА ДЕТЕЙ',
              cost: actionLabel('scaleRight'),
              costAtMs: actionAt('scaleRight'),
              note: actionLabel('scaleNote'),
              noteAtMs: actionAt('scaleNote'),
            },
            {
              title: 'ПРИВАТНОСТЬ',
              cost: actionLabel('scaleLeft'),
              costAtMs: actionAt('scaleLeft'),
            },
          ]}
          panicChip={{label: actionLabel('chipPanic'), atMs: actionAt('chipPanic')}}
        />
      </AbsoluteFill>

      <MemoryFrame title={memory.title} items={memory.items} atMs={memory.startMs} untilMs={memory.endMs} />

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

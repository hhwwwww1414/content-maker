import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import timeline from '../generated/timeline-how-sites-detect-vpn.json';
import captions from '../generated/captions-how-sites-detect-vpn.json';
import {night, nightTones} from '../components/vibe/theme';
import {useMs} from '../components/vibe/primitives';
import {AvatarZone} from '../components/vibe/AvatarZone';
import {KineticCaptions, type CaptionCluster, type CaptionPalette} from '../components/vibe/KineticCaptions';
import {LoopingBackground, MoodTint} from '../components/vpn/Backdrop';
import {ChapterHead, ChipRail, CtaFrame, MemoryFrame, SourceBadge} from '../components/vpn/frames';
import {CompareScene, HookScene, IpScene, RepScene, RiskScene, SharedScene} from '../components/vpndetect/scenes';

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

export const HowSitesDetectVpnReel: React.FC = () => {
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
        alarm={{fromMs: lineAt('l23') ?? 0, toMs: lineAt('l28') ?? 0}}
        split={{fromMs: lineAt('l13') ?? 0, toMs: lineAt('l17') ?? 0}}
        calm={{fromMs: lineAt('l35') ?? 0, toMs: lineAt('l39') ?? 0}}
      />

      <Audio src={staticFile(timeline.audioSrc)} volume={1} />

      <AbsoluteFill>
        <ChapterHeadline />
        <SourceBadge label={timeline.source.badge} atMs={actionAt('sourceBadge')} />
        <ChipRail
          chips={[
            {label: railLabel('chipIp'), tone: 'warning', atMs: actionAt('chipIp')},
            {label: railLabel('chipShared'), tone: 'warning', atMs: actionAt('chipShared')},
            {label: railLabel('chipRep'), tone: 'danger', atMs: actionAt('chipRep')},
          ]}
        />
      </AbsoluteFill>

      {/* Persistent canvas body: phone -> address -> home vs datacenter -> crowding -> reputation -> score */}
      <AbsoluteFill style={{opacity: bodyDim}}>
        <HookScene
          atMs={actionAt('phoneCard')}
          untilMs={actionUntil('phoneCard')}
          bannerAtMs={actionAt('siteBanner')}
          crossAtMs={actionAt('peekCross')}
          notSureAtMs={actionAt('notSure')}
          unknownAtMs={actionAt('unknownState')}
          tracesAtMs={actionAt('tracesLabel')}
          labels={{
            card: actionLabel('phoneCard'),
            banner: actionLabel('siteBanner'),
            cross: actionLabel('peekCross'),
            notSure: actionLabel('notSure'),
            unknown: actionLabel('unknownState'),
            traces: actionLabel('tracesLabel'),
          }}
        />

        <IpScene
          atMs={actionAt('parcelCard')}
          untilMs={actionUntil('parcelCard')}
          labelAtMs={actionAt('returnAddress')}
          cardAtMs={actionAt('ipCard')}
          asnAtMs={actionAt('asnNote')}
          labels={{
            card: actionLabel('parcelCard'),
            label: actionLabel('returnAddress'),
            ipCard: actionLabel('ipCard'),
            asn: actionLabel('asnNote'),
          }}
          fields={[
            {label: actionLabel('fieldCountry'), atMs: actionAt('fieldCountry')},
            {label: actionLabel('fieldNetwork'), atMs: actionAt('fieldNetwork')},
          ]}
        />

        <CompareScene
          atMs={actionAt('compareFrame')}
          untilMs={actionUntil('compareFrame')}
          homeAtMs={actionAt('homeSide')}
          homeDetailAtMs={actionAt('homeDetail')}
          dcAtMs={actionAt('dcSide')}
          dcDetailAtMs={actionAt('dcDetail')}
          labels={{
            home: actionLabel('homeSide'),
            homeDetail: actionLabel('homeDetail'),
            dc: actionLabel('dcSide'),
            dcDetail: actionLabel('dcDetail'),
          }}
        />

        <SharedScene
          atMs={actionAt('sharedFrame')}
          untilMs={actionUntil('sharedFrame')}
          ipAtMs={actionAt('sharedIp')}
          countFromMs={actionAt('counterStart')}
          countToMs={actionAt('counterPeak')}
          flatAtMs={actionAt('flatNote')}
          footnoteAtMs={actionAt('notAlways')}
          labels={{
            card: actionLabel('sharedFrame'),
            ip: actionLabel('sharedIp'),
            flat: actionLabel('flatNote'),
            footnote: actionLabel('notAlways'),
          }}
        />

        <RepScene
          atMs={actionAt('repFrame')}
          untilMs={actionUntil('repFrame')}
          dropAtMs={actionAt('repDrop')}
          labels={{
            card: actionLabel('repFrame'),
            drop: actionLabel('repDrop'),
            clean: 'ЧИСТЫЙ',
            unsure: 'СОМНИТЕЛЬНЫЙ',
            bad: 'ПЛОХАЯ РЕПУТАЦИЯ',
          }}
          marks={[
            {label: actionLabel('markSpam'), atMs: actionAt('markSpam')},
            {label: actionLabel('markBots'), atMs: actionAt('markBots')},
            {label: actionLabel('markFlood'), atMs: actionAt('markFlood')},
          ]}
        />

        <RiskScene
          atMs={actionAt('riskFrame')}
          untilMs={actionUntil('riskFrame')}
          labels={{card: actionLabel('riskFrame')}}
          signals={[
            {label: actionLabel('sigIp'), atMs: actionAt('sigIp')},
            {label: actionLabel('sigCountry'), atMs: actionAt('sigCountry')},
            {label: actionLabel('sigNetwork'), atMs: actionAt('sigNetwork')},
            {label: actionLabel('sigShared'), atMs: actionAt('sigShared')},
            {label: actionLabel('sigRep'), atMs: actionAt('sigRep')},
            {label: actionLabel('sigBehaviour'), atMs: actionAt('sigBehaviour')},
          ]}
          verdicts={[
            {label: actionLabel('outAllow'), tone: 'mint', atMs: actionAt('outAllow')},
            {label: actionLabel('outCheck'), tone: 'warning', atMs: actionAt('outCheck')},
            {label: actionLabel('outBlock'), tone: 'danger', atMs: actionAt('outBlock')},
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

      {/* Open-ended question: no answer chips, the comment carries the ask. */}
      <CtaFrame
        prompt={timeline.cta.prompt}
        comment={timeline.cta.comment}
        teaser={timeline.cta.teaser}
        atMs={timeline.cta.startMs}
        commentAtMs={actionAt('ctaHint')}
        teaserAtMs={actionAt('nextTeaser')}
        teaserDetailAtMs={actionAt('teaserDetail')}
      />

      <AvatarZone states={timeline.avatarStates} sticker />
      <KineticCaptions clusters={clusters} palette={CAPTION_PALETTE} />
    </AbsoluteFill>
  );
};

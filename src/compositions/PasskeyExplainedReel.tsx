import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import timeline from '../generated/timeline-passkey-explained.json';
import captions from '../generated/captions-passkey-explained.json';
import {night, nightTones} from '../components/vibe/theme';
import {useMs} from '../components/vibe/primitives';
import {AvatarZone} from '../components/vibe/AvatarZone';
import {KineticCaptions, type CaptionCluster, type CaptionPalette} from '../components/vibe/KineticCaptions';
import {LoopingBackground, MoodTint} from '../components/vpn/Backdrop';
import {ChapterHead, ChipRail, CtaFrame, MemoryFrame, SourceBadge, type CtaOption} from '../components/vpn/frames';
import {
  BreachScene,
  FaceIdScene,
  HalvesScene,
  HookScene,
  LoginScene,
  PhishScene,
} from '../components/passkey/scenes';

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
  {label: 'ПАРОЛЬ', tone: 'yellow', atMs: actionAt('ctaOptionA')},
  {label: 'ЛИЦО', tone: 'mint', atMs: actionAt('ctaOptionB')},
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

export const PasskeyExplainedReel: React.FC = () => {
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
        alarm={{fromMs: lineAt('l25') ?? 0, toMs: lineAt('l31') ?? 0}}
        split={{fromMs: lineAt('l10') ?? 0, toMs: lineAt('l17') ?? 0}}
        calm={{fromMs: lineAt('l31') ?? 0, toMs: lineAt('l35') ?? 0}}
      />

      <Audio src={staticFile(timeline.audioSrc)} volume={1} />

      <AbsoluteFill>
        <ChapterHeadline />
        <SourceBadge label={timeline.source.badge} atMs={actionAt('sourceBadge')} />
        <ChipRail
          chips={[
            {label: railLabel('chipFace'), tone: 'mint', atMs: actionAt('chipFace')},
            {label: railLabel('chipSecret'), tone: 'mint', atMs: actionAt('chipSecret')},
            {label: railLabel('chipNoPass'), tone: 'mint', atMs: actionAt('chipNoPass')},
          ]}
        />
      </AbsoluteFill>

      {/* Persistent canvas body: the fear -> Face ID stays on device -> two halves -> login -> phishing -> breach */}
      <AbsoluteFill style={{opacity: bodyDim}}>
        <HookScene
          atMs={actionAt('hookCard')}
          untilMs={actionUntil('hookCard')}
          fearAtMs={actionAt('hookFear')}
          noAtMs={actionAt('hookNo')}
          answerAtMs={actionAt('hookAnswer')}
          labels={{
            card: actionLabel('hookCard'),
            fear: actionLabel('hookFear'),
            no: actionLabel('hookNo'),
            answer: actionLabel('hookAnswer'),
          }}
        />

        <FaceIdScene
          atMs={actionAt('phoneFrame')}
          untilMs={actionUntil('phoneFrame')}
          faceAtMs={actionAt('faceUnlock')}
          onlyDeviceAtMs={actionAt('onlyDevice')}
          unlockAtMs={actionAt('unlockArrow')}
          keyAtMs={actionAt('safeInside')}
          blockedAtMs={actionAt('blockedToSite')}
          labels={{
            card: actionLabel('phoneFrame'),
            face: actionLabel('faceUnlock'),
            onlyDevice: actionLabel('onlyDevice'),
            unlock: actionLabel('unlockArrow'),
            key: actionLabel('safeInside'),
            blocked: actionLabel('blockedToSite'),
          }}
        />

        <HalvesScene
          atMs={actionAt('lockFrame')}
          untilMs={actionUntil('lockFrame')}
          splitAtMs={actionAt('splitKey')}
          siteAtMs={actionAt('sitePart')}
          uselessAtMs={actionAt('siteUseless')}
          userAtMs={actionAt('userPart')}
          staysAtMs={actionAt('secretStays')}
          labels={{
            card: actionLabel('lockFrame'),
            site: actionLabel('sitePart'),
            useless: actionLabel('siteUseless'),
            user: actionLabel('userPart'),
            stays: actionLabel('secretStays'),
          }}
        />

        <LoginScene
          atMs={actionAt('loginFrame')}
          untilMs={actionUntil('loginFrame')}
          noPasswordAtMs={actionAt('noPassword')}
          noSharedAtMs={actionAt('noSharedPassword')}
          labels={{
            card: actionLabel('loginFrame'),
            noPassword: actionLabel('noPassword'),
            noShared: actionLabel('noSharedPassword'),
          }}
          steps={[
            {label: actionLabel('stepQuestion'), atMs: actionAt('stepQuestion')},
            {label: actionLabel('stepAnswer'), atMs: actionAt('stepAnswer')},
            {label: actionLabel('stepVerify'), atMs: actionAt('stepVerify')},
          ]}
        />

        <PhishScene
          atMs={actionAt('phishFrame')}
          untilMs={actionUntil('phishFrame')}
          realAtMs={actionAt('realSite')}
          fakeAtMs={actionAt('fakeSite')}
          keyAtMs={actionAt('keyToReal')}
          failsAtMs={actionAt('keyFails')}
          boundAtMs={actionAt('boundToAddress')}
          labels={{
            real: actionLabel('realSite'),
            fake: actionLabel('fakeSite'),
            key: actionLabel('keyToReal'),
            fails: actionLabel('keyFails'),
            bound: actionLabel('boundToAddress'),
          }}
        />

        <BreachScene
          atMs={actionAt('breachFrame')}
          untilMs={actionUntil('breachFrame')}
          rowsAtMs={actionAt('publicRows')}
          gapAtMs={actionAt('missingSecret')}
          verdictAtMs={actionAt('cantDerive')}
          footnoteAtMs={actionAt('breachNote')}
          labels={{
            card: actionLabel('breachFrame'),
            rows: actionLabel('publicRows'),
            gap: actionLabel('missingSecret'),
            verdict: actionLabel('cantDerive'),
            footnote: actionLabel('breachNote'),
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
        divider={timeline.cta.divider}
        options={CTA_OPTIONS}
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

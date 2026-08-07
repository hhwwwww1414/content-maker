import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, interpolate, staticFile} from 'remotion';
import timeline from '../generated/timeline-vibe-coding-trust.json';
import captions from '../generated/captions-vibe-coding-trust.json';
import {vibe} from '../components/vibe/theme';
import {Chip, useMs} from '../components/vibe/primitives';
import {SlotMachine} from '../components/vibe/SlotMachine';
import {AgentPipeline, BlindCard, OpenLoopCounter} from '../components/vibe/BlindZones';
import {DocChain} from '../components/vibe/DocChain';
import {TrustStack} from '../components/vibe/TrustStack';
import {AvatarZone} from '../components/vibe/AvatarZone';
import {KineticCaptions, type CaptionCluster} from '../components/vibe/KineticCaptions';
import {ChapterHead, CtaFrame, MemoryFrame, SourceBadge, SpeedVsTrust} from '../components/vibe/Frames';

const clusters = captions as unknown as CaptionCluster[];

const lineAt = (id: string): number | null => timeline.lines.find((line) => line.id === id)?.startMs ?? null;
const actionAt = (id: string): number | null => timeline.actions.find((action) => action.id === id)?.atMs ?? null;
const actionUntil = (id: string): number | null => timeline.actions.find((action) => action.id === id)?.untilMs ?? null;

const CHAPTER_CROSSFADE_MS = 320;

/** Faint engineering-paper grid — static, so it never reads as motion noise. */
const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: vibe.bg,
      backgroundImage: `linear-gradient(${vibe.inkFaint} 1px, transparent 1px), linear-gradient(90deg, ${vibe.inkFaint} 1px, transparent 1px)`,
      backgroundSize: '90px 90px',
      backgroundPosition: '-1px -1px',
    }}
  />
);

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
          // Chapter 1 must be readable on frame 0 — no intro, no build-in.
          instant={index === 0}
        />
      </div>
    </>
  );
};

/** Accumulated verdicts. Chips enter once and never leave. */
const ChipRail: React.FC = () => {
  const ms = useMs();
  const rail: {label: string; tone: 'danger' | 'mint'; atMs: number | null}[] = [
    {label: 'КАЗИНО', tone: 'danger', atMs: actionAt('chipCasino')},
    {label: 'ДОВЕРИЕ', tone: 'mint', atMs: lineAt('l06')},
  ];

  return (
    <div style={{position: 'absolute', left: 90, top: 500, display: 'flex', gap: 14, alignItems: 'center'}}>
      {rail.map((chip) => {
        const on = chip.atMs === null
          ? 0
          : interpolate(ms, [chip.atMs, chip.atMs + 380], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (on <= 0.001) return null;
        return (
          <div key={chip.label} style={{opacity: on, transform: `translateY(${(1 - on) * 10}px)`}}>
            <Chip label={chip.label} tone={chip.tone} size={26} />
          </div>
        );
      })}
    </div>
  );
};

const ChapterFourChips: React.FC = () => {
  const ms = useMs();
  const until = actionUntil('chipSelfCheck');
  const items: {label: string; tone: 'danger' | 'warning'; atMs: number | null; top: number}[] = [
    {label: 'АГЕНТ ПРОВЕРИЛ САМ СЕБЯ', tone: 'danger', atMs: actionAt('chipSelfCheck'), top: 926},
    {label: 'КАЗИНО С ДОКУМЕНТАЦИЕЙ', tone: 'warning', atMs: actionAt('chipDocsCasino'), top: 1006},
  ];

  return (
    <>
      {items.map((item) => {
        const on = item.atMs === null
          ? 0
          : interpolate(ms, [item.atMs, item.atMs + 380], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const off = until === null ? 1 : interpolate(ms, [until - 300, until], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (on * off <= 0.001) return null;
        return (
          <div
            key={item.label}
            style={{position: 'absolute', left: 90, top: item.top, opacity: on * off, transform: `translateY(${(1 - on) * 12}px)`}}
          >
            <Chip label={item.label} tone={item.tone} size={28} />
          </div>
        );
      })}
    </>
  );
};

export const VibeCodingTrustReel: React.FC = () => {
  const ms = useMs();

  const ctaStartMs = timeline.cta.startMs ?? Infinity;
  const memory = timeline.memoryFrame;

  // The diagram never disappears — it dims so the memory frame and the closing
  // question can sit on top of it without two texts fighting for the same pixels.
  const ctaDim = interpolate(ms, [ctaStartMs - 200, ctaStartMs + 300], [1, 0.13], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const memoryDim = interpolate(
    ms,
    [(memory.startMs ?? 0) - 150, memory.startMs ?? 0, memory.endMs ?? 0, (memory.endMs ?? 0) + 380],
    [1, 0.13, 0.13, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const diagramDim = Math.min(ctaDim, memoryDim);

  const trustNodes = [
    {
      label: 'НАМЕРЕНИЕ',
      sublabel: 'что функция обязана делать',
      atMs: actionAt('nodeIntent'),
      sublabelAtMs: actionAt('nodeIntentDetail'),
    },
    {
      label: 'ФАЙЛЫ',
      sublabel: 'что это реализует',
      atMs: actionAt('nodeFiles'),
      sublabelAtMs: actionAt('nodeFilesDetail'),
      linkLabel: 'требование → реализация',
    },
    {
      label: 'ТЕСТЫ',
      sublabel: 'что это доказывает',
      atMs: actionAt('nodeTests'),
      sublabelAtMs: actionAt('nodeTestsDetail'),
      linkLabel: 'реализация → доказательство',
    },
    {
      label: 'DIFF / BLAST RADIUS',
      sublabel: 'до коммита, а не после',
      atMs: actionAt('nodeBlast'),
      sublabelAtMs: actionAt('nodeBlastDetail'),
      linkLabel: 'изменение → область воздействия',
    },
  ];

  return (
    <AbsoluteFill style={{background: vibe.bg, color: vibe.ink}}>
      <Backdrop />
      <Audio src={staticFile(timeline.audioSrc)} volume={1} />

      <AbsoluteFill>
        <ChapterHeadline />
        <SourceBadge label={timeline.source.badge} atMs={actionAt('sourceBadge')} />
        <ChipRail />
      </AbsoluteFill>

      {/* Persistent canvas body */}
      <AbsoluteFill style={{opacity: diagramDim}}>
        <SlotMachine
          pullMs={actionAt('slotLever') ?? 0}
          shrinkMs={actionAt('slotShrink')}
          morphMs={actionAt('agentBlock')}
        />

        <SpeedVsTrust
          speedAtMs={actionAt('speedWord')}
          trustAtMs={actionAt('trustWord')}
          untilMs={actionUntil('speedWord')}
        />

        <AgentPipeline
          atMs={actionAt('pipeline')}
          untilMs={actionUntil('pipeline')}
          steps={[actionAt('pipeline') ?? 0, actionAt('pipelineStep2') ?? 0, actionAt('pipelineStep3') ?? 0]}
        />

        <OpenLoopCounter
          atMs={actionAt('openLoop3')}
          untilMs={actionUntil('openLoop3')}
          revealed={[actionAt('card1'), actionAt('card2'), actionAt('card3')].filter((at) => at !== null && ms >= at).length}
        />
        <BlindCard index={0} label="ЧТО ИЗМЕНИЛОСЬ?" atMs={actionAt('card1')} untilMs={actionUntil('card1')} />
        <BlindCard index={1} label="ЧТО НЕ ДОДЕЛАНО?" atMs={actionAt('card2')} untilMs={actionUntil('card2')} />
        <BlindCard index={2} label="ЧТО СЛОМАЕТСЯ ДАЛЬШЕ?" atMs={actionAt('card3')} untilMs={actionUntil('card3')} />

        <DocChain
          atMs={actionAt('docChain')}
          untilMs={actionUntil('docChain')}
          loopAtMs={actionAt('loopArrow')}
          stepMs={[
            actionAt('docChain'),
            actionAt('docStep2'),
            actionAt('docStep3'),
            actionAt('loopArrow'),
            actionAt('loopArrow'),
          ]}
        />
        <ChapterFourChips />

        <TrustStack nodes={trustNodes} />
      </AbsoluteFill>

      <MemoryFrame title={memory.title} chain={memory.chain} atMs={memory.startMs} untilMs={memory.endMs} />

      <CtaFrame
        prompt={timeline.cta.prompt}
        optionA={timeline.cta.optionA}
        divider={timeline.cta.divider}
        optionB={timeline.cta.optionB}
        teaser={timeline.cta.teaser}
        atMs={timeline.cta.startMs}
        optionBAtMs={actionAt('ctaOptionB')}
        commentAtMs={actionAt('ctaComment')}
        teaserAtMs={actionAt('nextTeaser')}
        teaserStepsAtMs={actionAt('teaserSteps')}
      />

      <AvatarZone states={timeline.avatarStates} />
      <KineticCaptions clusters={clusters} />
    </AbsoluteFill>
  );
};

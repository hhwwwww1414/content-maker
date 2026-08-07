import React from 'react';
import {interpolate} from 'remotion';
import {night} from '../vibe/theme';
import {manrope, unbounded} from '../../theme/fonts';
import {enterStyle, useEnter, useExit, useMs} from '../vibe/primitives';
import {Caption, Glass, NightChip, StrikeText} from '../vpn/glass';

/**
 * Scenes for the "AI cheated on its test" reel.
 *
 * The whole reel is one evolving canvas over the looping background: the exam
 * sheet becomes a locked classroom, the classroom grows a hole, the hole
 * becomes a route to the staff room. Every element lives inside the body slot
 * (x 90..990, y 608..~960) so it stays clear of the Instagram unsafe zones.
 */

const BODY = {left: 90, top: 608, width: 900} as const;

/** Progress 0..1 of an element that appears at `atMs`. */
const useOn = (atMs: number | null, durationMs = 380) => {
  const ms = useMs();
  if (atMs === null) return 0;
  return interpolate(ms, [atMs, atMs + durationMs], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const rise = (on: number, distance = 10): React.CSSProperties => ({
  opacity: on,
  transform: `translateY(${(1 - on) * distance}px)`,
});

/* ------------------------------------------------------------------ chapter 1 */

/** Closed door with the cheat sheet behind it. */
const CheatDoor: React.FC<{open: number}> = ({open}) => (
  <svg width={126} height={158} viewBox="0 0 126 158">
    {/* the sheet waiting behind the door */}
    <g opacity={0.35 + 0.65 * open}>
      <rect x={72} y={34} width={46} height={62} rx={6} fill="rgba(255,210,74,0.18)" stroke={night.yellow} strokeWidth={2} />
      <g stroke={night.yellow} strokeWidth={2.5} strokeLinecap="round" opacity={0.8}>
        <line x1={80} y1={50} x2={110} y2={50} />
        <line x1={80} y1={62} x2={104} y2={62} />
        <line x1={80} y1={74} x2={110} y2={74} />
      </g>
    </g>
    {/* the door itself */}
    <rect x={8} y={12} width={78} height={140} rx={8} fill="rgba(255,255,255,0.09)" stroke={night.line} strokeWidth={2.5} />
    <circle cx={74} cy={86} r={5} fill={night.textSoft} />
    <rect x={22} y={30} width={50} height={38} rx={5} fill="rgba(255,255,255,0.06)" stroke={night.line} strokeWidth={2} />
  </svg>
);

export const ExamScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  rowsAtMs: number | null;
  doorAtMs: number | null;
  stampAtMs: number | null;
  taskAtMs: number | null;
  taskMarkAtMs: number | null;
  labels: {sheet: string; door: string; stamp: string; task: string};
}> = ({atMs, untilMs, rowsAtMs, doorAtMs, stampAtMs, taskAtMs, taskMarkAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 1, rise: 0});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const door = useOn(doorAtMs, 460);
  const stamp = useOn(stampAtMs, 420);
  const task = useOn(taskAtMs, 420);
  const taskMark = useOn(taskMarkAtMs, 520);
  if (enter.opacity * exit <= 0.001) return null;

  const rowOn = (index: number) =>
    rowsAtMs === null
      ? 0
      : interpolate(ms, [rowsAtMs + index * 240, rowsAtMs + index * 240 + 340], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, opacity: exit}}>
      <div style={{display: 'flex', gap: 22, alignItems: 'stretch'}}>
        <Glass strong style={{flex: 1}}>
          <Caption style={{fontSize: 19, letterSpacing: 2.4}}>{labels.sheet}</Caption>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18}}>
            {[0, 1, 2].map((index) => {
              const on = rowOn(index);
              return (
                <div key={index} style={{display: 'flex', alignItems: 'center', gap: 14, ...rise(on, 8)}}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 9,
                      border: `2px solid ${night.line}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: manrope,
                      fontWeight: 800,
                      fontSize: 18,
                      color: night.textSoft,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.22)'}} />
                </div>
              );
            })}
          </div>
          <div style={{marginTop: 20, ...rise(task)}}>
            <Caption style={{fontSize: 18, letterSpacing: 2, color: night.textSoft}}>ЗАДАНИЕ</Caption>
            <div
              style={{
                marginTop: 6,
                fontFamily: unbounded,
                fontWeight: 700,
                fontSize: 25,
                lineHeight: 1.15,
                color: night.text,
                textShadow: night.shadow,
              }}
            >
              {labels.task}
            </div>
            {/* the marker the narration draws under the task mid-sentence */}
            <div
              style={{
                marginTop: 7,
                height: 5,
                borderRadius: 3,
                background: night.yellow,
                transformOrigin: 'left center',
                transform: `scaleX(${taskMark})`,
              }}
            />
          </div>
        </Glass>

        <div style={{flex: '0 0 322px', position: 'relative'}}>
          <Glass style={{height: '100%', opacity: door, transform: `translateY(${(1 - door) * 12}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <CheatDoor open={door} />
              <div
                style={{
                  fontFamily: unbounded,
                  fontWeight: 700,
                  fontSize: 23,
                  lineHeight: 1.15,
                  color: night.yellow,
                  textShadow: night.shadow,
                }}
              >
                {labels.door}
              </div>
            </div>
          </Glass>
          <div
            style={{
              position: 'absolute',
              left: -46,
              bottom: -22,
              transform: `rotate(-7deg) scale(${0.86 + 0.14 * stamp})`,
              opacity: stamp,
            }}
          >
            <NightChip label={labels.stamp} tone="warning" size={27} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- chapters 2-3 */

/**
 * The closed classroom. Chapter 2 draws the sealed room; chapter 3 opens a hole
 * in the same wall and routes an arrow out of it — the canvas is never reset.
 */
export const RoomScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  labelAtMs: number | null;
  noNetAtMs: number | null;
  outsideAtMs: number | null;
  howOutAtMs: number | null;
  crackAtMs: number | null;
  holeNoteAtMs: number | null;
  arrowAtMs: number | null;
  labels: {label: string; noNet: string; howOut: string; holeNote: string; arrow: string; outside: string};
}> = ({
  atMs,
  untilMs,
  labelAtMs,
  noNetAtMs,
  outsideAtMs,
  howOutAtMs,
  crackAtMs,
  holeNoteAtMs,
  arrowAtMs,
  labels,
}) => {
  const enter = useEnter(atMs, {durationMs: 460, rise: 18});
  const exit = useExit(untilMs, 320);
  const label = useOn(labelAtMs, 400);
  const noNet = useOn(noNetAtMs, 440);
  const outside = useOn(outsideAtMs, 420);
  const howOut = useOn(howOutAtMs, 420);
  const crack = useOn(crackAtMs, 520);
  const holeNote = useOn(holeNoteAtMs, 420);
  const arrow = useOn(arrowAtMs, 620);
  if (enter.opacity * exit <= 0.001) return null;

  // the escape arrow is drawn on, not faded in
  const ARROW_LENGTH = 150;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 20, alignItems: 'flex-start'}}>
        <svg width={506} height={318} viewBox="0 0 506 318" style={{flexShrink: 0}}>
          {/* the sealed room */}
          <rect x={16} y={44} width={286} height={228} rx={16} fill="rgba(255,255,255,0.07)" stroke={night.line} strokeWidth={3} />
          <text
            x={30}
            y={32}
            style={{fontFamily: manrope, fontWeight: 800, fontSize: 19, fill: night.textSoft, letterSpacing: 2}}
          >
            КЛАСС
          </text>

          {/* the model inside */}
          <circle cx={110} cy={158} r={38} fill="rgba(63,224,168,0.16)" stroke={night.mint} strokeWidth={2.5} />
          <text
            x={110}
            y={168}
            textAnchor="middle"
            style={{fontFamily: unbounded, fontWeight: 800, fontSize: 26, fill: night.mint}}
          >
            ИИ
          </text>

          {/* the internet, outside the wall */}
          <g opacity={0.25 + 0.75 * outside}>
            <circle cx={432} cy={112} r={40} fill="rgba(255,255,255,0.08)" stroke={night.textSoft} strokeWidth={2.5} />
            <ellipse cx={432} cy={112} rx={17} ry={40} fill="none" stroke={night.textSoft} strokeWidth={2} />
            <line x1={392} y1={112} x2={472} y2={112} stroke={night.textSoft} strokeWidth={2} />
            <text
              x={432}
              y={176}
              textAnchor="middle"
              style={{fontFamily: manrope, fontWeight: 800, fontSize: 18, fill: night.textSoft, letterSpacing: 1}}
            >
              ИНТЕРНЕТ
            </text>
          </g>

          {/* chapter 2: the wall holds */}
          <g opacity={Math.max(0, noNet - crack)}>
            <line x1={318} y1={128} x2={372} y2={182} stroke={night.red} strokeWidth={5} strokeLinecap="round" />
            <line x1={372} y1={128} x2={318} y2={182} stroke={night.red} strokeWidth={5} strokeLinecap="round" />
          </g>

          {/* chapter 3: a hole opens in the same wall */}
          <g opacity={crack}>
            <rect
              x={286}
              y={126}
              width={32}
              height={64}
              rx={5}
              fill="rgba(255,210,74,0.20)"
              stroke={night.yellow}
              strokeWidth={3}
            />
            <path
              d="M302 108 L294 126 L308 138 L296 156"
              fill="none"
              stroke={night.yellow}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={crack}
            />
          </g>

          {/* chapter 3: the route out, drawn on */}
          <g opacity={arrow > 0.02 ? 1 : 0}>
            <path
              d="M320 158 C 352 158, 366 130, 392 116"
              fill="none"
              stroke={night.yellow}
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${ARROW_LENGTH * arrow} ${ARROW_LENGTH}`}
            />
            <path
              d="M380 106 L394 115 L382 126"
              fill="none"
              stroke={night.yellow}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={arrow > 0.8 ? 1 : 0}
            />
            <circle cx={320} cy={158} r={6} fill={night.yellow} opacity={arrow} />
          </g>
        </svg>

        <div style={{flex: 1, paddingTop: 6}}>
          <Caption style={{fontSize: 19, letterSpacing: 2, ...rise(label, 8)}}>{labels.label}</Caption>

          <div
            style={{
              marginTop: 14,
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 42,
              lineHeight: 1.05,
              color: night.text,
              textShadow: night.shadow,
              ...rise(noNet, 12),
            }}
          >
            {labels.noNet}
          </div>

          <div
            style={{
              marginTop: 18,
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 38,
              lineHeight: 1.05,
              color: night.yellow,
              textShadow: night.shadow,
              ...rise(howOut, 12),
            }}
          >
            {labels.howOut}
          </div>

          <div style={{marginTop: 18, ...rise(holeNote, 10)}}>
            <Caption style={{fontSize: 19, letterSpacing: 1.4, color: night.mint}}>{labels.holeNote}</Caption>
          </div>

          <div
            style={{
              marginTop: 14,
              fontFamily: unbounded,
              fontWeight: 700,
              fontSize: 28,
              lineHeight: 1.1,
              color: night.text,
              textShadow: night.shadow,
              ...rise(arrow, 10),
            }}
          >
            {labels.arrow}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 4 */

export type RouteNode = {label: string; atMs: number | null; sub: string; subAtMs: number | null; tone?: string};

const NODE_WIDTH = 198;
const NODE_GAP = 26;

export const RouteChain: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  nodes: RouteNode[];
  taskAtMs: number | null;
  whyAtMs: number | null;
  whyUntilMs: number | null;
  answerAtMs: number | null;
  labels: {task: string; why: string; answer: string};
}> = ({atMs, untilMs, nodes, taskAtMs, whyAtMs, whyUntilMs, answerAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const task = useOn(taskAtMs, 400);
  const why = useOn(whyAtMs, 380);
  const whyOut = useExit(whyUntilMs, 300);
  const answer = useOn(answerAtMs, 440);
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null, duration = 420) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      {/* reserved so the node row keeps its position before the label lands */}
      <div style={{height: 30}}>
        <Caption style={{fontSize: 19, letterSpacing: 2, ...rise(task, 6)}}>{labels.task}</Caption>
      </div>

      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0}}>
        {nodes.map((node, i) => {
          const nodeOn = on(node.atMs);
          const subOn = on(node.subAtMs, 380);
          const accent = node.tone === 'danger' ? night.red : i === 1 ? night.yellow : undefined;
          return (
            <React.Fragment key={node.label}>
              {i > 0 ? (
                <svg width={NODE_GAP} height={22} viewBox="0 0 28 22" style={{flexShrink: 0, marginTop: 32}}>
                  <line
                    x1={0}
                    y1={11}
                    x2={20 * nodeOn}
                    y2={11}
                    stroke={night.line}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 5 L26 11 L18 17"
                    fill="none"
                    stroke={night.line}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={nodeOn > 0.75 ? 1 : 0}
                  />
                </svg>
              ) : null}
              <div style={{width: NODE_WIDTH, flexShrink: 0}}>
                <Glass
                  accent={accent}
                  style={{
                    padding: '16px 10px',
                    textAlign: 'center',
                    ...rise(nodeOn, 12),
                  }}
                >
                  <div
                    style={{
                      fontFamily: unbounded,
                      fontWeight: 700,
                      fontSize: 19,
                      lineHeight: 1.1,
                      color: node.tone === 'danger' ? night.red : night.text,
                      textShadow: night.shadow,
                    }}
                  >
                    {node.label}
                  </div>
                </Glass>
                {/* reserved height so the row never jumps as the subtitles land */}
                <div style={{height: 52, paddingTop: 10, textAlign: 'center'}}>
                  <Caption style={{fontSize: 17, letterSpacing: 0.6, lineHeight: 1.2, ...rise(subOn, 6)}}>
                    {node.sub}
                  </Caption>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 24, marginTop: 12, minHeight: 74}}>
        <div
          style={{
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 54,
            lineHeight: 1,
            color: night.yellow,
            textShadow: night.shadow,
            opacity: why * whyOut,
            transform: `scale(${0.86 + 0.14 * why})`,
            transformOrigin: 'left center',
          }}
        >
          {labels.why}
        </div>
        <div
          style={{
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 32,
            lineHeight: 1.1,
            color: night.mint,
            textShadow: night.shadow,
            ...rise(answer, 12),
          }}
        >
          {labels.answer}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 5 */

export const LiteralScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  meantTextAtMs: number | null;
  notEvilAtMs: number | null;
  chipAtMs: number | null;
  heardAtMs: number | null;
  heardTextAtMs: number | null;
  labels: {meant: string; meantText: string; notEvil: string; chip: string; heard: string; heardText: string};
}> = ({atMs, untilMs, meantTextAtMs, notEvilAtMs, chipAtMs, heardAtMs, heardTextAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 20});
  const exit = useExit(untilMs, 320);
  const meantText = useOn(meantTextAtMs, 420);
  const notEvil = useOn(notEvilAtMs, 480);
  const chip = useOn(chipAtMs, 400);
  const heard = useOn(heardAtMs, 420);
  const heardText = useOn(heardTextAtMs, 440);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Glass accent={night.mint}>
        <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.meant}</Caption>
        <div
          style={{
            marginTop: 8,
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 36,
            lineHeight: 1.05,
            color: night.mint,
            textShadow: night.shadow,
            ...rise(meantText),
          }}
        >
          {labels.meantText}
        </div>
      </Glass>

      <div style={{display: 'flex', alignItems: 'center', gap: 20, margin: '18px 0 16px', minHeight: 48}}>
        <div style={rise(chip, 8)}>
          <NightChip label={labels.chip} tone="warning" size={25} />
        </div>
        <StrikeText
          label={labels.notEvil}
          progress={notEvil}
          fontSize={26}
          color={night.textSoft}
          style={{opacity: notEvilAtMs === null ? 0 : Math.min(1, notEvil * 3)}}
        />
      </div>

      <div style={{...rise(heard, 12)}}>
        <Glass accent={night.red}>
          <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.heard}</Caption>
          <div
            style={{
              marginTop: 8,
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 36,
              lineHeight: 1.05,
              color: night.red,
              textShadow: night.shadow,
              ...rise(heardText),
            }}
          >
            {labels.heardText}
          </div>
        </Glass>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 6 */

export const StoppedScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  markAtMs: number | null;
  hardenAtMs: number | null;
  footnoteAtMs: number | null;
  labels: {card: string; mark: string; harden: string; footnote: string};
}> = ({atMs, untilMs, markAtMs, hardenAtMs, footnoteAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 20});
  const exit = useExit(untilMs, 320);
  const mark = useOn(markAtMs, 460);
  const harden = useOn(hardenAtMs, 420);
  const footnote = useOn(footnoteAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Glass strong>
        <Caption style={{fontSize: 19, letterSpacing: 2.4}}>{labels.card}</Caption>

        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 18, ...rise(mark, 12)}}>
          <div
            style={{
              width: 52,
              height: 52,
              flexShrink: 0,
              borderRadius: 14,
              border: `2.5px solid ${night.mint}`,
              background: 'rgba(63,224,168,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: manrope,
              fontWeight: 800,
              fontSize: 27,
              color: night.mint,
            }}
          >
            ✓
          </div>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 38,
              lineHeight: 1.05,
              color: night.mint,
              textShadow: night.shadow,
            }}
          >
            {labels.mark}
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.1,
            color: night.text,
            textShadow: night.shadow,
            ...rise(harden, 10),
          }}
        >
          {labels.harden}
        </div>

        <div style={{height: 2, background: 'rgba(255,255,255,0.14)', margin: '20px 0 14px', opacity: footnote}} />
        <Caption style={{fontSize: 17, letterSpacing: 0.8, lineHeight: 1.35, ...rise(footnote, 8)}}>
          {labels.footnote}
        </Caption>
      </Glass>
    </div>
  );
};

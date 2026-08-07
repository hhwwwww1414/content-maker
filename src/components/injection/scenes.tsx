import React from 'react';
import {interpolate} from 'remotion';
import {night} from '../vibe/theme';
import {unbounded} from '../../theme/fonts';
import {enterStyle, useEnter, useExit, useMs} from '../vibe/primitives';
import {Caption, Glass, NightChip} from '../vpn/glass';

/**
 * Scenes for the "a website can command your AI" reel.
 *
 * One evolving canvas over the looping background: a page the agent reads grows
 * a hidden instruction, the instruction and the user's task collapse into one
 * context block, and the same shape reappears as a courier carrying two
 * conflicting notes. Everything lives inside the body slot (x 90..990,
 * y 608..~950) so it stays clear of the Instagram unsafe zones.
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

const Headline: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({
  children,
  color = night.text,
  size = 34,
  style,
}) => (
  <div
    style={{
      fontFamily: unbounded,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.08,
      color,
      textShadow: night.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ chapter 1 */

/** Browser window whose last text row is the planted instruction. */
const PageGlyph: React.FC<{rows: number; seed: number; accent?: string}> = ({rows, seed, accent}) => (
  <svg width={260} height={186} viewBox="0 0 260 186">
    <rect x={2} y={2} width={256} height={182} rx={12} fill="rgba(255,255,255,0.07)" stroke={night.line} strokeWidth={2.5} />
    <line x1={2} y1={38} x2={258} y2={38} stroke={night.line} strokeWidth={2} />
    <circle cx={22} cy={20} r={5} fill={night.textFaint} />
    <circle cx={40} cy={20} r={5} fill={night.textFaint} />
    <circle cx={58} cy={20} r={5} fill={night.textFaint} />
    <rect x={78} y={12} width={162} height={16} rx={8} fill="rgba(255,255,255,0.10)" />
    <g stroke={night.textSoft} strokeWidth={5} strokeLinecap="round" opacity={0.75}>
      {[0, 1, 2].map((i) => (
        <line key={i} x1={22} y1={64 + i * 24} x2={i === 2 ? 168 : 226} y2={64 + i * 24} opacity={rows > i ? 1 : 0.18} />
      ))}
    </g>
    {/* the planted line: same shape as the rest, only the tint gives it away */}
    <g opacity={seed}>
      <rect x={16} y={136} width={228} height={34} rx={8} fill="rgba(255,107,90,0.16)" stroke={accent ?? night.red} strokeWidth={2.5} />
      <line x1={30} y1={153} x2={202} y2={153} stroke={accent ?? night.red} strokeWidth={5} strokeLinecap="round" />
    </g>
  </svg>
);

/** Simple agent glyph: a rounded head with an antenna, never a real product logo. */
const AgentGlyph: React.FC<{tone?: string; size?: number}> = ({tone = night.mint, size = 96}) => (
  <svg width={size} height={size} viewBox="0 0 96 96">
    <line x1={48} y1={8} x2={48} y2={20} stroke={tone} strokeWidth={3} strokeLinecap="round" />
    <circle cx={48} cy={8} r={5} fill={tone} />
    <rect x={16} y={20} width={64} height={54} rx={14} fill="rgba(63,224,168,0.14)" stroke={tone} strokeWidth={3} />
    <circle cx={34} cy={44} r={6} fill={tone} />
    <circle cx={62} cy={44} r={6} fill={tone} />
    <line x1={34} y1={60} x2={62} y2={60} stroke={tone} strokeWidth={3} strokeLinecap="round" />
    <line x1={30} y1={74} x2={30} y2={86} stroke={tone} strokeWidth={3} strokeLinecap="round" />
    <line x1={66} y1={74} x2={66} y2={86} stroke={tone} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

export const HookScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  agentAtMs: number | null;
  seedAtMs: number | null;
  noClickAtMs: number | null;
  labels: {card: string; agent: string; seed: string; noClick: string};
}> = ({atMs, untilMs, agentAtMs, seedAtMs, noClickAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 1, rise: 0});
  const exit = useExit(untilMs, 320);
  const agent = useOn(agentAtMs, 420);
  const seed = useOn(seedAtMs, 520);
  const noClick = useOn(noClickAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, opacity: exit}}>
      <div style={{display: 'flex', gap: 24, alignItems: 'flex-start'}}>
        <div style={{flexShrink: 0}}>
          <Caption style={{fontSize: 18, letterSpacing: 2.2, marginBottom: 10}}>{labels.card}</Caption>
          <PageGlyph rows={3} seed={seed} />
          <div style={{marginTop: 10, ...rise(seed, 8)}}>
            <Caption style={{fontSize: 17, letterSpacing: 1, color: night.red}}>{labels.seed}</Caption>
          </div>
        </div>

        <div style={{flex: 1, paddingTop: 26}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16, ...rise(agent, 12)}}>
            <AgentGlyph />
            <Headline size={30}>{labels.agent}</Headline>
          </div>
          <div style={{marginTop: 26, ...rise(noClick, 12)}}>
            <NightChip label={labels.noClick} tone="danger" size={27} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 2 */

export type ChainNode = {label: string; atMs: number | null};

export const TaskScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  nodes: ChainNode[];
  noteAtMs: number | null;
  openAtMs: number | null;
  labels: {note: string; open: string};
}> = ({atMs, untilMs, nodes, noteAtMs, openAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const note = useOn(noteAtMs, 440);
  const open = useOn(openAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {nodes.map((node, i) => {
          const nodeOn = on(node.atMs);
          return (
            <React.Fragment key={node.label}>
              {i > 0 ? (
                <svg width={40} height={22} viewBox="0 0 40 22" style={{flexShrink: 0}}>
                  <line x1={0} y1={11} x2={30 * nodeOn} y2={11} stroke={night.line} strokeWidth={3} strokeLinecap="round" />
                  <path
                    d="M28 5 L38 11 L28 17"
                    fill="none"
                    stroke={night.line}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={nodeOn > 0.75 ? 1 : 0}
                  />
                </svg>
              ) : null}
              <Glass
                accent={i === nodes.length - 1 ? night.mint : undefined}
                style={{padding: '18px 16px', textAlign: 'center', flex: 1, ...rise(nodeOn, 12)}}
              >
                <div
                  style={{
                    fontFamily: unbounded,
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: 1.1,
                    color: night.text,
                    textShadow: night.shadow,
                  }}
                >
                  {node.label}
                </div>
              </Glass>
            </React.Fragment>
          );
        })}
      </div>

      {/* the owner's note, pinned to the task the agent was actually given */}
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 26, minHeight: 84, ...rise(note, 12)}}>
        <svg width={72} height={72} viewBox="0 0 72 72" style={{flexShrink: 0}}>
          <rect x={6} y={10} width={60} height={54} rx={8} fill="rgba(63,224,168,0.16)" stroke={night.mint} strokeWidth={3} />
          <g stroke={night.mint} strokeWidth={3} strokeLinecap="round">
            <line x1={18} y1={28} x2={54} y2={28} />
            <line x1={18} y1={40} x2={44} y2={40} />
          </g>
        </svg>
        <Headline size={30} color={night.mint}>
          {labels.note}
        </Headline>
      </div>

      <div style={{marginTop: 6, ...rise(open, 10)}}>
        <Caption style={{fontSize: 21, letterSpacing: 1.2}}>{labels.open}</Caption>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 3 */

export const PageScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  noteAtMs: number | null;
  quoteAAtMs: number | null;
  quoteBAtMs: number | null;
  unnoticedAtMs: number | null;
  labels: {card: string; note: string; quoteA: string; quoteB: string; unnoticed: string};
}> = ({atMs, untilMs, noteAtMs, quoteAAtMs, quoteBAtMs, unnoticedAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const note = useOn(noteAtMs, 480);
  const quoteA = useOn(quoteAAtMs, 420);
  const quoteB = useOn(quoteBAtMs, 420);
  const unnoticed = useOn(unnoticedAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 22, alignItems: 'flex-start'}}>
        <div style={{flexShrink: 0}}>
          <Caption style={{fontSize: 17, letterSpacing: 1.6, marginBottom: 10, lineHeight: 1.25, width: 260}}>
            {labels.card}
          </Caption>
          <PageGlyph rows={3} seed={note} />
        </div>

        <div style={{flex: 1}}>
          <div style={{...rise(note, 12)}}>
            <NightChip label={labels.note} tone="danger" size={25} />
          </div>

          {/* the planted instruction, quoted — never presented as advice */}
          <div style={{marginTop: 16, ...rise(quoteA, 10)}}>
            <Glass accent={night.red} style={{padding: '16px 20px'}}>
              <div
                style={{
                  fontFamily: unbounded,
                  fontWeight: 700,
                  fontSize: 23,
                  lineHeight: 1.2,
                  color: night.red,
                  textShadow: night.shadow,
                }}
              >
                {labels.quoteA}
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: unbounded,
                  fontWeight: 700,
                  fontSize: 23,
                  lineHeight: 1.2,
                  color: night.red,
                  textShadow: night.shadow,
                  ...rise(quoteB, 8),
                }}
              >
                {labels.quoteB}
              </div>
            </Glass>
          </div>

          <div style={{marginTop: 16, ...rise(unnoticed, 10)}}>
            <Headline size={28} color={night.yellow}>
              {labels.unnoticed}
            </Headline>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 4 */

/** Two identically drawn sheets that slide into a single context block. */
export const BlurScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  dataAtMs: number | null;
  commandAtMs: number | null;
  sameAtMs: number | null;
  mergeAtMs: number | null;
  bothAtMs: number | null;
  termAtMs: number | null;
  termDefAtMs: number | null;
  labels: {data: string; command: string; same: string; merge: string; both: string; term: string; termDef: string};
}> = ({atMs, untilMs, dataAtMs, commandAtMs, sameAtMs, mergeAtMs, bothAtMs, termAtMs, termDefAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const data = useOn(dataAtMs, 420);
  const command = useOn(commandAtMs, 420);
  const same = useOn(sameAtMs, 420);
  const merge = useOn(mergeAtMs, 620);
  const both = useOn(bothAtMs, 440);
  const term = useOn(termAtMs, 460);
  const termDef = useOn(termDefAtMs, 440);
  if (enter.opacity * exit <= 0.001) return null;

  // Both sheets travel to the middle: the merge is the point of the chapter.
  const slide = 96 * merge;

  const sheet = (label: string, on: number, dx: number) => (
    <div style={{transform: `translateX(${dx}px)`, opacity: on, flex: '0 0 250px'}}>
      <Glass style={{padding: '16px 18px'}}>
        <Caption style={{fontSize: 17, letterSpacing: 2}}>{label}</Caption>
        <div style={{display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.30)', width: i === 2 ? '64%' : '100%'}} />
          ))}
        </div>
      </Glass>
    </div>
  );

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      {/* the context block the two sheets fall into */}
      <div
        style={{
          position: 'relative',
          borderRadius: 22,
          border: `2.5px dashed rgba(255,255,255,${0.10 + 0.28 * merge})`,
          padding: '18px 20px',
          background: `rgba(255,255,255,${0.03 * merge})`,
        }}
      >
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          {sheet(labels.data, data, slide)}
          {sheet(labels.command, command, -slide)}
        </div>
        <div style={{marginTop: 12, textAlign: 'center', opacity: merge}}>
          <Caption style={{fontSize: 18, letterSpacing: 2.4, color: night.yellow}}>{labels.merge}</Caption>
        </div>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, minHeight: 40, ...rise(same, 8)}}>
        <Caption style={{fontSize: 19, letterSpacing: 1.2}}>{labels.same}</Caption>
      </div>

      <div style={{marginTop: 4, ...rise(both, 12)}}>
        <Headline size={30} color={night.yellow}>
          {labels.both}
        </Headline>
      </div>

      {/* the term lands only after the mechanism has been shown */}
      <div style={{marginTop: 14, ...rise(term, 12)}}>
        <Glass accent={night.yellow} style={{padding: '14px 20px'}}>
          <Headline size={28} color={night.yellow}>
            {labels.term}
          </Headline>
          <div style={{marginTop: 6, ...rise(termDef, 6)}}>
            <Caption style={{fontSize: 18, letterSpacing: 0.8, lineHeight: 1.3}}>{labels.termDef}</Caption>
          </div>
        </Glass>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 5 */

const BoxGlyph: React.FC<{owner: number; stranger: number}> = ({owner, stranger}) => (
  <svg width={230} height={196} viewBox="0 0 230 196">
    {/* parcel */}
    <rect x={40} y={62} width={150} height={112} rx={10} fill="rgba(255,255,255,0.08)" stroke={night.line} strokeWidth={3} />
    <line x1={40} y1={96} x2={190} y2={96} stroke={night.line} strokeWidth={3} />
    <line x1={115} y1={62} x2={115} y2={96} stroke={night.line} strokeWidth={3} />
    {/* the owner's note, on the box from the start */}
    <g opacity={owner} transform="translate(0,0)">
      <rect x={54} y={110} width={80} height={50} rx={6} fill="rgba(63,224,168,0.20)" stroke={night.mint} strokeWidth={2.5} />
      <g stroke={night.mint} strokeWidth={2.5} strokeLinecap="round">
        <line x1={64} y1={126} x2={124} y2={126} />
        <line x1={64} y1={140} x2={106} y2={140} />
      </g>
    </g>
    {/* the stranger's note, stuck on top at an angle */}
    <g opacity={stranger} transform={`rotate(${-9 + 9 * (1 - stranger)} 160 92) translate(0 ${(1 - stranger) * -18})`}>
      <rect x={116} y={44} width={92} height={58} rx={6} fill="rgba(255,107,90,0.24)" stroke={night.red} strokeWidth={3} />
      <g stroke={night.red} strokeWidth={2.5} strokeLinecap="round">
        <line x1={128} y1={62} x2={196} y2={62} />
        <line x1={128} y1={76} x2={176} y2={76} />
        <line x1={128} y1={90} x2={188} y2={90} />
      </g>
    </g>
  </svg>
);

export const CourierScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  boxAtMs: number | null;
  courierAtMs: number | null;
  ownerAtMs: number | null;
  strangerAtMs: number | null;
  quoteAtMs: number | null;
  quoteBAtMs: number | null;
  labels: {box: string; courier: string; owner: string; stranger: string; quote: string; quoteB: string};
}> = ({atMs, untilMs, boxAtMs, courierAtMs, ownerAtMs, strangerAtMs, quoteAtMs, quoteBAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const box = useOn(boxAtMs, 460);
  const courier = useOn(courierAtMs, 440);
  const owner = useOn(ownerAtMs, 440);
  const stranger = useOn(strangerAtMs, 520);
  const quote = useOn(quoteAtMs, 420);
  const quoteB = useOn(quoteBAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 20, alignItems: 'flex-start'}}>
        <div style={{flexShrink: 0, opacity: box, textAlign: 'center'}}>
          <BoxGlyph owner={owner} stranger={stranger} />
          <div style={{marginTop: 2, ...rise(courier, 8)}}>
            <Caption style={{fontSize: 18, letterSpacing: 2}}>
              {labels.courier} · {labels.box}
            </Caption>
          </div>
        </div>

        <div style={{flex: 1, paddingTop: 4}}>
          <div style={{...rise(owner, 10)}}>
            <NightChip label={labels.owner} tone="mint" size={21} />
          </div>

          <div style={{marginTop: 16, ...rise(stranger, 10)}}>
            <NightChip label={labels.stranger} tone="danger" size={21} />
          </div>

          <div style={{marginTop: 16, ...rise(quote, 10)}}>
            <Glass accent={night.red} style={{padding: '14px 18px'}}>
              <Headline size={24} color={night.red}>
                {labels.quote}
              </Headline>
              <div style={{marginTop: 8, ...rise(quoteB, 8)}}>
                <Headline size={24} color={night.red}>
                  {labels.quoteB}
                </Headline>
              </div>
            </Glass>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 6 */

const KEY_GLYPHS: Record<string, React.ReactNode> = {
  ПОЧТА: (
    <>
      <rect x={6} y={12} width={52} height={38} rx={6} fill="none" stroke="currentColor" strokeWidth={3} />
      <path d="M6 16 L32 36 L58 16" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  ОБЛАКО: (
    <path
      d="M18 46 A12 12 0 0 1 18 22 A15 15 0 0 1 46 20 A11 11 0 0 1 48 46 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinejoin="round"
    />
  ),
  ФАЙЛЫ: (
    <>
      <path d="M16 8 H40 L50 20 V54 H16 Z" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" />
      <path d="M40 8 V20 H50" fill="none" stroke="currentColor" strokeWidth={3} strokeLinejoin="round" />
    </>
  ),
  ДЕНЬГИ: (
    <>
      <rect x={6} y={16} width={52} height={32} rx={5} fill="none" stroke="currentColor" strokeWidth={3} />
      <circle cx={32} cy={32} r={8} fill="none" stroke="currentColor" strokeWidth={3} />
    </>
  ),
};

export type AccessKey = {label: string; atMs: number | null};

export const KeysScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  keys: AccessKey[];
  linkAtMs: number | null;
  actionAtMs: number | null;
  labels: {card: string; link: string; action: string};
}> = ({atMs, untilMs, keys, linkAtMs, actionAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const link = useOn(linkAtMs, 620);
  const action = useOn(actionAtMs, 440);
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});


  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>

      <div style={{display: 'flex', gap: 14, marginTop: 16}}>
        {keys.map((key) => {
          const keyOn = on(key.atMs);
          return (
            <div key={key.label} style={{flex: 1, ...rise(keyOn, 12)}}>
              <Glass style={{padding: '14px 8px', textAlign: 'center'}}>
                <svg width={64} height={62} viewBox="0 0 64 62" style={{color: night.yellow}}>
                  {KEY_GLYPHS[key.label]}
                </svg>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: unbounded,
                    fontWeight: 700,
                    fontSize: 19,
                    color: night.text,
                    textShadow: night.shadow,
                  }}
                >
                  {key.label}
                </div>
              </Glass>
            </div>
          );
        })}
      </div>

      {/* foreign text -> real action, drawn on rather than faded in */}
      <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, minHeight: 76}}>
        <div style={{opacity: link > 0.02 ? 1 : 0, flexShrink: 0}}>
          <NightChip label={labels.link} tone="danger" size={23} />
        </div>
        <svg width={72} height={22} viewBox="0 0 72 22" style={{flexShrink: 0}}>
          <line x1={0} y1={11} x2={60 * link} y2={11} stroke={night.red} strokeWidth={4} strokeLinecap="round" />
          <path
            d="M58 4 L70 11 L58 18"
            fill="none"
            stroke={night.red}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={link > 0.8 ? 1 : 0}
          />
        </svg>
        <Headline size={30} color={night.red} style={{...rise(action, 10)}}>
          {labels.action}
        </Headline>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 7 */

export type GuardStep = {label: string; atMs: number | null; detail?: string; detailAtMs?: number | null};

export const GuardScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  steps: GuardStep[];
  shieldAtMs: number | null;
  labels: {card: string; shield: string};
}> = ({atMs, untilMs, steps, shieldAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const shield = useOn(shieldAtMs, 520);
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null | undefined) =>
    at === null || at === undefined
      ? 0
      : interpolate(ms, [at, at + 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>

      <div style={{display: 'flex', gap: 20, marginTop: 16, alignItems: 'flex-start'}}>
        <div style={{flex: 1}}>
          {steps.map((step, i) => {
            const stepOn = on(step.atMs);
            const detailOn = on(step.detailAtMs);
            return (
              <div key={step.label}>
                {i > 0 ? (
                  <svg width={26} height={26} viewBox="0 0 26 26" style={{marginLeft: 22}}>
                    <line x1={13} y1={0} x2={13} y2={18 * stepOn} stroke={night.mint} strokeWidth={3} strokeLinecap="round" />
                    <path
                      d="M7 16 L13 24 L19 16"
                      fill="none"
                      stroke={night.mint}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={stepOn > 0.75 ? 1 : 0}
                    />
                  </svg>
                ) : null}
                <div style={{...rise(stepOn, 10)}}>
                  <Glass accent={night.mint} style={{padding: '12px 18px'}}>
                    <Headline size={26} color={night.mint}>
                      {step.label}
                    </Headline>
                    {/* reserved so the column never jumps when a detail lands */}
                    {step.detail ? (
                      <div style={{minHeight: 26, marginTop: 4, ...rise(detailOn, 6)}}>
                        <Caption style={{fontSize: 17, letterSpacing: 0.8}}>{step.detail}</Caption>
                      </div>
                    ) : null}
                  </Glass>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{flex: '0 0 250px', textAlign: 'center', paddingTop: 24, opacity: shield}}>
          <svg width={128} height={140} viewBox="0 0 128 140">
            <path
              d="M64 8 L116 30 V74 C116 106 92 124 64 132 C36 124 12 106 12 74 V30 Z"
              fill="rgba(63,224,168,0.14)"
              stroke={night.mint}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <path
              d="M42 70 L58 86 L88 52"
              fill="none"
              stroke={night.mint}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={90}
              strokeDashoffset={90 * (1 - shield)}
            />
          </svg>
          <div style={{marginTop: 4}}>
            <Caption style={{fontSize: 18, letterSpacing: 1.2, color: night.mint, lineHeight: 1.25}}>
              {labels.shield}
            </Caption>
          </div>
        </div>
      </div>
    </div>
  );
};


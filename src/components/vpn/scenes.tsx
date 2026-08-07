import React from 'react';
import {interpolate} from 'remotion';
import {night} from '../vibe/theme';
import {manrope, unbounded} from '../../theme/fonts';
import {enterStyle, useEnter, useExit, useMs} from '../vibe/primitives';
import {Caption, Glass, NightChip, StrikeText} from './glass';

/** Progress 0..1 of an element that appears at `atMs`. */
const useOn = (atMs: number | null, durationMs = 380) => {
  const ms = useMs();
  if (atMs === null) return 0;
  return interpolate(ms, [atMs, atMs + durationMs], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/* ------------------------------------------------------------------ chapter 1 */

/**
 * Abstract Europe: a cluster of soft shapes, not a real map. A dashed VPN
 * tunnel arcs in from outside the region.
 */
export const EuropeMap: React.FC<{atMs: number | null; untilMs: number | null}> = ({atMs, untilMs}) => {
  const enter = useEnter(atMs, {durationMs: 520});
  const exit = useExit(untilMs, 340);
  const ms = useMs();
  const dash = atMs === null ? 0 : ((ms - atMs) / 60) % 24;

  return (
    <div style={{position: 'absolute', left: 96, top: 616, width: 380, height: 300, ...enterStyle(enter, exit)}}>
      <svg width={380} height={300} viewBox="0 0 380 300">
        <g fill="rgba(255,255,255,0.14)" stroke={night.line} strokeWidth={2}>
          <path d="M104 58 L164 44 L206 66 L188 104 L128 112 L98 88 Z" />
          <path d="M206 66 L268 58 L296 96 L262 130 L200 122 L188 104 Z" />
          <path d="M128 112 L188 104 L200 122 L192 168 L136 176 L112 142 Z" />
          <path d="M192 168 L262 130 L288 162 L266 210 L206 214 L176 190 Z" />
          <path d="M136 176 L176 190 L166 234 L114 232 L104 196 Z" />
        </g>
        {/* the age gate that sits inside the region */}
        <g>
          <rect x={214} y={152} width={54} height={54} rx={12} fill="rgba(255,107,90,0.20)" stroke={night.red} strokeWidth={2.5} />
          <text
            x={241}
            y={186}
            textAnchor="middle"
            style={{fontFamily: unbounded, fontWeight: 800, fontSize: 22, fill: night.red}}
          >
            18+
          </text>
        </g>
        {/* VPN tunnel arriving from outside */}
        <path
          d="M12 268 C 90 250, 118 214, 190 196"
          fill="none"
          stroke={night.yellow}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeDasharray="14 10"
          strokeDashoffset={-dash}
        />
        <circle cx={12} cy={268} r={9} fill={night.yellow} />
        <text
          x={26}
          y={294}
          style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, fill: night.yellow, letterSpacing: 1}}
        >
          VPN
        </text>
      </svg>
    </div>
  );
};

export const LoopholeQuote: React.FC<{label: string; atMs: number | null; untilMs: number | null}> = ({
  label,
  atMs,
  untilMs,
}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: 508, top: 640, width: 470, ...enterStyle(enter, exit)}}>
      <Glass accent={night.red}>
        <Caption style={{color: night.red, fontSize: 19, letterSpacing: 2}}>ЗАГОЛОВОК В ЛЕНТЕ</Caption>
        <div
          style={{
            marginTop: 12,
            fontFamily: unbounded,
            fontWeight: 700,
            fontSize: 32,
            lineHeight: 1.15,
            color: night.text,
            textShadow: night.shadow,
          }}
        >
          {label}
        </div>
      </Glass>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 2 */

export const DocumentCard: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  subAtMs: number | null;
  quoteAtMs: number | null;
  says1AtMs: number | null;
  says2AtMs: number | null;
  takeawayAtMs: number | null;
  labels: {sub: string; quote: string; says1: string; says2: string; takeaway: string};
}> = ({atMs, untilMs, subAtMs, quoteAtMs, says1AtMs, says2AtMs, takeawayAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 20});
  const exit = useExit(untilMs, 320);
  const sub = useOn(subAtMs);
  const quote = useOn(quoteAtMs);
  const says1 = useOn(says1AtMs);
  const says2 = useOn(says2AtMs);
  const takeaway = useOn(takeawayAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  const row = (text: string, on: number, color: string) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: on,
        transform: `translateY(${(1 - on) * 10}px)`,
        fontFamily: unbounded,
        fontWeight: 700,
        fontSize: 27,
        color,
        textShadow: night.shadow,
      }}
    >
      <span style={{color: night.textFaint, fontSize: 20}}>→</span>
      {text}
    </div>
  );

  return (
    <div style={{position: 'absolute', left: 90, top: 616, width: 900, ...enterStyle(enter, exit)}}>
      <Glass strong>
        <Caption style={{fontSize: 19, letterSpacing: 2.4}}>ЧТО ЭТО ЗА ДОКУМЕНТ</Caption>
        <div
          style={{
            marginTop: 10,
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 38,
            color: night.mint,
            opacity: sub,
            textShadow: night.shadow,
          }}
        >
          {labels.sub}
        </div>

        <div style={{height: 2, background: 'rgba(255,255,255,0.14)', margin: '20px 0 18px', opacity: quote}} />
        <Caption style={{opacity: quote, fontSize: 19, letterSpacing: 2}}>{labels.quote}</Caption>

        <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14}}>
          {row(labels.says1, says1, night.text)}
          {row(labels.says2, says2, night.text)}
        </div>

        <div style={{marginTop: 22, opacity: takeaway, transform: `translateY(${(1 - takeaway) * 12}px)`}}>
          <NightChip label={labels.takeaway} tone="mint" size={26} />
        </div>
      </Glass>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 3 */

export const AgeAnswerCard: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  answerAtMs: number | null;
  crossed: {label: string; atMs: number | null}[];
  takeawayAtMs: number | null;
  takeaway: string;
}> = ({atMs, untilMs, answerAtMs, crossed, takeawayAtMs, takeaway}) => {
  const ms = useMs();
  const enter = useEnter(atMs, {durationMs: 420, rise: 20});
  const exit = useExit(untilMs, 320);
  const answer = useOn(answerAtMs, 440);
  const takeawayOn = useOn(takeawayAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: 90, top: 616, width: 900, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 22, alignItems: 'stretch'}}>
        <Glass accent={night.mint} style={{flex: '0 0 400px'}}>
          <Caption style={{fontSize: 19, letterSpacing: 2.4}}>САЙТ ПОЛУЧАЕТ</Caption>
          <div
            style={{
              marginTop: 16,
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 62,
              lineHeight: 1,
              color: night.mint,
              opacity: answer,
              transform: `scale(${0.9 + 0.1 * answer})`,
              transformOrigin: 'left center',
              textShadow: night.shadow,
            }}
          >
            18+ = ДА
          </div>
          <Caption style={{marginTop: 14, fontSize: 20}}>и больше ничего</Caption>
        </Glass>

        <Glass style={{flex: 1}}>
          <Caption style={{fontSize: 19, letterSpacing: 2.4}}>САЙТ НЕ ПОЛУЧАЕТ</Caption>
          <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18}}>
            {crossed.map((item) => {
              const progress = item.atMs === null
                ? 0
                : interpolate(ms, [item.atMs, item.atMs + 420], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
              return (
                <StrikeText
                  key={item.label}
                  label={item.label}
                  progress={progress}
                  fontSize={30}
                  style={{opacity: item.atMs === null ? 0.2 : 0.25 + 0.75 * Math.min(1, progress * 3)}}
                />
              );
            })}
          </div>
        </Glass>
      </div>

      <div style={{marginTop: 20, opacity: takeawayOn, transform: `translateY(${(1 - takeawayOn) * 12}px)`}}>
        <NightChip label={takeaway} tone="mint" size={25} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 4 */

/** The turnstile the VPN route walks around. */
const Turnstile: React.FC<{dimmed: number}> = ({dimmed}) => (
  <svg width={120} height={150} viewBox="0 0 120 150" style={{opacity: 1 - dimmed * 0.55}}>
    <rect x={6} y={26} width={30} height={112} rx={8} fill="rgba(255,255,255,0.10)" stroke={night.line} strokeWidth={2} />
    <rect x={84} y={26} width={30} height={112} rx={8} fill="rgba(255,255,255,0.10)" stroke={night.line} strokeWidth={2} />
    <g stroke={night.red} strokeWidth={5} strokeLinecap="round">
      <line x1={36} y1={70} x2={84} y2={70} />
      <line x1={36} y1={96} x2={84} y2={96} />
    </g>
    <text
      x={60}
      y={18}
      textAnchor="middle"
      style={{fontFamily: manrope, fontWeight: 800, fontSize: 17, fill: night.red, letterSpacing: 1}}
    >
      18+
    </text>
  </svg>
);

export const BypassChain: React.FC<{nodes: {label: string; atMs: number | null; tone?: string}[]; untilMs: number | null}> = ({
  nodes,
  untilMs,
}) => {
  const ms = useMs();
  const exit = useExit(untilMs, 320);
  const firstAt = nodes[0]?.atMs ?? null;
  const lastAt = nodes[nodes.length - 1]?.atMs ?? null;
  const chainIn = useOn(firstAt, 400);
  const bypassed = useOn(lastAt, 500);
  if (chainIn * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: 90, top: 608, width: 900, opacity: exit}}>
      <div style={{display: 'flex', gap: 26, alignItems: 'flex-start'}}>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10}}>
          {nodes.map((node, i) => {
            const on = node.atMs === null
              ? 0
              : interpolate(ms, [node.atMs, node.atMs + 420], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
            const accent = node.tone === 'danger' ? night.red : i === 1 ? night.yellow : night.line;
            return (
              <React.Fragment key={node.label}>
                {i > 0 ? (
                  <div
                    style={{
                      width: 3,
                      height: 22,
                      marginLeft: 26,
                      borderRadius: 2,
                      background: night.line,
                      opacity: on,
                    }}
                  />
                ) : null}
                <Glass
                  accent={accent === night.line ? undefined : accent}
                  style={{
                    opacity: on,
                    transform: `translateY(${(1 - on) * 14}px)`,
                    padding: '14px 20px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: unbounded,
                      fontWeight: 700,
                      fontSize: 27,
                      color: node.tone === 'danger' ? night.red : night.text,
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

        <div style={{width: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40}}>
          <Turnstile dimmed={bypassed} />
          <Caption style={{marginTop: 10, textAlign: 'center', fontSize: 18, opacity: bypassed}}>
            турникет остаётся позади
          </Caption>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 5 */

export type ConflictSide = {
  title: string;
  cost: string;
  costAtMs: number | null;
  note?: string;
  noteAtMs?: number | null;
};

const ScaleSide: React.FC<{side: ConflictSide; accent: string}> = ({side, accent}) => {
  const costOn = useOn(side.costAtMs, 400);
  const noteOn = useOn(side.noteAtMs ?? null, 400);

  return (
    <Glass accent={accent} style={{flex: 1}}>
      <div
        style={{
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 32,
          lineHeight: 1.1,
          color: accent,
          textShadow: night.shadow,
        }}
      >
        {side.title}
      </div>
      <div style={{height: 2, background: 'rgba(255,255,255,0.14)', margin: '16px 0 14px'}} />
      <Caption style={{fontSize: 18, letterSpacing: 2}}>ЦЕНА</Caption>
      <div
        style={{
          marginTop: 8,
          fontFamily: unbounded,
          fontWeight: 700,
          fontSize: 26,
          lineHeight: 1.15,
          color: night.red,
          opacity: costOn,
          transform: `translateY(${(1 - costOn) * 10}px)`,
          textShadow: night.shadow,
        }}
      >
        {side.cost}
      </div>
      {side.note ? <Caption style={{marginTop: 10, fontSize: 19, opacity: noteOn}}>{side.note}</Caption> : null}
    </Glass>
  );
};

export const ConflictScale: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  sides: [ConflictSide, ConflictSide];
  panicChip: {label: string; atMs: number | null} | null;
}> = ({atMs, untilMs, sides, panicChip}) => {
  const enter = useEnter(atMs, {durationMs: 440, rise: 20});
  const exit = useExit(untilMs, 320);
  const chip = useOn(panicChip?.atMs ?? null, 420);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: 90, top: 616, width: 900, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 18, alignItems: 'stretch'}}>
        <ScaleSide side={sides[0]} accent={night.mint} />
        <div
          style={{
            alignSelf: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 26,
            color: night.textSoft,
            textShadow: night.shadow,
          }}
        >
          VS
        </div>
        <ScaleSide side={sides[1]} accent={night.yellow} />
      </div>

      {panicChip ? (
        <div style={{marginTop: 20, opacity: chip, transform: `translateY(${(1 - chip) * 12}px)`}}>
          <NightChip label={panicChip.label} tone="warning" size={25} />
        </div>
      ) : null}
    </div>
  );
};

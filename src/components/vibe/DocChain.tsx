import React from 'react';
import {interpolate} from 'remotion';
import {vibe} from './theme';
import {unbounded} from '../../theme/fonts';
import {ArrowRight, enterStyle, useEnter, useExit, useMs} from './primitives';

const BOXES = [
  {label: 'ИНСТРУКЦИЯ', width: 186},
  {label: 'АГЕНТ', width: 132},
  {label: 'КОД', width: 104},
  {label: 'ТЕСТ', width: 112},
  {label: '«ВСЁ ХОРОШО»', width: 206},
];
const GAP = 26;
const TOTAL = BOXES.reduce((sum, box) => sum + box.width, 0) + GAP * (BOXES.length - 1);
const LEFT = 90 + Math.round((900 - TOTAL) / 2);

const centerOf = (index: number) => {
  let x = 0;
  for (let i = 0; i < index; i++) x += BOXES[i].width + GAP;
  return x + BOXES[index].width / 2;
};

const AGENT_INDEX = 1;
const TEST_INDEX = 3;

/**
 * Chapter 4: the chain that *looks* like control, plus the arrow that closes it
 * back onto the agent — the middle-of-the-reel twist.
 */
export const DocChain: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  loopAtMs: number | null;
  /** one timestamp per box, so the chain builds in step with the narration */
  stepMs: (number | null)[];
}> = ({atMs, untilMs, loopAtMs, stepMs}) => {
  const ms = useMs();
  const enter = useEnter(atMs, {durationMs: 400});
  const exit = useExit(untilMs, 320);

  const loop = loopAtMs === null
    ? 0
    : interpolate(ms, [loopAtMs, loopAtMs + 700], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const agentX = centerOf(AGENT_INDEX);
  const testX = centerOf(TEST_INDEX);
  const loopColor = vibe.danger;

  return (
    <div style={{position: 'absolute', left: LEFT, top: 748, width: TOTAL, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', alignItems: 'center'}}>
        {BOXES.map((box, i) => {
          const at = stepMs[i] ?? (atMs ?? 0) + i * 220;
          const on = interpolate(ms, [at, at + 320], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const isAgent = i === AGENT_INDEX;
          const highlighted = isAgent && loop > 0.5;
          return (
            <React.Fragment key={box.label}>
              {i > 0 ? (
                <div style={{width: GAP, display: 'flex', justifyContent: 'center'}}>
                  <ArrowRight width={GAP - 2} progress={on} color={vibe.line} />
                </div>
              ) : null}
              <div
                style={{
                  width: box.width,
                  boxSizing: 'border-box',
                  opacity: 0.14 + 0.86 * on,
                  padding: '16px 8px',
                  borderRadius: 14,
                  textAlign: 'center',
                  background: vibe.paper,
                  border: `2.5px solid ${highlighted ? loopColor : vibe.line}`,
                  color: highlighted ? loopColor : vibe.ink,
                  fontFamily: unbounded,
                  fontWeight: 700,
                  fontSize: 22,
                  whiteSpace: 'nowrap',
                }}
              >
                {box.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* The arrow that turns the pipeline into a closed loop. */}
      <svg width={TOTAL} height={80} style={{display: 'block', marginTop: 2, overflow: 'visible'}}>
        <path
          d={`M ${testX} 4 V 62 H ${agentX} V 12`}
          fill="none"
          stroke={loopColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - loop}
        />
        <path
          d={`M ${agentX - 8} 20 L ${agentX} 8 L ${agentX + 8} 20`}
          fill="none"
          stroke={loopColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={loop > 0.92 ? 1 : 0}
        />
      </svg>
    </div>
  );
};

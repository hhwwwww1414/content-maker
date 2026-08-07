import React from 'react';
import {interpolate} from 'remotion';
import {vibe} from './theme';
import {manrope, unbounded} from '../../theme/fonts';
import {ArrowRight, enterStyle, useEnter, useExit, useMs} from './primitives';

/** Chapter 3 setup beat: план → сотни строк → тесты зелёные. */
export const AgentPipeline: React.FC<{atMs: number | null; untilMs: number | null; steps: number[]}> = ({
  atMs,
  untilMs,
  steps,
}) => {
  const enter = useEnter(atMs, {durationMs: 380});
  const exit = useExit(untilMs, 300);
  const ms = useMs();
  const labels = ['ПЛАН', 'СОТНИ СТРОК', 'ТЕСТЫ ✓'];

  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 700,
        width: 580,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        ...enterStyle(enter, exit),
      }}
    >
      {labels.map((label, i) => {
        const at = steps[i] ?? atMs ?? 0;
        const on = interpolate(ms, [at, at + 300], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const isTest = i === labels.length - 1;
        return (
          <React.Fragment key={label}>
            {i > 0 ? <ArrowRight width={30} progress={on} color={vibe.line} /> : null}
            <div
              style={{
                opacity: 0.25 + 0.75 * on,
                padding: '14px 18px',
                borderRadius: 14,
                background: vibe.paper,
                border: `2.5px solid ${isTest && on > 0.6 ? 'rgba(18,185,129,0.5)' : vibe.line}`,
                color: isTest && on > 0.6 ? '#0A7A55' : vibe.ink,
                fontFamily: unbounded,
                fontWeight: 700,
                fontSize: 24,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** The open loop: a big "3" that promises three reveals. */
export const OpenLoopCounter: React.FC<{atMs: number | null; untilMs: number | null; revealed: number}> = ({
  atMs,
  untilMs,
  revealed,
}) => {
  const enter = useEnter(atMs, {durationMs: 420, pop: true});
  const exit = useExit(untilMs, 320);

  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 596,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        ...enterStyle(enter, exit),
      }}
    >
      <div
        style={{
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 96,
          lineHeight: 0.9,
          color: vibe.danger,
          letterSpacing: -2,
        }}
      >
        3
      </div>
      <div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: vibe.ink, lineHeight: 1.1}}>
          СЛЕПЫЕ ЗОНЫ
        </div>
        <div style={{display: 'flex', gap: 8, marginTop: 12}}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 34,
                height: 6,
                borderRadius: 3,
                background: i < revealed ? vibe.danger : vibe.inkFaint,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const BlindCard: React.FC<{
  index: number;
  label: string;
  atMs: number | null;
  untilMs: number | null;
}> = ({index, label, atMs, untilMs}) => {
  const enter = useEnter(atMs, {durationMs: 400, rise: 26});
  const exit = useExit(untilMs, 300);

  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        top: 726 + index * 116,
        width: 600,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '20px 26px',
        borderRadius: 20,
        background: vibe.paper,
        border: `2.5px solid ${vibe.line}`,
        borderLeft: `10px solid ${vibe.danger}`,
        ...enterStyle(enter, exit),
      }}
    >
      <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, color: vibe.danger, minWidth: 26}}>
        {index + 1}
      </div>
      <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 32, color: vibe.ink, lineHeight: 1.1}}>
        {label}
      </div>
    </div>
  );
};

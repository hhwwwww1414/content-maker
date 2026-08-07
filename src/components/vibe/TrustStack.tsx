import React from 'react';
import {interpolate} from 'remotion';
import {vibe} from './theme';
import {manrope, unbounded} from '../../theme/fonts';
import {useMs} from './primitives';

const NODE_HEIGHT = 76;
const ARROW_HEIGHT = 44;
const TOP = 628;
const LEFT = 90;
const WIDTH = 600;

export type TrustNode = {
  label: string;
  sublabel?: string;
  /** the node itself */
  atMs: number | null;
  /** the sublabel lands on its own line of narration, a beat after the node */
  sublabelAtMs?: number | null;
  linkLabel?: string;
};

/**
 * Chapter 5: intent -> files -> tests -> blast radius.
 * Nodes are `persistent` — once a node is up it stays up for the rest of the reel.
 */
export const TrustStack: React.FC<{nodes: TrustNode[]}> = ({nodes}) => {
  const ms = useMs();

  return (
    <>
      {nodes.map((node, i) => {
        const at = node.atMs;
        const on = at === null
          ? 0
          : interpolate(ms, [at, at + 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const top = TOP + i * (NODE_HEIGHT + ARROW_HEIGHT);
        const isLast = i === nodes.length - 1;

        return (
          <React.Fragment key={node.label}>
            {i > 0 ? (
              <svg
                width={WIDTH}
                height={ARROW_HEIGHT}
                style={{position: 'absolute', left: LEFT, top: top - ARROW_HEIGHT, overflow: 'visible'}}
              >
                <line
                  x1={44}
                  y1={0}
                  x2={44}
                  y2={ARROW_HEIGHT - 10}
                  stroke={vibe.mint}
                  strokeWidth={3}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - on}
                />
                <path
                  d={`M 37 ${ARROW_HEIGHT - 14} L 44 ${ARROW_HEIGHT - 3} L 51 ${ARROW_HEIGHT - 14}`}
                  fill="none"
                  stroke={vibe.mint}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={on > 0.8 ? 1 : 0}
                />
                {node.linkLabel ? (
                  <text
                    x={68}
                    y={ARROW_HEIGHT / 2 + 7}
                    style={{fontFamily: manrope, fontWeight: 700, fontSize: 20, fill: '#0A7A55'}}
                    opacity={on}
                  >
                    {node.linkLabel}
                  </text>
                ) : null}
              </svg>
            ) : null}

            <div
              style={{
                position: 'absolute',
                left: LEFT,
                top,
                width: WIDTH,
                height: NODE_HEIGHT,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '0 26px',
                borderRadius: 18,
                background: vibe.paper,
                border: `2.5px solid ${isLast ? 'rgba(18,185,129,0.55)' : vibe.line}`,
                borderLeft: `10px solid ${vibe.mint}`,
                opacity: on,
                transform: `translateY(${(1 - on) * 18}px)`,
              }}
            >
              <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 32, color: vibe.ink, lineHeight: 1.05}}>
                {node.label}
              </div>
              {node.sublabel ? (
                <div
                  style={{
                    fontFamily: manrope,
                    fontWeight: 600,
                    fontSize: 20,
                    color: vibe.inkSoft,
                    marginTop: 4,
                    opacity:
                      node.sublabelAtMs == null
                        ? on
                        : interpolate(ms, [node.sublabelAtMs, node.sublabelAtMs + 340], [0, 1], {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp',
                          }),
                  }}
                >
                  {node.sublabel}
                </div>
              ) : null}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
};

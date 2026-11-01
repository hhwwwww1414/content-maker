import React from 'react';
import {bodyFont} from './fonts';
import {BACK, moving, prog, QaText, useScene} from './scene';
import type {Cue} from './types';

type FlowNode = {id: string; label: string; sub?: string; x: number; y: number; w?: number; h?: number; cue?: Cue; tone?: 'accent' | 'accent2' | 'danger' | 'plain'; strikeCue?: Cue; hotCue?: Cue};
type FlowEdge = {from: string; to: string; cue?: Cue; tone?: 'accent' | 'accent2' | 'danger' | 'muted'; packets?: number; cutCue?: Cue};
export type FlowProps = {nodes: FlowNode[]; edges: FlowEdge[]};

const NODE = {w: 300, h: 130};
const edgePoint = (a: {cx: number; cy: number; w: number; h: number}, tx: number, ty: number) => {
  const dx = tx - a.cx, dy = ty - a.cy;
  const k = Math.min(Math.abs(dx) ? (a.w / 2 + 10) / Math.abs(dx) : Infinity, Math.abs(dy) ? (a.h / 2 + 10) / Math.abs(dy) : Infinity);
  return {x: a.cx + dx * k, y: a.cy + dy * k};
};

/** Node-and-edge schema. Edges draw on a cue, then carry packets, so the mechanism visibly runs. */
export const Flow: React.FC<FlowProps> = ({nodes, edges}) => {
  const {frame, at, theme} = useScene();
  const tones = {accent: theme.accent, accent2: theme.accent2, danger: theme.danger, plain: theme.line, muted: theme.muted};
  const byId = Object.fromEntries(nodes.map((n) => {
    const w = n.w ?? NODE.w, h = n.h ?? NODE.h;
    return [n.id, {cx: n.x + w / 2, cy: n.y + h / 2, w, h}];
  }));
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>
        {edges.map((edge, i) => {
          const a = byId[edge.from], b = byId[edge.to];
          const p1 = edgePoint(a, b.cx, b.cy), p2 = edgePoint(b, a.cx, a.cy);
          const start = at(edge.cue);
          const draw = prog(frame, start, 16);
          const cut = edge.cutCue === undefined ? 0 : prog(frame, at(edge.cutCue), 8);
          const color = cut > 0.5 ? theme.danger : tones[edge.tone ?? 'accent'];
          const packets = cut > 0.5 ? 0 : edge.packets ?? 2;
          const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
          return (
            <g key={i}>
              <path d={`M${p1.x} ${p1.y}L${p2.x} ${p2.y}`} stroke={color} strokeWidth={6} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={1 - cut * 0.45}/>
              {draw >= 1 && Array.from({length: packets}, (_, k) => {
                const t = ((frame - start) / 34 + k / packets) % 1;
                return <circle key={k} cx={p1.x + (p2.x - p1.x) * t} cy={p1.y + (p2.y - p1.y) * t} r={10} fill={color} opacity={Math.min(1, t * 6, (1 - t) * 6)}/>;
              })}
              {cut > 0 && <path d={`M${midX - 34} ${midY - 34}L${midX + 34} ${midY + 34}M${midX + 34} ${midY - 34}L${midX - 34} ${midY + 34}`} stroke={theme.danger} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - cut}/>}
            </g>
          );
        })}
      </svg>
      {nodes.map((node) => {
        const p = prog(frame, at(node.cue), 14, BACK);
        const hot = node.hotCue === undefined ? 0 : prog(frame, at(node.hotCue), 10);
        const strike = node.strikeCue === undefined ? 0 : prog(frame, at(node.strikeCue), 10);
        const w = node.w ?? NODE.w, h = node.h ?? NODE.h;
        const tone = tones[node.tone ?? 'plain'];
        return (
          <div key={node.id} data-qa-solid {...moving(p)} style={{position: 'absolute', left: node.x, top: node.y, width: w, height: h, transform: `scale(${(0.7 + 0.3 * p) * (1 + hot * 0.06)})`, opacity: Math.min(1, p * 1.4) * (1 - strike * 0.5), background: hot > 0.5 ? tone : theme.surface, border: `4px solid ${tone}`, borderRadius: theme.radius, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${hot * 60}px ${tone}`}}>
            <QaText style={{textAlign: 'center', fontFamily: bodyFont, fontWeight: 800, fontSize: 42, lineHeight: 1.1, color: hot > 0.5 ? theme.onAccent : theme.ink, padding: '0 10px', textDecoration: strike > 0.5 ? 'line-through' : undefined}}>
              {node.label}
              {node.sub && <div style={{fontSize: 30, fontWeight: 600, color: hot > 0.5 ? theme.onAccent : theme.muted}}>{node.sub}</div>}
            </QaText>
          </div>
        );
      })}
    </div>
  );
};

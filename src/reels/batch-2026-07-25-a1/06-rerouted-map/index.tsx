import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-batch06-rerouted-map.json';
import captionsJson from '../../../generated/captions-batch06-rerouted-map.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * REEL 06 — "Сеть цела".
 *
 * Camera grammar: ARCHITECTURAL / ISOMETRIC / TOP-DOWN — a flat model on a lit
 * table, shifted only along the grid axes. Motion grammar: GEOMETRIC SPATIAL
 * RECOMPOSITION — the same blocks are re-laid out, nothing melts or morphs.
 * Transitions are geometric match cuts. Ending: NO SEPARATE END CARD — the reel
 * finishes inside its own model. Mascot: background environmental cameo.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const TILE_W = 148;
const TILE_H = 76;
const ORIGIN = {x: 540, y: 596};

const iso = (gx: number, gy: number, lift = 0) => ({
  x: ORIGIN.x + (gx - gy) * (TILE_W / 2),
  y: ORIGIN.y + (gx + gy) * (TILE_H / 2) - lift,
});

const GRID = 5;

// --- blocks: same set, two lawful arrangements ------------------------------
type Block = {id: string; a: [number, number]; b: [number, number]; h: number};
const BLOCKS: Block[] = [
  {id: 'b1', a: [0, 1], b: [0, 1], h: 46},
  {id: 'b2', a: [1, 0], b: [2, 0], h: 66},
  {id: 'b3', a: [1, 3], b: [1, 2], h: 38},
  {id: 'b4', a: [2, 2], b: [3, 2], h: 54},
  {id: 'b5', a: [3, 1], b: [3, 0], h: 72},
  {id: 'b6', a: [4, 3], b: [4, 4], h: 44},
  {id: 'b7', a: [0, 4], b: [1, 4], h: 58},
  {id: 'b8', a: [4, 0], b: [4, 1], h: 40},
  {id: 'b9', a: [2, 4], b: [2, 3], h: 50},
];

const Tile: React.FC<{gx: number; gy: number; fill: string; stroke: string; opacity?: number}> = ({gx, gy, fill, stroke, opacity = 1}) => {
  const c = iso(gx, gy);
  const pts = [
    `${c.x},${c.y - TILE_H / 2}`,
    `${c.x + TILE_W / 2},${c.y}`,
    `${c.x},${c.y + TILE_H / 2}`,
    `${c.x - TILE_W / 2},${c.y}`,
  ].join(' ');
  return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={1.5} opacity={opacity} />;
};

const Prism: React.FC<{gx: number; gy: number; h: number; accent: string; lit: number}> = ({gx, gy, h, accent, lit}) => {
  const base = iso(gx, gy);
  const top = iso(gx, gy, h);
  const topPts = [
    `${top.x},${top.y - TILE_H / 2}`,
    `${top.x + TILE_W / 2},${top.y}`,
    `${top.x},${top.y + TILE_H / 2}`,
    `${top.x - TILE_W / 2},${top.y}`,
  ].join(' ');
  const leftPts = [
    `${base.x - TILE_W / 2},${base.y}`,
    `${base.x},${base.y + TILE_H / 2}`,
    `${top.x},${top.y + TILE_H / 2}`,
    `${top.x - TILE_W / 2},${top.y}`,
  ].join(' ');
  const rightPts = [
    `${base.x + TILE_W / 2},${base.y}`,
    `${base.x},${base.y + TILE_H / 2}`,
    `${top.x},${top.y + TILE_H / 2}`,
    `${top.x + TILE_W / 2},${top.y}`,
  ].join(' ');
  return (
    <g>
      <polygon points={leftPts} fill="#0F1618" stroke={`${accent}44`} strokeWidth={1.2} />
      <polygon points={rightPts} fill="#141D20" stroke={`${accent}44`} strokeWidth={1.2} />
      <polygon points={topPts} fill="#1B2528" stroke={accent} strokeWidth={1.6} opacity={0.5 + 0.5 * lit} />
    </g>
  );
};

// --- background: the lit table ----------------------------------------------
const Table: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.26 + 0.04 * Math.sin(frame / 74);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#05090A', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          left: -280,
          top: 420,
          width: 1640,
          height: 940,
          objectFit: 'cover',
          transform: 'rotate(180deg)',
          filter: 'grayscale(0.75) brightness(0.5) blur(3px)',
          opacity: pulse,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 700px 500px at 50% 44%, rgba(34,240,208,0.10), transparent 62%), radial-gradient(ellipse at 50% 46%, rgba(5,9,10,0.2), #04080A 78%)',
        }}
      />
    </AbsoluteFill>
  );
};

// --- the model ---------------------------------------------------------------
const RoutePath: React.FC<{points: [number, number][]; color: string; progress: number; width: number; dash?: string}> = ({
  points,
  color,
  progress,
  width,
  dash,
}) => {
  const pts = points.map(([gx, gy]) => iso(gx, gy, 4));
  const total = points.length - 1;
  const shown = Math.max(0, Math.min(total, progress * total));
  const drawn: string[] = [];
  for (let i = 0; i <= Math.floor(shown); i += 1) drawn.push(`${pts[i].x},${pts[i].y}`);
  const frac = shown - Math.floor(shown);
  if (frac > 0 && Math.floor(shown) + 1 <= total) {
    const a = pts[Math.floor(shown)];
    const b = pts[Math.floor(shown) + 1];
    drawn.push(`${a.x + (b.x - a.x) * frac},${a.y + (b.y - a.y) * frac}`);
  }
  if (drawn.length < 2) return null;
  return (
    <polyline
      points={drawn.join(' ')}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
    />
  );
};

const OLD_ROUTE: [number, number][] = [
  [0, 0],
  [2, 0],
  [2, 2],
  [4, 2],
  [4, 4],
];
const NEW_ROUTE: [number, number][] = [
  [0, 0],
  [0, 2],
  [2, 2],
  [2, 4],
  [4, 4],
];

const Model: React.FC = () => {
  const frame = useCurrentFrame();

  const recompose = interpolate(frame, [clock.at('w_notbroken'), clock.at('w_rewrote') + 22], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const nodeRise = clock.rise(frame, clock.at('y_march'), 26);
  const oldRoute = interpolate(frame, [clock.at('x_cable'), clock.at('x_signal')], [0, 1], CLAMP);
  const oldDies = interpolate(frame, [clock.at('x_cant') - 6, clock.at('x_cant') + 16], [1, 0.16], CLAMP);
  const mint = interpolate(frame, [clock.at('b_ghost'), clock.at('f_map')], [0, 1], {...CLAMP, easing: Easing.out(Easing.cubic)});
  const pull = clock.rise(frame, clock.at('y_points'), 24);

  const node = iso(2, 2, 40 + nodeRise * 70);

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', zIndex: LAYERS.ENVIRONMENT}}>
      {/* ground plate */}
      {Array.from({length: GRID + 1}).map((_, gx) =>
        Array.from({length: GRID + 1}).map((__, gy) => (
          <Tile key={`${gx}-${gy}`} gx={gx} gy={gy} fill="rgba(18,26,28,0.85)" stroke="rgba(120,170,170,0.14)" />
        )),
      )}

      {/* the route that used to work, now dark but physically intact */}
      <g opacity={oldDies}>
        <RoutePath points={OLD_ROUTE} color={BRAND.gray} progress={oldRoute} width={7} />
      </g>

      {/* blocks — same set, re-laid out along the grid */}
      {BLOCKS.map((b) => {
        const gx = b.a[0] + (b.b[0] - b.a[0]) * recompose;
        const gy = b.a[1] + (b.b[1] - b.a[1]) * recompose;
        return <Prism key={b.id} gx={gx} gy={gy} h={b.h} accent={BRAND.mint} lit={pull} />;
      })}

      {/* the central exchange node */}
      {nodeRise > 0.002 ? (
        <g opacity={nodeRise}>
          <line x1={node.x} y1={node.y + 40} x2={node.x} y2={node.y + 120} stroke={BRAND.mint} strokeWidth={3} opacity={0.5} />
          <polygon
            points={`${node.x},${node.y - 34} ${node.x + 62},${node.y} ${node.x},${node.y + 34} ${node.x - 62},${node.y}`}
            fill="#0D1719"
            stroke={BRAND.mint}
            strokeWidth={2.4}
          />
          <circle cx={node.x} cy={node.y} r={10 + 4 * Math.sin(frame / 14)} fill={BRAND.mint} opacity={0.85} />
        </g>
      ) : null}

      {/* our own route, drawn over the rewritten rules */}
      <RoutePath points={NEW_ROUTE} color={BRAND.mint} progress={mint} width={8} />
    </svg>
  );
};

/** Inspection plate: what the box actually reads. */
const InspectionPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('z_dpi');
  const to = clock.end('z_reads');
  const o = interpolate(frame, [from - 4, from + 16, to + 8, to + 24], [0, 1, 1, 0], CLAMP);
  if (o <= 0.002) return null;
  const rows = ['протокол', 'домен', 'поведение соединения'];
  return (
    <div
      style={{
        position: 'absolute',
        left: 300,
        top: 330,
        width: 480,
        borderRadius: 14,
        padding: '18px 22px',
        background: 'linear-gradient(180deg, rgba(13,23,25,0.96), rgba(7,13,14,0.96))',
        border: `1px solid ${BRAND.mint}55`,
        opacity: o,
        zIndex: LAYERS.TEXT,
      }}
    >
      <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 19, letterSpacing: 2.6, color: BRAND.mint, textTransform: 'uppercase'}}>
        ТСПУ · DPI
      </div>
      {rows.map((r, i) => (
        <div
          key={r}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
            // first row lands with the plate so it is never an empty box on screen
            opacity: clock.rise(frame, clock.at('z_dpi') + 10 + i * 14, 12),
          }}
        >
          <span style={{width: 10, height: 10, background: BRAND.mint, transform: 'rotate(45deg)'}} />
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 28, color: BRAND.white}}>{r}</span>
        </div>
      ))}
    </div>
  );
};

/** Architectural typography: labels sit on the plan's axes, like an экспликация. */
const PlanLabels: React.FC = () => {
  const frame = useCurrentFrame();
  const checks: {id: string; text: string}[] = [
    {id: 'x_cable', text: 'кабель'},
    {id: 'x_station', text: 'станция'},
    {id: 'x_signal', text: 'сигнал'},
  ];
  const checksOut = interpolate(frame, [clock.at('y_march') - 10, clock.at('y_march') + 8], [1, 0], CLAMP);
  const title = interpolate(
    frame,
    [clock.at('y_march'), clock.at('y_march') + 14, clock.at('z_dpi') - 10, clock.at('z_dpi')],
    [0, 1, 1, 0],
    CLAMP,
  );
  const closing = clock.rise(frame, clock.at('w_rewrote'), 18);
  return (
    <>
      <div style={{position: 'absolute', left: 128, top: 272, opacity: checksOut, zIndex: LAYERS.TEXT}}>
        {checks.map((c, i) => {
          const o = clock.rise(frame, clock.at(c.id), 12);
          return (
            <div key={c.id} style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, opacity: o}}>
              <span style={{width: 22, height: 22, border: `2px solid ${BRAND.mint}`, display: 'grid', placeItems: 'center'}}>
                <span style={{width: 10, height: 10, background: BRAND.mint}} />
              </span>
              <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 30, letterSpacing: 3, color: BRAND.white, textTransform: 'uppercase'}}>
                {c.text}
              </span>
              <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 24, color: BRAND.gray, letterSpacing: 1}}>
                {i === 2 ? '— полный' : '— в норме'}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{position: 'absolute', left: 128, top: 272, opacity: title, zIndex: LAYERS.TEXT}}>
        <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 21, letterSpacing: 3, color: BRAND.mint, textTransform: 'uppercase'}}>
          с 1 марта 2026
        </div>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 52, letterSpacing: -1.6, color: BRAND.white, marginTop: 8}}>
          магистраль —<br />единый узел
        </div>
      </div>

      <div style={{position: 'absolute', left: 128, top: 272, opacity: closing, zIndex: LAYERS.TEXT}}>
        <div style={{width: 74, height: 4, background: BRAND.mint, marginBottom: 18}} />
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 56, letterSpacing: -1.8, lineHeight: 1.04, color: BRAND.white}}>
          те же блоки<br />
          <span style={{color: BRAND.mint}}>другие правила</span>
        </div>
      </div>

      {/* axis ticks, always present, part of the drawing */}
      <div
        style={{
          position: 'absolute',
          left: 128,
          top: 1128,
          display: 'flex',
          gap: 26,
          fontFamily: manrope,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 3,
          color: 'rgba(155,168,165,0.6)',
          zIndex: LAYERS.TEXT,
        }}
      >
        <span>ПЛАН 1:1</span>
        <span>УЗЕЛ 02</span>
        <span>МАРШРУТ A→B</span>
      </div>
    </>
  );
};

/** Environmental cameo: the mascot stands at the corner of the model, in the set. */
const CornerCameo: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [clock.at('b_ghost') - 10, clock.at('b_ghost') + 22], [0, 0.55], CLAMP);
  if (o <= 0.002) return null;
  const bob = Math.sin(frame / 26) * 3;
  return (
    <Img
      src={staticFile(ASSETS.mascot)}
      style={{
        position: 'absolute',
        left: 742,
        top: 866 + bob,
        width: 168,
        height: 168,
        objectFit: 'contain',
        opacity: o,
        filter: 'drop-shadow(0 18px 34px rgba(0,0,0,0.65))',
        zIndex: LAYERS.HERO_FRONT,
      }}
    />
  );
};

export const GhostPepeBatch06ReroutedMap: React.FC = () => {
  const frame = useCurrentFrame();
  // shifts happen along the grid axes only — never a free camera move
  const step = interpolate(
    frame,
    [clock.at('y_march'), clock.at('y_march') + 22, clock.at('z_dpi'), clock.at('z_dpi') + 22, clock.at('w_notbroken'), clock.at('w_notbroken') + 22],
    [0, 1, 1, 2, 2, 0],
    {...CLAMP, easing: Easing.inOut(Easing.cubic)},
  );
  const x = -step * 26;
  const y = -step * 14;
  return (
    <LayoutRegistryProvider>
      <AbsoluteFill style={{background: '#04080A', overflow: 'hidden'}}>
        <Table />
        <AbsoluteFill style={{transform: `translate(${x}px, ${y}px)`}}>
          <Model />
          <CornerCameo />
        </AbsoluteFill>
        <InspectionPlate />
        <PlanLabels />
        <BatchCaption pages={pages} fps={clock.fps} frame="band" face="unbounded" accent={BRAND.mint} fontSize={40} />
        <Audio src={staticFile(voicePath('batch06-rerouted-map'))} volume={1} />
        <Audio src={staticFile(ASSETS.ambient)} loop volume={0.03} />
        <SafeZoneOverlay />
      </AbsoluteFill>
    </LayoutRegistryProvider>
  );
};

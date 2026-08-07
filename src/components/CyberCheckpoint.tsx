import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {WhitelistBeats} from '../compositions/whitelistSceneFrames';
import {colors} from '../theme/colors';
import {AccessDisplay, type AccessTone} from './AccessDisplay';
import {DigitalTurnstile} from './DigitalTurnstile';
import {DomainToken, TOKEN_SIZE} from './DomainToken';
import {ScannerGate} from './ScannerGate';
import {WhitelistHall} from './WhitelistHall';

const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// World geometry: the whole checkpoint lives in one 1080x1920 space that a single
// virtual camera travels through, so no scene ever cuts -- it only reframes.
const GATE_X = 470;
const GATE_TOP = 690;
const GATE_W = 380;
const GATE_H = 460;
const SCAN_X = 470;
const TOKEN_Y = 1005;
const BOARD_TOP = 560;

/** The full checkpoint world plus its camera. All choreography anchors derive from the
 * measured voiceover beats, so regenerated audio re-times every movement for free. */
export const CyberCheckpoint: React.FC<{beats: WhitelistBeats}> = ({beats}) => {
  const frame = useCurrentFrame();
  const f2 = beats.factStart;
  const f3 = beats.passStart;
  const f4 = beats.linkStart;

  // --- camera -------------------------------------------------------------
  const camFrames = [0, f2 + 4, f2 + 52, f3 + 4, f3 + 60, f4 + 4, f4 + 52];
  const camS = interpolate(frame, camFrames, [1.18, 1.18, 1.3, 1.3, 0.92, 0.92, 1.36], EASE);
  const camX = interpolate(frame, camFrames, [0, 0, -10, -10, 40, 40, 140], EASE);
  const camY = interpolate(frame, camFrames, [48, 48, 96, 96, 0, 0, -30], EASE);

  // --- shared checkpoint state ---------------------------------------------
  const approveAt = f2 + 44;
  const denyAt = f2 + 138;
  const approve2At = f3 + 46;
  const deny2At = f3 + 76;

  const rotation = interpolate(frame, [f2 + 56, f2 + 84, f3 + 49, f3 + 73], [0, 120, 120, 240], EASE);
  const denyPulse = interpolate(frame, [denyAt, denyAt + 16, denyAt + 38, f3 + 60], [0, 1, 0.3, 0], EASE);
  const hallGlow = interpolate(frame, [f2 + 56, f2 + 94, f2 + 124, approve2At, f3 + 80, f4 + 20], [0.35, 0.8, 0.55, 0.55, 0.85, 0.6], EASE);
  const lightSweepX = 85 + Math.sin(frame / 85) * 135;

  const board: {label: string; tone: AccessTone; start: number} =
    frame < f2 + 6
      ? {label: 'ОЖИДАНИЕ', tone: 'neutral', start: 20}
      : frame < approveAt
        ? {label: 'ПРОВЕРКА СПИСКА', tone: 'neutral', start: f2 + 6}
        : frame < f2 + 80
          ? {label: 'ДОПУСК', tone: 'approve', start: approveAt}
          : frame < denyAt
            ? {label: 'ПРОВЕРКА СПИСКА', tone: 'neutral', start: f2 + 80}
            : frame < approve2At
              ? {label: 'НЕ В СПИСКЕ', tone: 'deny', start: denyAt}
              : frame < deny2At
                ? {label: 'ДОПУСК', tone: 'approve', start: approve2At}
                : {label: 'НЕ В СПИСКЕ', tone: 'deny', start: deny2At};
  const boardDecode = interpolate(frame, [board.start, board.start + 14], [0, 1], EASE);
  const boardOpacity = interpolate(frame, [f2 - 10, f2 + 16, f4, f4 + 34], [0.6, 1, 1, 0.35], EASE);

  const scanIntensity = interpolate(frame, [36, 44, 74, 84, f2 + 104, f2 + 112, f2 + 136, f2 + 146], [0, 1, 1, 0.12, 0.12, 1, 1, 0.1], EASE);
  const beam1 = interpolate(frame, [40, 78], [0, 1], EASE);
  const beam2 = interpolate(frame, [f2 + 108, f2 + 140], [0, 1], EASE);
  const beamProgress = frame < f2 + 100 ? beam1 : beam2;

  // --- tokens ---------------------------------------------------------------
  const t1 = {
    x: interpolate(frame, [18, 54, f2 + 56, f2 + 94], [200, SCAN_X, SCAN_X, 640], EASE),
    y: interpolate(frame, [f2 + 56, f2 + 94], [TOKEN_Y, 928], EASE),
    scale: interpolate(frame, [f2 + 56, f2 + 94], [1, 0.72], EASE),
    opacity: interpolate(frame, [f2 + 62, f2 + 94], [1, 0], EASE),
    glow: interpolate(frame, [36, 46, 80, 92], [0.25, 0.85, 0.85, 0.6], EASE),
    stamp: interpolate(frame, [approveAt, approveAt + 20], [0, 1], EASE),
  };

  const t2 = {
    x: interpolate(frame, [30, 70, f2 + 66, f2 + 102, f3 + 13, f3 + 93], [70, 90, 90, SCAN_X, SCAN_X, 150], EASE),
    y: interpolate(frame, [f3 + 13, f3 + 93], [TOKEN_Y, 1056], EASE),
    scale: interpolate(frame, [f3 + 13, f3 + 93], [1, 1.04], EASE),
    glow: interpolate(frame, [f2 + 106, f2 + 118, denyAt, denyAt + 20], [0.25, 0.7, 0.7, 0.12], EASE),
    redRim: interpolate(frame, [denyAt, denyAt + 14, f3 + 40, f3 + 90], [0, 0.9, 0.6, 0.22], EASE),
    dim: interpolate(frame, [f3 + 20, f3 + 80], [0, 0.5], EASE),
    stamp: interpolate(frame, [denyAt, denyAt + 18, f3 + 34, f3 + 72], [0, 1, 1, 0], EASE),
  };

  const t3 = {
    x: interpolate(frame, [30, 70, f2 + 76, f2 + 112, f3 + 9, f3 + 45, f3 + 49, f3 + 73], [-50, -30, -30, 90, 90, SCAN_X, SCAN_X, 640], EASE),
    y: interpolate(frame, [f3 + 49, f3 + 73], [TOKEN_Y, 928], EASE),
    scale: interpolate(frame, [f3 + 49, f3 + 73], [1, 0.72], EASE),
    opacity: interpolate(frame, [f3 + 55, f3 + 73], [1, 0], EASE),
    glow: interpolate(frame, [f3 + 36, f3 + 48], [0.25, 0.8], EASE),
  };

  const t4Pulse = interpolate(frame, [f4, f4 + 24], [0, 1], EASE);
  const t4 = {
    x: interpolate(frame, [30, 70, f2 + 76, f2 + 112, f3 + 25, f3 + 79], [-170, -150, -150, -30, -30, 330], EASE),
    glow: 0.25 + t4Pulse * (0.32 + 0.18 * Math.sin((frame - f4) / 11)),
  };

  const signalIn = interpolate(frame, [f4, f4 + 22], [0, 1], EASE);

  const token = (
    key: string,
    t: {x: number; y?: number; scale?: number; opacity?: number; glow: number; redRim?: number; dim?: number},
    label: string,
    zIndex: number,
    stamp?: 'approve' | 'deny' | null,
    stampProgress?: number,
  ) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: t.x - TOKEN_SIZE / 2,
        top: (t.y ?? TOKEN_Y) - TOKEN_SIZE / 2,
        scale: `${t.scale ?? 1}`,
        opacity: t.opacity ?? 1,
        zIndex,
      }}
    >
      <DomainToken label={label} glow={t.glow} redRim={t.redRim ?? 0} dim={t.dim ?? 0} stamp={stamp ?? null} stampProgress={stampProgress ?? 0} />
    </div>
  );

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${camX}px, ${camY}px) scale(${camS})`,
          transformOrigin: '470px 920px',
        }}
      >
        {/* hall behind the gate, counter-moving slightly for depth parallax */}
        <div
          style={{
            position: 'absolute',
            left: GATE_X - 165,
            top: 645,
            zIndex: 1,
            transform: `translate(${-camX * 0.18}px, ${-camY * 0.18}px)`,
          }}
        >
          <WhitelistHall glow={hallGlow} frame={frame} />
        </div>

        {/* floor */}
        <div
          style={{
            position: 'absolute',
            left: GATE_X - 310,
            top: 1128,
            width: 620,
            height: 96,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(34,240,208,.14), rgba(2,3,4,0) 70%)',
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 60,
            right: 60,
            top: 1152,
            height: 2,
            background: 'linear-gradient(90deg, rgba(140,255,233,0), rgba(140,255,233,.18) 30%, rgba(140,255,233,.18) 70%, rgba(140,255,233,0))',
            zIndex: 1,
          }}
        />

        {/* access board */}
        <div style={{position: 'absolute', left: GATE_X - GATE_W / 2, top: BOARD_TOP, zIndex: 3, opacity: boardOpacity}}>
          <AccessDisplay label={board.label} tone={board.tone} decode={boardDecode} frame={frame} width={GATE_W} />
        </div>

        {/* turnstile */}
        <div style={{position: 'absolute', left: GATE_X - GATE_W / 2, top: GATE_TOP, zIndex: 2}}>
          <DigitalTurnstile width={GATE_W} height={GATE_H} rotationDeg={rotation} denyPulse={denyPulse} lightSweepX={lightSweepX} />
        </div>

        {/* signal indicator above the closed door (final contradiction beat) */}
        <div
          style={{
            position: 'absolute',
            left: GATE_X - 34,
            top: 716,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
            zIndex: 4,
            opacity: signalIn,
          }}
        >
          {[10, 16, 22, 28].map((h, i) => (
            <div
              key={h}
              style={{
                width: 10,
                height: h,
                borderRadius: 3,
                background: colors.mint,
                opacity: i === 3 ? 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(frame / 13)) : 0.85,
                boxShadow: '0 0 10px rgba(34,240,208,.6)',
              }}
            />
          ))}
        </div>

        {/* scanner rig in front of the doorway */}
        <div style={{position: 'absolute', left: SCAN_X - 105, top: TOKEN_Y - 125, zIndex: 4}}>
          <ScannerGate intensity={scanIntensity} beamProgress={beamProgress} />
        </div>

        {/* domain tokens */}
        {token('t1', t1, 'SITE 01', 6, 'approve', t1.stamp)}
        {token('t2', t2, 'VIDEO 02', 7, 'deny', t2.stamp)}
        {token('t3', t3, 'CHAT 03', 6)}
        {token('t4', t4, 'CLOUD 04', 5)}

        {/* soft foreground glass shard for near-plane parallax */}
        <div
          style={{
            position: 'absolute',
            left: 96,
            top: 1296,
            width: 210,
            height: 130,
            borderRadius: 30,
            background: 'linear-gradient(150deg, rgba(140,255,233,.12), rgba(21,27,29,.4))',
            border: '1px solid rgba(140,255,233,.16)',
            filter: 'blur(5px)',
            opacity: 0.45,
            zIndex: 8,
            transform: `translate(${camX * 0.25}px, ${camY * 0.25}px)`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

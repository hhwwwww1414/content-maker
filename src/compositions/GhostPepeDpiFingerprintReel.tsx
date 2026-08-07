import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-dpi-fingerprint.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, Cross, Check} from '../components/vpn-explainer/parts';

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const AMBER = '#FFC24B';
const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const seg = (id: string) => timeline.segments.find((s) => s.id === id);
const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);
const end = (id: string) => toFrame(seg(id)?.endMs ?? 0);
const total = timeline.durationInFrames;

const appear = (frame: number, from: number, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out});
const sceneOpacity = (frame: number, firstId: string, lastId: string, lead = 10, tail = 12) =>
  interpolate(frame, [start(firstId) - lead, start(firstId) - lead + 12, end(lastId) + tail - 12, end(lastId) + tail], [0, 1, 1, 0], CLAMP);

const Backdrop: React.FC<{tint: string}> = ({tint}) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, total], [0, 40], CLAMP);
  return (
    <>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 38%, ${tint}22, rgba(6,11,12,0.6) 46%, #05090A 78%)`}} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          backgroundPosition: `0 ${drift}px`,
          maskImage: 'radial-gradient(ellipse at 50% 44%, #000 40%, transparent 78%)',
          opacity: 0.5,
        }}
      />
    </>
  );
};

/** A traffic packet chip with a protocol label and a little signature pattern. */
const Packet: React.FC<{label: string; color: string; x: number; y: number; masked?: boolean; opacity?: number; scale?: number}> = ({label, color, x, y, masked, opacity = 1, scale = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity, transform: `scale(${scale})`}}>
    {masked ? <div style={{position: 'absolute', inset: -10, borderRadius: 22, border: `2px solid ${C.vpn}`, boxShadow: `0 0 22px ${C.vpn}66`}} /> : null}
    <div style={{...card(color), padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16}}>
      <div style={{display: 'flex', gap: 3}}>
        {[0, 1, 2, 3].map((i) => <span key={i} style={{width: 5, height: 5, borderRadius: 3, background: color}} />)}
      </div>
      <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, color}}>{label}</span>
    </div>
  </div>
);

const GATE_X = 600;
/** The DPI / ТСПУ gate with a moving scan line. */
const Gate: React.FC<{alert: number}> = ({alert}) => {
  const frame = useCurrentFrame();
  const scanY = 680 + ((frame * 6) % 340);
  const color = alert > 0.5 ? C.danger : AMBER;
  return (
    <div style={{position: 'absolute', left: GATE_X - 6, top: 660, width: 12, height: 380, zIndex: 22}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 8, background: `linear-gradient(180deg, ${color}, ${color}66)`, boxShadow: `0 0 ${20 + alert * 30}px ${color}`}} />
      <div style={{position: 'absolute', left: -30, top: scanY - 660, width: 72, height: 3, background: color, boxShadow: `0 0 16px ${color}`, opacity: 0.9}} />
      <div style={{position: 'absolute', left: -34, top: -50, width: 80, textAlign: 'center', fontFamily: unbounded, fontWeight: 800, fontSize: 24, letterSpacing: 1, color}}>ТСПУ</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};
const BEATS: Beat[] = [
  {id: 'hook_drop', color: C.danger, node: <>Твой VPN снова<br /><Accent color={C.danger}>отвалился?</Accent></>},
  {id: 'hook_year', color: C.danger, node: <>Это не баг.<br />Это <Accent color={C.danger}>2026</Accent></>},

  {id: 'ctx_black', color: C.danger, kicker: 'Что происходит', node: <>Мобильный интернет<br /><Accent color={C.danger}>глушат на недели</Accent></>},
  {id: 'ctx_wl', color: C.danger, node: <>Работает только<br /><Accent color={C.danger}>белый список</Accent></>},
  {id: 'ctx_vpn', color: C.danger, node: <>А VPN не запрещают —<br /><Accent color={C.danger}>тихо душат</Accent></>},

  {id: 'dpi_where', color: AMBER, kicker: 'Как это ловят', node: <>ТСПУ не смотрит,<br /><Accent color={C.muted}>куда ты идёшь</Accent></>},
  {id: 'dpi_how', color: AMBER, node: <>Он смотрит,<br /><Accent color={AMBER}>КАК ты идёшь</Accent></>},
  {id: 'dpi_print', color: AMBER, node: <>У трафика есть<br /><Accent color={AMBER}>отпечаток</Accent></>},
  {id: 'dpi_seen', color: C.danger, node: <>VPN выглядит как VPN —<br /><Accent color={C.danger}>его режут</Accent></>},

  {id: 'fix_mask', color: C.vpn, kicker: 'Что работает', node: <>Ответ — <Accent color={C.vpn}>маскировка</Accent></>},
  {id: 'fix_look', color: C.vpn, node: <>Трафик выглядит<br /><Accent color={C.vpn}>как обычный сайт</Accent></>},
  {id: 'fix_proto', color: C.vpn, node: <>Современные протоколы,<br /><Accent color={C.vpn}>что не светятся</Accent></>},
];

const Headlines: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {BEATS.map((beat, i) => {
        const s = start(beat.id);
        const next = i < BEATS.length - 1 ? start(BEATS[i + 1].id) : start('cta_q');
        const opacity = interpolate(frame, [s, s + 7, Math.max(s + 8, next - 11), Math.max(s + 9, next - 4)], [0, 1, 1, 0], CLAMP);
        if (opacity <= 0.001) return null;
        return (
          <div key={beat.id} style={{position: 'absolute', left: 90, top: 250, width: 900, opacity, translate: `0 ${interpolate(opacity, [0, 1], [10, 0], CLAMP)}px`, display: 'flex', flexDirection: 'column', gap: 14, zIndex: 40}}>
            {beat.kicker ? (
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <span style={{width: 34, height: 3, borderRadius: 3, background: beat.color, boxShadow: `0 0 12px ${beat.color}`}} />
                <span style={{...typo.kicker, color: beat.color}}>{beat.kicker}</span>
              </div>
            ) : null}
            <div style={{...typo.display, fontSize: 60, textShadow: '0 14px 40px rgba(0,0,0,0.6)'}}>{beat.node}</div>
          </div>
        );
      })}
    </>
  );
};

// Scene: current context — three stacked news chips.
const ContextScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    {id: 'ctx_black', t: 'Мобильный интернет глушат'},
    {id: 'ctx_wl', t: 'Только белый список сайтов'},
    {id: 'ctx_vpn', t: 'VPN не банят — душат через фильтры'},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'ctx_black', 'ctx_vpn'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 120, right: 120, top: 760, display: 'flex', flexDirection: 'column', gap: 20}}>
        {rows.map((r) => {
          const a = appear(frame, start(r.id) - 2);
          return (
            <div key={r.id} style={{...card(C.danger), padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 18, opacity: a, translate: `${interpolate(a, [0, 1], [30, 0], CLAMP)}px 0`}}>
              <Cross size={36} color={C.danger} t={a} />
              <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 30, color: C.white}}>{r.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene: the DPI scanner reading fingerprints and cutting the VPN packet.
const ScannerScene: React.FC = () => {
  const frame = useCurrentFrame();
  const alert = appear(frame, start('dpi_seen'));
  const printPanel = appear(frame, start('dpi_print'));
  // HTTPS packets glide across the gate then fade out before the right rail.
  const httpsX = (offset: number) => 140 + ((frame * 5 + offset) % 620);
  const rows = [
    {k: 'порт', v: 'нестандартный'},
    {k: 'рукопожатие', v: 'VPN-шаблон'},
    {k: 'шифрование', v: 'узнаваемое'},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'dpi_where', 'dpi_seen'), zIndex: 20}}>
      <Gate alert={alert} />
      {/* passing HTTPS packets (top lane) */}
      {[0, 210, 420].map((o) => {
        const x = httpsX(o);
        return <Packet key={o} label="HTTPS" color={C.ok} x={x} y={700} opacity={interpolate(x, [GATE_X + 30, GATE_X + 150], [1, 0], CLAMP)} scale={0.86} />;
      })}
      {/* the VPN packet stuck at the gate */}
      <Packet label="VPN" color={alert > 0.5 ? C.danger : AMBER} x={GATE_X - 220} y={820} scale={1.06} />
      {alert > 0.5 ? (
        <div style={{position: 'absolute', left: GATE_X - 250, top: 800, zIndex: 24}}><Cross size={52} color={C.danger} t={alert} /></div>
      ) : null}
      {/* fingerprint readout */}
      <div style={{position: 'absolute', left: 130, top: 1000, width: 760, ...card(AMBER), padding: 24, opacity: printPanel}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 14}}>
          <span style={{...typo.label, color: AMBER}}>ОТПЕЧАТОК ТРАФИКА</span>
          <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, color: alert > 0.5 ? C.danger : C.muted}}>{alert > 0.5 ? 'совпадение: VPN' : 'сканирование…'}</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.k} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none', opacity: appear(frame, start('dpi_print') + i * 6)}}>
            <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: C.muted}}>{r.k}</span>
            <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, color: alert > 0.5 ? C.danger : C.white}}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scene: masked traffic sails through as ordinary HTTPS.
const FixScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pass = appear(frame, start('fix_look'));
  const proto = appear(frame, start('fix_proto'));
  const x = interpolate(pass, [0, 1], [150, 560], CLAMP);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'fix_mask', 'fix_proto'), zIndex: 20}}>
      <Gate alert={0} />
      <Packet label="как HTTPS" color={C.vpn} x={x} y={780} masked scale={1.02} />
      {pass > 0.6 ? <div style={{position: 'absolute', left: 828, top: 790, zIndex: 24}}><Check size={46} color={C.vpn} t={pass} /></div> : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: 980, display: 'flex', justifyContent: 'center', gap: 14, opacity: proto}}>
        <Pill color={C.vpn}>маскировка</Pill>
        <Pill color={C.vpn}>ничем не выделяется</Pill>
      </div>
    </div>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [start('cta_q') - 8, start('cta_q') + 16], [0, 1], {...CLAMP, easing: ease.out});
  const btn = appear(frame, start('cta_brand'));
  const tap = appear(frame, start('cta_tap'));
  const float = Math.sin(frame / 40) * 6;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, zIndex: 30}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 520, height: 520, borderRadius: '50%', background: C.vpn, filter: 'blur(150px)', opacity: 0.22, position: 'absolute', top: -40}} />
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain', translate: `0 ${float}px`, filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))'}} />
        <div style={{...typo.display, fontSize: 60, textAlign: 'center', marginTop: 8}}>VPN, который<br /><Accent color={C.vpn}>не светится</Accent></div>
        <div style={{marginTop: 22, ...card(C.vpn), padding: '20px 30px', display: 'flex', alignItems: 'center', gap: 16, opacity: btn, transform: `scale(${interpolate(btn, [0, 1], [0.92, 1], CLAMP)})`}}>
          <Check size={40} color={C.vpn} t={btn} />
          <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 40, color: C.white}}>GhostPepe</span>
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 30, color: C.muted}}>· VPN в Telegram</span>
        </div>
        <div style={{marginTop: 20, padding: '20px 46px', borderRadius: 999, background: `linear-gradient(180deg, #8CFFE9, ${C.vpn})`, color: '#06110F', fontFamily: unbounded, fontWeight: 800, fontSize: 38, opacity: tap, boxShadow: `0 20px 60px ${C.vpn}55`}}>Подключить в пару нажатий</div>
      </div>
    </div>
  );
};

const Tint: React.FC<{children: (t: string) => React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const pick = () => {
    if (frame < start('dpi_where')) return C.danger;
    if (frame < start('fix_mask')) return AMBER;
    return C.vpn;
  };
  return <>{children(pick())}</>;
};

export const GhostPepeDpiFingerprintReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Tint>{(t) => <Backdrop tint={t} />}</Tint>
      <ContextScene />
      <ScannerScene />
      <FixScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-dpi-fingerprint.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

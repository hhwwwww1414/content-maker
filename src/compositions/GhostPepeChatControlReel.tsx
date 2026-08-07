import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-chatcontrol.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, Cross, Check, ProviderEye, TunnelGlow} from '../components/vpn-explainer/parts';

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const AMBER = '#FFC24B';
const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const seg = (id: string) => timeline.segments.find((s) => s.id === id);
const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);
const end = (id: string) => toFrame(seg(id)?.endMs ?? 0);
const total = timeline.durationInFrames;

const appear = (frame: number, from: number, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out});
// Scenes share the same screen region, so they must not co-occupy during a
// crossfade: fade in quickly at the first segment's start and out right after
// the last segment ends. Scene boundaries carry 560-620ms pauses, so this
// leaves a clean gap with no two diagrams overlapping.
const sceneOpacity = (frame: number, firstId: string, lastId: string) =>
  interpolate(frame, [start(firstId) - 2, start(firstId) + 8, end(lastId), end(lastId) + 10], [0, 1, 1, 0], CLAMP);

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

const Lens: React.FC<{color: string; size?: number}> = ({color, size = 60}) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
    <circle cx="25" cy="25" r="16" stroke={color} strokeWidth="3.4" />
    <path d="M37 37l14 14" stroke={color} strokeWidth="3.4" strokeLinecap="round" />
  </svg>
);

const LockIcon: React.FC<{color: string; size?: number}> = ({color, size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 30 34" fill="none">
    <rect x="5" y="14" width="20" height="16" rx="4" stroke={color} strokeWidth="2.4" />
    <path d="M9 14v-3a6 6 0 0 1 12 0v3" stroke={color} strokeWidth="2.4" />
    <circle cx="15" cy="22" r="2.2" fill={color} />
  </svg>
);

const Bubble: React.FC<{color: string; text: string; locked?: boolean; opacity?: number; width?: number}> = ({color, text, locked, opacity = 1, width = 420}) => (
  <div style={{...card(color), width, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 20, opacity}}>
    {locked ? <LockIcon color={color} size={26} /> : <span style={{width: 10, height: 10, borderRadius: 5, background: color}} />}
    <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: locked ? color : C.white, letterSpacing: locked ? 3 : 0, flex: 1}}>{text}</span>
  </div>
);

// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};
const BEATS: Beat[] = [
  {id: 'hook_vote', color: C.danger, node: <>Европа голосует за<br /><Accent color={C.danger}>чтение сообщений</Accent></>},
  {id: 'hook_short', color: C.danger, node: <>Отклонить —<br /><Accent color={C.danger}>не хватило голосов</Accent></>},

  {id: 'what_check', color: C.danger, kicker: 'Chat Control', node: <>Платформам можно<br /><Accent color={C.danger}>читать переписку</Accent></>},
  {id: 'what_no', color: C.danger, node: <>Без ордера, без<br />подозрений. До 2028</>},

  {id: 'key_open', color: AMBER, kicker: 'Нюанс', node: <>Сканируют лишь<br /><Accent color={AMBER}>незашифрованное</Accent></>},
  {id: 'key_auto', color: AMBER, node: <>Всё открытое —<br /><Accent color={AMBER}>читается само</Accent></>},

  {id: 'e2e_only', color: C.vpn, kicker: 'Щит 1', node: <>Сообщения спасает<br /><Accent color={C.vpn}>сквозное шифрование</Accent></>},
  {id: 'e2e_pass', color: C.vpn, node: <>Его <Accent color={C.vpn}>не сканируют</Accent></>},

  {id: 'vpn_channel', color: C.vpn, kicker: 'Щит 2', node: <>Соединение<br /><Accent color={C.vpn}>закрывает VPN</Accent></>},
  {id: 'vpn_hide', color: C.vpn, node: <>Где ты и что открываешь —<br /><Accent color={C.vpn}>провайдер не видит</Accent></>},
  {id: 'vpn_honest', color: C.vpn, node: <>Не читает за тебя —<br /><Accent color={C.vpn}>закрывает канал</Accent></>},
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
            <div style={{...typo.display, fontSize: 58, textShadow: '0 14px 40px rgba(0,0,0,0.6)'}}>{beat.node}</div>
          </div>
        );
      })}
    </>
  );
};

// Scene 1 — the parliament vote tally.
const VoteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = appear(frame, start('hook_vote') + 6);
  const fail = appear(frame, start('hook_short'));
  const row = (label: string, val: number, max: number, color: string, delay: number) => {
    const w = appear(frame, start('hook_vote') + delay);
    return (
      <div style={{marginTop: 18}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: manrope, fontWeight: 800, fontSize: 26, color: C.white, marginBottom: 8}}>
          <span>{label}</span><span style={{color}}>{val}</span>
        </div>
        <div style={{height: 22, borderRadius: 12, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${(val / max) * 100 * w}%`, borderRadius: 12, background: color, boxShadow: `0 0 16px ${color}`}} />
        </div>
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'hook_vote', 'hook_short'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 150, top: 720, width: 780, ...card(C.danger), padding: 30, opacity: bars}}>
        <div style={{...typo.label, color: C.muted, marginBottom: 6}}>ЕВРОПАРЛАМЕНТ · 9 ИЮЛЯ</div>
        {row('против сканирования', 314, 361, C.vpn, 8)}
        {row('за сканирование', 276, 361, C.danger, 16)}
        <div style={{marginTop: 24, display: 'flex', alignItems: 'center', gap: 12, opacity: fail}}>
          <Cross size={34} color={C.danger} t={fail} />
          <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, color: C.danger}}>нужно было 361 — не хватило 47</span>
        </div>
      </div>
    </div>
  );
};

// Scene 2 — a scanner reading open messages; encrypted one passes.
const ScanScene: React.FC = () => {
  const frame = useCurrentFrame();
  const scanY = 720 + ((frame * 5) % 240);
  const openFlag = appear(frame, start('key_open') + 4);
  const encPass = appear(frame, start('e2e_only'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'what_check', 'e2e_pass'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 200, top: 700, width: 500}}>
        <div style={{position: 'relative', display: 'flex', flexDirection: 'column', gap: 16}}>
          <Bubble color={C.danger} text="привет, как ты?" opacity={1} />
          <Bubble color={C.danger} text="скинь адрес" opacity={1} />
          <Bubble color={C.vpn} text="•••••••••••" locked opacity={encPass > 0.3 ? 1 : 0.4} />
          {/* scan line over the open messages */}
          <div style={{position: 'absolute', left: -14, top: scanY - 700, width: 528, height: 3, background: C.danger, boxShadow: `0 0 16px ${C.danger}`, opacity: 0.9}} />
        </div>
      </div>
      {/* lens badge */}
      <div style={{position: 'absolute', left: 740, top: 700}}><Lens color={C.danger} size={70} /></div>
      {/* flags */}
      <div style={{position: 'absolute', left: 720, top: 800, display: 'flex', flexDirection: 'column', gap: 14, opacity: openFlag}}>
        <Pill color={C.danger} style={{fontSize: 20, padding: '8px 16px'}}>открыто · читается</Pill>
      </div>
      <div style={{position: 'absolute', left: 720, top: 930, opacity: encPass}}>
        <Pill color={C.vpn} style={{fontSize: 20, padding: '8px 16px'}}>🔒 не сканируется</Pill>
      </div>
    </div>
  );
};

// Scene 3 — VPN closes the connection channel (honest: not reading messages).
const VpnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const on = appear(frame, start('vpn_channel') + 4);
  const hide = appear(frame, start('vpn_hide'));
  const px = 130, py = 700, pw = 190, ph = 300;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'vpn_channel', 'vpn_honest'), zIndex: 20}}>
      <div style={{position: 'absolute', left: px, top: py, width: pw, height: ph, borderRadius: 36, background: 'linear-gradient(160deg,#202a2c,#0b1113)', border: '1px solid rgba(184,255,243,0.2)', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center'}}>
        <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: C.vpn}}>ты</span>
      </div>
      <TunnelGlow x={px} y={py} w={pw} h={ph} color={C.vpn} on={on} />
      {/* provider eye sees only encrypted */}
      <div style={{position: 'absolute', left: 560, top: 760, opacity: hide}}>
        <ProviderEye color={C.vpn} label="Провайдер видит" sees="•••••  зашифровано" />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: py + ph + 70, display: 'flex', justifyContent: 'center', gap: 14, opacity: hide}}>
        <Pill color={C.vpn}>прячет, ГДЕ ты</Pill>
        <Pill color={C.vpn}>прячет, ЧТО открываешь</Pill>
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
        <div style={{...typo.display, fontSize: 62, textAlign: 'center', marginTop: 8}}>Закрой свой <Accent color={C.vpn}>канал</Accent></div>
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
    if (frame < start('key_open')) return C.danger;
    if (frame < start('e2e_only')) return AMBER;
    return C.vpn;
  };
  return <>{children(pick())}</>;
};

export const GhostPepeChatControlReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Tint>{(t) => <Backdrop tint={t} />}</Tint>
      <VoteScene />
      <ScanScene />
      <VpnScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-chatcontrol.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

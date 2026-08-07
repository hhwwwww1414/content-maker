import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-superapp.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, ProviderEye, Cross, Check, TunnelGlow} from '../components/vpn-explainer/parts';

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

const AppIcon: React.FC<{color: string; size: number; label: string; glyph: React.ReactNode; dim?: boolean}> = ({color, size, label, glyph, dim}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: dim ? 0.5 : 1}}>
    <div style={{width: size, height: size, borderRadius: size * 0.26, background: `${color}1f`, border: `1px solid ${color}`, display: 'grid', placeItems: 'center', color, boxShadow: `0 12px 30px rgba(0,0,0,0.4)`}}>{glyph}</div>
    <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: dim ? C.muted : C.white}}>{label}</span>
  </div>
);

const ChatGlyph = (c: string) => <svg width="34" height="34" viewBox="0 0 34 34"><path d="M5 8a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H14l-6 5v-5H8a3 3 0 0 1-3-3V8Z" stroke={c} strokeWidth="2.4" fill="none" strokeLinejoin="round"/></svg>;
const PaperGlyph = (c: string) => <svg width="34" height="34" viewBox="0 0 34 34"><path d="M29 5 3 15l9 3 3 9L29 5Z" stroke={c} strokeWidth="2.4" fill="none" strokeLinejoin="round"/></svg>;
const MaxGlyph = (c: string) => <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 44, color: c}}>M</span>;

// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};
const BEATS: Beat[] = [
  {id: 'hook_one', color: AMBER, node: <>Один app<br />на <Accent color={AMBER}>каждом телефоне</Accent></>},
  {id: 'hook_conv', color: C.danger, node: <>И это не<br />про <Accent color={C.danger}>удобство</Accent></>},

  {id: 'what_super', color: AMBER, kicker: 'Что это', node: <>Max — это<br /><Accent color={AMBER}>суперапп</Accent></>},
  {id: 'what_all', color: AMBER, node: <>Чат, банк, платежи,<br />ID — <Accent color={AMBER}>всё в одном</Accent></>},
  {id: 'what_enc', color: C.danger, node: <>И <Accent color={C.danger}>без шифрования</Accent></>},

  {id: 'funnel_block', color: C.danger, kicker: 'Зачем', node: <>WhatsApp — бан.<br />Telegram — <Accent color={C.danger}>душат</Accent></>},
  {id: 'funnel_here', color: C.danger, node: <>Чтобы ты <Accent color={C.danger}>переехал сюда</Accent></>},

  {id: 'dossier_one', color: C.danger, kicker: 'Цена', node: <>Всё в одном app —<br /><Accent color={C.danger}>досье в одном месте</Accent></>},
  {id: 'dossier_seen', color: C.danger, node: <>Чаты, платежи, гео —<br /><Accent color={C.danger}>как на ладони</Accent></>},

  {id: 'vpn_alive', color: C.vpn, kicker: 'Что делать', node: <>VPN держит твой<br /><Accent color={C.vpn}>Telegram живым</Accent></>},
  {id: 'vpn_yours', color: C.vpn, node: <>И чаты остаются<br /><Accent color={C.vpn}>твоими</Accent></>},
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

// Scene 1 — one Max icon on the phone, that unpacks into many functions.
const SuperappScene: React.FC = () => {
  const frame = useCurrentFrame();
  const icon = appear(frame, start('hook_one') + 6);
  const unpack = appear(frame, start('what_all'));
  const noEnc = appear(frame, start('what_enc'));
  const funcs = [
    {label: 'чат', glyph: ChatGlyph(AMBER)},
    {label: 'банк', glyph: <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: AMBER}}>₽</span>},
    {label: 'госуслуги', glyph: <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 26, color: AMBER}}>ГУ</span>},
    {label: 'ID', glyph: <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 26, color: AMBER}}>ID</span>},
    {label: 'платежи', glyph: <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: AMBER}}>≋</span>},
    {label: 'соцсеть', glyph: <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: AMBER}}>@</span>},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'hook_one', 'what_enc'), zIndex: 20}}>
      {/* central Max icon */}
      <div style={{position: 'absolute', left: 540 - 80, top: 640, opacity: icon, transform: `scale(${interpolate(unpack, [0, 1], [1, 0.78], CLAMP)})`}}>
        <AppIcon color={AMBER} size={160} label="Max" glyph={MaxGlyph(AMBER)} />
      </div>
      {/* unpacked functions grid */}
      <div style={{position: 'absolute', left: 150, right: 150, top: 900, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 30, opacity: unpack}}>
        {funcs.map((f, i) => (
          <div key={f.label} style={{opacity: appear(frame, start('what_all') + i * 4)}}>
            <AppIcon color={AMBER} size={110} label={f.label} glyph={f.glyph} />
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1250, display: 'flex', justifyContent: 'center', opacity: noEnc}}>
        <Pill color={C.danger}>всё в одном · без сквозного шифрования</Pill>
      </div>
    </div>
  );
};

// Scene 2 — WhatsApp blocked, Telegram throttled, funnel into Max.
const FunnelScene: React.FC = () => {
  const frame = useCurrentFrame();
  const push = appear(frame, start('funnel_here'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'funnel_block', 'funnel_here'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, top: 720}}>
        <div style={{position: 'relative'}}>
          <AppIcon color={C.danger} size={120} label="WhatsApp" glyph={PaperGlyph(C.danger)} dim />
          <div style={{position: 'absolute', left: 38, top: 30}}><Cross size={56} color={C.danger} t={appear(frame, start('funnel_block') + 4)} /></div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 130, top: 940}}>
        <AppIcon color={AMBER} size={120} label="Telegram · душат" glyph={PaperGlyph(AMBER)} />
      </div>
      {/* arrows to Max */}
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: push}}>
        {[790, 1000].map((y, i) => (
          <line key={i} x1={330} y1={y} x2={640} y2={880} stroke={C.danger} strokeWidth="3" strokeDasharray="6 10" markerEnd="" />
        ))}
      </svg>
      <div style={{position: 'absolute', left: 640, top: 800, opacity: push, transform: `scale(${interpolate(push, [0, 1], [0.85, 1], CLAMP)})`}}>
        <AppIcon color={C.danger} size={170} label="Max" glyph={MaxGlyph(C.danger)} />
      </div>
    </div>
  );
};

// Scene 3 — one app = one dossier, watched.
const DossierScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = ['переписка', 'платежи и карты', 'геолокация', 'документы и ID'];
  const seen = appear(frame, start('dossier_seen'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'dossier_one', 'dossier_seen'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 150, top: 700, width: 500, ...card(C.danger), padding: 26}}>
        <div style={{...typo.label, color: C.danger, marginBottom: 8}}>ОДНО ДОСЬЕ</div>
        {rows.map((t, i) => (
          <div key={t} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none', opacity: appear(frame, start('dossier_one') + 6 + i * 6)}}>
            <span style={{width: 8, height: 8, borderRadius: 4, background: C.danger}} />
            <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 28, color: C.white}}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 700, top: 800, opacity: seen}}>
        <ProviderEye color={C.danger} label="Видно" sees="всё сразу" />
      </div>
    </div>
  );
};

// Scene 4 — VPN keeps Telegram alive & private.
const VpnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const on = appear(frame, start('vpn_alive') + 4);
  const yours = appear(frame, start('vpn_yours'));
  const px = 440, py = 680, pw = 200, ph = 360;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'vpn_alive', 'vpn_yours'), zIndex: 20}}>
      <div style={{position: 'absolute', left: px, top: py, width: pw, height: ph, borderRadius: 40, background: 'linear-gradient(160deg,#202a2c,#0b1113)', border: '1px solid rgba(184,255,243,0.2)', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center'}}>
        <div style={{textAlign: 'center'}}>
          {PaperGlyph(C.vpn)}
          <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 26, color: C.vpn, marginTop: 10}}>Telegram</div>
          <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 4}}>работает</div>
        </div>
      </div>
      <TunnelGlow x={px} y={py} w={pw} h={ph} color={C.vpn} on={on} />
      <div style={{position: 'absolute', left: 0, right: 0, top: py + ph + 40, display: 'flex', justifyContent: 'center', gap: 14, opacity: yours}}>
        <Pill color={C.vpn}>шифрование</Pill>
        <Pill color={C.vpn}>чаты только твои</Pill>
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
        <div style={{...typo.display, fontSize: 58, textAlign: 'center', marginTop: 8}}>Оставайся в <Accent color={C.vpn}>Telegram</Accent><br />а не в супераппе</div>
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
    if (frame < start('funnel_block')) return AMBER;
    if (frame < start('vpn_alive')) return C.danger;
    return C.vpn;
  };
  return <>{children(pick())}</>;
};

export const GhostPepeSuperappReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Tint>{(t) => <Backdrop tint={t} />}</Tint>
      <SuperappScene />
      <FunnelScene />
      <DossierScene />
      <VpnScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-superapp.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

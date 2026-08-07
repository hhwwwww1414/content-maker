import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-whitelist-cage.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, Flow, TunnelGlow, Check} from '../components/vpn-explainer/parts';

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const seg = (id: string) => timeline.segments.find((s) => s.id === id);
const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);
const end = (id: string) => toFrame(seg(id)?.endMs ?? 0);
const total = timeline.durationInFrames;

const LOCK = '#63757A';
const appear = (frame: number, from: number, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out});
const sceneOpacity = (frame: number, firstId: string, lastId: string, lead = 10, tail = 12) =>
  interpolate(frame, [start(firstId) - lead, start(firstId) - lead + 12, end(lastId) + tail - 12, end(lastId) + tail], [0, 1, 1, 0], CLAMP);

// ---------------------------------------------------------------------------
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <Img
        src={staticFile('assets/backgrounds/cyberspace-main.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          scale: String(interpolate(frame, [0, total], [1.04, 1.1], CLAMP)),
          translate: `${Math.sin(frame / 90) * 8}px ${Math.cos(frame / 110) * 8}px`,
          filter: 'brightness(0.5) contrast(0.95) saturate(0.9)',
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%, rgba(6,14,16,0.2), rgba(4,9,10,0.72) 60%, rgba(2,5,6,0.92) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,7,8,0.7) 0%, transparent 22%, transparent 70%, rgba(3,7,8,0.82) 100%)'}} />
    </>
  );
};

const Lock: React.FC<{color: string; size?: number}> = ({color, size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 30 34" fill="none">
    <rect x="5" y="14" width="20" height="16" rx="4" stroke={color} strokeWidth="2.4" />
    <path d="M9 14v-3a6 6 0 0 1 12 0v3" stroke={color} strokeWidth="2.4" />
    <circle cx="15" cy="22" r="2.2" fill={color} />
  </svg>
);

const APPS = ['Стрим', 'Магазин', 'Почта', 'Карты', 'Соцсеть', 'Облако', 'Игры', 'Новости', 'Видео'];
const ALLOWED = new Set([2, 4]); // only a couple pass the whitelist

/** The whitelist cage: a grid of app tiles, most locked, a few allowed.
 *  `unlock` 0→1 releases every tile to mint (the VPN moment). */
const TileGrid: React.FC<{unlock: number; from: number; scale?: number}> = ({unlock, from, scale = 1}) => {
  const frame = useCurrentFrame();
  const cols = 3;
  const size = 200 * scale;
  const gap = 24 * scale;
  const gridW = cols * size + (cols - 1) * gap;
  return (
    <div style={{position: 'absolute', left: (1080 - gridW) / 2, top: 620, width: gridW, display: 'flex', flexWrap: 'wrap', gap}}>
      {APPS.map((name, i) => {
        const a = appear(frame, from + i * 2);
        const open = ALLOWED.has(i) ? 1 : unlock;
        const color = open > 0.5 ? C.vpn : LOCK;
        return (
          <div
            key={name}
            style={{
              width: size,
              height: size,
              borderRadius: 28,
              ...card(color),
              border: `1px solid ${color}${open > 0.5 ? 'aa' : '44'}`,
              boxShadow: open > 0.5 ? `0 0 28px ${C.vpn}44, 0 24px 50px rgba(0,0,0,0.5)` : '0 20px 44px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14 * scale,
              opacity: a * (open > 0.5 ? 1 : 0.7),
              translate: `0 ${interpolate(a, [0, 1], [20, 0], CLAMP)}px`,
            }}
          >
            {open > 0.5 ? <Check size={44 * scale} color={C.vpn} t={ALLOWED.has(i) ? 1 : appear(frame, start('vpn_back') + i)} /> : <Lock color={LOCK} size={40 * scale} />}
            <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 24 * scale, color: open > 0.5 ? C.white : C.muted}}>{name}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};
const BEATS: Beat[] = [
  {id: 'hook_a', color: C.vpn, node: <>Заметил?</>},
  {id: 'hook_b', color: C.danger, node: <>Интернет стал<br /><Accent color={C.danger}>короче</Accent></>},

  {id: 'wl_allow', color: C.danger, kicker: 'Белый список', node: <>Работает только<br /><Accent color={C.danger}>что разрешили</Accent></>},
  {id: 'wl_name', color: C.danger, node: <>Это <Accent color={C.danger}>белый список</Accent></>},
  {id: 'wl_few', color: C.danger, node: <>Остальное будто<br /><Accent color={C.danger}>не существует</Accent></>},

  {id: 'cage_open', color: C.danger, kicker: 'Клетка', node: <>Полсети <Accent color={C.danger}>не грузится</Accent></>},
  {id: 'cage_link', color: C.danger, node: <>Связь есть —<br /><Accent color={C.danger}>интернета нет</Accent></>},
  {id: 'cage_inside', color: C.danger, node: <>Ты внутри<br /><Accent color={C.danger}>чужого списка</Accent></>},

  {id: 'vpn_out', color: C.vpn, kicker: 'Выход', node: <>VPN уводит трафик<br /><Accent color={C.vpn}>за пределы списка</Accent></>},
  {id: 'vpn_tunnel', color: C.vpn, node: <>Зашифрованный<br /><Accent color={C.vpn}>туннель наружу</Accent></>},
  {id: 'vpn_back', color: C.vpn, node: <>Снова работает<br /><Accent color={C.vpn}>весь интернет</Accent></>},
];

const Headlines: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {BEATS.map((beat, i) => {
        const s = start(beat.id);
        const next = i < BEATS.length - 1 ? start(BEATS[i + 1].id) : start('cmp_before');
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
            <div style={{...typo.display, fontSize: 62, textShadow: '0 14px 40px rgba(0,0,0,0.7)'}}>{beat.node}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
const WhitelistScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'wl_allow', 'cage_inside'), zIndex: 20}}>
      <TileGrid unlock={0} from={start('wl_allow') + 4} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1250, display: 'flex', justifyContent: 'center', opacity: appear(frame, start('wl_few'))}}>
        <Pill color={C.danger}>разрешено 2 из 9 · остальное закрыто</Pill>
      </div>
    </div>
  );
};

const VpnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const out = appear(frame, start('vpn_out') + 4);
  const unlock = appear(frame, start('vpn_back'));
  const px = 120, py = 700, pw = 190, ph = 300;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'vpn_out', 'vpn_back'), zIndex: 20}}>
      {/* device on the left */}
      <div style={{position: 'absolute', left: px, top: py, width: pw, height: ph, borderRadius: 36, background: 'linear-gradient(160deg,#202a2c,#0b1113)', border: '1px solid rgba(184,255,243,0.2)', boxShadow: '0 40px 90px rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center'}}>
        <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: C.vpn}}>ты</span>
      </div>
      <TunnelGlow x={px} y={py} w={pw} h={ph} color={C.vpn} on={out} />
      {/* the whitelist wall in the middle */}
      <div style={{position: 'absolute', left: 470, top: 640, width: 8, height: 420, borderRadius: 6, background: `repeating-linear-gradient(180deg, ${C.danger} 0 18px, transparent 18px 34px)`, opacity: interpolate(unlock, [0, 1], [0.9, 0.25], CLAMP)}} />
      <div style={{position: 'absolute', left: 396, top: 1080, width: 160, textAlign: 'center', fontFamily: manrope, fontWeight: 800, fontSize: 20, letterSpacing: 1, color: C.danger, opacity: interpolate(unlock, [0, 1], [1, 0.3], CLAMP)}}>белый список</div>
      {/* tunnel breaking through to the open internet */}
      <Flow x1={px + pw + 30} y={py + ph / 2} x2={860} color={C.vpn} opacity={out} count={6} speed={4} />
      <div style={{position: 'absolute', left: 640, top: py + ph / 2 - 90, width: 300, ...card(C.vpn), padding: 22, textAlign: 'center', opacity: unlock, transform: `scale(${interpolate(unlock, [0, 1], [0.9, 1], CLAMP)})`}}>
        <div style={{display: 'grid', placeItems: 'center', marginBottom: 8}}><Check size={48} color={C.vpn} t={unlock} /></div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.vpn}}>весь интернет</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 6}}>без списка</div>
      </div>
    </div>
  );
};

const CompareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const after = appear(frame, start('cmp_after'));
  const mini = (allowed: boolean, count: number) => (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, width: 240}}>
      {Array.from({length: 9}).map((_, i) => {
        const on = allowed ? true : ALLOWED.has(i);
        return <div key={i} style={{width: 70, height: 70, borderRadius: 16, background: on ? `${C.vpn}22` : 'rgba(255,255,255,0.05)', border: `1px solid ${on ? C.vpn : LOCK}66`, display: 'grid', placeItems: 'center'}}>{on ? <Check size={26} color={C.vpn} t={1} /> : <Lock color={LOCK} size={22} />}</div>;
      })}
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'cmp_before', 'cmp_after'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 120, top: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
        <Pill color={C.danger}>Было</Pill>
        {mini(false, 2)}
      </div>
      <div style={{position: 'absolute', right: 120, top: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: after, translate: `0 ${interpolate(after, [0, 1], [24, 0], CLAMP)}px`}}>
        <Pill color={C.vpn}>Стало</Pill>
        {mini(true, 9)}
      </div>
      <div style={{position: 'absolute', left: '50%', top: 860, translate: '-50% 0', fontFamily: unbounded, fontWeight: 800, fontSize: 40, color: C.vpn, opacity: after}}>→</div>
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
        <div style={{...typo.display, fontSize: 60, textAlign: 'center', marginTop: 8}}>Выйди из чужого<br /><Accent color={C.vpn}>белого списка</Accent></div>
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

export const GhostPepeWhitelistCageReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Backdrop />
      <WhitelistScene />
      <VpnScene />
      <CompareScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-whitelist-cage.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

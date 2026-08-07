import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-internet-passport.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, Check} from '../components/vpn-explainer/parts';

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

const IdIcon: React.FC<{color: string; size?: number}> = ({color, size = 40}) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 40 28" fill="none">
    <rect x="1.5" y="1.5" width="37" height="25" rx="4" stroke={color} strokeWidth="2.2" />
    <circle cx="11" cy="12" r="4" stroke={color} strokeWidth="2.2" />
    <path d="M5 22c0-3 3-5 6-5s6 2 6 5" stroke={color} strokeWidth="2.2" />
    <path d="M22 10h12M22 15h12M22 20h8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const FaceScan: React.FC<{color: string; size?: number}> = ({color, size = 46}) => (
  <svg width={size} height={size} viewBox="0 0 46 46" fill="none">
    <path d="M6 14V8a2 2 0 0 1 2-2h6M40 14V8a2 2 0 0 0-2-2h-6M6 32v6a2 2 0 0 0 2 2h6M40 32v6a2 2 0 0 1-2 2h-6" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="23" cy="21" r="5" stroke={color} strokeWidth="2.4" />
    <path d="M15 33c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};
const BEATS: Beat[] = [
  {id: 'hook_ask', color: AMBER, node: <>Скоро интернет<br />попросит <Accent color={AMBER}>паспорт</Accent></>},
  {id: 'hook_now', color: C.danger, node: <>А кое-где<br /><Accent color={C.danger}>уже просит</Accent></>},

  {id: 'us_states', color: C.danger, kicker: 'Что происходит', node: <>27 штатов США —<br /><Accent color={C.danger}>скан ID или лицо</Accent></>},
  {id: 'over18', color: C.danger, node: <>Даже если тебе<br />давно за 18</>},
  {id: 'world', color: C.danger, node: <>Британия, ЕС,<br /><Accent color={C.danger}>десятки стран</Accent></>},

  {id: 'link_face', color: C.danger, kicker: 'Проблема', node: <>Твоё лицо привязывают<br /><Accent color={C.danger}>к твоим просмотрам</Accent></>},
  {id: 'leak', color: C.danger, node: <>Утечёт база —<br /><Accent color={C.danger}>утечёшь и ты</Accent></>},

  {id: 'vpn_region', color: C.vpn, kicker: 'Что делать', node: <>VPN меняет<br /><Accent color={C.vpn}>твой регион</Accent></>},
  {id: 'vpn_nowall', color: C.vpn, node: <>Заходишь оттуда,<br /><Accent color={C.vpn}>где стены нет</Accent></>},
  {id: 'vpn_nopass', color: C.vpn, node: <>Не раздаёшь паспорт<br /><Accent color={C.vpn}>каждому сайту</Accent></>},
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

// Scene 1 — a website that demands an ID / face scan to enter.
const GateScene: React.FC = () => {
  const frame = useCurrentFrame();
  const show = appear(frame, start('hook_ask') + 6);
  const lock = appear(frame, start('hook_now'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'hook_ask', 'hook_now'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 190, top: 660, width: 700, ...card(AMBER), padding: 0, overflow: 'hidden', opacity: show, transform: `scale(${interpolate(show, [0, 1], [0.92, 1], CLAMP)})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '18px 22px', background: 'rgba(255,255,255,0.04)'}}>
          <span style={{width: 12, height: 12, borderRadius: 6, background: '#4a5658'}} />
          <span style={{width: 12, height: 12, borderRadius: 6, background: '#4a5658'}} />
          <span style={{width: 12, height: 12, borderRadius: 6, background: '#4a5658'}} />
          <span style={{marginLeft: 14, fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.muted}}>любой-сайт.com</span>
        </div>
        <div style={{padding: '40px 40px 46px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
          <div style={{width: 96, height: 96, borderRadius: 24, background: `${AMBER}1a`, border: `1px solid ${AMBER}`, display: 'grid', placeItems: 'center'}}><FaceScan color={AMBER} size={54} /></div>
          <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 40, color: C.white, textAlign: 'center'}}>Подтвердите возраст</div>
          <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 26, color: C.muted, textAlign: 'center'}}>Загрузите паспорт или скан лица</div>
          <div style={{marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, padding: '16px 30px', borderRadius: 16, background: lock > 0.5 ? `${C.danger}22` : `${AMBER}22`, border: `1px solid ${lock > 0.5 ? C.danger : AMBER}`}}>
            <IdIcon color={lock > 0.5 ? C.danger : AMBER} size={34} />
            <span style={{fontFamily: unbounded, fontWeight: 700, fontSize: 26, color: lock > 0.5 ? C.danger : AMBER}}>Загрузить документ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scene 2 — the demand spreading across regions.
const SpreadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const regions = [
    {id: 'us_states', label: 'США · 27 штатов'},
    {id: 'over18', label: 'Британия'},
    {id: 'world', label: 'Евросоюз · цифровой ID'},
    {id: 'world', label: 'Бразилия · Индонезия · …'},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'us_states', 'world'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 110, right: 200, top: 700, display: 'flex', flexDirection: 'column', gap: 18}}>
        {regions.map((r, i) => {
          const a = appear(frame, start(r.id) + (r.id === 'world' ? i * 10 : 0) - 2);
          return (
            <div key={r.label} style={{...card(C.danger), padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, opacity: a, translate: `${interpolate(a, [0, 1], [30, 0], CLAMP)}px 0`}}>
              <IdIcon color={C.danger} size={36} />
              <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 28, color: C.white, flex: 1}}>{r.label}</span>
              <Pill color={C.danger} style={{fontSize: 20, padding: '8px 16px'}}>ID</Pill>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 3 — your identity linked to your browsing, then leaked.
const LinkScene: React.FC = () => {
  const frame = useCurrentFrame();
  const link = appear(frame, start('link_face') + 4);
  const leak = appear(frame, start('leak'));
  const items = ['история просмотров', 'что ты искал', 'на что подписан'];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'link_face', 'leak'), zIndex: 20}}>
      {/* identity card */}
      <div style={{position: 'absolute', left: 130, top: 700, width: 320, ...card(leak > 0.5 ? C.danger : AMBER), padding: 24, textAlign: 'center'}}>
        <div style={{display: 'grid', placeItems: 'center', marginBottom: 12}}><FaceScan color={leak > 0.5 ? C.danger : AMBER} size={56} /></div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 28, color: C.white}}>ты</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 4}}>имя · лицо · документ</div>
      </div>
      {/* browsing items linked */}
      <div style={{position: 'absolute', left: 500, top: 700, width: 450, display: 'flex', flexDirection: 'column', gap: 14}}>
        {items.map((t, i) => (
          <div key={t} style={{...card(C.muted), padding: '16px 20px', opacity: appear(frame, start('link_face') + 6 + i * 6), fontFamily: manrope, fontWeight: 700, fontSize: 24, color: C.white}}>{t}</div>
        ))}
      </div>
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: link}}>
        {[740, 800, 860].map((y, i) => <line key={i} x1={450} y1={800} x2={500} y2={y} stroke={leak > 0.5 ? C.danger : AMBER} strokeWidth="3" strokeDasharray="4 8" />)}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1010, display: 'flex', justifyContent: 'center', opacity: leak}}>
        <Pill color={C.danger}>утечка базы — и всё это уже не только у тебя</Pill>
      </div>
    </div>
  );
};

// Scene 4 — VPN changes region; the wall is gone.
const VpnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pick = appear(frame, start('vpn_region') + 4);
  const open = appear(frame, start('vpn_nowall'));
  const regions = [
    {name: 'Твой регион', wall: true},
    {name: 'Регион без стены', wall: false},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'vpn_region', 'vpn_nopass'), zIndex: 20}}>
      {/* region selector */}
      <div style={{position: 'absolute', left: 130, top: 700, width: 380, ...card(C.vpn), padding: 20, opacity: pick}}>
        <div style={{...typo.label, color: C.vpn, marginBottom: 12}}>ВЫБОР РЕГИОНА</div>
        {regions.map((r, i) => {
          const active = i === 1 ? open : 1 - open;
          return (
            <div key={r.name} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', marginTop: 8, borderRadius: 12, background: i === 1 ? `${C.vpn}${open > 0.4 ? '22' : '0a'}` : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 1 && open > 0.4 ? C.vpn : 'transparent'}`}}>
              <span style={{width: 16, height: 16, borderRadius: 8, border: `2px solid ${i === 1 && open > 0.4 ? C.vpn : C.muted}`, background: i === 1 && open > 0.4 ? C.vpn : 'transparent'}} />
              <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 24, color: C.white, flex: 1}}>{r.name}</span>
              {r.wall ? <IdIcon color={C.danger} size={28} /> : <Check size={28} color={C.vpn} t={active} />}
            </div>
          );
        })}
      </div>
      {/* resulting site — open, no wall */}
      <div style={{position: 'absolute', left: 560, top: 720, width: 380, ...card(C.vpn), padding: 0, overflow: 'hidden', opacity: open, transform: `scale(${interpolate(open, [0, 1], [0.92, 1], CLAMP)})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', background: 'rgba(255,255,255,0.04)'}}>
          <span style={{width: 10, height: 10, borderRadius: 5, background: C.vpn}} />
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 20, color: C.muted}}>любой-сайт.com</span>
        </div>
        <div style={{padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
          <Check size={56} color={C.vpn} t={open} />
          <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.white, textAlign: 'center'}}>Открыто</div>
          <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 22, color: C.muted, textAlign: 'center'}}>без паспорта</div>
        </div>
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
        <div style={{...typo.display, fontSize: 60, textAlign: 'center', marginTop: 8}}>Интернет <Accent color={C.vpn}>без паспорта</Accent><br />на входе</div>
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
    if (frame < start('us_states')) return AMBER;
    if (frame < start('vpn_region')) return C.danger;
    return C.vpn;
  };
  return <>{children(pick())}</>;
};

export const GhostPepeInternetPassportReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Tint>{(t) => <Backdrop tint={t} />}</Tint>
      <GateScene />
      <SpreadScene />
      <LinkScene />
      <VpnScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-internet-passport.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

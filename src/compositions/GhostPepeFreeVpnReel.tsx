import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-free-vpn.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, ServerIcon, Flow, Cross, Check} from '../components/vpn-explainer/parts';

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const seg = (id: string) => timeline.segments.find((s) => s.id === id);
const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);
const end = (id: string) => toFrame(seg(id)?.endMs ?? 0);
const total = timeline.durationInFrames;

const appear = (frame: number, from: number, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out});
const sceneOpacity = (frame: number, firstId: string, lastId: string, lead = 10, tail = 12) =>
  interpolate(frame, [start(firstId) - lead, start(firstId) - lead + 12, end(lastId) + tail - 12, end(lastId) + tail], [0, 1, 1, 0], CLAMP);

const AMBER = '#FFC24B';

// ---------------------------------------------------------------------------
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

const Barcode: React.FC<{w: number; h: number; color: string; t: number}> = ({w, h, color, t}) => {
  const bars = Array.from({length: 34}, (_, i) => ((i * 37) % 7) + 2);
  let x = 0;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${bars.reduce((a, b) => a + b + 4, 0)} 60`} style={{opacity: t}}>
      {bars.map((bw, i) => {
        const rect = <rect key={i} x={x} y={0} width={bw} height={60} fill={color} opacity={i / bars.length < t ? 1 : 0.15} />;
        x += bw + 4;
        return rect;
      })}
    </svg>
  );
};

const WarnTriangle: React.FC<{size: number; color: string; t: number}> = ({size, color, t}) => (
  <svg width={size} height={size} viewBox="0 0 44 40" style={{opacity: t}}>
    <path d="M22 3 42 37H2L22 3Z" stroke={color} strokeWidth="3" fill={`${color}22`} strokeLinejoin="round" />
    <path d="M22 15v10" stroke={color} strokeWidth="3.4" strokeLinecap="round" />
    <circle cx="22" cy="31" r="2.2" fill={color} />
  </svg>
);

// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};
const BEATS: Beat[] = [
  {id: 'hook_free', color: C.danger, kicker: 'Бесплатный VPN', node: <>Поставил <Accent color={C.danger}>бесплатный?</Accent></>},
  {id: 'hook_news', color: C.danger, node: <>Тогда плохие<br />новости</>},
  {id: 'hook_product', color: C.danger, node: <>Не платишь за VPN?<br />Товар — <Accent color={C.danger}>это ты</Accent></>},

  {id: 'm1_how', color: AMBER, kicker: 'Как они зарабатывают', node: <>Смотри, как это<br />работает</>},
  {id: 'm1_all', color: AMBER, node: <>Он пропускает <Accent color={AMBER}>всё,</Accent><br />что ты открываешь</>},
  {id: 'm1_sell', color: C.danger, node: <>А этот поток<br /><Accent color={C.danger}>можно продать</Accent></>},

  {id: 'm2_inject', color: C.danger, kicker: 'Второе', node: <>Реклама и <Accent color={C.danger}>трекеры</Accent></>},
  {id: 'm2_marked', color: C.danger, node: <>Думаешь, спрятался?<br /><Accent color={C.danger}>Тебя метят плотнее</Accent></>},

  {id: 'm3_worst', color: AMBER, kicker: 'Третье', node: <>Самое <Accent color={AMBER}>неприятное</Accent></>},
  {id: 'm3_node', color: AMBER, node: <>Твоё устройство —<br /><Accent color={AMBER}>выходной узел</Accent></>},
  {id: 'm3_blame', color: C.danger, node: <>Через твой IP ходит<br /><Accent color={C.danger}>чужой трафик</Accent></>},

  {id: 'price_title', color: C.danger, kicker: 'Настоящая цена', node: <>И вот она</>},
  {id: 'price_pay', color: C.danger, node: <>Экономишь пару $ —<br />отдаёшь <Accent color={C.danger}>всё о себе</Accent></>},

  {id: 'fix_sub', color: C.vpn, kicker: 'Как должно быть', node: <>VPN живёт на подписке<br /><Accent color={C.vpn}>Не на тебе</Accent></>},
  {id: 'fix_rules', color: C.vpn, node: <>Оплата. Без рекламы.<br /><Accent color={C.vpn}>Без логов</Accent></>},
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

// ---------------------------------------------------------------------------
// Scene 1 — the "FREE" tag that turns out to be a price tag on you.
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const tag = appear(frame, start('hook_free') + 4);
  const reveal = appear(frame, start('hook_product'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'hook_free', 'hook_product'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 300, top: 660, width: 480, ...card(C.danger), padding: 34, textAlign: 'center', opacity: tag, transform: `scale(${interpolate(tag, [0, 1], [0.9, 1], CLAMP)}) rotate(${interpolate(reveal, [0, 1], [-3, 0], CLAMP)}deg)`}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 92, color: C.danger, letterSpacing: -2}}>FREE</div>
        <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: C.muted, marginTop: 6}}>0 ₽ / месяц</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 940, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: reveal}}>
        <Barcode w={420} h={60} color={C.danger} t={reveal} />
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 40, color: C.danger, letterSpacing: 2}}>ТОВАР — ТЫ</div>
      </div>
    </div>
  );
};

// Scene 2 — your traffic passes through the free server and gets sold on.
const SellScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flow = appear(frame, start('m1_all'));
  const sell = appear(frame, start('m1_sell'));
  const buyer = (x: number, label: string, sub: string, delay: number) => (
    <div style={{position: 'absolute', left: x, top: 980, width: 340, ...card(C.danger), padding: 20, textAlign: 'center', opacity: appear(frame, start('m1_sell') + delay), translate: `0 ${interpolate(appear(frame, start('m1_sell') + delay), [0, 1], [20, 0], CLAMP)}px`}}>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 26, color: C.danger}}>{label}</div>
        <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.muted, marginTop: 6}}>{sub}</div>
      </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'm1_how', 'm1_sell'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 120, top: 700, width: 240, ...card(C.white), padding: 22, textAlign: 'center'}}>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.white}}>Ты</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 6}}>весь трафик</div>
      </div>
      <Flow x1={380} y={760} x2={600} color={AMBER} opacity={flow} />
      <div style={{position: 'absolute', left: 620, top: 690, width: 300, ...card(AMBER), padding: 22, textAlign: 'center'}}>
        <div style={{display: 'grid', placeItems: 'center'}}><ServerIcon color={AMBER} size={34} /></div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 28, color: AMBER, marginTop: 8}}>Free VPN</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 4}}>видит всё</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 900, textAlign: 'center', opacity: sell, fontFamily: manrope, fontWeight: 800, fontSize: 26, color: C.danger}}>продаётся ↓</div>
      {buyer(110, 'Рекламные сети', 'таргет по тебе', 0)}
      {buyer(630, 'Брокеры данных', 'профиль на продажу', 8)}
    </div>
  );
};

// Scene 3 — injected ads and trackers.
const InjectScene: React.FC = () => {
  const frame = useCurrentFrame();
  const inject = appear(frame, start('m2_inject') + 6);
  const marked = appear(frame, start('m2_marked'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'm2_inject', 'm2_marked'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 220, top: 660, width: 640, ...card(C.danger), padding: 24}}>
        <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
          {[0, 1, 2].map((i) => <span key={i} style={{width: 12, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.18)'}} />)}
        </div>
        {[0, 1].map((i) => (
          <div key={i} style={{height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.10)', marginBottom: 12, width: i === 0 ? '80%' : '62%'}} />
        ))}
        <div style={{marginTop: 10, padding: '16px 18px', borderRadius: 14, border: `1px dashed ${C.danger}`, background: `${C.danger}1a`, opacity: inject, fontFamily: manrope, fontWeight: 800, fontSize: 26, color: C.danger, textAlign: 'center'}}>
          РЕКЛАМА, которой тут не было
        </div>
        {[0, 1].map((i) => (
          <div key={`b${i}`} style={{height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.10)', marginTop: 12, width: i === 0 ? '70%' : '48%'}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1010, display: 'flex', justifyContent: 'center', gap: 14, opacity: marked}}>
        {['cookie', 'pixel', 'fingerprint'].map((t, i) => (
          <div key={t} style={{opacity: appear(frame, start('m2_marked') + i * 5)}}>
            <Pill color={C.danger}>{t}</Pill>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scene 4 — your device rented out as an exit node.
const ExitNodeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const route = appear(frame, start('m3_node'));
  const blame = appear(frame, start('m3_blame'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'm3_worst', 'm3_blame'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, top: 700, width: 200, ...card(C.muted), padding: 18, textAlign: 'center', opacity: route}}>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 24, color: C.muted}}>Чужие</div>
      </div>
      <Flow x1={350} y={760} x2={430} color={AMBER} opacity={route} count={3} />
      <div style={{position: 'absolute', left: 440, top: 660, width: 200, height: 300, borderRadius: 34, background: 'linear-gradient(160deg,#202a2c,#0b1113)', border: `2px solid ${AMBER}`, boxShadow: `0 0 46px ${AMBER}55`, opacity: route, display: 'grid', placeItems: 'center'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 26, color: AMBER}}>твой IP</div>
          <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 6}}>выходной узел</div>
        </div>
      </div>
      <Flow x1={660} y={760} x2={860} color={AMBER} opacity={route} count={3} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1010, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: blame}}>
        <WarnTriangle size={54} color={C.danger} t={blame} />
        <Pill color={C.danger}>вопросы прилетят тебе</Pill>
      </div>
    </div>
  );
};

// Scene 5 — the real price: tiny saving vs everything you hand over.
const PriceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pay = appear(frame, start('price_pay'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'price_title', 'price_pay'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, top: 700, width: 340, ...card(C.muted), padding: 26, textAlign: 'center'}}>
        <div style={{...typo.label, color: C.muted}}>ЭКОНОМИШЬ</div>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 62, color: C.white, marginTop: 10}}>~2 $</div>
      </div>
      <div style={{position: 'absolute', left: 540, top: 700, width: 410, ...card(C.danger), padding: 26, opacity: pay}}>
        <div style={{...typo.label, color: C.danger, textAlign: 'center'}}>ОТДАЁШЬ</div>
        {['История посещений', 'Рекламные метки', 'Репутация IP'].map((t, i) => (
          <div key={t} style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, opacity: appear(frame, start('price_pay') + i * 7)}}>
            <Cross size={30} color={C.danger} t={appear(frame, start('price_pay') + i * 7)} />
            <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: C.white}}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scene 6 — how a normal VPN works.
const FixScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = ['Понятная подписка', 'Без рекламы', 'Без логов на продажу'];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'fix_sub', 'fix_rules'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 150, top: 700, width: 780, ...card(C.vpn), padding: 30}}>
        {rows.map((t, i) => {
          const a = appear(frame, start(i === 0 ? 'fix_sub' : 'fix_rules') + i * 8);
          return (
            <div key={t} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: i ? 22 : 0, opacity: a, translate: `${interpolate(a, [0, 1], [24, 0], CLAMP)}px 0`}}>
              <Check size={44} color={C.vpn} t={a} />
              <span style={{fontFamily: unbounded, fontWeight: 700, fontSize: 34, color: C.white}}>{t}</span>
            </div>
          );
        })}
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
        <div style={{width: 520, height: 520, borderRadius: '50%', background: C.vpn, filter: 'blur(150px)', opacity: 0.2, position: 'absolute', top: -40}} />
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain', translate: `0 ${float}px`, filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))'}} />
        <div style={{...typo.display, fontSize: 60, textAlign: 'center', marginTop: 8}}>VPN, который зарабатывает<br /><Accent color={C.vpn}>на подписке</Accent></div>
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
    if (frame < start('m1_how')) return C.danger;
    if (frame < start('m2_inject')) return AMBER;
    if (frame < start('m3_worst')) return C.danger;
    if (frame < start('price_title')) return AMBER;
    if (frame < start('fix_sub')) return C.danger;
    return C.vpn;
  };
  return <>{children(pick())}</>;
};

export const GhostPepeFreeVpnReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Tint>{(t) => <Backdrop tint={t} />}</Tint>
      <HookScene />
      <SellScene />
      <InjectScene />
      <ExitNodeScene />
      <PriceScene />
      <FixScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-free-vpn.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-vpn-proxy-dns.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, BookIcon, ServerIcon, DbIcon, ProviderEye, Flow, TunnelGlow, Cross, Check} from '../components/vpn-explainer/parts';

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const seg = (id: string) => timeline.segments.find((s) => s.id === id);
const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);
const end = (id: string) => toFrame(seg(id)?.endMs ?? 0);
const total = timeline.durationInFrames;

const appear = (frame: number, from: number, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out});
// Scene crossfade over a segment id range.
const sceneOpacity = (frame: number, firstId: string, lastId: string, lead = 10, tail = 12) =>
  interpolate(frame, [start(firstId) - lead, start(firstId) - lead + 12, end(lastId) + tail - 12, end(lastId) + tail], [0, 1, 1, 0], CLAMP);

// ---------------------------------------------------------------------------
// Backdrop: clean dark stage with a faint grid so the diagram cards read.
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

// ---------------------------------------------------------------------------
// Headline per segment (kicker + display + accent), non-overlapping windows.
// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};

const BEATS: Beat[] = [
  {id: 'hook_confuse', color: C.danger, kicker: 'VPN · Прокси · DNS', node: <>В чём <Accent color={C.danger}>разница?</Accent></>},
  {id: 'hook_same', color: C.danger, node: <>Кажется — одно<br />и то же</>},
  {id: 'hook_three', color: C.danger, node: <>Но это <Accent color={C.danger}>три</Accent><br />разные вещи</>},
  {id: 'hook_price', color: C.danger, node: <>Путаница стоит<br /><Accent color={C.danger}>приватности</Accent></>},

  {id: 'dns_book', color: C.dns, kicker: 'DNS', node: <>Телефонная книга<br />интернета</>},
  {id: 'dns_open', color: C.dns, node: <>Меняешь DNS —<br /><Accent color={C.dns}>сайт открывается</Accent></>},
  {id: 'dns_visible', color: C.dns, node: <>Но трафик виден<br /><Accent color={C.danger}>провайдеру</Accent></>},

  {id: 'proxy_middle', color: C.proxy, kicker: 'Прокси', node: <>Это <Accent color={C.proxy}>посредник</Accent></>},
  {id: 'proxy_addr', color: C.proxy, node: <>Сайт видит его<br />адрес, <Accent color={C.proxy}>не твой</Accent></>},
  {id: 'proxy_one', color: C.proxy, node: <>Но чаще это<br /><Accent color={C.danger}>один браузер</Accent></>},

  {id: 'vpn_tunnel', color: C.vpn, kicker: 'VPN', node: <>Зашифрованный<br /><Accent color={C.vpn}>туннель</Accent></>},
  {id: 'vpn_all', color: C.vpn, node: <>Для всего<br />устройства сразу</>},
  {id: 'vpn_hide', color: C.vpn, node: <>Прячет и адрес,<br />и <Accent color={C.vpn}>содержимое</Accent></>},

  {id: 'trap_q', color: C.danger, kicker: 'Ловушка', node: <>«Сменил DNS —<br /><Accent color={C.danger}>значит защищён»?</Accent></>},
  {id: 'trap_no', color: C.danger, node: <>Нет. DNS<br /><Accent color={C.danger}>не шифрует</Accent></>},
  {id: 'trap_leak', color: C.danger, node: <>Бесплатный прокси<br /><Accent color={C.danger}>сливает</Accent></>},

  {id: 'sum_dns', color: C.white, kicker: 'Запомни', node: <>Обойти блокировку —<br /><Accent color={C.dns}>это DNS</Accent></>},
  {id: 'sum_proxy', color: C.white, node: <>Сменить адрес —<br /><Accent color={C.proxy}>это прокси</Accent></>},
  {id: 'sum_vpn', color: C.white, node: <>Спрятать всё —<br /><Accent color={C.vpn}>это VPN</Accent></>},
];

const Headlines: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {BEATS.map((beat, i) => {
        const s = start(beat.id);
        const next = i < BEATS.length - 1 ? start(BEATS[i + 1].id) : start('cta_ask');
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
            <div style={{...typo.display, fontSize: 62, textShadow: '0 14px 40px rgba(0,0,0,0.6)'}}>{beat.node}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Scene diagrams (center stage ~ y 520-1240).
// ---------------------------------------------------------------------------
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const terms = [
    {label: 'DNS', color: C.dns},
    {label: 'Прокси', color: C.proxy},
    {label: 'VPN', color: C.vpn},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'hook_confuse', 'hook_price'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 720, display: 'flex', justifyContent: 'center', gap: 26}}>
        {terms.map((t, i) => {
          const a = appear(frame, start('hook_confuse') + 6 + i * 6);
          return (
            <div key={t.label} style={{...card(t.color), width: 240, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: a, translate: `0 ${interpolate(a, [0, 1], [24, 0], CLAMP)}px`}}>
              <div style={{width: 64, height: 64, borderRadius: 18, background: `${t.color}22`, border: `1px solid ${t.color}`, display: 'grid', placeItems: 'center', fontFamily: unbounded, fontWeight: 800, fontSize: 40, color: t.color}}>?</div>
              <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 32, color: C.white}}>{t.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DnsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const swap = appear(frame, start('dns_open'));
  const exposed = appear(frame, start('dns_visible'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'dns_book', 'dns_visible'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 150, top: 640, ...card(C.dns), width: 780, padding: 28}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20}}>
          <BookIcon color={C.dns} size={36} />
          <span style={{fontFamily: unbounded, fontWeight: 700, fontSize: 34, color: C.dns}}>DNS</span>
          <span style={{marginLeft: 'auto', ...typo.label, color: C.muted}}>ИМЯ → АДРЕС</span>
        </div>
        {[
          {name: 'ghostpepe.site', ip: '172.10.4.9'},
          {name: 'you-tube.com', ip: '142.250.74.14'},
        ].map((r, i) => (
          <div key={r.name} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', marginTop: 12, borderRadius: 14, background: i === 0 ? `${C.dns}18` : 'rgba(255,255,255,0.04)', border: i === 0 ? `1px solid ${C.dns}66` : '1px solid transparent'}}>
            <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 28, color: C.white, flex: 1}}>{r.name}</span>
            <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, color: C.dns, opacity: 0.6 + swap * 0.4}}>→</span>
            <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: i === 0 ? C.vpn : C.muted}}>{r.ip}</span>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1010, display: 'flex', justifyContent: 'center', opacity: exposed}}>
        <Pill color={C.danger}>Провайдер видит, куда ты идёшь · не зашифровано</Pill>
      </div>
    </div>
  );
};

const ProxyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const node = (x: number, label: string, sub: string, color: string, hot: number) => (
    <div style={{position: 'absolute', left: x - 110, top: 720, width: 220, ...card(color), padding: 20, textAlign: 'center', boxShadow: hot > 0.5 ? `0 0 40px ${color}66, 0 30px 70px rgba(0,0,0,0.5)` : card(color).boxShadow}}>
      <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color}}>{label}</div>
      <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 8}}>{sub}</div>
    </div>
  );
  const hot = appear(frame, start('proxy_middle') + 6);
  const siteSees = appear(frame, start('proxy_addr'));
  const oneApp = appear(frame, start('proxy_one'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'proxy_middle', 'proxy_one'), zIndex: 20}}>
      <Flow x1={240} y={800} x2={430} color={C.proxy} opacity={hot} />
      <Flow x1={650} y={800} x2={840} color={C.proxy} opacity={siteSees} />
      {node(180, 'Ты', 'адрес: A.1.2.3', C.white, 0)}
      {node(540, 'Прокси', 'посредник', C.proxy, hot)}
      {node(900, 'Сайт', 'видит: прокси', C.proxy, siteSees)}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1010, display: 'flex', justifyContent: 'center', opacity: oneApp}}>
        <Pill color={C.danger}>обычно один браузер · прокси видит трафик</Pill>
      </div>
    </div>
  );
};

const VpnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const on = appear(frame, start('vpn_tunnel') + 4);
  const wrap = appear(frame, start('vpn_all'));
  const hidden = appear(frame, start('vpn_hide'));
  const px = 360, py = 660, pw = 200, ph = 400;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'vpn_tunnel', 'vpn_hide'), zIndex: 20}}>
      {/* device */}
      <div style={{position: 'absolute', left: px, top: py, width: pw, height: ph, borderRadius: 40, background: 'linear-gradient(160deg,#202a2c,#0b1113)', border: '1px solid rgba(184,255,243,0.2)', boxShadow: '0 40px 90px rgba(0,0,0,0.55)'}}>
        <div style={{position: 'absolute', inset: 14, borderRadius: 28, background: '#0a1112', display: 'grid', placeItems: 'center'}}>
          <DbIcon color={C.vpn} size={54} />
        </div>
      </div>
      <TunnelGlow x={px} y={py} w={pw} h={ph} color={C.vpn} on={wrap} />
      <Flow x1={px + pw + 40} y={py + ph / 2} x2={860} color={C.vpn} opacity={on} count={5} />
      {/* cloud */}
      <div style={{position: 'absolute', left: 780, top: py + ph / 2 - 44, width: 150, height: 88, ...card(C.vpn), display: 'grid', placeItems: 'center', fontFamily: manrope, fontWeight: 800, fontSize: 24, color: C.muted}}>интернет</div>
      <div style={{position: 'absolute', left: 150, top: py + ph + 40, opacity: hidden}}>
        <ProviderEye color={C.vpn} label="Провайдер видит" sees="•••••••  зашифровано" />
      </div>
    </div>
  );
};

const TrapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const noEnc = appear(frame, start('trap_no'));
  const leak = appear(frame, start('trap_leak'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'trap_q', 'trap_leak'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, top: 700, width: 380, ...card(C.dns), padding: 24, textAlign: 'center'}}>
        <BookIcon color={C.dns} size={40} />
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.dns, marginTop: 10}}>DNS</div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 16, gap: 10, alignItems: 'center'}}>
          <Cross size={40} color={C.danger} t={noEnc} />
          <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 24, color: C.danger, opacity: noEnc}}>не шифрует</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 560, top: 700, width: 380, ...card(C.proxy), padding: 24, textAlign: 'center'}}>
        <ServerIcon color={C.proxy} size={40} />
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.proxy, marginTop: 10}}>Free proxy</div>
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 16, gap: 10, alignItems: 'center'}}>
          <Cross size={40} color={C.danger} t={leak} />
          <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 24, color: C.danger, opacity: leak}}>логирует и сливает</span>
        </div>
      </div>
    </div>
  );
};

const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    {id: 'sum_dns', tag: 'DNS', color: C.dns, text: 'обойти блокировку по имени'},
    {id: 'sum_proxy', tag: 'Прокси', color: C.proxy, text: 'сменить адрес одному приложению'},
    {id: 'sum_vpn', tag: 'VPN', color: C.vpn, text: 'зашифровать и спрятать всё'},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'sum_dns', 'sum_vpn'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 120, right: 120, top: 700, display: 'flex', flexDirection: 'column', gap: 22}}>
        {rows.map((r) => {
          const a = appear(frame, start(r.id) - 2);
          return (
            <div key={r.id} style={{...card(r.color), padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 22, opacity: a, translate: `${interpolate(a, [0, 1], [30, 0], CLAMP)}px 0`}}>
              <div style={{minWidth: 150}}><Pill color={r.color}>{r.tag}</Pill></div>
              <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 30, color: C.white}}>{r.text}</span>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1120, textAlign: 'center', fontFamily: manrope, fontWeight: 700, fontSize: 28, color: C.muted, opacity: appear(frame, start('sum_vpn') + 20)}}>
        не конкуренты — три разные страховки
      </div>
    </div>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [start('cta_ask') - 8, start('cta_ask') + 16], [0, 1], {...CLAMP, easing: ease.out});
  const btn = appear(frame, start('cta_brand'));
  const tap = appear(frame, start('cta_tap'));
  const float = Math.sin(frame / 40) * 6;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, zIndex: 30}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 520, height: 520, borderRadius: '50%', background: C.vpn, filter: 'blur(150px)', opacity: 0.2, position: 'absolute', top: -40}} />
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain', translate: `0 ${float}px`, filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))'}} />
        <div style={{...typo.display, fontSize: 66, textAlign: 'center', marginTop: 8}}>Хочешь прятать<br /><Accent color={C.vpn}>весь трафик?</Accent></div>
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

const CurrentTint: React.FC<{children: (tint: string) => React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const pick = () => {
    if (frame < start('dns_book')) return C.danger;
    if (frame < start('proxy_middle')) return C.dns;
    if (frame < start('vpn_tunnel')) return C.proxy;
    if (frame < start('trap_q')) return C.vpn;
    if (frame < start('sum_dns')) return C.danger;
    if (frame < start('cta_ask')) return C.white;
    return C.vpn;
  };
  return <>{children(pick())}</>;
};

export const GhostPepeVpnProxyDnsReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <CurrentTint>{(tint) => <Backdrop tint={tint} />}</CurrentTint>
      <HookScene />
      <DnsScene />
      <ProxyScene />
      <VpnScene />
      <TrapScene />
      <SummaryScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-vpn-proxy-dns.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

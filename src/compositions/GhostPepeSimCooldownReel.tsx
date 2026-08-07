import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-sim-cooldown.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {Accent} from '../components/kit/Typo';
import {C, card, Pill, Cross, Check} from '../components/vpn-explainer/parts';

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const ICE = '#6FC8FF';
const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const seg = (id: string) => timeline.segments.find((s) => s.id === id);
const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);
const end = (id: string) => toFrame(seg(id)?.endMs ?? 0);
const total = timeline.durationInFrames;

const appear = (frame: number, from: number, dur = 12) => interpolate(frame, [from, from + dur], [0, 1], {...CLAMP, easing: ease.out});
// Scenes share the stage — fade in at first segment start, out right after last
// segment ends, so no two diagrams overlap during a crossfade.
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

const Snowflake: React.FC<{color: string; size?: number}> = ({color, size = 34}) => (
  <svg width={size} height={size} viewBox="0 0 34 34" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a} 17 17)`}>
        <path d="M17 2v30" />
        <path d="M17 7l-4 4M17 7l4 4M17 27l-4-4M17 27l4-4" />
      </g>
    ))}
  </svg>
);

const SimCard: React.FC<{color: string; w?: number; frost?: number}> = ({color, w = 300, frost = 0}) => (
  <div style={{width: w, height: w * 0.78, borderRadius: 26, ...card(color), padding: 20, position: 'relative', overflow: 'hidden'}}>
    <div style={{position: 'absolute', top: 22, left: 22, width: 66, height: 52, borderRadius: 10, background: `linear-gradient(135deg, ${color}55, ${color}22)`, border: `1px solid ${color}`}}>
      <div style={{position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: color, opacity: 0.6}} />
      <div style={{position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: color, opacity: 0.6}} />
    </div>
    <div style={{position: 'absolute', right: 22, top: 22, fontFamily: unbounded, fontWeight: 800, fontSize: 26, color, letterSpacing: 2}}>SIM</div>
    <div style={{position: 'absolute', left: 22, bottom: 22, fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.muted}}>+7 •••</div>
    {frost > 0 ? <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 70% 80%, ${ICE}22, transparent 60%)`, opacity: frost}} /> : null}
  </div>
);

const StatusRow: React.FC<{ok: boolean; label: string; opacity: number}> = ({ok, label, opacity}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: ok ? `${C.vpn}14` : `${C.danger}14`, border: `1px solid ${ok ? C.vpn : C.danger}55`, opacity}}>
    {ok ? <Check size={30} color={C.vpn} t={opacity} /> : <Cross size={30} color={C.danger} t={opacity} />}
    <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 28, color: C.white}}>{label}</span>
  </div>
);

// ---------------------------------------------------------------------------
type Beat = {id: string; color: string; kicker?: string; node: React.ReactNode};
const BEATS: Beat[] = [
  {id: 'hook_back', color: ICE, node: <>Вернулся из-за границы,<br />а <Accent color={ICE}>интернета нет?</Accent></>},
  {id: 'hook_cool', color: ICE, node: <>Твоя SIM<br /><Accent color={ICE}>«остывает»</Accent></>},

  {id: 'what_law', color: ICE, kicker: 'С 10 ноября', node: <>Период <Accent color={ICE}>охлаждения</Accent><br />SIM-карт</>},
  {id: 'what_off', color: C.danger, node: <>Сутки без интернета<br />и <Accent color={C.danger}>SMS</Accent></>},
  {id: 'what_calls', color: C.vpn, node: <>Но <Accent color={C.vpn}>звонки работают</Accent></>},

  {id: 'trig_two', color: ICE, kicker: 'Когда включается', node: <>Два случая</>},
  {id: 'trig_roam', color: ICE, node: <>Вернулся<br /><Accent color={ICE}>из роуминга</Accent></>},
  {id: 'trig_silent', color: ICE, node: <>SIM молчала<br /><Accent color={ICE}>больше 72 часов</Accent></>},

  {id: 'why_check', color: '#FFC24B', kicker: 'Зачем', node: <>Проверить, что SIM<br /><Accent color={'#FFC24B'}>у человека</Accent></>},
  {id: 'why_drone', color: '#FFC24B', node: <>А не встроена<br /><Accent color={C.danger}>в беспилотник</Accent></>},

  {id: 'how_captcha', color: C.vpn, kicker: 'Как снять', node: <>На номер придёт<br /><Accent color={C.vpn}>капча</Accent></>},
  {id: 'how_back', color: C.vpn, node: <>Прошёл —<br /><Accent color={C.vpn}>интернет вернулся</Accent></>},
];

const Headlines: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {BEATS.map((beat, i) => {
        const s = start(beat.id);
        const next = i < BEATS.length - 1 ? start(BEATS[i + 1].id) : start('cta_half');
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

// Scene 1 — the frozen SIM with a 24h timer, and what's off/on.
const FrozenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sim = appear(frame, start('hook_back') + 6);
  const flake = Math.sin(frame / 30) * 6;
  const off = appear(frame, start('what_off'));
  const calls = appear(frame, start('what_calls'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'hook_back', 'what_calls'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 540 - 150, top: 660, opacity: sim, translate: `0 ${flake}px`}}>
        <SimCard color={ICE} w={300} frost={1} />
        <div style={{position: 'absolute', right: -18, top: -18}}><Snowflake color={ICE} size={54} /></div>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: -54, textAlign: 'center', fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: ICE}}>24:00:00</div>
      </div>
      <div style={{position: 'absolute', left: 150, right: 150, top: 1030, display: 'flex', flexDirection: 'column', gap: 14}}>
        <StatusRow ok={false} label="мобильный интернет" opacity={off} />
        <StatusRow ok={false} label="SMS" opacity={off} />
        <StatusRow ok label="звонки" opacity={calls} />
      </div>
    </div>
  );
};

// Scene 2 — the two triggers.
const TriggersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = [
    {id: 'trig_roam', n: '1', label: 'Вернулся из роуминга', glyph: '✈'},
    {id: 'trig_silent', n: '2', label: 'SIM молчала > 72 ч', glyph: '⏱'},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'trig_two', 'trig_silent'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, right: 130, top: 760, display: 'flex', flexDirection: 'column', gap: 22}}>
        {cards.map((c) => {
          const a = appear(frame, start(c.id) - 2);
          return (
            <div key={c.id} style={{...card(ICE), padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 22, opacity: a, translate: `${interpolate(a, [0, 1], [30, 0], CLAMP)}px 0`}}>
              <div style={{width: 64, height: 64, borderRadius: 18, background: `${ICE}1f`, border: `1px solid ${ICE}`, display: 'grid', placeItems: 'center', fontSize: 34, color: ICE}}>{c.glyph}</div>
              <div>
                <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, color: C.muted}}>СЛУЧАЙ {c.n}</div>
                <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 34, color: C.white, marginTop: 4}}>{c.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PersonGlyph: React.FC<{color: string; size?: number}> = ({color, size = 60}) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round">
    <circle cx="30" cy="20" r="10" />
    <path d="M12 48c2-10 9-15 18-15s16 5 18 15" />
  </svg>
);
const DroneGlyph: React.FC<{color: string; size?: number}> = ({color, size = 60}) => (
  <svg width={size} height={size} viewBox="0 0 64 60" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round">
    <circle cx="12" cy="14" r="8" />
    <circle cx="52" cy="14" r="8" />
    <path d="M12 14h40M18 20l12 14M46 20L34 34" />
    <rect x="24" y="34" width="16" height="12" rx="3" />
  </svg>
);

// Scene 3 — the reason: verify a human, not a drone.
const WhyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const drone = appear(frame, start('why_drone'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'why_check', 'why_drone'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 150, top: 740, width: 340, ...card(C.vpn), padding: 26, textAlign: 'center'}}>
        <div style={{display: 'grid', placeItems: 'center', height: 68}}><PersonGlyph color={C.vpn} /></div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.vpn, marginTop: 8}}>человек</div>
        <div style={{marginTop: 12, display: 'flex', justifyContent: 'center'}}><Check size={40} color={C.vpn} t={appear(frame, start('why_check') + 6)} /></div>
      </div>
      <div style={{position: 'absolute', left: 590, top: 740, width: 340, ...card(C.danger), padding: 26, textAlign: 'center', opacity: drone}}>
        <div style={{display: 'grid', placeItems: 'center', height: 68}}><DroneGlyph color={C.danger} /></div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.danger, marginTop: 8}}>беспилотник</div>
        <div style={{marginTop: 12, display: 'flex', justifyContent: 'center'}}><Cross size={40} color={C.danger} t={drone} /></div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', opacity: drone}}>
        <Pill color={ICE}>SIM должна быть у человека, а не в дроне</Pill>
      </div>
    </div>
  );
};

// Scene 4 — captcha lifts the block.
const CaptchaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const check = appear(frame, start('how_captcha') + 10);
  const back = appear(frame, start('how_back'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 'how_captcha', 'how_back'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 240, top: 720, width: 600, ...card(C.vpn), padding: 30}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{width: 54, height: 54, borderRadius: 12, border: `2px solid ${check > 0.5 ? C.vpn : C.muted}`, display: 'grid', placeItems: 'center', background: check > 0.5 ? `${C.vpn}22` : 'transparent'}}>
            {check > 0.5 ? <Check size={36} color={C.vpn} t={check} /> : null}
          </div>
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 34, color: C.white}}>Я не робот</span>
          <span style={{marginLeft: 'auto', fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.muted}}>captcha</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 940, display: 'flex', justifyContent: 'center', opacity: back}}>
        <Pill color={C.vpn}>проверка пройдена · интернет вернулся</Pill>
      </div>
    </div>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [start('cta_half') - 8, start('cta_half') + 16], [0, 1], {...CLAMP, easing: ease.out});
  const btn = appear(frame, start('cta_brand'));
  const tap = appear(frame, start('cta_tap'));
  const float = Math.sin(frame / 40) * 6;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, zIndex: 30}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 520, height: 520, borderRadius: '50%', background: C.vpn, filter: 'blur(150px)', opacity: 0.22, position: 'absolute', top: -40}} />
        <Img src={staticFile('assets/mascot/ghostpepe-main.png')} style={{width: 300, height: 300, objectFit: 'contain', translate: `0 ${float}px`, filter: 'drop-shadow(0 20px 50px rgba(0,0,0,0.5))'}} />
        <div style={{...typo.display, fontSize: 58, textAlign: 'center', marginTop: 8}}>Интернет вернулся —<br /><Accent color={C.vpn}>но не весь</Accent></div>
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
    if (frame < start('trig_two')) return ICE;
    if (frame < start('why_check')) return ICE;
    if (frame < start('how_captcha')) return '#FFC24B';
    return C.vpn;
  };
  return <>{children(pick())}</>;
};

export const GhostPepeSimCooldownReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Tint>{(t) => <Backdrop tint={t} />}</Tint>
      <FrozenScene />
      <TriggersScene />
      <WhyScene />
      <CaptchaScene />
      <Headlines />
      <CtaScene />
      <Audio src={staticFile('generated/voiceover-sim-cooldown.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.04} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

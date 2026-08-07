import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-wifi-not-internet.json';
import captionsData from '../generated/captions-wifi-not-internet.json';
import {LayoutRegistryProvider} from '../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../reel-system/layout/SafeArea';
import {captionSlot} from '../reel-system/layout/safe-area';
import {LAYERS} from '../reel-system/layers';
import {manrope, unbounded} from '../theme/fonts';
import {ease, type as typo} from '../theme/tokens';
import {makeTiming, CLAMP} from '../reel-system/reel-kit';
import {C, card, Pill} from '../components/vpn-explainer/parts';

const T = makeTiming(timeline);
const MINT = C.vpn;
const DANGER = '#FF6B61';

const A = {
  mascot: 'assets/mascot/ghostpepe-main.png',
  user: 'assets/characters/ghostpepe-user-confused-v1.png',
  packet: 'assets/characters/ghostpepe-data-packet-v1.png',
  gate: 'assets/characters/ghostpepe-gatekeeper-v1.png',
  wifi: 'assets/characters/ghostpepe-fake-wifi-v1.png',
  spirit: 'assets/characters/ghostpepe-loading-spirit-v1.png',
} as const;

// Character render: baked-background PNG feathered with a radial mask so it floats
// on the dark stage, with a soft breathing float.
const Char: React.FC<{
  src: string; x: number; y: number; w: number; opacity?: number; enterFrom?: number; flip?: boolean; floatAmp?: number; mask?: string;
}> = ({src, x, y, w, opacity = 1, enterFrom, flip, floatAmp = 8, mask = 'radial-gradient(ellipse at 50% 46%, #000 52%, transparent 74%)'}) => {
  const frame = useCurrentFrame();
  const enter = enterFrom === undefined ? 1 : T.appear(frame, enterFrom, 16);
  const float = Math.sin(frame / 44) * floatAmp;
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: 'absolute', left: x, top: y, width: w, height: w * 1.5,
        objectFit: 'contain',
        opacity: opacity * enter,
        translate: `0 ${float + interpolate(enter, [0, 1], [30, 0], CLAMP)}px`,
        transform: flip ? 'scaleX(-1)' : undefined,
        maskImage: mask, WebkitMaskImage: mask,
        filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))',
      }}
    />
  );
};

// A clean phone with Wi-Fi bars, a video thumbnail and a play/loading state.
const Phone: React.FC<{x: number; y: number; scale?: number; loading?: boolean; playing?: boolean; opacity?: number}> = ({x, y, scale = 1, loading = true, playing = false, opacity = 1}) => {
  const frame = useCurrentFrame();
  const spin = (frame * 7) % 360;
  const w = 300 * scale, h = 600 * scale;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity, borderRadius: 46 * scale, background: 'linear-gradient(160deg,#202a2c,#0b1113)', border: '1px solid rgba(184,255,243,0.22)', boxShadow: '0 50px 100px rgba(0,0,0,0.6)'}}>
      <div style={{position: 'absolute', inset: 16 * scale, borderRadius: 34 * scale, background: '#080e10', overflow: 'hidden'}}>
        {/* status: wifi bars full */}
        <div style={{position: 'absolute', top: 20 * scale, left: 24 * scale, right: 24 * scale, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 18 * scale, color: 'rgba(246,250,249,0.55)'}}>9:41</span>
          <div style={{display: 'flex', gap: 3 * scale, alignItems: 'flex-end'}}>
            {[1, 2, 3, 4].map((i) => <span key={i} style={{width: 6 * scale, height: (5 + i * 5) * scale, borderRadius: 2, background: MINT}} />)}
          </div>
        </div>
        {/* video area */}
        <div style={{position: 'absolute', top: 70 * scale, left: 22 * scale, right: 22 * scale, height: 300 * scale, borderRadius: 24 * scale, background: 'linear-gradient(150deg, rgba(34,240,208,0.10), rgba(9,16,18,0.9))', border: '1px solid rgba(184,255,243,0.12)', display: 'grid', placeItems: 'center'}}>
          {playing ? (
            <div style={{width: 0, height: 0, borderStyle: 'solid', borderWidth: `${22 * scale}px 0 ${22 * scale}px ${36 * scale}px`, borderColor: `transparent transparent transparent ${MINT}`}} />
          ) : loading ? (
            <div style={{width: 70 * scale, height: 70 * scale, borderRadius: '50%', border: `${6 * scale}px solid rgba(255,255,255,0.12)`, borderTopColor: MINT, rotate: `${spin}deg`}} />
          ) : null}
        </div>
        <div style={{position: 'absolute', top: 396 * scale, left: 22 * scale, right: 22 * scale, height: 10 * scale, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
          <div style={{height: '100%', width: playing ? '96%' : '8%', background: MINT, borderRadius: 6}} />
        </div>
      </div>
    </div>
  );
};

const WifiArc: React.FC<{x: number; y: number; on: number; color?: string}> = ({x, y, on, color = MINT}) => (
  <svg width="160" height="120" viewBox="0 0 160 120" style={{position: 'absolute', left: x, top: y, opacity: on}}>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${40 + i * 8} ${90 - i * 6} A ${40 - i * 12} ${40 - i * 12} 0 0 1 ${120 - i * 8} ${90 - i * 6}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" opacity={0.55 + i * 0.15} />
    ))}
    <circle cx="80" cy="92" r="6" fill={color} />
  </svg>
);

// ---------------------------------------------------------------------------
// Top scene labels (short caps — never a word-for-word copy of the subtitle).
type Label = {id: string; color: string; kicker?: string; node: React.ReactNode; size?: number; center?: boolean};
const LABELS: Label[] = [
  {id: 's1_bars', color: DANGER, node: <>4 полоски.<br /><span style={{color: DANGER}}>Интернета нет.</span></>, size: 66},
  {id: 's2_look', color: MINT, kicker: 'GhostPepe объясняет', node: <>Полоски — это<br />телефон и роутер</>, size: 54},
  {id: 's3_net', color: MINT, node: <>Wi-Fi <span style={{color: DANGER}}>≠</span> интернет</>, size: 72, center: true},
  {id: 's4_send', color: MINT, kicker: 'Шаг 1', node: <>Телефон <span style={{color: MINT}}>→</span> роутер</>, size: 58, center: true},
  {id: 's5_journey', color: MINT, kicker: 'Шаг 2', node: <>Настоящее<br /><span style={{color: MINT}}>путешествие</span></>, size: 60},
  {id: 's7_notfix', color: C.white, kicker: 'Честно', node: <>Не любую<br />медленную сеть</>, size: 56},
  {id: 's8_stable', color: MINT, kicker: 'Если дело в маршруте', node: <>Более стабильный<br /><span style={{color: MINT}}>путь</span></>, size: 56},
  {id: 's10_remember', color: C.white, kicker: 'Запомни', node: <>Дверь и весь<br />путь за ней</>, size: 58},
];

const SceneLabels: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {LABELS.map((l, i) => {
        const s = T.start(l.id);
        const next = i < LABELS.length - 1 ? T.start(LABELS[i + 1].id) : T.start('s11_bot');
        const op = interpolate(frame, [s, s + 8, Math.max(s + 9, next - 12), Math.max(s + 10, next - 4)], [0, 1, 1, 0], CLAMP);
        if (op <= 0.001) return null;
        return (
          <div key={l.id} style={{position: 'absolute', left: 90, top: 244, width: 900, opacity: op, translate: `0 ${interpolate(op, [0, 1], [10, 0], CLAMP)}px`, display: 'flex', flexDirection: 'column', gap: 12, alignItems: l.center ? 'center' : 'flex-start', zIndex: LAYERS.TEXT}}>
            {l.kicker ? (
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <span style={{width: 34, height: 3, borderRadius: 3, background: l.color, boxShadow: `0 0 12px ${l.color}`}} />
                <span style={{...typo.kicker, color: l.color}}>{l.kicker}</span>
              </div>
            ) : null}
            <div style={{...typo.display, fontSize: l.size ?? 60, textAlign: l.center ? 'center' : 'left', textShadow: '0 14px 40px rgba(0,0,0,0.7)'}}>{l.node}</div>
          </div>
        );
      })}
    </>
  );
};

// Bottom phrase subtitles (Unbounded, <=2 lines, stable caption slot, mint word tint).
const balance = (text: string): React.ReactNode => {
  const words = text.trim().split(/\s+/);
  if (words.length <= 4) return text;
  const mid = Math.ceil(words.length / 2);
  return <>{words.slice(0, mid).join(' ')}<br />{words.slice(mid).join(' ')}</>;
};
const Subtitles: React.FC = () => {
  const {fps} = timeline;
  const finaleMs = timeline.segments.find((s) => s.id === 's11_bot')?.startMs ?? Infinity;
  // The finale carries its own big slogan + CTA, so bottom subtitles are hidden
  // there (they would collide with the CTA button).
  const pages = (captionsData as {text: string; startMs: number; durationMs: number}[]).filter((p) => p.startMs < finaleMs - 100);
  const slot = captionSlot(150);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.CAPTIONS}}>
      {pages.map((p, i) => {
        const from = Math.round((p.startMs / 1000) * fps);
        const dur = Math.max(1, Math.round((p.durationMs / 1000) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <SubPage text={p.text} dur={dur} slot={slot} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
const SubPage: React.FC<{text: string; dur: number; slot: {x: number; y: number; width: number}}> = ({text, dur, slot}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 6, dur - 6, dur], [0, 1, 1, 0], CLAMP);
  return (
    <div style={{position: 'absolute', left: slot.x, top: slot.y, width: slot.width, display: 'flex', justifyContent: 'center'}}>
      <div style={{maxWidth: 860, padding: '18px 30px', borderRadius: 22, background: 'rgba(6,12,14,0.62)', border: '1px solid rgba(184,255,243,0.12)', backdropFilter: 'blur(6px)', textAlign: 'center', opacity: op, translate: `0 ${interpolate(op, [0, 1], [8, 0], CLAMP)}px`}}>
        <span style={{fontFamily: unbounded, fontWeight: 700, fontSize: 40, lineHeight: 1.16, letterSpacing: -0.5, color: C.white, textShadow: `0 0 20px ${MINT}44`}}>{balance(text)}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
const so = (a: string, b: string) => (frame: number) => T.sceneOpacity(frame, a, b);

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const op = so('s1_bars', 's1_how')(frame);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, zIndex: LAYERS.HERO}}>
      <Char src={A.user} x={70} y={720} w={520} />
      <Phone x={620} y={640} scale={1} loading />
      <WifiArc x={690} y={560} on={T.appear(frame, T.start('s1_bars'))} />
    </div>
  );
};

const Enter: React.FC = () => {
  const frame = useCurrentFrame();
  const smoke = T.appear(frame, T.start('s2_look'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s2_look', 's3_net')(frame), zIndex: LAYERS.HERO}}>
      <div style={{position: 'absolute', left: 300, top: 700, width: 480, height: 480, borderRadius: '50%', background: MINT, filter: 'blur(150px)', opacity: 0.22 * smoke}} />
      <Char src={A.mascot} x={300} y={560} w={480} enterFrom={T.start('s2_look')} floatAmp={6} mask="radial-gradient(ellipse at 50% 44%, #000 56%, transparent 76%)" />
    </div>
  );
};

const WifiNotNet: React.FC = () => {
  const frame = useCurrentFrame();
  const beam = T.appear(frame, T.start('s3_notmean'));
  const city = T.appear(frame, T.start('s3_net'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s3_notmean', 's3_net')(frame), zIndex: LAYERS.HERO}}>
      {/* dark city behind the router */}
      <div style={{position: 'absolute', left: 560, top: 640, width: 460, height: 620, opacity: city * 0.9, borderRadius: 26, background: 'repeating-linear-gradient(90deg, rgba(184,255,243,0.05) 0 3px, transparent 3px 46px), repeating-linear-gradient(0deg, rgba(184,255,243,0.05) 0 3px, transparent 3px 60px)', maskImage: 'radial-gradient(ellipse at 60% 40%, #000 30%, transparent 80%)'}} />
      <Phone x={120} y={760} scale={0.72} loading />
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
        <line x1={330} y1={980} x2={520} y2={900} stroke={MINT} strokeWidth="6" strokeLinecap="round" opacity={beam} style={{filter: `drop-shadow(0 0 10px ${MINT})`}} />
      </svg>
      <Char src={A.wifi} x={520} y={640} w={380} mask="radial-gradient(ellipse at 50% 42%, #000 46%, transparent 68%)" />
    </div>
  );
};

const PacketBirth: React.FC = () => {
  const frame = useCurrentFrame();
  const fly = T.appear(frame, T.start('s4_fast'));
  const px = interpolate(fly, [0, 1], [180, 560], CLAMP);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s4_send', 's4_torouter')(frame), zIndex: LAYERS.HERO}}>
      <Phone x={90} y={780} scale={0.66} loading={false} />
      <Char src={A.packet} x={px} y={720} w={360} floatAmp={5} />
      <Char src={A.wifi} x={760} y={740} w={280} mask="radial-gradient(ellipse at 50% 42%, #000 46%, transparent 68%)" />
    </div>
  );
};

const Journey: React.FC = () => {
  const frame = useCurrentFrame();
  const queue = so('s5_journey', 's5_queue')(frame);
  const detour = so('s5_detour', 's5_detour')(frame);
  const check = so('s5_check', 's5_stuck')(frame);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s5_journey', 's5_stuck')(frame), zIndex: LAYERS.HERO}}>
      {/* 5.1 queue */}
      <div style={{position: 'absolute', inset: 0, opacity: queue}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 780, display: 'flex', justifyContent: 'center', gap: 20, alignItems: 'center'}}>
          {[0, 1, 2].map((i) => <div key={i} style={{width: 84, height: 84, borderRadius: 20, ...card(DANGER)}} />)}
          <Char src={A.packet} x={0} y={0} w={300} opacity={1} mask="radial-gradient(ellipse at 50% 46%, #000 50%, transparent 72%)" floatAmp={4} />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1120, display: 'flex', justifyContent: 'center'}}><Pill color={DANGER}>ОЧЕРЕДЬ</Pill></div>
      </div>
      {/* 5.2 detour */}
      <div style={{position: 'absolute', inset: 0, opacity: detour}}>
        <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
          <path d="M 200 900 C 500 640, 900 640, 820 980 S 300 1200, 560 980" fill="none" stroke={DANGER} strokeWidth="5" strokeDasharray="14 16" strokeDashoffset={-frame * 3} opacity={0.8} />
        </svg>
        <Char src={A.packet} x={560} y={720} w={300} floatAmp={4} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 1120, display: 'flex', justifyContent: 'center'}}><Pill color={DANGER}>ЛИШНИЙ КРУГ</Pill></div>
      </div>
      {/* 5.3 checkpoint */}
      <div style={{position: 'absolute', inset: 0, opacity: check}}>
        <Char src={A.gate} x={520} y={640} w={440} mask="radial-gradient(ellipse at 50% 44%, #000 50%, transparent 72%)" />
        <Char src={A.packet} x={130} y={820} w={280} floatAmp={4} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center'}}><Pill color={DANGER}>ЕЩЁ ОДНА ПРОВЕРКА</Pill></div>
      </div>
    </div>
  );
};

const Loading: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s6_shines', 's6_newlife')(frame), zIndex: LAYERS.HERO}}>
      <Phone x={110} y={760} scale={0.7} loading />
      <WifiArc x={150} y={690} on={1} />
      <Char src={A.spirit} x={520} y={620} w={470} mask="radial-gradient(ellipse at 50% 44%, #000 48%, transparent 70%)" floatAmp={5} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1180, display: 'flex', justifyContent: 'center', opacity: T.appear(frame, T.start('s6_newlife'))}}><Pill color={MINT}>кружок живёт уже несколько лет</Pill></div>
    </div>
  );
};

const TwoCases: React.FC = () => {
  const frame = useCurrentFrame();
  const right = T.appear(frame, T.start('s7_noair'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s7_notfix', 's7_noair')(frame), zIndex: LAYERS.HERO}}>
      <div style={{position: 'absolute', left: 110, top: 720, width: 380, ...card(DANGER), padding: 26, textAlign: 'center'}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: DANGER}}>СЛАБЫЙ СИГНАЛ</div>
        <svg width="320" height="120" viewBox="0 0 320 120" style={{marginTop: 14}}><path d="M20 60 h120 m40 0 h120" stroke={DANGER} strokeWidth="6" strokeLinecap="round" strokeDasharray="10 14" /><path d="M150 40 l20 40 m0 -40 l-20 40" stroke={DANGER} strokeWidth="5" strokeLinecap="round" /></svg>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 22, color: C.muted, marginTop: 8}}>телефон ↔ роутер</div>
      </div>
      <div style={{position: 'absolute', left: 590, top: 720, width: 380, ...card(MINT), padding: 26, textAlign: 'center', opacity: right}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: MINT}}>ПРОБЛЕМА В МАРШРУТЕ</div>
        <svg width="320" height="120" viewBox="0 0 320 120" style={{marginTop: 14}}><path d="M20 90 C 120 20, 200 120, 300 40" fill="none" stroke={MINT} strokeWidth="6" strokeLinecap="round" strokeDasharray="12 12" /></svg>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 22, color: C.muted, marginTop: 8}}>после роутера</div>
      </div>
      <Char src={A.mascot} x={370} y={1080} w={340} mask="radial-gradient(ellipse at 50% 44%, #000 56%, transparent 76%)" floatAmp={5} />
    </div>
  );
};

const NewRoute: React.FC = () => {
  const frame = useCurrentFrame();
  const fold = T.appear(frame, T.start('s8_helps'));
  const px = interpolate(T.appear(frame, T.start('s8_stable')), [0, 1], [180, 820], CLAMP);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s8_ifroute', 's8_stable')(frame), zIndex: LAYERS.HERO}}>
      {/* tangled routes fading into one clean tunnel */}
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
        <path d="M 160 900 C 500 640, 700 1180, 900 900" fill="none" stroke={DANGER} strokeWidth="5" strokeDasharray="12 14" opacity={interpolate(fold, [0, 1], [0.7, 0], CLAMP)} />
        <path d="M 160 940 L 920 940" fill="none" stroke={MINT} strokeWidth="10" strokeLinecap="round" opacity={fold} style={{filter: `drop-shadow(0 0 14px ${MINT})`}} />
      </svg>
      <div style={{position: 'absolute', left: 140, top: 880, width: 800, height: 120, borderRadius: 60, border: `2px solid ${MINT}`, opacity: fold * 0.7, boxShadow: `inset 0 0 40px ${MINT}44`}} />
      <Char src={A.packet} x={px} y={800} w={280} floatAmp={4} />
      <Char src={A.gate} x={760} y={560} w={300} opacity={0.5} mask="radial-gradient(ellipse at 50% 44%, #000 48%, transparent 70%)" />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1140, display: 'flex', justifyContent: 'center', opacity: T.appear(frame, T.start('s8_stable'))}}><Pill color={MINT}>БОЛЕЕ СТАБИЛЬНЫЙ ПУТЬ</Pill></div>
    </div>
  );
};

const Resolve: React.FC = () => {
  const frame = useCurrentFrame();
  const plays = T.appear(frame, T.start('s9_plays'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s9_arrives', 's9_believe')(frame), zIndex: LAYERS.HERO}}>
      <Char src={A.packet} x={80} y={760} w={320} floatAmp={5} />
      <Phone x={640} y={700} scale={0.82} loading={false} playing={plays > 0.4} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1170, display: 'flex', justifyContent: 'center', opacity: plays}}><Pill color={MINT}>видео запускается</Pill></div>
    </div>
  );
};

const Simple: React.FC = () => {
  const frame = useCurrentFrame();
  const door = T.appear(frame, T.start('s10_door'));
  const path = T.appear(frame, T.start('s10_path'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: so('s10_remember', 's10_path')(frame), zIndex: LAYERS.HERO}}>
      <div style={{position: 'absolute', left: 90, right: 90, top: 820, height: 200}}>
        <Phone x={0} y={-40} scale={0.44} loading={false} />
        <Char src={A.wifi} x={230} y={-70} w={200} mask="radial-gradient(ellipse at 50% 42%, #000 46%, transparent 68%)" floatAmp={3} />
        {/* short door segment */}
        <svg width="900" height="200" style={{position: 'absolute', left: 0, top: 60}}>
          <line x1={150} y1={40} x2={330} y2={40} stroke={MINT} strokeWidth="8" strokeLinecap="round" opacity={door} />
          <line x1={370} y1={40} x2={860} y2={40} stroke={C.muted} strokeWidth="6" strokeLinecap="round" strokeDasharray="10 12" opacity={path} />
          <circle cx={860} cy={40} r={16} fill="#0d1517" stroke={MINT} strokeWidth="3" opacity={path} />
        </svg>
      </div>
      <div style={{position: 'absolute', left: 120, top: 1080, opacity: door}}><Pill color={MINT}>Wi-Fi = дверь до роутера</Pill></div>
      <div style={{position: 'absolute', left: 120, top: 1180, opacity: path}}><Pill color={C.white}>интернет = весь путь после неё</Pill></div>
    </div>
  );
};

const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [T.start('s11_bot') - 8, T.start('s11_bot') + 16], [0, 1], {...CLAMP, easing: ease.out});
  const slogan = T.appear(frame, T.start('s11_notlight'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: op, zIndex: LAYERS.BRAND}}>
      <div style={{position: 'absolute', left: 540 - 280, top: 460, width: 560, height: 560, borderRadius: '50%', background: MINT, filter: 'blur(160px)', opacity: 0.2}} />
      <Char src={A.mascot} x={360} y={430} w={360} mask="radial-gradient(ellipse at 50% 44%, #000 56%, transparent 76%)" floatAmp={5} />
      <Char src={A.user} x={90} y={760} w={300} opacity={0.9} floatAmp={4} />
      <Char src={A.packet} x={700} y={780} w={280} opacity={0.9} floatAmp={5} />
      <div style={{position: 'absolute', left: 90, right: 90, top: 1010, textAlign: 'center'}}>
        <div style={{...typo.display, fontSize: 56, opacity: slogan}}>Не быстрее света.<br /><span style={{color: MINT}}>Просто умнее маршрут.</span></div>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 44, color: C.white, marginTop: 26}}>GhostPepeBot</div>
        <div style={{marginTop: 16, display: 'inline-flex', padding: '16px 40px', borderRadius: 999, background: `linear-gradient(180deg,#8CFFE9,${MINT})`, color: '#06110F', fontFamily: unbounded, fontWeight: 800, fontSize: 32, boxShadow: `0 20px 60px ${MINT}55`}}>Ссылка в профиле</div>
      </div>
    </div>
  );
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, T.total], [0, 46], CLAMP);
  return (
    <>
      <Img src={staticFile('assets/backgrounds/cyberspace-dark.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'brightness(0.42) saturate(0.9)', scale: String(interpolate(frame, [0, T.total], [1.04, 1.1], CLAMP))}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, rgba(34,240,208,0.14), rgba(6,12,13,0.6) 46%, rgba(3,7,8,0.92) 82%)'}} />
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '74px 74px', backgroundPosition: `0 ${drift}px`, maskImage: 'radial-gradient(ellipse at 50% 46%, #000 38%, transparent 78%)', opacity: 0.5}} />
    </>
  );
};

const sfx = (id: string, from: string, vol = 0.14, lead = 0) => ({id, from: Math.max(0, T.start(from) + lead), vol});
const SFX: React.FC = () => {
  const cues = [
    sfx('click', 's1_bars', 0.2, 6),
    sfx('whoosh', 's2_look', 0.18),
    sfx('whoosh', 's4_send', 0.16, 8),
    sfx('click', 's5_check', 0.14),
    sfx('connect', 's8_helps', 0.14),
    sfx('connect', 's9_arrives', 0.2),
  ];
  return (
    <>
      {cues.map((c, i) => (
        <Sequence key={i} from={c.from} layout="none"><Audio src={staticFile(`generated/${c.id}.wav`)} volume={c.vol} /></Sequence>
      ))}
    </>
  );
};

export const GhostPepeWifiNotInternetReel: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <Backdrop />
      <Hook />
      <Enter />
      <WifiNotNet />
      <PacketBirth />
      <Journey />
      <Loading />
      <TwoCases />
      <NewRoute />
      <Resolve />
      <Simple />
      <SceneLabels />
      <Finale />
      <Subtitles />
      <Audio src={staticFile('generated/voiceover-wifi-not-internet.wav')} volume={1} />
      <Audio src={staticFile('generated/ambient.wav')} loop volume={0.05} />
      <SFX />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

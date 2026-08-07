import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-ping.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, CLAMP, type Beat} from '../reel-system/reel-kit';
import {card, Pill} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const BEATS: Beat[] = [
  {id: 'hook_world', color: AMBER, node: <>Твой клик оббегает<br /><Accent color={AMBER}>полмира за 40 мс</Accent></>},
  {id: 'hook_how', color: C.danger, node: <>Как так?</>},
  {id: 'not_direct', color: AMBER, kicker: 'Разбираемся', node: <>Запрос идёт<br /><Accent color={AMBER}>не напрямую</Accent></>},
  {id: 'hops', color: AMBER, node: <>Прыгает по узлам,<br />как <Accent color={AMBER}>по камням</Accent></>},
  {id: 'each_time', color: C.danger, node: <>Каждый прыжок —<br /><Accent color={C.danger}>время</Accent></>},
  {id: 'ping_is', color: C.vpn, kicker: 'Пинг', node: <>Это время<br /><Accent color={C.vpn}>туда и обратно</Accent></>},
  {id: 'farther', color: C.danger, node: <>Дальше сервер —<br /><Accent color={C.danger}>больше лаг</Accent></>},
  {id: 'vpn_near', color: C.vpn, kicker: 'Вывод', node: <>Близкий сервер —<br /><Accent color={C.vpn}>это скорость</Accent></>},
  {id: 'vpn_choose', color: C.vpn, node: <>Выбирай поближе —<br /><Accent color={C.vpn}>и лага нет</Accent></>},
];

const HopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const go = T.appear(frame, T.start('hops'));
  const nodes = [150, 330, 510, 690, 870];
  const y = 820;
  const dotIdx = interpolate(((frame - T.start('hops')) % 60) / 60, [0, 1], [0, nodes.length - 1], CLAMP);
  const dotX = interpolate(dotIdx, nodes.map((_, i) => i), nodes, CLAMP);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'not_direct', 'each_time'), zIndex: 20}}>
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
        <line x1={150} y1={y} x2={870} y2={y} stroke={`${AMBER}44`} strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
        {nodes.map((x, i) => <circle key={i} cx={x} cy={y} r={18} fill="#0d1517" stroke={AMBER} strokeWidth="3" opacity={T.appear(frame, T.start('not_direct') + i * 3)} />)}
        <circle cx={dotX} cy={y} r={10} fill={AMBER} opacity={go} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 700, textAlign: 'center', fontFamily: manrope, fontWeight: 700, fontSize: 24, color: C.muted}}>ты → узел → узел → узел → сайт</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 960, display: 'flex', justifyContent: 'center', opacity: T.appear(frame, T.start('each_time'))}}>
        <Pill color={C.danger}>каждый прыжок добавляет миллисекунды</Pill>
      </div>
    </div>
  );
};

const PingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const far = T.appear(frame, T.start('farther'));
  const meter = (label: string, ms: number, color: string, w: number, o: number) => (
    <div style={{...card(color), padding: '22px 26px', opacity: o}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: manrope, fontWeight: 800, fontSize: 24, color: C.white, marginBottom: 10}}>
        <span>{label}</span><span style={{color}}>{ms} мс</span>
      </div>
      <div style={{height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${w}%`, borderRadius: 10, background: color, boxShadow: `0 0 16px ${color}`}} />
      </div>
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'ping_is', 'farther'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, right: 130, top: 780, display: 'flex', flexDirection: 'column', gap: 22}}>
        {meter('сервер рядом', 40, C.vpn, 22, T.appear(frame, T.start('ping_is')))}
        {meter('сервер далеко', 180, C.danger, 90, far)}
      </div>
    </div>
  );
};

const VpnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const near = T.appear(frame, T.start('vpn_near') + 4);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'vpn_near', 'vpn_choose'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 240, top: 800, width: 600, ...card(C.vpn), padding: 34, textAlign: 'center', opacity: near, transform: `scale(${interpolate(near, [0, 1], [0.92, 1], CLAMP)})`}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 64, color: C.vpn}}>~40 мс</div>
        <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: C.muted, marginTop: 8}}>VPN-сервер рядом — минимум лага</div>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('not_direct') ? AMBER : frame < T.start('ping_is') ? AMBER : frame < T.start('vpn_near') ? C.danger : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepePingReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-ping.wav">
    <Tinted />
    <HopScene />
    <PingScene />
    <VpnScene />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>VPN с сервером <Accent color={C.vpn}>поближе</Accent></CtaBlock>
  </ReelRoot>
);

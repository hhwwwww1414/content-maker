import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-ports.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, CLAMP, type Beat} from '../reel-system/reel-kit';
import {card, Pill, ProviderEye} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const Door: React.FC<{color: string; label?: string; sub?: string; glow?: number; dim?: number}> = ({color, label, sub, glow = 0, dim = 0}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 1 - dim * 0.6}}>
    <div style={{width: 96, height: 150, borderRadius: '14px 14px 6px 6px', background: `linear-gradient(180deg, ${color}22, ${color}0a)`, border: `2px solid ${color}${glow > 0.4 ? 'ff' : '55'}`, boxShadow: glow > 0.4 ? `0 0 34px ${color}88` : 'none', position: 'relative'}}>
      <div style={{position: 'absolute', right: 14, top: '50%', width: 10, height: 10, borderRadius: 5, background: color}} />
    </div>
    {label ? <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 24, color}}>{label}</span> : null}
    {sub ? <span style={{fontFamily: manrope, fontWeight: 600, fontSize: 18, color: C.muted}}>{sub}</span> : null}
  </div>
);

const BEATS: Beat[] = [
  {id: 'hook_doors', color: AMBER, node: <>У устройства<br /><Accent color={AMBER}>65 тысяч дверей</Accent></>},
  {id: 'hook_knock', color: C.danger, node: <>А стучишь ты<br /><Accent color={C.danger}>только в пару</Accent></>},
  {id: 'ip_house', color: AMBER, kicker: 'Разбираемся', node: <>IP-адрес —<br />это <Accent color={AMBER}>дом</Accent></>},
  {id: 'port_door', color: AMBER, node: <>Порт — это<br /><Accent color={AMBER}>дверь</Accent></>},
  {id: 'known', color: AMBER, node: <>80 — сайты<br /><Accent color={AMBER}>443 — шифр</Accent></>},
  {id: 'each_service', color: AMBER, node: <>У каждой службы<br /><Accent color={AMBER}>своя дверь</Accent></>},
  {id: 'filters_watch', color: C.danger, kicker: 'Проблема', node: <>Фильтры следят,<br /><Accent color={C.danger}>в какую дверь</Accent></>},
  {id: 'vpn_one', color: C.vpn, kicker: 'Решение', node: <>VPN уводит всё<br /><Accent color={C.vpn}>в одну дверь</Accent></>},
  {id: 'vpn_look', color: C.vpn, node: <>Снаружи —<br /><Accent color={C.vpn}>обычный стук</Accent></>},
];

const DoorsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const known = T.appear(frame, T.start('known'));
  const watch = T.appear(frame, T.start('filters_watch'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'ip_house', 'filters_watch'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 120, right: 120, top: 720, ...card(AMBER), padding: '30px 24px'}}>
        <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, letterSpacing: 2, color: C.muted, marginBottom: 18}}>ДОМ · IP-АДРЕС</div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <Door color={AMBER} label="80" sub="сайты" glow={known} />
          <Door color={AMBER} label="443" sub="шифр" glow={known} />
          <Door color={C.muted} sub="..." />
          <Door color={C.muted} sub="..." />
          <Door color={C.muted} sub="65535" />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1120, display: 'flex', justifyContent: 'center', opacity: watch}}>
        <Pill color={C.danger}>фильтр видит, в какую дверь ты постучал</Pill>
      </div>
    </div>
  );
};

const VpnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const one = T.appear(frame, T.start('vpn_one') + 4);
  const look = T.appear(frame, T.start('vpn_look'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'vpn_one', 'vpn_look'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 740, display: 'flex', justifyContent: 'center', opacity: one, transform: `scale(${interpolate(one, [0, 1], [0.9, 1], CLAMP)})`}}>
        <Door color={C.vpn} label="VPN" sub="одна зашифрованная дверь" glow={1} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', opacity: look}}>
        <ProviderEye color={C.vpn} label="Фильтр видит" sees="обычный шифрованный стук" />
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('ip_house') ? AMBER : frame < T.start('vpn_one') ? AMBER : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepePortsReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-ports.wav">
    <Tinted />
    <DoorsScene />
    <VpnScene />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Одна <Accent color={C.vpn}>надёжная дверь</Accent></CtaBlock>
  </ReelRoot>
);

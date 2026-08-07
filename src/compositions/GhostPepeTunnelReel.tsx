import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-tunnel.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, CLAMP, type Beat} from '../reel-system/reel-kit';
import {card, Pill, ProviderEye} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const Envelope: React.FC<{color: string; to: string; sealed?: boolean; w?: number}> = ({color, to, sealed, w = 460}) => (
  <div style={{width: w, ...card(color), padding: 0, overflow: 'hidden'}}>
    <div style={{height: 74, background: `linear-gradient(180deg, ${color}22, transparent)`, borderBottom: `1px solid ${color}44`, position: 'relative'}}>
      <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 50% 60%, 100% 0)', background: `${color}18`}} />
    </div>
    <div style={{padding: '20px 24px'}}>
      <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 20, color: C.muted}}>кому</div>
      <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color, marginTop: 4}}>{to}</div>
      {sealed ? <div style={{marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: `${color}18`, border: `1px solid ${color}`, fontFamily: manrope, fontWeight: 800, fontSize: 20, color}}><svg width="18" height="20" viewBox="0 0 18 20"><rect x="3" y="8" width="12" height="10" rx="2.5" stroke={color} strokeWidth="1.8" fill="none"/><path d="M5.5 8V5.5a3.5 3.5 0 0 1 7 0V8" stroke={color} strokeWidth="1.8" fill="none"/></svg>запечатано</div> : null}
    </div>
  </div>
);

const BEATS: Beat[] = [
  {id: 'hook_letter', color: AMBER, node: <>Письмо<br />внутри <Accent color={AMBER}>письма</Accent></>},
  {id: 'hook_postman', color: C.danger, node: <>Почтальон видит конверт,<br /><Accent color={C.danger}>но не то, что внутри</Accent></>},
  {id: 'req_letter', color: AMBER, kicker: 'Как есть', node: <>Твой запрос —<br />это <Accent color={AMBER}>письмо</Accent></>},
  {id: 'isp_reads', color: C.danger, node: <>Провайдер читает<br /><Accent color={C.danger}>адрес на конверте</Accent></>},
  {id: 'vpn_wrap', color: C.vpn, kicker: 'Что делает VPN', node: <>Кладёт письмо<br />в <Accent color={C.vpn}>другой конверт</Accent></>},
  {id: 'vpn_outer', color: C.vpn, node: <>Снаружи — только<br /><Accent color={C.vpn}>адрес VPN</Accent></>},
  {id: 'vpn_enc', color: C.vpn, node: <>Внутри — всё<br /><Accent color={C.vpn}>зашифровано</Accent></>},
  {id: 'reveal_encap', color: C.vpn, kicker: 'Итог', node: <>Это инкапсуляция —<br /><Accent color={C.vpn}>пакет в пакете</Accent></>},
  {id: 'reveal_see', color: C.vpn, node: <>Провайдер видит:<br /><Accent color={C.vpn}>ты говоришь с VPN</Accent></>},
];

const OpenScene: React.FC = () => {
  const frame = useCurrentFrame();
  const read = T.appear(frame, T.start('isp_reads'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'req_letter', 'isp_reads'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, top: 760}}><Envelope color={C.danger} to="сайт.com" /></div>
      <div style={{position: 'absolute', left: 660, top: 800, opacity: read}}><ProviderEye color={C.danger} label="Провайдер видит" sees="сайт.com" /></div>
    </div>
  );
};

const WrapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const wrap = T.appear(frame, T.start('vpn_wrap') + 4);
  const enc = T.appear(frame, T.start('vpn_enc'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'vpn_wrap', 'reveal_see'), zIndex: 20}}>
      {/* outer VPN envelope */}
      <div style={{position: 'absolute', left: 200, top: 700, opacity: wrap, transform: `scale(${interpolate(wrap, [0, 1], [0.94, 1], CLAMP)})`}}>
        <div style={{...card(C.vpn), padding: 26, width: 680}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18}}>
            <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.muted}}>внешний конверт → VPN-сервер</span>
          </div>
          {/* inner sealed letter */}
          <div style={{transform: 'scale(0.9)', transformOrigin: 'left top', opacity: enc}}>
            <Envelope color={C.danger} to="сайт.com" sealed w={520} />
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1220, display: 'flex', justifyContent: 'center', opacity: T.appear(frame, T.start('reveal_see'))}}>
        <Pill color={C.vpn}>провайдер видит только: ты → VPN</Pill>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('req_letter') ? C.danger : frame < T.start('vpn_wrap') ? AMBER : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeTunnelReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-tunnel.wav">
    <Tinted />
    <OpenScene />
    <WrapScene />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Спрячь письмо<br />в <Accent color={C.vpn}>конверт</Accent></CtaBlock>
  </ReelRoot>
);

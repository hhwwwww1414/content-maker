import React from 'react';
import {useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-ip-address.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, type Beat} from '../reel-system/reel-kit';
import {card, Pill, Check, Cross} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const BEATS: Beat[] = [
  {id: 'hook_threat', color: C.danger, node: <>«Вычислю<br /><Accent color={C.danger}>по айпи»</Accent></>},
  {id: 'hook_bluff', color: C.vpn, node: <>Почти всегда —<br /><Accent color={C.vpn}>это блеф</Accent></>},
  {id: 'isp', color: C.vpn, kicker: 'Видно', node: <>Провайдер и<br /><Accent color={C.vpn}>примерный город</Accent></>},
  {id: 'online', color: C.vpn, node: <>И что ты<br /><Accent color={C.vpn}>сейчас в сети</Accent></>},
  {id: 'nothome', color: C.danger, node: <>Но не квартиру<br /><Accent color={C.danger}>и не имя</Accent></>},
  {id: 'onlyisp', color: AMBER, node: <>Точный адрес — только<br /><Accent color={AMBER}>у провайдера</Accent></>},
  {id: 'vpn', color: C.vpn, node: <>VPN подменяет айпи<br /><Accent color={C.vpn}>на чужой город</Accent></>},
  {id: 'payoff', color: C.vpn, kicker: 'Итог', node: <>IP — это <Accent color={C.vpn}>район</Accent>,<br />а не дверь</>},
];

const Line: React.FC<{ok: boolean; text: string; t: number}> = ({ok, text, t}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0'}}>
    {ok ? <Check size={34} color={C.vpn} t={t} /> : <Cross size={34} color={C.danger} t={t} />}
    <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: C.white}}>{text}</span>
  </div>
);

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const online = T.appear(frame, T.start('online'));
  const nothome = T.appear(frame, T.start('nothome'));
  const vpn = T.appear(frame, T.start('vpn'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'isp', 'payoff'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', justifyContent: 'center'}}>
        <div style={{...card(vpn > 0.5 ? C.vpn : C.proxy), padding: '16px 30px', display: 'flex', alignItems: 'center', gap: 14}}>
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 24, color: C.muted}}>твой IP</span>
          <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 34, color: vpn > 0.5 ? C.vpn : C.white}}>95.{vpn > 0.5 ? '210 · Амстердам' : '13 · Пермь'}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 90, top: 960, width: 380, ...card(C.vpn), padding: '14px 24px'}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 24, color: C.vpn, marginBottom: 4}}>ВИДНО</div>
        <Line ok text="провайдер" t={T.appear(frame, T.start('isp'))} />
        <Line ok text="город" t={T.appear(frame, T.start('isp') + 6)} />
        <Line ok text="ты онлайн" t={online} />
      </div>
      <div style={{position: 'absolute', right: 90, top: 960, width: 380, ...card(C.danger), padding: '14px 24px', opacity: nothome}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 24, color: C.danger, marginBottom: 4}}>НЕ ВИДНО</div>
        <Line ok={false} text="квартира" t={nothome} />
        <Line ok={false} text="имя" t={T.appear(frame, T.start('nothome') + 6)} />
        <Line ok={false} text="кто ты" t={T.appear(frame, T.start('nothome') + 12)} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1250, display: 'flex', justifyContent: 'center', opacity: vpn}}>
        <Pill color={C.vpn}>VPN → показываешь чужой район</Pill>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('isp') ? C.danger : frame < T.start('nothome') ? C.vpn : frame < T.start('payoff') ? AMBER : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeIpAddressReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-ip-address.wav">
    <Tinted />
    <Stage />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Покажи сети <Accent color={C.vpn}>чужой район</Accent></CtaBlock>
  </ReelRoot>
);

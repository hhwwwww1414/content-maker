import React from 'react';
import {useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-incognito.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, type Beat} from '../reel-system/reel-kit';
import {card, Pill, ProviderEye, Check, Cross} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const Glasses: React.FC<{color: string; size?: number}> = ({color, size = 84}) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 84 42" fill="none">
    <circle cx="18" cy="24" r="14" stroke={color} strokeWidth="3.4" fill={`${color}22`} />
    <circle cx="66" cy="24" r="14" stroke={color} strokeWidth="3.4" fill={`${color}22`} />
    <path d="M32 22h20M4 20l6-8h8M80 20l-6-8h-8" stroke={color} strokeWidth="3.4" strokeLinecap="round" />
  </svg>
);

const BEATS: Beat[] = [
  {id: 'hook_invis', color: C.proxy, node: <>Инкогнито — это<br /><Accent color={C.proxy}>не плащ-невидимка</Accent></>},
  {id: 'hook_one', color: AMBER, node: <>Он прячет тебя<br /><Accent color={AMBER}>лишь от одного</Accent></>},
  {id: 'local', color: C.vpn, kicker: 'От кого', node: <>От того, кто возьмёт<br /><Accent color={C.vpn}>телефон после</Accent></>},
  {id: 'isp', color: C.danger, node: <>Провайдер видит,<br /><Accent color={C.danger}>куда ты ходил</Accent></>},
  {id: 'site', color: C.danger, node: <>И сайт узнаёт<br /><Accent color={C.danger}>твой адрес</Accent></>},
  {id: 'truth', color: AMBER, node: <>Это чистая история,<br /><Accent color={AMBER}>а не невидимость</Accent></>},
  {id: 'route', color: C.vpn, node: <>Скрыть маршрут —<br /><Accent color={C.vpn}>другая задача</Accent></>},
  {id: 'payoff', color: C.vpn, kicker: 'Итог', node: <>Прячет следы дома,<br /><Accent color={C.vpn}>не в сети</Accent></>},
];

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const local = T.appear(frame, T.start('local'));
  const isp = T.appear(frame, T.start('isp'));
  const site = T.appear(frame, T.start('site'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'local', 'payoff'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 800, display: 'flex', justifyContent: 'center'}}>
        <div style={{...card(AMBER), padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 16}}>
          <Glasses color={AMBER} />
          <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: AMBER}}>ИНКОГНИТО</span>
        </div>
      </div>
      {/* what it DOES hide */}
      <div style={{position: 'absolute', left: 90, top: 980, width: 280, ...card(C.vpn), padding: 20, textAlign: 'center', opacity: local}}>
        <div style={{display: 'flex', justifyContent: 'center'}}><Check size={44} color={C.vpn} t={local} /></div>
        <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.white, marginTop: 10}}>история и cookie<br />на этом телефоне</div>
      </div>
      {/* what it does NOT hide */}
      <div style={{position: 'absolute', right: 90, top: 980, width: 280, ...card(C.danger), padding: 20, textAlign: 'center', opacity: Math.max(isp, site)}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: 20}}>
          <div style={{opacity: isp}}><ProviderEye color={C.danger} label="провайдер" sees="сайты" /></div>
          <div style={{opacity: site, alignSelf: 'center'}}><Cross size={44} color={C.danger} t={site} /></div>
        </div>
        <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.white, marginTop: 10}}>провайдер и сайт<br />видят тебя</div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1300, display: 'flex', justifyContent: 'center'}}>
        <Pill color={AMBER}>прячет следы, но не маршрут</Pill>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('local') ? C.proxy : frame < T.start('truth') ? C.danger : frame < T.start('payoff') ? AMBER : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeIncognitoReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-incognito.wav">
    <Tinted />
    <Stage />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Спрячь <Accent color={C.vpn}>маршрут</Accent></CtaBlock>
  </ReelRoot>
);

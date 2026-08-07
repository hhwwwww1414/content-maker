import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-password.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, CLAMP, type Beat} from '../reel-system/reel-kit';
import {card, Pill} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const BEATS: Beat[] = [
  {id: 'hook_hard', color: C.proxy, node: <><Accent color={C.proxy}>Tr0b4!</Accent><br />кажется крутым</>},
  {id: 'hook_phrase', color: C.vpn, node: <>А «три весёлых кота» —<br /><Accent color={C.vpn}>слабым</Accent></>},
  {id: 'twist', color: AMBER, kicker: 'Но', node: <>Первый взломают<br /><Accent color={AMBER}>раньше</Accent></>},
  {id: 'length', color: C.vpn, node: <>Каждый символ<br /><Accent color={C.vpn}>умножает варианты</Accent></>},
  {id: 'compare', color: C.vpn, node: <>8 символов — часы.<br /><Accent color={C.vpn}>Фраза — века</Accent></>},
  {id: 'human', color: AMBER, node: <>А фразу<br /><Accent color={AMBER}>проще запомнить</Accent></>},
  {id: 'reuse', color: C.danger, node: <>Только не повторяй<br /><Accent color={C.danger}>её везде</Accent></>},
  {id: 'payoff', color: C.vpn, kicker: 'Итог', node: <><Accent color={C.vpn}>Длина</Accent> бьёт<br />сложность</>},
];

const Row: React.FC<{label: string; sub: string; accent: string; bar: number; time: string}> = ({label, sub, accent, bar, time}) => (
  <div style={{...card(accent), padding: 20, marginBottom: 18}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
      <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: C.white}}>{label}</span>
      <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 20, color: C.muted}}>{sub}</span>
    </div>
    <div style={{marginTop: 14, height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.06)', overflow: 'hidden'}}>
      <div style={{height: '100%', width: `${bar * 100}%`, background: accent, borderRadius: 10, boxShadow: `0 0 20px ${accent}66`}} />
    </div>
    <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 24, color: accent, marginTop: 10}}>{time}</div>
  </div>
);

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = T.appear(frame, T.start('compare'), 26);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'twist', 'payoff'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 90, right: 90, top: 790}}>
        <Row label="Tr0b4!" sub="8 символов" accent={C.danger} bar={interpolate(grow, [0, 1], [0.04, 0.14], CLAMP)} time="часы" />
        <Row label="три-весёлых-кота" sub="длинная фраза" accent={C.vpn} bar={interpolate(grow, [0, 1], [0.04, 1], CLAMP)} time="века" />
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 8}}>
          <Pill color={AMBER}>перебор × на каждый символ</Pill>
        </div>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('twist') ? C.proxy : frame < T.start('reuse') ? C.vpn : frame < T.start('payoff') ? C.danger : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepePasswordReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-password.wav">
    <Tinted />
    <Stage />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>А канал прикроет <Accent color={C.vpn}>VPN</Accent></CtaBlock>
  </ReelRoot>
);

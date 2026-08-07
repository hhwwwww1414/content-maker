import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-handshake.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, CLAMP, type Beat} from '../reel-system/reel-kit';
import {card, Pill} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);
const BLUE = '#5B9CFF';
const RED = '#FF6B61';
const MIX = '#37E0A6';

const Swatch: React.FC<{color: string; label: string; size?: number}> = ({color, label, size = 84}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
    <div style={{width: size, height: size, borderRadius: 20, background: color, boxShadow: `0 10px 30px ${color}55`}} />
    <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 20, color: C.muted}}>{label}</span>
  </div>
);

const BEATS: Beat[] = [
  {id: 'hook_shout', color: AMBER, node: <>Договориться о секрете,<br /><Accent color={AMBER}>крича на весь двор?</Accent></>},
  {id: 'hook_nobody', color: C.danger, node: <>И чтобы враг<br /><Accent color={C.danger}>ничего не понял</Accent></>},
  {id: 'paint_own', color: BLUE, kicker: 'Представь краски', node: <>У каждого — <Accent color={BLUE}>своя</Accent><br />и одна общая</>},
  {id: 'paint_mix', color: BLUE, node: <>Смешал свою<br />с <Accent color={AMBER}>общей</Accent></>},
  {id: 'paint_swap', color: MIX, node: <>Обменялись<br /><Accent color={MIX}>смесями</Accent></>},
  {id: 'paint_same', color: MIX, node: <>Добавил свою —<br /><Accent color={MIX}>цвет совпал</Accent></>},
  {id: 'enemy_stuck', color: C.danger, node: <>Враг видел смеси,<br /><Accent color={C.danger}>но не повторит</Accent></>},
  {id: 'reveal_dh', color: C.vpn, kicker: 'Итог', node: <>Это и есть<br /><Accent color={C.vpn}>рукопожатие</Accent></>},
  {id: 'reveal_vpn', color: C.vpn, node: <>С него начинается<br /><Accent color={C.vpn}>каждый VPN</Accent></>},
];

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const mix = T.appear(frame, T.start('paint_mix'));
  const swap = T.appear(frame, T.start('paint_swap'));
  const same = T.appear(frame, T.start('paint_same'));
  const col = (x: number, name: string, own: string) => (
    <div style={{position: 'absolute', left: x, top: 700, width: 300, ...card(same > 0.4 ? MIX : own), padding: 24, textAlign: 'center'}}>
      <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 28, color: same > 0.4 ? MIX : own, marginBottom: 16}}>{name}</div>
      <div style={{display: 'flex', justifyContent: 'center', gap: 16}}>
        <Swatch color={own} label="своя" />
        <span style={{alignSelf: 'center', fontSize: 30, color: C.muted, opacity: mix}}>+</span>
        <Swatch color={AMBER} label="общая" />
      </div>
      <div style={{marginTop: 18, opacity: same}}>
        <div style={{width: '70%', height: 60, margin: '0 auto', borderRadius: 16, background: MIX, boxShadow: `0 0 26px ${MIX}66`}} />
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 24, color: MIX, marginTop: 10}}>СЕКРЕТ</div>
      </div>
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'paint_own', 'enemy_stuck'), zIndex: 20}}>
      {col(110, 'Ты', BLUE)}
      {col(670, 'Собеседник', RED)}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', opacity: swap}}>
        <Pill color={MIX}>обмен смесями крест-накрест</Pill>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1160, display: 'flex', justifyContent: 'center', opacity: T.appear(frame, T.start('enemy_stuck'))}}>
        <Pill color={C.danger}>враг видит смеси, но разделить не может</Pill>
      </div>
    </div>
  );
};

const RevealScene: React.FC = () => {
  const frame = useCurrentFrame();
  const on = T.appear(frame, T.start('reveal_dh') + 4);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'reveal_dh', 'reveal_vpn'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 240, top: 780, width: 600, ...card(C.vpn), padding: 34, textAlign: 'center', opacity: on, transform: `scale(${interpolate(on, [0, 1], [0.92, 1], CLAMP)})`}}>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: 96}}>
          <div style={{width: 84, height: 84, borderRadius: 22, background: BLUE, marginRight: -24}} />
          <div style={{width: 96, height: 96, borderRadius: 24, background: MIX, zIndex: 2, boxShadow: `0 0 34px ${MIX}88`}} />
          <div style={{width: 84, height: 84, borderRadius: 22, background: RED, marginLeft: -24}} />
        </div>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 40, color: C.vpn, marginTop: 16}}>Рукопожатие</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 26, color: C.muted, marginTop: 8}}>общий секрет — на глазах у всех</div>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('paint_own') ? C.danger : frame < T.start('enemy_stuck') ? BLUE : frame < T.start('reveal_dh') ? C.danger : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeHandshakeReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-handshake.wav">
    <Tinted />
    <Stage />
    <RevealScene />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Соединение, что <Accent color={C.vpn}>с секрета</Accent></CtaBlock>
  </ReelRoot>
);

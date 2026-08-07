import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-packets.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, CLAMP, type Beat} from '../reel-system/reel-kit';
import {card, Pill} from '../components/vpn-explainer/parts';
import {unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const PacketChip: React.FC<{n: number; color: string; locked?: boolean; opacity?: number}> = ({n, color, locked, opacity = 1}) => (
  <div style={{...card(color), width: 96, height: 96, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity, position: 'relative'}}>
    <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 34, color}}>{n}</span>
    {locked ? <svg width="20" height="22" viewBox="0 0 20 22" style={{marginTop: 4}}><rect x="3" y="9" width="14" height="11" rx="2.5" stroke={color} strokeWidth="2" fill="none"/><path d="M6 9V6.5a4 4 0 0 1 8 0V9" stroke={color} strokeWidth="2" fill="none"/></svg> : null}
  </div>
);

const BEATS: Beat[] = [
  {id: 'hook_torn', color: AMBER, node: <>Твоё видео едет<br /><Accent color={AMBER}>разорванным на куски</Accent></>},
  {id: 'hook_perfect', color: C.vpn, node: <>И собирается<br /><Accent color={C.vpn}>идеально</Accent></>},
  {id: 'not_whole', color: AMBER, kicker: 'Как это работает', node: <>Данные не едут<br /><Accent color={AMBER}>целиком</Accent></>},
  {id: 'cut', color: AMBER, node: <>Их режут на<br /><Accent color={AMBER}>пакеты</Accent></>},
  {id: 'numbered', color: AMBER, node: <>У каждого —<br /><Accent color={AMBER}>номер и адрес</Accent></>},
  {id: 'paths', color: AMBER, node: <>Едут <Accent color={AMBER}>разными путями</Accent><br />обгоняя друг друга</>},
  {id: 'reassemble', color: C.vpn, kicker: 'На месте', node: <>Собираются<br /><Accent color={C.vpn}>по номерам</Accent></>},
  {id: 'lost', color: C.danger, node: <>Потерялся —<br /><Accent color={C.danger}>переспросят</Accent></>},
  {id: 'vpn_each', color: C.vpn, node: <>VPN шифрует<br /><Accent color={C.vpn}>каждый пакет</Accent></>},
];

const FlyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = T.appear(frame, T.start('cut'));
  const fly = T.appear(frame, T.start('paths'));
  const nums = [1, 2, 3, 4, 5, 6];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'not_whole', 'paths'), zIndex: 20}}>
      {/* the whole "видео" block that splits */}
      <div style={{position: 'absolute', left: 340, top: 700, width: 400, height: 120, ...card(AMBER), display: 'grid', placeItems: 'center', opacity: interpolate(cut, [0, 1], [1, 0], CLAMP)}}>
        <span style={{fontFamily: unbounded, fontWeight: 700, fontSize: 40, color: AMBER}}>видео</span>
      </div>
      {/* packets fanning out along different y offsets */}
      <div style={{position: 'absolute', inset: 0, opacity: cut}}>
        {nums.map((n, i) => {
          const t = fly;
          const x = 130 + i * 138;
          const y = 760 + Math.sin(i * 1.3) * 60 * t;
          return <div key={n} style={{position: 'absolute', left: x, top: y}}><PacketChip n={n} color={AMBER} /></div>;
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1000, display: 'flex', justifyContent: 'center', opacity: fly}}>
        <Pill color={AMBER}>разные пути · разная скорость</Pill>
      </div>
    </div>
  );
};

const AssembleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const sort = T.appear(frame, T.start('reassemble') + 2);
  const lost = T.appear(frame, T.start('lost'));
  const vpn = T.appear(frame, T.start('vpn_each'));
  const nums = [1, 2, 3, 4, 5, 6];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'reassemble', 'vpn_each'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, right: 130, top: 780, display: 'flex', justifyContent: 'center', gap: 12}}>
        {nums.map((n, i) => {
          const missing = n === 4 && lost > 0.3 && vpn < 0.3;
          return (
            <div key={n} style={{opacity: T.appear(frame, T.start('reassemble') + i * 3), transform: `translateY(${interpolate(sort, [0, 1], [24, 0], CLAMP)}px)`}}>
              {missing ? (
                <div style={{width: 96, height: 96, borderRadius: 20, border: `2px dashed ${C.danger}`, display: 'grid', placeItems: 'center', fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: C.danger}}>?</div>
              ) : (
                <PacketChip n={n} color={vpn > 0.4 ? C.vpn : C.white} locked={vpn > 0.4} />
              )}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 940, display: 'flex', justifyContent: 'center', opacity: lost}}>
        <Pill color={vpn > 0.4 ? C.vpn : C.danger}>{vpn > 0.4 ? 'каждый пакет зашифрован' : 'пакет №4 потерялся — переспросят'}</Pill>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('not_whole') ? AMBER : frame < T.start('reassemble') ? AMBER : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepePacketsReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-packets.wav">
    <Tinted />
    <FlyScene />
    <AssembleScene />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Закрой <Accent color={C.vpn}>каждый кусочек</Accent></CtaBlock>
  </ReelRoot>
);

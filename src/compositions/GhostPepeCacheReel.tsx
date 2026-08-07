import React from 'react';
import {useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-cache.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, type Beat} from '../reel-system/reel-kit';
import {card, Pill, Flow} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);
const FAR = C.danger;
const NEAR = C.vpn;

const BEATS: Beat[] = [
  {id: 'hook_slow', color: C.danger, node: <>Первый раз —<br /><Accent color={C.danger}>грузилось вечность</Accent></>},
  {id: 'hook_fast', color: NEAR, node: <>Второй —<br /><Accent color={NEAR}>мгновенно</Accent></>},
  {id: 'copy', color: AMBER, kicker: 'Секрет', node: <>Браузер оставил<br /><Accent color={AMBER}>копию рядом</Accent></>},
  {id: 'shelf', color: NEAR, node: <>Картинки и шрифты —<br /><Accent color={NEAR}>на полке</Accent></>},
  {id: 'skip', color: NEAR, node: <>Второй раз не идёт<br /><Accent color={NEAR}>в сеть</Accent></>},
  {id: 'stale', color: C.danger, node: <>Минус: копия<br /><Accent color={C.danger}>устаревает</Accent></>},
  {id: 'clear', color: AMBER, node: <>Очистка кэша —<br /><Accent color={AMBER}>сайт чинится</Accent></>},
  {id: 'payoff', color: NEAR, kicker: 'Итог', node: <>Близкая полка вместо<br /><Accent color={NEAR}>дальнего склада</Accent></>},
];

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const shelf = T.appear(frame, T.start('shelf'));
  const skip = T.appear(frame, T.start('skip'));
  const near = skip > 0.5;
  const tiles = ['IMG', 'CSS', 'ШРИФТ'];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'copy', 'payoff'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 90, top: 780, width: 250, ...card(NEAR), padding: 22, textAlign: 'center'}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: NEAR}}>ТЫ</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 6}}>браузер</div>
      </div>
      <div style={{position: 'absolute', right: 90, top: 780, width: 250, ...card(FAR), padding: 22, textAlign: 'center'}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: FAR}}>СКЛАД</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 6}}>далеко в сети</div>
      </div>
      <Flow x1={345} y={846} x2={735} color={near ? NEAR : FAR} speed={near ? 5 : 2} />
      <div style={{position: 'absolute', left: 90, top: 1010, width: 460, ...card(NEAR), padding: 18, opacity: shelf}}>
        <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, color: NEAR, marginBottom: 12, letterSpacing: 1}}>ПОЛКА · КЭШ</div>
        <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
          {tiles.map((t, i) => (
            <div key={t} style={{padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: `1px solid ${NEAR}55`, fontFamily: manrope, fontWeight: 700, fontSize: 20, color: C.white, opacity: T.appear(frame, T.start('shelf') + 6 + i * 7)}}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1230, display: 'flex', justifyContent: 'center', gap: 18}}>
        <Pill color={FAR}>1-й раз · далеко</Pill>
        <div style={{opacity: skip}}><Pill color={NEAR}>2-й раз · с полки</Pill></div>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('copy') ? C.danger : frame < T.start('stale') ? C.vpn : frame < T.start('payoff') ? AMBER : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeCacheReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-cache.wav">
    <Tinted />
    <Stage />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Дальний склад — <Accent color={C.vpn}>близко</Accent></CtaBlock>
  </ReelRoot>
);

import React from 'react';
import {useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-cookie.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, type Beat} from '../reel-system/reel-kit';
import {card} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);
const ID = '#A7F3-92';

const Badge: React.FC<{color: string; op?: number}> = ({color, op = 1}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: `${color}22`, border: `1px solid ${color}`, opacity: op}}>
    <span style={{width: 14, height: 14, borderRadius: 4, background: color}} />
    <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 22, color}}>{ID}</span>
  </div>
);

const BEATS: Beat[] = [
  {id: 'hook_noauth', color: C.proxy, node: <>Не логинился —<br /><Accent color={C.proxy}>а сайт тебя узнал</Accent></>},
  {id: 'hook_cart', color: C.proxy, node: <>И корзина<br /><Accent color={C.proxy}>всё помнит</Accent></>},
  {id: 'badge', color: AMBER, kicker: 'Как', node: <>Сайт выдал тебе<br /><Accent color={AMBER}>бейджик — cookie</Accent></>},
  {id: 'store', color: C.vpn, node: <>Браузер показывает его<br /><Accent color={C.vpn}>каждый визит</Accent></>},
  {id: 'useful', color: C.vpn, node: <>Так работает корзина<br />и <Accent color={C.vpn}>«не выходить»</Accent></>},
  {id: 'track', color: C.danger, node: <>Но чужие бейджики<br /><Accent color={C.danger}>следят между сайтами</Accent></>},
  {id: 'clear', color: AMBER, node: <>Удалил cookie —<br /><Accent color={AMBER}>снова новичок</Accent></>},
  {id: 'payoff', color: C.vpn, kicker: 'Итог', node: <>Бейджик, что узнаёт<br /><Accent color={C.vpn}>тебя за тебя</Accent></>},
];

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const badge = T.appear(frame, T.start('badge'));
  const track = T.appear(frame, T.start('track'));
  const sites = ['news.ru', 'shop.ru', 'video.ru'];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'badge', 'payoff'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 90, top: 800, width: 250, ...card(C.vpn), padding: 22, textAlign: 'center'}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 30, color: C.vpn}}>ТЫ</div>
        <div style={{marginTop: 14, opacity: badge}}><Badge color={C.vpn} /></div>
      </div>
      <div style={{position: 'absolute', right: 90, top: 800, width: 250, ...card(AMBER), padding: 22, textAlign: 'center'}}>
        <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 28, color: AMBER}}>SHOP.RU</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 20, color: C.muted, marginTop: 6}}>выдал бейджик</div>
      </div>
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
        <path d="M735 860 C 620 900, 460 900, 350 900" fill="none" stroke={AMBER} strokeWidth="4" strokeDasharray="8 10" strokeDashoffset={-frame * 3} opacity={badge * 0.8} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1060, textAlign: 'center', opacity: track}}>
        <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 22, color: C.danger, marginBottom: 14, letterSpacing: 1}}>ОДИН БЕЙДЖИК — МНОГО САЙТОВ</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 16}}>
          {sites.map((s, i) => (
            <div key={s} style={{...card(C.danger), padding: '14px 16px', textAlign: 'center', opacity: T.appear(frame, T.start('track') + i * 8)}}>
              <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 22, color: C.white}}>{s}</div>
              <div style={{marginTop: 8}}><Badge color={C.danger} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('badge') ? C.proxy : frame < T.start('track') ? C.vpn : frame < T.start('payoff') ? C.danger : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeCookieReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-cookie.wav">
    <Tinted />
    <Stage />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Меньше <Accent color={C.vpn}>чужих глаз</Accent></CtaBlock>
  </ReelRoot>
);

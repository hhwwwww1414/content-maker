import React from 'react';
import {useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-https-lock.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, type Beat} from '../reel-system/reel-kit';
import {card, Pill} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const Lock: React.FC<{color: string; size?: number}> = ({color, size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <rect x="6" y="13" width="18" height="13" rx="3" stroke={color} strokeWidth="2.4" fill={`${color}22`} />
    <path d="M10 13v-3a5 5 0 0 1 10 0v3" stroke={color} strokeWidth="2.4" />
    <circle cx="15" cy="19" r="2" fill={color} />
  </svg>
);

const AddressBar: React.FC<{accent: string; url: string; tag: string; highlight?: number}> = ({accent, url, tag, highlight = 0}) => (
  <div style={{...card(accent), padding: '18px 22px', width: 400}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
      <Lock color={accent} size={30} />
      <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 28, color: C.white, padding: highlight > 0.2 ? '2px 8px' : 0, borderRadius: 8, background: highlight > 0.2 ? `${accent}33` : 'transparent', boxShadow: highlight > 0.2 ? `0 0 0 2px ${accent}` : 'none'}}>{url}</span>
    </div>
    <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 22, color: accent, marginTop: 12}}>{tag}</div>
  </div>
);

const BEATS: Beat[] = [
  {id: 'hook_lock', color: C.danger, node: <>У фишинга <Accent color={C.danger}>тоже</Accent><br />есть замочек</>},
  {id: 'hook_safe', color: AMBER, node: <>Значит, замок<br /><Accent color={AMBER}>≠ безопасно</Accent></>},
  {id: 'means', color: C.vpn, kicker: 'Замок значит', node: <>По дороге<br /><Accent color={C.vpn}>не подслушают</Accent></>},
  {id: 'notmeans', color: C.danger, node: <>Но на том конце<br /><Accent color={C.danger}>может быть мошенник</Accent></>},
  {id: 'phish', color: C.danger, node: <>Поддельный сайт<br /><Accent color={C.danger}>легко получит замок</Accent></>},
  {id: 'check', color: AMBER, node: <>Смотри на <Accent color={AMBER}>адрес</Accent>,<br />а не на замок</>},
  {id: 'truth', color: C.vpn, node: <>Замок бережёт канал,<br />доверие — <Accent color={C.vpn}>за тобой</Accent></>},
  {id: 'payoff', color: C.vpn, kicker: 'Итог', node: <>Замочек ≠<br /><Accent color={C.vpn}>честный сайт</Accent></>},
];

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const fake = T.appear(frame, T.start('phish'));
  const hl = T.appear(frame, T.start('check'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'means', 'payoff'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center'}}>
        <AddressBar accent={C.vpn} url="bank.ru" tag="🔒 настоящий" highlight={hl} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1010, display: 'flex', justifyContent: 'center', opacity: fake}}>
        <AddressBar accent={C.danger} url="b4nk-login.ru" tag="🔒 поддельный" highlight={hl} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1230, display: 'flex', justifyContent: 'center', gap: 16}}>
        <Pill color={C.vpn}>замок = канал зашифрован</Pill>
        <div style={{opacity: hl}}><Pill color={AMBER}>адрес решает</Pill></div>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('means') ? C.danger : frame < T.start('check') ? C.danger : frame < T.start('payoff') ? AMBER : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeHttpsLockReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-https-lock.wav">
    <Tinted />
    <Stage />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Шифруй <Accent color={C.vpn}>весь путь</Accent></CtaBlock>
  </ReelRoot>
);

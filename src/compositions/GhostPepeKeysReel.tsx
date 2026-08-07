import React from 'react';
import {useCurrentFrame} from 'remotion';
import timeline from '../generated/timeline-keys.json';
import {makeTiming, Backdrop, HeadlineStack, CtaBlock, ReelRoot, Accent, C, AMBER, type Beat} from '../reel-system/reel-kit';
import {card, Pill, Cross, Check} from '../components/vpn-explainer/parts';
import {manrope, unbounded} from '../theme/fonts';

const T = makeTiming(timeline);

const Key: React.FC<{color: string; size?: number}> = ({color, size = 54}) => (
  <svg width={size} height={size} viewBox="0 0 54 54" fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round">
    <circle cx="17" cy="17" r="9" />
    <path d="M23 23l18 18M35 35l6-6M41 41l6-6" />
  </svg>
);

const BEATS: Beat[] = [
  {id: 'hook_lock', color: AMBER, node: <>Отправить замок,<br /><Accent color={AMBER}>а ключ не передавать?</Accent></>},
  {id: 'hook_open', color: AMBER, node: <>И чтобы открыл<br /><Accent color={AMBER}>только получатель</Accent></>},
  {id: 'old_way', color: C.danger, kicker: 'Старый способ', node: <>Ключ передашь —<br /><Accent color={C.danger}>его перехватят</Accent></>},
  {id: 'two_keys', color: C.vpn, kicker: 'Хитрость', node: <>Ключей —<br /><Accent color={C.vpn}>два</Accent></>},
  {id: 'public_closes', color: '#5B9CFF', node: <>Открытый —<br /><Accent color={'#5B9CFF'}>только закрывает</Accent></>},
  {id: 'private_opens', color: C.vpn, node: <>Закрытый —<br /><Accent color={C.vpn}>только открывает</Accent></>},
  {id: 'share_public', color: C.vpn, node: <>Открытый — всем,<br />закрытый — <Accent color={C.vpn}>только тебе</Accent></>},
  {id: 'they_close', color: '#5B9CFF', node: <>Тебе закрывают<br /><Accent color={'#5B9CFF'}>твоим открытым</Accent></>},
  {id: 'only_you', color: C.vpn, node: <>Откроешь<br /><Accent color={C.vpn}>только ты</Accent></>},
  {id: 'vpn_use', color: C.vpn, node: <>Так VPN меняется<br /><Accent color={C.vpn}>ключами</Accent></>},
];

const BLUE = '#5B9CFF';

const OldScene: React.FC = () => {
  const frame = useCurrentFrame();
  const grab = T.appear(frame, T.start('old_way') + 8);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'old_way', 'old_way'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30}}>
        <div style={{...card(C.white), padding: 24, textAlign: 'center'}}><Key color={C.white} /><div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color: C.muted, marginTop: 8}}>ключ едет...</div></div>
        <div style={{opacity: grab}}><Cross size={56} color={C.danger} t={grab} /></div>
        <div style={{...card(C.danger), padding: 24, textAlign: 'center', opacity: grab}}><div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 26, color: C.danger}}>перехват</div></div>
      </div>
    </div>
  );
};

const TwoKeysScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pub = T.appear(frame, T.start('public_closes'));
  const priv = T.appear(frame, T.start('private_opens'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'two_keys', 'share_public'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 130, top: 760, width: 360, ...card(BLUE), padding: 28, textAlign: 'center', opacity: pub}}>
        <div style={{display: 'grid', placeItems: 'center', height: 64}}><Key color={BLUE} /></div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: BLUE, marginTop: 10}}>Открытый</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 22, color: C.muted, marginTop: 6}}>только закрывает · раздаёшь всем</div>
      </div>
      <div style={{position: 'absolute', left: 590, top: 760, width: 360, ...card(C.vpn), padding: 28, textAlign: 'center', opacity: priv}}>
        <div style={{display: 'grid', placeItems: 'center', height: 64}}><Key color={C.vpn} /></div>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: C.vpn, marginTop: 10}}>Закрытый</div>
        <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 22, color: C.muted, marginTop: 6}}>только открывает · только у тебя</div>
      </div>
    </div>
  );
};

const SendScene: React.FC = () => {
  const frame = useCurrentFrame();
  const closed = T.appear(frame, T.start('they_close') + 4);
  const open = T.appear(frame, T.start('only_you'));
  const vpn = T.appear(frame, T.start('vpn_use'));
  return (
    <div style={{position: 'absolute', inset: 0, opacity: T.sceneOpacity(frame, 'they_close', 'vpn_use'), zIndex: 20}}>
      <div style={{position: 'absolute', left: 240, top: 780, width: 600, ...card(open > 0.4 ? C.vpn : BLUE), padding: 32, textAlign: 'center'}}>
        <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: open > 0.4 ? C.vpn : BLUE}}>сообщение для тебя</div>
        <div style={{marginTop: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
          {open > 0.4 ? <Check size={48} color={C.vpn} t={open} /> : <svg width="46" height="50" viewBox="0 0 46 50" style={{opacity: closed}}><rect x="8" y="22" width="30" height="24" rx="5" stroke={BLUE} strokeWidth="3" fill="none"/><path d="M14 22v-5a9 9 0 0 1 18 0v5" stroke={BLUE} strokeWidth="3" fill="none"/></svg>}
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: C.white}}>{open > 0.4 ? 'открыл только ты' : 'закрыто твоим открытым'}</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1060, display: 'flex', justifyContent: 'center', opacity: vpn}}>
        <Pill color={C.vpn}>так VPN обменивается ключами, не передавая секрет</Pill>
      </div>
    </div>
  );
};

const Tinted: React.FC = () => {
  const frame = useCurrentFrame();
  const tint = frame < T.start('old_way') ? AMBER : frame < T.start('two_keys') ? C.danger : C.vpn;
  return <Backdrop tint={tint} total={T.total} />;
};

export const GhostPepeKeysReel: React.FC = () => (
  <ReelRoot voice="generated/voiceover-keys.wav">
    <Tinted />
    <OldScene />
    <TwoKeysScene />
    <SendScene />
    <HeadlineStack T={T} beats={BEATS} stopId="cta_q" />
    <CtaBlock T={T}>Замок, что <Accent color={C.vpn}>откроешь только ты</Accent></CtaBlock>
  </ReelRoot>
);

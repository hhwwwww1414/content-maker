import React from 'react';
import {Phone, PhoneOff, Search, ShieldAlert, Heart, Lock, MessageCircle, Battery, Wifi, Signal} from 'lucide-react';
import {Img} from 'remotion';
import type {z} from 'zod';
import {movingAttr, useShot} from '../context';
import {assetUrl} from '../library';
import {clamp01, lerp, sec, springFrom, tween} from '../motion/core';
import {alpha, mix} from '../tokens';
import {PHONE, screenInk} from './Phone';
import type {DeviceShot} from '../spec/schema';

type Screen = z.output<typeof DeviceShot>['screen'];
const SW = PHONE.width - PHONE.bezel * 2, SH = PHONE.height - PHONE.bezel * 2;

const UI: React.FC<React.HTMLAttributes<HTMLDivElement> & {size: number; weight?: number; color?: string; moving?: boolean}> = ({size, weight = 500, color, moving, style, children, ...rest}) => {
  const {art} = useShot();
  return <div data-qa="text" {...movingAttr(!!moving)} {...rest} style={{fontFamily: art.body.family, fontSize: size, fontWeight: weight, color, lineHeight: 1.22, ...style}}>{children}</div>;
};

const StatusBar: React.FC<{color: string; clock?: string}> = ({color, clock = '9:41'}) => (
  <div style={{position: 'absolute', left: 54, right: 50, top: 34, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color}}>
    <div style={{fontFamily: 'Onest', fontWeight: 700, fontSize: 34, color}}>{clock}</div>
    <div style={{display: 'flex', gap: 10, alignItems: 'center'}}><Signal size={32}/><Wifi size={32}/><Battery size={40}/></div>
  </div>
);

const CallScreen: React.FC<{s: Extract<Screen, {app: 'call'}>}> = ({s}) => {
  const {frame, fps, start, palette, spring, t} = useShot();
  const answered = s.answerCue !== undefined && frame >= start(s.answerCue);
  const ended = s.hangupCue !== undefined && frame >= start(s.hangupCue);
  const ringing = !answered && !ended;
  const seconds = answered ? Math.floor((frame - start(s.answerCue)) / fps) + 3 : 0;
  const pulse = (i: number) => (t * 0.9 + i * 0.33) % 1;
  const appear = spring(undefined, 'soft');
  const lineIndex = s.lines.reduce((last, line, i) => (frame >= start(line.cue) ? i : last), -1);
  const line = lineIndex >= 0 ? s.lines[lineIndex] : null;
  const lineP = line ? springFrom(frame, start(line.cue), fps, 'snap') : 0;
  const hang = s.hangupCue !== undefined ? tween(frame, start(s.hangupCue), 0.4, fps, 'out') : 0;
  return (
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(120% 60% at 50% 18%, ${mix('#14161C', ended ? palette.danger : palette.accent, 0.22)} 0%, #0B0C10 62%, #050507 100%)`}}>
      <StatusBar color="#fff"/>
      <div data-qa-group-root="call" style={{position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', opacity: clamp01(appear)}}>
        <UI size={42} color="#B7BAC4" moving={appear < 0.98} style={{height: 54, display: 'inline-block'}}>{ended ? 'Вызов завершён' : answered ? `0:${String(seconds).padStart(2, '0')}` : 'Входящий вызов'}</UI>
        <br/><UI size={76} weight={700} color="#fff" moving={appear < 0.98} style={{marginTop: 14, maxWidth: SW - 68, lineHeight: 1.08, display: 'inline-block'}}>{s.name}</UI>
        {s.detail && <><br/><UI size={40} color="#B7BAC4" moving={appear < 0.98} style={{marginTop: 18, display: 'inline-block'}}>{s.detail}</UI></>}
      </div>
      <div style={{position: 'absolute', left: SW / 2 - 130, top: 620, width: 260, height: 260, borderRadius: '50%', background: `linear-gradient(145deg,#3A3E4A,#16171D)`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {ringing && [0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid ${alpha(palette.accent, (1 - pulse(i)) * 0.6)}`, transform: `scale(${1 + pulse(i) * 1.25})`}}/>)}
        {answered && !ended && Array.from({length: 7}, (_, i) => {
          const h = 30 + Math.abs(Math.sin(t * 7 + i * 1.3)) * 70;
          return <div key={i} style={{width: 14, height: h, background: palette.accent, borderRadius: 7, margin: '0 5px'}}/>;
        })}
        {(ringing || ended) && <Phone size={110} color={ended ? palette.danger : '#fff'} strokeWidth={1.5}/>}
      </div>
      {line && !ended && <div style={{position: 'absolute', left: 40, right: 40, top: 940, padding: '28px 34px', borderRadius: 34, background: 'rgba(255,255,255,.1)', transform: `translateY(${(1 - lineP) * 26}px)`, opacity: clamp01(lineP * 2)}}>
        <UI key={lineIndex} size={46} weight={600} color="#fff" moving={lineP < 0.98} style={{lineHeight: 1.2}}>{line.text}</UI>
      </div>}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 240, display: 'flex', justifyContent: 'center', gap: 170, opacity: ended ? 1 - hang : 1}}>
        <div style={{width: 164, height: 164, borderRadius: '50%', background: '#E5484D', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><PhoneOff size={72} color="#fff"/></div>
        {ringing && <div style={{width: 164, height: 164, borderRadius: '50%', background: '#30A46C', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${Math.sin(t * 6) * 8}px)`}}><Phone size={72} color="#fff"/></div>}
      </div>
    </div>
  );
};

/** Messages stack from the input bar upward, like a real chat: each arrival pushes the rest up on a spring. */
const ChatScreen: React.FC<{s: Extract<Screen, {app: 'chat'}>; dark: boolean}> = ({s, dark}) => {
  const {frame, fps, start, palette} = useShot();
  const ink = screenInk(dark);
  const height = (text: string) => (text.length > 20 ? 196 : 122);
  const floor = SH - 470;
  return (
    <div style={{position: 'absolute', inset: 0, background: ink.bg}}>
      {s.items.map((item, i) => {
        const begin = start(item.cue);
        if (frame < begin - sec(0.45, fps)) return null;
        const typing = frame < begin;
        const p = springFrom(frame, begin, fps, 'snap');
        const later = s.items.slice(i + 1).reduce((sum, next) => sum + (height(next.text) + 22) * clamp01(springFrom(frame, start(next.cue) - sec(0.45, fps), fps, 'snap')), 0);
        const me = item.from === 'me';
        return (
          <div key={i} style={{position: 'absolute', top: floor - height(item.text) - later, [me ? 'right' : 'left']: 30, maxWidth: SW - 120, transform: `scale(${typing ? 1 : 0.86 + 0.14 * p})`, transformOrigin: me ? '100% 100%' : '0 100%', padding: typing ? '30px 36px' : '26px 36px', borderRadius: 46, background: me ? palette.accent : ink.card, boxShadow: dark ? undefined : '0 6px 18px rgba(0,0,0,.08)'}}>
            {typing ? <div style={{display: 'flex', gap: 12}}>{[0, 1, 2].map((d) => <div key={d} style={{width: 22, height: 22, borderRadius: 11, background: ink.muted, opacity: 0.4 + 0.6 * Math.abs(Math.sin((frame / fps) * 5 + d))}}/>)}</div>
              : <UI size={54} weight={500} color={me ? palette.onAccent : ink.ink} moving={p < 0.98} style={{lineHeight: 1.16}}>{item.text}</UI>}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 214, background: ink.bg, borderBottom: `2px solid ${ink.line}`}}>
        <StatusBar color={ink.ink}/>
        <div style={{position: 'absolute', left: 36, right: 36, top: 100, height: 100, display: 'flex', alignItems: 'center', gap: 22}}>
          <div style={{width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent2})`}}/>
          <UI size={48} weight={700} color={ink.ink}>{s.title}</UI>
        </div>
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, bottom: 340, height: 96, borderRadius: 48, background: ink.card, border: `2px solid ${ink.line}`}}/>
      <div style={{position: 'absolute', left: 14, right: 14, bottom: 36, height: 280, display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 12}}>
        {[10, 9, 7].map((keys, row) => <div key={row} style={{display: 'flex', gap: 8, justifyContent: 'center'}}>{Array.from({length: keys}, (_, k) => <div key={k} style={{width: 62, borderRadius: 12, background: ink.card}}/>)}</div>)}
      </div>
    </div>
  );
};

const NotificationsScreen: React.FC<{s: Extract<Screen, {app: 'notifications'}>}> = ({s}) => {
  const {frame, fps, start, palette, art} = useShot();
  const shown = s.items.map((item, i) => ({item, i, p: springFrom(frame, start(item.cue), fps, 'snap'), at: start(item.cue)})).filter((n) => frame >= n.at);
  return (
    <div style={{position: 'absolute', inset: 0, background: `linear-gradient(170deg, ${mix(palette.accent, '#0B0D16', 0.58)} 0%, #090A10 62%)`}}>
      <StatusBar color="#fff" clock=""/>
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center'}}>
        {s.date && <UI size={42} weight={600} color="rgba(255,255,255,.86)">{s.date}</UI>}
        <div style={{fontFamily: art.display.family, fontWeight: 600, fontSize: 184, lineHeight: 1.05, color: '#fff'}}>{s.clock}</div>
      </div>
      <div data-qa-group-root="notes" style={{position: 'absolute', left: 30, right: 30, top: 440}}>
        {shown.slice().reverse().map(({item, i, p}) => (
          <div key={i} style={{marginBottom: 20, padding: '26px 30px', borderRadius: 42, background: item.urgent ? palette.danger : 'rgba(255,255,255,.92)', transform: `translateY(${(1 - p) * -70}px) scale(${0.92 + 0.08 * clamp01(p)})`, opacity: clamp01(p * 2.5), transformOrigin: '50% 0'}}>
            <UI size={38} weight={700} color={item.urgent ? '#1A0500' : '#54545E'} moving={p < 0.98} style={{height: 50}}>{item.app}</UI>
            <UI size={44} weight={600} color={item.urgent ? '#120300' : '#0D0D12'} moving={p < 0.98} style={{marginTop: 6}}>{item.text}</UI>
          </div>
        ))}
      </div>
    </div>
  );
};

const money = (n: number, currency: string) => `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0')}\u00A0${currency}`;
const BankScreen: React.FC<{s: Extract<Screen, {app: 'bank'}>; dark: boolean}> = ({s, dark}) => {
  const {frame, fps, start, palette, art} = useShot();
  const ink = screenInk(dark);
  const drop = s.to !== undefined ? tween(frame, start(s.balanceCue), 1.1, fps, 'inOut') : 0;
  const balance = lerp(s.balance, s.to ?? s.balance, drop);
  const low = s.to !== undefined && drop > 0.5;
  return (
    <div style={{position: 'absolute', inset: 0, background: ink.bg}}>
      <StatusBar color={ink.ink}/>
      <div style={{position: 'absolute', left: 40, right: 40, top: 130}}>
        <UI size={42} weight={600} color={ink.muted}>{s.title}</UI>
        <div data-qa="text" {...movingAttr(drop > 0 && drop < 1)} style={{marginTop: 10, fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 112, lineHeight: 1.25, whiteSpace: 'nowrap', color: low ? palette.danger : ink.ink, fontFeatureSettings: '"tnum"'}}>{money(balance, s.currency)}</div>
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 370}}>
        {s.items.map((item, i) => {
          const at = start(item.cue);
          if (frame < at) return null;
          const p = springFrom(frame, at, fps, 'snap');
          return <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 18, padding: '30px 30px', borderRadius: 36, background: ink.card, transform: `translateX(${(1 - p) * 60}px)`, opacity: clamp01(p * 2)}}>
            <UI size={40} weight={600} color={ink.ink} moving={p < 0.98} style={{flex: 1}}>{item.text}</UI>
            <UI size={42} weight={700} color={palette.danger} moving={p < 0.98} style={{whiteSpace: 'nowrap'}}>{item.amount}</UI>
          </div>;
        })}
      </div>
    </div>
  );
};

const SettingsScreen: React.FC<{s: Extract<Screen, {app: 'settings'}>; dark: boolean}> = ({s, dark}) => {
  const {frame, fps, start, palette} = useShot();
  const ink = screenInk(dark);
  return (
    <div style={{position: 'absolute', inset: 0, background: ink.bg}}>
      <StatusBar color={ink.ink}/>
      <UI size={76} weight={700} color={ink.ink} style={{position: 'absolute', left: 40, top: 130, right: 40, lineHeight: 1.05}}>{s.title}</UI>
      <div style={{position: 'absolute', left: 30, right: 30, top: 300, borderRadius: 40, background: ink.card, overflow: 'hidden'}}>
        {s.items.map((item, i) => {
          const flip = item.flipCue !== undefined ? tween(frame, start(item.flipCue), 0.32, fps, 'inOut') : 0;
          const on = item.on ? 1 - flip : flip;
          const focusP = item.focus ? tween(frame, start(item.flipCue, 0) - sec(0.5, fps), 0.5, fps, 'out') : 0;
          return <div key={i} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 26, padding: '36px 34px', borderBottom: i < s.items.length - 1 ? `2px solid ${ink.line}` : undefined, background: item.focus ? alpha(palette.accent, focusP * 0.16) : undefined}}>
            <UI size={46} weight={item.focus ? 700 : 500} color={ink.ink} style={{flex: 1}}>{item.text}</UI>
            <div style={{flex: 'none', width: 130, height: 76, borderRadius: 38, background: mix(ink.line, palette.accent, on), position: 'relative'}}>
              <div style={{position: 'absolute', top: 6, left: 6 + on * 54, width: 64, height: 64, borderRadius: 32, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,.3)'}}/>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
};

const FeedScreen: React.FC<{s: Extract<Screen, {app: 'feed'}>; dark: boolean}> = ({s, dark}) => {
  const {frame, fps, start, palette, assets} = useShot();
  const ink = screenInk(dark);
  const scroll = s.scrollCue !== undefined ? springFrom(frame, start(s.scrollCue), fps, 'soft') * 720 : (frame / fps) * 18;
  return (
    <div style={{position: 'absolute', inset: 0, background: ink.bg}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-scroll}px)`, paddingTop: 200}}>
        {s.items.map((post, i) => {
          const likeAt = start(post.cue, 0);
          const likes = post.likes !== undefined ? Math.round((post.likes * clamp01((frame - likeAt) / sec(1.2, fps))) ** 1) : 0;
          return <div key={i} style={{margin: '0 24px 26px', borderRadius: 42, background: ink.card, overflow: 'hidden'}}>
            <div style={{display: 'flex', gap: 20, alignItems: 'center', padding: '26px 28px'}}>
              <div style={{width: 76, height: 76, borderRadius: '50%', background: `linear-gradient(135deg, ${palette.accent}, ${palette.accent2})`}}/>
              <UI size={40} weight={700} color={ink.ink} moving={!!s.scrollCue}>{post.author}</UI>
            </div>
            {post.asset && assets[post.asset]
              ? <Img src={assetUrl(assets[post.asset])} style={{display: 'block', width: '100%', height: 400, objectFit: 'cover'}}/>
              : <div style={{height: 400, background: `linear-gradient(${140 + i * 50}deg, ${mix(palette.accent, ink.bg, 0.18)}, ${mix(palette.accent2, ink.bg, 0.3)})`}}/>}
            <div style={{padding: '24px 28px 30px'}}>
              <div style={{display: 'flex', gap: 22, alignItems: 'center', marginBottom: 12}}>
                <Heart size={46} color={palette.danger} fill={likes ? palette.danger : 'none'}/>
                <MessageCircle size={46} color={ink.muted}/>
                {post.likes !== undefined && <UI size={38} weight={700} color={ink.ink} moving style={{fontFeatureSettings: '"tnum"'}}>{likes.toLocaleString('ru-RU')}</UI>}
              </div>
              <UI size={40} color={ink.ink} moving={!!s.scrollCue}>{post.text}</UI>
            </div>
          </div>;
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 180, background: ink.bg}}><StatusBar color={ink.ink}/>{s.title && <UI size={46} weight={700} color={ink.ink} style={{position: 'absolute', left: 40, top: 100}}>{s.title}</UI>}</div>
    </div>
  );
};

const BrowserScreen: React.FC<{s: Extract<Screen, {app: 'browser'}>; dark: boolean}> = ({s, dark}) => {
  const {frame, fps, start, palette, art} = useShot();
  const ink = screenInk(dark);
  const typed = s.typeCue !== undefined ? Math.round(s.url.length * clamp01((frame - start(s.typeCue)) / sec(0.9, fps))) : s.url.length;
  const loaded = s.typeCue !== undefined ? tween(frame, start(s.typeCue) + sec(0.9, fps), 0.5, fps, 'out') : 1;
  const warn = s.warning ? springFrom(frame, start(s.warning.cue), fps, 'snap') : 0;
  return (
    <div style={{position: 'absolute', inset: 0, background: ink.bg}}>
      <StatusBar color={ink.ink}/>
      <div style={{position: 'absolute', left: 30, right: 30, top: 104, height: 98, borderRadius: 30, background: ink.card, display: 'flex', alignItems: 'center', gap: 16, padding: '0 28px', boxShadow: '0 3px 14px rgba(0,0,0,.1)'}}>
        <Lock size={40} color={ink.muted}/>
        <UI size={40} color={ink.ink} moving={typed < s.url.length} style={{whiteSpace: 'nowrap', overflow: 'hidden'}}>{s.url.slice(0, typed)}</UI>
      </div>
      <div style={{position: 'absolute', left: 40, right: 40, top: 270, opacity: loaded, transform: `translateY(${(1 - loaded) * 40}px)`}}>
        <div data-qa="text" {...movingAttr(loaded < 1)} style={{fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 92, lineHeight: 1.05, color: ink.ink}}>{s.heading}</div>
        {s.body && <UI size={42} color={ink.muted} moving={loaded < 1} style={{marginTop: 26}}>{s.body}</UI>}
        <div style={{marginTop: 40, height: 420, borderRadius: 34, background: `linear-gradient(135deg, ${mix(palette.accent, ink.bg, 0.3)}, ${mix(palette.accent2, ink.bg, 0.4)})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Search size={130} color="rgba(255,255,255,.75)"/></div>
      </div>
      {s.warning && warn > 0 && <div style={{position: 'absolute', left: 30, right: 30, bottom: 170, padding: '34px', borderRadius: 40, background: palette.danger, display: 'flex', gap: 22, alignItems: 'center', transform: `translateY(${(1 - warn) * 200}px)`}}>
        <ShieldAlert size={76} color="#180400"/>
        <UI size={46} weight={700} color="#180400" moving={warn < 0.98} style={{flex: 1}}>{s.warning.text}</UI>
      </div>}
    </div>
  );
};

export const ScreenView: React.FC<{screen: Screen}> = ({screen}) => {
  const {variant, art} = useShot();
  const dark = (variant === 'base') !== ['editorial', 'dimensional', 'culture', 'bold'].includes(art.id);
  switch (screen.app) {
    case 'call': return <CallScreen s={screen}/>;
    case 'chat': return <ChatScreen s={screen} dark={dark}/>;
    case 'notifications': return <NotificationsScreen s={screen}/>;
    case 'bank': return <BankScreen s={screen} dark={dark}/>;
    case 'settings': return <SettingsScreen s={screen} dark={dark}/>;
    case 'feed': return <FeedScreen s={screen} dark={dark}/>;
    case 'browser': return <BrowserScreen s={screen} dark={dark}/>;
  }
};

import React from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame} from 'remotion';
import {Audio} from '@remotion/media';
import {FontGate} from '../../fonts';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => 1 - Math.pow(1 - clamp(value), 3);
const INK = '#171713';
const PAPER = '#e8e4d7';
const LIME = '#e4e92f';
const serif = 'Noto Serif Display, Georgia, serif';
const sans = 'Inter Tight, Arial, sans-serif';
const beat = (t: number, at: number, duration = .24) => ease((t - at) / duration);

const Texture: React.FC<{dark?: boolean; time: number}> = ({dark = false, time}) => <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: dark ? 'screen' : 'multiply', opacity: dark ? .10 : .18, backgroundImage: `url(${staticFile('library/textures/grain-512.png')})`, backgroundSize: '390px 390px', backgroundPosition: `${Math.floor(time * 13) % 390}px ${Math.floor(time * 9) % 390}px`}}/>;

const Paper: React.FC<{children: React.ReactNode; time: number; dark?: boolean}> = ({children, time, dark = false}) => <AbsoluteFill style={{background: dark ? '#151612' : PAPER, overflow: 'hidden'}}>
  <AbsoluteFill style={{background: dark ? 'radial-gradient(circle at 45% 52%, transparent 26%, #000a 125%)' : 'radial-gradient(circle at 45% 47%, #fff5 0%, transparent 55%, #514a3b4d 140%)'}}/>
  <Texture dark={dark} time={time}/>
  {children}
</AbsoluteFill>;

const EditorialMarks: React.FC<{dark?: boolean}> = ({dark = false}) => <>
  <div style={{position: 'absolute', top: 66, left: 74, width: 86, height: 3, background: dark ? PAPER : INK}}/>
  <div style={{position: 'absolute', top: 65, right: 75, width: 86, height: 3, background: dark ? PAPER : INK}}/>
  <div style={{position: 'absolute', bottom: 66, left: 76, width: 928, height: 2, background: dark ? '#eee8' : '#1818138c'}}/>
</>;

const Reveal: React.FC<{time: number; at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number}> = ({time, at, children, style, from = 52}) => {
  const p = beat(time, at, .30);
  return <div style={{opacity: p, transform: `translateY(${(1 - p) * from}px)`, clipPath: `inset(${(1 - p) * 100}% -4% -8% -4%)`, ...style}}>{children}</div>;
};

const Opening: React.FC<{time: number}> = ({time}) => {
  const push = Math.min(.035, time * .003);
  return <Paper time={time}>
    <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + push})`, transformOrigin: 'center'}}>
      <div style={{position: 'absolute', left: 73, top: 210, width: 934, height: 610, borderLeft: `3px solid ${INK}`, borderRight: `3px solid ${INK}`}}/>
      <div style={{position: 'absolute', top: 254, left: 52, width: 980, height: 132, background: LIME, transform: `rotate(-1deg) scaleX(${beat(time, .18, .36)})`, transformOrigin: 'left center'}}/>
      <div style={{position: 'absolute', top: 573, left: 52, width: 792, height: 134, background: LIME, transform: `rotate(.6deg) scaleX(${beat(time, 3.55, .32)})`, transformOrigin: 'left center'}}/>
      <div data-qa="text" style={{position: 'absolute', left: 85, top: 224, color: INK, fontFamily: serif, fontWeight: 700, fontSize: 128, lineHeight: 1.06, letterSpacing: -8}}>
        <Reveal time={time} at={.20}>НЕ <span style={{opacity: time >= 1.33 ? 1 : 0}}>ЖДИ,</span></Reveal>
        <Reveal time={time} at={2.40}>ПОКА</Reveal>
        <Reveal time={time} at={3.55}>СТРАХ</Reveal>
        <Reveal time={time} at={4.93} style={{fontStyle: 'italic', fontSize: 112}}>ПРОЙДЁТ.</Reveal>
      </div>
      <div style={{position: 'absolute', left: 79, top: 765, height: 4, width: 870 * beat(time, 4.93, .8), background: INK}}/>
    </div>
    <EditorialMarks/>
  </Paper>;
};

const Step: React.FC<{time: number}> = ({time}) => {
  const knock = Math.sin((time - 7.16) * 26) * 9 * (1 - beat(time, 7.16, .5));
  return <Paper time={time} dark>
    <div style={{position: 'absolute', left: -130, top: 104, width: 1150, height: 706, background: LIME, transform: `rotate(-9deg) scaleX(${beat(time, 5.77, .65)})`, transformOrigin: 'left center', boxShadow: '28px 24px 0 #0007'}}/>
    <div style={{position: 'absolute', left: 93, top: 245, width: 900, color: INK, fontFamily: sans, fontWeight: 900, lineHeight: .87, letterSpacing: -13, transform: `translateX(${knock}px)`}}>
      <Reveal time={time} at={6.06} style={{fontSize: 151}}>СДЕЛАЙ</Reveal>
      <Reveal time={time} at={7.16} style={{fontSize: 286, letterSpacing: -22}}>ШАГ</Reveal>
      <Reveal time={time} at={7.97} style={{fontSize: 69, letterSpacing: -3, lineHeight: 1.1}}>ВМЕСТЕ <span style={{opacity: time >= 8.28 ? 1 : 0}}>С</span> <span style={{opacity: time >= 8.83 ? 1 : 0}}>НИМ.</span></Reveal>
    </div>
    <div style={{position: 'absolute', right: 70, bottom: 165, width: 172, height: 172, border: `8px solid ${PAPER}`, borderRadius: '50%', transform: `rotate(${time * 23}deg)`}}>
      <div style={{position: 'absolute', left: 70, top: -34, width: 8, height: 226, background: PAPER}}/>
    </div>
    <EditorialMarks dark/>
  </Paper>;
};

const Door: React.FC<{time: number}> = ({time}) => {
  const p = beat(time, 9.5, 1.35);
  const width = 30 + p * 405;
  const pulse = 1 + .025 * Math.sin((time - 9.5) * 22);
  return <AbsoluteFill style={{background: '#10110f', overflow: 'hidden'}}>
    <div style={{position: 'absolute', top: -60, bottom: -60, left: 540 - width / 2, width, background: '#f3f2e9', boxShadow: `0 0 ${120 + p * 140}px ${70 + p * 90}px #fbfac8a0`, transform: `scale(${pulse})`}}/>
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #070807 0%, transparent 30%, transparent 70%, #070807 100%)'}}/>
    <div style={{position: 'absolute', left: 82, top: 160, width: 920, fontFamily: sans, fontWeight: 900, color: PAPER, lineHeight: .94, letterSpacing: -8, textShadow: '0 7px 35px #000b'}}>
      <Reveal time={time} at={9.5} style={{fontSize: 168}}>СИЛА</Reveal>
      <Reveal time={time} at={9.94} style={{fontSize: 124}}>ПРИХОДИТ</Reveal>
      <Reveal time={time} at={10.50} style={{fontSize: 108}}>В <span style={{color: LIME, opacity: time >= 11.05 ? 1 : 0}}>ДВИЖЕНИИ.</span></Reveal>
    </div>
    <div style={{position: 'absolute', bottom: 115, left: 80, width: 920 * p, height: 9, background: LIME}}/>
    <Texture dark time={time}/>
  </AbsoluteFill>;
};

const Tempo: React.FC<{time: number}> = ({time}) => {
  const words = [
    {text: 'ТВОЙ', at: 11.67, left: 90, top: 700, width: 330},
    {text: 'ТЕМП', at: 12.16, left: 270, top: 530, width: 480},
    {text: 'ТОЖЕ', at: 12.72, left: 465, top: 360, width: 450},
    {text: 'ПУТЬ.', at: 13.28, left: 625, top: 190, width: 400},
  ];
  return <Paper time={time}>
    <div style={{position: 'absolute', left: 40, bottom: 98, width: 1000, height: 840, background: '#222', clipPath: 'polygon(0 100%, 0 80%, 23% 80%, 23% 59%, 44% 59%, 44% 38%, 67% 38%, 67% 17%, 100% 17%, 100% 100%)', transform: `translateY(${(1 - beat(time, 11.67, 1.65)) * 720}px)`}}/>
    {words.map((item, i) => <div key={item.text} style={{position: 'absolute', left: item.left, top: item.top, width: item.width, height: 100, transform: `translateY(${(1 - beat(time, item.at, .23)) * 100}px)`, opacity: beat(time, item.at, .23), background: i === 3 ? LIME : PAPER, border: `5px solid ${INK}`, boxShadow: '12px 12px 0 #171713'}}>
      <div data-qa="text" style={{padding: '5px 16px', fontFamily: sans, fontWeight: 900, fontSize: 67, letterSpacing: -5, color: INK}}>{item.text}</div>
    </div>)}
    <Texture time={time}/>
  </Paper>;
};

const Continue: React.FC<{time: number}> = ({time}) => {
  const p = beat(time, 13.67, .4);
  const sweep = beat(time, 14.16, 1.1);
  return <Paper time={time} dark>
    <div style={{position: 'absolute', left: -100, top: 146, width: 1250, height: 690, borderTop: `13px solid ${LIME}`, borderBottom: `13px solid ${LIME}`, transform: `rotate(-6deg) scaleX(${p})`, transformOrigin: 'left center'}}/>
    <div style={{position: 'absolute', left: -190, top: 230, color: 'transparent', WebkitTextStroke: '3px #e8e4d733', fontFamily: sans, fontSize: 236, fontWeight: 900, letterSpacing: -15, transform: `translateX(${-250 * sweep}px)`, whiteSpace: 'nowrap'}}>ПРОДОЛЖАЙ ПРОДОЛЖАЙ</div>
    <div data-qa="text" style={{position: 'absolute', top: 380, left: 45, width: 990, color: PAPER, fontFamily: sans, fontWeight: 900, fontSize: 148, letterSpacing: -11, textAlign: 'center', opacity: p, transform: `scale(${.88 + p * .12})`, textShadow: '8px 8px 0 #000'}}>ПРОДОЛЖАЙ.</div>
    <div style={{position: 'absolute', left: 75, top: 613, width: 930 * sweep, height: 30, background: LIME, transform: 'rotate(-2deg)', transformOrigin: 'left center'}}/>
    <Texture dark time={time}/>
  </Paper>;
};

export const BeatQuoteVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const time = frame / 30;
  return <FontGate><AbsoluteFill style={{overflow: 'hidden'}}>
    {time < 5.77 ? <Opening time={time}/> : time < 9.5 ? <Step time={time}/> : time < 11.67 ? <Door time={time}/> : time < 13.67 ? <Tempo time={time}/> : <Continue time={time}/>}
    <Audio src={staticFile('library/media/motivation-beat-source.m4a')} volume={1}/>
  </AbsoluteFill></FontGate>;
};

import React from 'react';
import {Backdrop} from '../../Frame';
import {useShot} from '../../context';
import {clamp01} from '../../motion/core';
import {PHONE, PhoneBody} from '../../ui/Phone';

/** A time jump built around a single continuous hand movement. */
export const ScrollClock: React.FC = () => {
  const {t, start, frame, fps, palette} = useShot();
  const jump = clamp01((frame - start('полчаса') + fps * 0.18) / (fps * 0.48));
  const clock = Math.round(1 + 29 * jump);
  const swipe = clamp01((t - 0.72) / 1.85);
  const feedY = -760 * swipe;
  const float = Math.sin(t * 1.1) * 7;
  const card = (k: number, heading: string, tone: string) => (
    <div key={k} style={{height: 880, marginBottom: 18, borderRadius: 26, overflow: 'hidden', background: tone, position: 'relative'}}>
      <div style={{position: 'absolute', left: -80, top: 65, width: 720, height: 720, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,rgba(255,255,255,.45),rgba(255,255,255,.02) 60%,transparent 62%)'}}/>
      <div style={{position: 'absolute', left: -60, right: -60, bottom: -120, height: 440, borderRadius: '50% 50% 0 0', background: 'rgba(13,12,28,.34)', transform: 'rotate(-9deg)'}}/>
      <div style={{position: 'absolute', left: 42, bottom: 58, fontFamily: 'Inter Tight', fontSize: 64, lineHeight: 1.05, fontWeight: 800, color: '#fff', textShadow: '0 3px 24px rgba(0,0,0,.45)'}}>{heading}</div>
      <div style={{position: 'absolute', top: 110, right: 40, fontFamily: 'JetBrains Mono', fontSize: 30, color: '#fff', opacity: .8}}>0{k + 1} / 03</div>
    </div>
  );
  return <>
    <Backdrop light={[0.52, 0.1]}/>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%,rgba(121,99,207,.22),transparent 54%)'}}/>
    <div style={{position: 'absolute', left: 100, top: 252, fontFamily: 'Inter Tight', fontWeight: 700, fontSize: 62, letterSpacing: -2, color: palette.ink}}>ЗАШЁЛ НА МИНУТУ</div>
    <div style={{position: 'absolute', left: 95, top: 318, fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 184, letterSpacing: -18, color: jump > .65 ? palette.accent : palette.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>{`00:${String(clock).padStart(2, '0')}`}</div>
    <div style={{position: 'absolute', left: 278, top: 538 + float, width: PHONE.width, height: PHONE.height, transform: 'perspective(2500px) rotateY(-13deg) rotateZ(3deg) scale(.73)', transformOrigin: 'top left'}}>
      <PhoneBody>
        <div style={{position: 'absolute', inset: 0, background: '#09090e', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 124, zIndex: 2, padding: '52px 36px 0', boxSizing: 'border-box', fontFamily: 'Inter Tight', fontSize: 34, fontWeight: 800, color: '#fff', background: 'linear-gradient(#0c0c10,transparent)'}}>СЕЙЧАС В ЛЕНТЕ</div>
          <div style={{position: 'absolute', left: 16, right: 16, top: 118, transform: `translateY(${feedY}px)`}}>
            {card(0, 'Ещё одно видео', 'linear-gradient(140deg,#c05a64,#713c8e 55%,#271a53)')}
            {card(1, 'И ещё одно', 'linear-gradient(145deg,#e79870,#b75578 52%,#462954)')}
            {card(2, 'А дальше?', 'linear-gradient(145deg,#7a71c8,#314b89 60%,#1b2447)')}
          </div>
          <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, background: 'linear-gradient(transparent,#09090e 85%)'}}/>
        </div>
      </PhoneBody>
    </div>
  </>;
};

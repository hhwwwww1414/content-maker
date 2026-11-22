import React from 'react';
import {Backdrop} from '../../Frame';
import {useShot} from '../../context';
import {clamp01} from '../../motion/core';

/** Short videos become a continuous spatial path with no visible boundary. */
export const FeedTunnel: React.FC = () => {
  const {t, frame, start, palette} = useShot();
  const pace = t * 0.64 + (frame >= start('сразу') ? Math.min(0.45, (frame - start('сразу')) / 34) : 0);
  const hold = clamp01((frame - start('спросить')) / 14);
  const colors = [
    'linear-gradient(145deg,#ec9b7d,#b2597d 55%,#51315f)',
    'linear-gradient(145deg,#8c83d9,#4f5caa 55%,#293066)',
    'linear-gradient(145deg,#d1a6bb,#ae6170 60%,#5f355f)',
    'linear-gradient(145deg,#e3c28a,#ad7a8a 60%,#59436c)',
    'linear-gradient(145deg,#a4a3d9,#5974a2 60%,#273d65)',
  ];
  return <>
    <Backdrop light={[0.5, 0.25]}/>
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 48%,rgba(75,68,118,.25),transparent 62%)'}}/>
    <div style={{position: 'absolute', left: 0, right: 0, top: 240, height: 1050, opacity: .42, background: 'repeating-linear-gradient(90deg,transparent 0 175px,rgba(74,67,118,.11) 176px 178px,transparent 179px 350px)', clipPath: 'polygon(44% 0,56% 0,100% 100%,0 100%)'}}/>
    {Array.from({length: 8}, (_, i) => {
      const depth = ((i + pace) % 8) / 8;
      const size = 0.22 + depth * depth * 1.2;
      const y = 290 + Math.pow(depth, 1.5) * 1530;
      const x = 540 + Math.sin(i * 1.7) * depth * 65;
      return <div key={i} data-qa-focal={i === 5 ? '' : undefined} style={{position: 'absolute', left: x, top: y, width: 620, height: 890, border: '11px solid #17151f', borderRadius: 55, overflow: 'hidden', transform: `translate(-50%,-50%) scale(${size}) rotate(${-4 + Math.sin(i * 1.8) * 5}deg)`, boxShadow: `0 ${Math.round(20 + depth * 60)}px ${Math.round(40 + depth * 80)}px rgba(20,17,35,.24)`, background: colors[i % colors.length], zIndex: Math.round(depth * 100)}}>
        <div style={{position: 'absolute', width: 510, height: 510, left: 50, top: 100, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%,rgba(255,255,255,.46),rgba(255,255,255,.02) 65%)'}}/>
        <div style={{position: 'absolute', left: -90, right: -90, bottom: -190, height: 570, borderRadius: '50% 50% 0 0', background: 'rgba(16,14,34,.3)', transform: 'rotate(-10deg)'}}/>
        <div style={{position: 'absolute', left: 38, bottom: 40, color: 'white', fontFamily: 'Inter Tight', fontWeight: 800, fontSize: 54}}>ещё одно</div>
      </div>;
    })}
    <div style={{position: 'absolute', left: 0, right: 0, top: 155, height: 520, background: 'linear-gradient(#f7f5f1 5%,rgba(247,245,241,.91) 48%,transparent)', zIndex: 101}}/>
    <div style={{position: 'absolute', left: 91, top: 292, color: palette.ink, fontFamily: 'Inter Tight', fontWeight: 800, fontSize: 82, lineHeight: 1.04, letterSpacing: -3, zIndex: 102}}>СЛЕДУЮЩЕЕ<br/>УЖЕ ЗДЕСЬ</div>
    <div style={{position: 'absolute', right: 92, top: 600, width: 150, height: 150, borderRadius: 75, background: palette.ink, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: hold, transform: `scale(${0.7 + hold * 0.3})`, zIndex: 110}}>
      <div style={{width: 16, height: 57, background: palette.bg, borderRadius: 8, marginRight: 11}}/><div style={{width: 16, height: 57, background: palette.bg, borderRadius: 8}}/>
    </div>
  </>;
};

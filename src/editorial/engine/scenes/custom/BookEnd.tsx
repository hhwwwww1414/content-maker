import React from 'react';
import {Backdrop} from '../../Frame';
import {useShot} from '../../context';
import {clamp01} from '../../motion/core';

/** A physical last page yields to a feed that keeps going. */
export const BookEnd: React.FC = () => {
  const {frame, fps, t, start, palette} = useShot();
  const turn = clamp01((frame - start('нет') + fps * .1) / (fps * .48));
  const pageX = -26 - 430 * turn;
  const feedX = 710 - 160 * turn;
  return <>
    <Backdrop light={[0.34, 0.2]}/>
    <div style={{position: 'absolute', left: 80, top: 250, fontFamily: 'Inter Tight', fontSize: 65, fontWeight: 800, letterSpacing: -1, color: palette.ink}}>У КНИГИ ЕСТЬ</div>
    <div data-qa-focal style={{position: 'absolute', left: pageX, top: 455, width: 700, height: 950, borderRadius: '9px 40px 42px 8px', background: 'linear-gradient(100deg,#d4c8ac 0%,#f9f2e1 5%,#fff9ea 68%,#e7dbc5 100%)', boxShadow: '28px 35px 70px rgba(45,15,8,.28),inset -12px 0 35px rgba(130,93,71,.12)', transform: `rotate(${-4 - turn * 13}deg)`, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 90, top: 118, fontFamily: 'JetBrains Mono', fontSize: 32, color: '#6d6252'}}>последняя страница</div>
      <div style={{position: 'absolute', left: 90, top: 410, fontFamily: 'Inter Tight', fontWeight: 900, fontSize: 128, letterSpacing: -7, color: '#221d1a'}}>КОНЕЦ.</div>
      <div style={{position: 'absolute', left: 90, top: 595, width: 460, height: 2, background: '#b9a98d'}}/>
      <div style={{position: 'absolute', left: 90, top: 635, width: 370, height: 2, background: '#d4c7ad'}}/>
      <div style={{position: 'absolute', left: 90, top: 675, width: 410, height: 2, background: '#d4c7ad'}}/>
      <div style={{position: 'absolute', left: 90, top: 715, width: 300, height: 2, background: '#d4c7ad'}}/>
    </div>
    <div style={{position: 'absolute', left: feedX, top: 420, width: 400, height: 940, transform: `rotate(${3 - turn * 2}deg)`}}>
      {Array.from({length: 4}, (_, i) => <div key={i} style={{position: 'absolute', left: i * 8, top: i * 235 - (t * 56) % 235, width: 385 + turn * 130, height: 285, border: '8px solid #201b2b', borderRadius: 30, boxShadow: '0 20px 34px rgba(31,11,16,.22)', background: ['linear-gradient(135deg,#b387d0,#6543a0)','#e9a784','linear-gradient(135deg,#f1c0b2,#bd657f)','#7b76bc'][i]}}>
        <div style={{position: 'absolute', left: 26, top: 26, width: 62, height: 62, borderRadius: 32, background: 'rgba(255,255,255,.35)'}}/>
        <div style={{position: 'absolute', left: 27, bottom: 24, fontFamily: 'Inter Tight', fontSize: 32, color: '#fff', fontWeight: 800}}>ещё ролик</div>
      </div>)}
    </div>
    <div style={{position: 'absolute', left: 80, top: 305, opacity: turn, width: 850, padding: '12px 26px', borderRadius: 12, background: '#fff4e2', boxShadow: '0 14px 36px rgba(75,22,9,.17)', color: '#231a16', fontFamily: 'Inter Tight', fontSize: 86, fontWeight: 900, letterSpacing: -4, transform: `translateY(${(1 - turn) * 80}px)`}}>А У ЛЕНТЫ — НЕТ</div>
  </>;
};

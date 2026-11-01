import React from 'react';
import {useScene} from './scene';

/** Always moving, at low contrast, so a held beat never reads as a still slide. */
export const Backdrop: React.FC<{kind: string; camX: number; camY: number}> = ({kind, camX, camY}) => {
  const {frame, theme} = useScene();
  const t = frame + 200;
  const px = camX * -0.25, py = camY * -0.25;
  const base = <div style={{position: 'absolute', inset: 0, background: theme.bg}}/>;
  if (kind === 'grid') {
    return <>{base}
      <div style={{position: 'absolute', left: -300, right: -300, top: 900, height: 1500, transformOrigin: 'top', transform: `translate(${px}px, ${py}px) perspective(620px) rotateX(62deg)`, backgroundImage: `linear-gradient(${theme.line}66 2px, transparent 2px), linear-gradient(90deg, ${theme.line}66 2px, transparent 2px)`, backgroundSize: '90px 90px', backgroundPosition: `0 ${t * 1.6}px`, maskImage: 'linear-gradient(transparent, #000 40%)'}}/>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at ${50 + Math.sin(t / 60) * 12}% 28%, ${theme.bg2} 0%, transparent 62%)`}}/>
    </>;
  }
  if (kind === 'paper') {
    return <>{base}
      <div style={{position: 'absolute', inset: -60, transform: `translate(${px}px, ${py + t * -0.25 % 64}px)`, backgroundImage: `repeating-linear-gradient(0deg, ${theme.line}55 0 2px, transparent 2px 64px)`}}/>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 54, borderRight: `3px solid ${theme.accent}55`}}/>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at ${50 + Math.sin(t / 70) * 16}% 40%, transparent 40%, ${theme.bg2} 100%)`}}/>
    </>;
  }
  if (kind === 'rays') {
    return <>{base}<div style={{position: 'absolute', left: -600, top: -500, width: 2280, height: 2280, transform: `translate(${px}px, ${py}px) rotate(${t * 0.12}deg)`, background: `repeating-conic-gradient(${theme.bg2} 0 12deg, ${theme.bg} 12deg 24deg)`}}/></>;
  }
  if (kind === 'dots') {
    return <>{base}<div style={{position: 'absolute', inset: -80, transform: `translate(${px + Math.sin(t / 50) * 18}px, ${py + t * 0.3 % 56}px)`, backgroundImage: `radial-gradient(${theme.line} 3px, transparent 3px)`, backgroundSize: '56px 56px'}}/></>;
  }
  return <>{base}
    <div style={{position: 'absolute', inset: 0, transform: `translate(${px}px, ${py}px)`, background: `radial-gradient(circle at ${30 + Math.sin(t / 48) * 22}% ${28 + Math.cos(t / 60) * 14}%, ${theme.bg2} 0%, transparent 52%), radial-gradient(circle at ${72 + Math.cos(t / 40) * 18}% ${68 + Math.sin(t / 54) * 16}%, ${theme.accent}26 0%, transparent 46%)`}}/>
  </>;
};

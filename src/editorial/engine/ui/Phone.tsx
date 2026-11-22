import React from 'react';
import {useShot} from '../context';
import {alpha, mix} from '../tokens';

export const PHONE = {width: 760, height: 1580, bezel: 22, radius: 112, screenRadius: 92};

/** A phone with weight: a machined edge, an inner lip, a glass highlight and a contact shadow. */
export const PhoneBody: React.FC<{children: React.ReactNode; tint?: string; glare?: number; dark?: boolean}> = ({children, glare = 0.5}) => {
  const {palette} = useShot();
  const metal = 'linear-gradient(115deg,#3c3d42 0%,#8d8f96 12%,#2f3035 28%,#23242a 60%,#6e7076 88%,#2b2c31 100%)';
  void palette;
  return (
    <div data-qa-focal style={{position: 'relative', width: PHONE.width, height: PHONE.height, borderRadius: PHONE.radius, background: metal, boxShadow: `0 90px 160px rgba(0,0,0,.5), 0 30px 60px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.22)`}}>
      <div style={{position: 'absolute', inset: 6, borderRadius: PHONE.radius - 6, background: '#050507'}}/>
      <div style={{position: 'absolute', left: PHONE.bezel, top: PHONE.bezel, right: PHONE.bezel, bottom: PHONE.bezel, borderRadius: PHONE.screenRadius, overflow: 'hidden', background: '#000'}}>
        {children}
        <div style={{position: 'absolute', left: '50%', top: 22, width: 214, height: 62, marginLeft: -107, borderRadius: 40, background: '#000'}}/>
        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(118deg, rgba(255,255,255,${0.13 * glare}) 0%, rgba(255,255,255,${0.03 * glare}) 26%, rgba(255,255,255,0) 44%)`}}/>
      </div>
      <div style={{position: 'absolute', right: -5, top: 330, width: 7, height: 170, borderRadius: 4, background: '#55575d'}}/>
      <div style={{position: 'absolute', left: -5, top: 280, width: 7, height: 96, borderRadius: 4, background: '#55575d'}}/>
      <div style={{position: 'absolute', left: -5, top: 400, width: 7, height: 96, borderRadius: 4, background: '#55575d'}}/>
    </div>
  );
};

export const screenInk = (dark: boolean) => (dark ? {bg: '#0C0C10', card: '#1C1C22', ink: '#F5F5F7', muted: '#A2A2AB', line: '#2A2A32'} : {bg: '#F4F4F7', card: '#FFFFFF', ink: '#0F0F14', muted: '#60606B', line: '#DEDEE4'});
export const glass = (color: string, a = 0.72) => alpha(color, a);
export const soften = (a: string, b: string) => mix(a, b, 0.5);

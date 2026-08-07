import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {manrope, unbounded} from '../theme/fonts';
import {C} from '../components/vpn-explainer/parts';

// Static cover frame for the reel «Wi-Fi полный. Интернета нет.»
// Reuses the canonical GhostPepe mascot + the new character asset, matching the
// reel's dark cyber stage. Single held frame (rendered as a still).

const MINT = C.vpn;
const DANGER = '#FF6B61';
const A = {
  mascot: 'assets/mascot/ghostpepe-main.png',
  user: 'assets/characters/ghostpepe-user-confused-v1.png',
};

const Char: React.FC<{src: string; x: number; y: number; w: number; opacity?: number; mask?: string}> = ({
  src, x, y, w, opacity = 1, mask = 'radial-gradient(ellipse at 50% 46%, #000 52%, transparent 74%)',
}) => (
  <Img
    src={staticFile(src)}
    style={{
      position: 'absolute', left: x, top: y, width: w, height: w * 1.5, objectFit: 'contain', opacity,
      maskImage: mask, WebkitMaskImage: mask, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.55))',
    }}
  />
);

// Compact phone with full Wi-Fi bars + a loading spinner (the cover's proof).
const Phone: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => {
  const w = 300 * scale, h = 600 * scale;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 46 * scale, background: 'linear-gradient(160deg,#202a2c,#0b1113)', border: '1px solid rgba(184,255,243,0.24)', boxShadow: '0 60px 120px rgba(0,0,0,0.65)'}}>
      <div style={{position: 'absolute', inset: 16 * scale, borderRadius: 34 * scale, background: '#080e10', overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 22 * scale, left: 26 * scale, right: 26 * scale, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
          <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 20 * scale, color: 'rgba(246,250,249,0.55)'}}>9:41</span>
          <div style={{display: 'flex', gap: 4 * scale, alignItems: 'flex-end'}}>
            {[1, 2, 3, 4].map((i) => <span key={i} style={{width: 7 * scale, height: (6 + i * 6) * scale, borderRadius: 2, background: MINT, boxShadow: `0 0 10px ${MINT}88`}} />)}
          </div>
        </div>
        <div style={{position: 'absolute', top: 84 * scale, left: 24 * scale, right: 24 * scale, height: 330 * scale, borderRadius: 26 * scale, background: 'linear-gradient(150deg, rgba(34,240,208,0.10), rgba(9,16,18,0.9))', border: '1px solid rgba(184,255,243,0.12)', display: 'grid', placeItems: 'center'}}>
          <div style={{width: 82 * scale, height: 82 * scale, borderRadius: '50%', border: `${7 * scale}px solid rgba(255,255,255,0.12)`, borderTopColor: MINT, transform: 'rotate(48deg)'}} />
        </div>
        <div style={{position: 'absolute', top: 438 * scale, left: 24 * scale, right: 24 * scale, height: 11 * scale, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
          <div style={{height: '100%', width: '9%', background: MINT, borderRadius: 6}} />
        </div>
      </div>
    </div>
  );
};

// Full Wi-Fi arc badge — the "signal is full" signifier.
const WifiBadge: React.FC<{x: number; y: number; scale?: number}> = ({x, y, scale = 1}) => (
  <svg width={200 * scale} height={150 * scale} viewBox="0 0 200 150" style={{position: 'absolute', left: x, top: y, filter: `drop-shadow(0 0 18px ${MINT}66)`}}>
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M ${44 + i * 12} ${112 - i * 8} A ${56 - i * 15} ${56 - i * 15} 0 0 1 ${156 - i * 12} ${112 - i * 8}`} fill="none" stroke={MINT} strokeWidth="8" strokeLinecap="round" opacity={0.5 + i * 0.16} />
    ))}
    <circle cx="100" cy="116" r="9" fill={MINT} />
  </svg>
);

export const GhostPepeWifiNotInternetCover: React.FC = () => (
  <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
    {/* backdrop */}
    <Img src={staticFile('assets/backgrounds/cyberspace-dark.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: 'brightness(0.4) saturate(0.9)', scale: '1.08'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 34%, rgba(34,240,208,0.16), rgba(6,12,13,0.6) 44%, rgba(3,7,8,0.94) 82%)'}} />
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '74px 74px', maskImage: 'radial-gradient(ellipse at 50% 44%, #000 36%, transparent 78%)', opacity: 0.5}} />

    {/* rubric kicker */}
    <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 14, padding: '12px 30px', borderRadius: 999, background: 'rgba(6,14,16,0.6)', border: `1px solid ${MINT}44`}}>
        <span style={{width: 30, height: 3, borderRadius: 3, background: MINT, boxShadow: `0 0 12px ${MINT}`}} />
        <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: MINT}}>GHOSTPEPE ОБЪЯСНЯЕТ ИНТЕРНЕТ</span>
      </div>
    </div>

    {/* headline */}
    <div style={{position: 'absolute', top: 250, left: 70, right: 70, textAlign: 'center'}}>
      <div style={{fontFamily: unbounded, fontWeight: 900, fontSize: 116, lineHeight: 0.98, letterSpacing: -2, color: C.white, textShadow: '0 18px 50px rgba(0,0,0,0.7)'}}>
        WI-FI <span style={{color: MINT}}>ПОЛНЫЙ.</span>
      </div>
      <div style={{fontFamily: unbounded, fontWeight: 900, fontSize: 116, lineHeight: 1.0, letterSpacing: -2, color: DANGER, textShadow: `0 0 60px ${DANGER}55, 0 18px 50px rgba(0,0,0,0.7)`, marginTop: 6}}>
        ИНТЕРНЕТА НЕТ.
      </div>
    </div>

    {/* full wifi badge over the phone */}
    <WifiBadge x={228} y={718} scale={1} />

    {/* confused user (left), phone with full bars + spinner (centre), mascot (right) */}
    <Char src={A.user} x={40} y={880} w={470} />
    <Phone x={430} y={840} scale={1.02} />
    <div style={{position: 'absolute', left: 640, top: 800, width: 520, height: 520, borderRadius: '50%', background: MINT, filter: 'blur(150px)', opacity: 0.2}} />
    <Char src={A.mascot} x={650} y={760} w={470} mask="radial-gradient(ellipse at 50% 44%, #000 56%, transparent 76%)" />

    {/* bottom brand strip */}
    <div style={{position: 'absolute', bottom: 150, left: 0, right: 0, textAlign: 'center'}}>
      <div style={{fontFamily: manrope, fontWeight: 600, fontSize: 40, color: C.muted}}>Полоски — это ещё не интернет</div>
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 46, color: C.white, marginTop: 14}}>GhostPepeBot</div>
    </div>
  </AbsoluteFill>
);

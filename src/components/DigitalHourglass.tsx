import {Easing, interpolate} from 'remotion';
import {colors} from '../theme/colors';
import {unbounded} from '../theme/fonts';
import {LostSecondsPile} from './LostSecondsPile';
import {TimeDrainStream} from './TimeDrainStream';
import {TimeReturnFlow} from './TimeReturnFlow';

const EASE = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const DigitalHourglass: React.FC<{
  frame: number;
  drainProgress: number;
  freezeProgress: number;
  returnProgress: number;
  morphProgress: number;
}> = ({frame, drainProgress, freezeProgress, returnProgress, morphProgress}) => {
  const glassOpacity = 1 - interpolate(morphProgress, [0.2, 1], [0, 0.9], EASE);
  const neck = interpolate(morphProgress, [0, 1], [1, 0.16], EASE);
  const fill = interpolate(drainProgress * (1 - returnProgress), [0, 1], [1, 0.22], EASE);
  return (
    <div style={{position: 'relative', width: 510, height: 970}}>
      <svg width="510" height="970" viewBox="0 0 510 970" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: glassOpacity}}>
        <defs>
          <linearGradient id="glass-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F6FAF9" stopOpacity=".58" />
            <stop offset=".24" stopColor="#22F0D0" stopOpacity=".22" />
            <stop offset=".74" stopColor="#8CFFE9" stopOpacity=".42" />
            <stop offset="1" stopColor="#F6FAF9" stopOpacity=".14" />
          </linearGradient>
          <radialGradient id="glass-fill">
            <stop offset="0" stopColor="#22F0D0" stopOpacity=".1" />
            <stop offset="1" stopColor="#081011" stopOpacity=".7" />
          </radialGradient>
          <filter id="mint-glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <path d="M74 86 C82 310 190 360 232 454 C190 550 82 612 74 866 L436 866 C428 612 320 550 278 454 C320 360 428 310 436 86 Z" fill="url(#glass-fill)" stroke="url(#glass-edge)" strokeWidth="7" />
        <path d="M96 110 C112 280 193 344 244 430" fill="none" stroke="#F6FAF9" strokeOpacity=".22" strokeWidth="5" strokeLinecap="round" />
        <path d="M414 110 C398 280 317 344 266 430" fill="none" stroke="#22F0D0" strokeOpacity=".23" strokeWidth="3" strokeLinecap="round" />
        <path d="M70 78 H440" stroke="#8CFFE9" strokeOpacity=".62" strokeWidth="12" strokeLinecap="round" filter="url(#mint-glow)" />
        <path d="M70 874 H440" stroke="#8CFFE9" strokeOpacity=".46" strokeWidth="12" strokeLinecap="round" />
        <ellipse cx="255" cy="904" rx="126" ry="22" fill="#020607" opacity=".9" />
        <ellipse cx="255" cy="902" rx="92" ry="12" fill="#22F0D0" opacity=".08" filter="url(#mint-glow)" />
      </svg>
      <div style={{position: 'absolute', left: 132, top: 145, width: 246, textAlign: 'center', opacity: glassOpacity, fontFamily: unbounded, fontWeight: 800, fontSize: 42, letterSpacing: 2, color: colors.lightMint, textShadow: '0 0 30px rgba(34,240,208,.58)', scale: interpolate(fill, [0.22, 1], [0.82, 1], EASE)}}>00:10:00</div>
      <div style={{position: 'absolute', left: 154, top: 218, width: 202, height: 128 * fill, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(34,240,208,.2), transparent 72%)', filter: 'blur(10px)', opacity: glassOpacity}} />
      <div style={{position: 'absolute', left: 252, top: 440, width: 3 * neck, height: 68, background: colors.mint, boxShadow: '0 0 22px rgba(34,240,208,.8)', opacity: (1 - freezeProgress) * (1 - morphProgress)}} />
      <TimeDrainStream frame={frame} progress={drainProgress} frozen={freezeProgress} opacity={(1 - returnProgress) * glassOpacity} />
      <TimeReturnFlow frame={frame} progress={returnProgress} opacity={returnProgress * glassOpacity} />
      <LostSecondsPile progress={drainProgress} returnProgress={returnProgress} />
    </div>
  );
};


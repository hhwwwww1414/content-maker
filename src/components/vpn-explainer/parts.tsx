import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {manrope, unbounded} from '../../theme/fonts';

/**
 * Concrete diagram objects for the VPN / Proxy / DNS explainer, in the dark mint
 * house style but with the reference's clarity: recognizable cards, color per
 * term (DNS blue, Proxy orange, VPN mint, danger red).
 */

export const C = {
  bg: '#0A1012',
  card: 'rgba(20,28,30,0.92)',
  cardLine: 'rgba(184,255,243,0.14)',
  white: '#F6FAF9',
  muted: '#8B9B9B',
  dns: '#5B9CFF',
  proxy: '#FF9F45',
  vpn: '#22F0D0',
  danger: '#FF6B61',
  ok: '#37E0A6',
} as const;

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

export const card = (accent: string): React.CSSProperties => ({
  background: 'linear-gradient(180deg, rgba(24,32,34,0.95), rgba(12,18,20,0.95))',
  border: `1px solid ${accent}55`,
  borderRadius: 26,
  boxShadow: `0 30px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
  boxSizing: 'border-box',
});

export const Pill: React.FC<{color: string; children: React.ReactNode; style?: React.CSSProperties}> = ({color, children, style}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 20px',
      borderRadius: 999,
      background: `${color}1f`,
      border: `1px solid ${color}`,
      color,
      fontFamily: manrope,
      fontWeight: 800,
      fontSize: 24,
      letterSpacing: 0.4,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A database/site record card with named rows (like the reference's Иван/Мария). */
export const RecordCard: React.FC<{
  title: string;
  accent: string;
  rows: {n: number; name: string; color: string}[];
  icon?: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
}> = ({title, accent, rows, icon, width = 360, style}) => (
  <div style={{...card(accent), width, padding: 20, ...style}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14}}>
      {icon}
      <span style={{fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: accent}}>{title}</span>
    </div>
    {rows.map((r) => (
      <div key={r.n} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginTop: 8, borderRadius: 12, background: 'rgba(255,255,255,0.04)'}}>
        <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, color: C.muted, width: 18}}>{r.n}</span>
        <span style={{fontFamily: manrope, fontWeight: 700, fontSize: 24, color: C.white, flex: 1}}>{r.name}</span>
        <span style={{width: 54, height: 10, borderRadius: 6, background: r.color}} />
      </div>
    ))}
  </div>
);

export const DbIcon: React.FC<{color: string; size?: number}> = ({color, size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <ellipse cx="15" cy="7" rx="10" ry="4" stroke={color} strokeWidth="2.2" />
    <path d="M5 7v16c0 2.2 4.5 4 10 4s10-1.8 10-4V7" stroke={color} strokeWidth="2.2" />
    <path d="M5 15c0 2.2 4.5 4 10 4s10-1.8 10-4" stroke={color} strokeWidth="2.2" />
  </svg>
);

export const BookIcon: React.FC<{color: string; size?: number}> = ({color, size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <path d="M4 6c3-1.6 7-1.6 11 0v20c-4-1.6-8-1.6-11 0V6Z" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M26 6c-3-1.6-7-1.6-11 0v20c4-1.6 8-1.6 11 0V6Z" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);

export const ServerIcon: React.FC<{color: string; size?: number}> = ({color, size = 30}) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
    <rect x="4" y="5" width="22" height="8" rx="2.5" stroke={color} strokeWidth="2.2" />
    <rect x="4" y="17" width="22" height="8" rx="2.5" stroke={color} strokeWidth="2.2" />
    <circle cx="9" cy="9" r="1.6" fill={color} />
    <circle cx="9" cy="21" r="1.6" fill={color} />
  </svg>
);

/** An "eye" that represents the ISP / observer, with what it can see. */
export const ProviderEye: React.FC<{color: string; label: string; sees: string; opacity?: number}> = ({color, label, sees, opacity = 1}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity}}>
    <svg width="58" height="40" viewBox="0 0 58 40" fill="none">
      <path d="M4 20C12 8 46 8 54 20C46 32 12 32 4 20Z" stroke={color} strokeWidth="2.6" />
      <circle cx="29" cy="20" r="8" stroke={color} strokeWidth="2.6" />
      <circle cx="29" cy="20" r="3" fill={color} />
    </svg>
    <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 18, letterSpacing: 1.5, color: C.muted, textTransform: 'uppercase'}}>{label}</div>
    <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 22, color}}>{sees}</div>
  </div>
);

/** Flowing dashed connection with animated packets between two x points. */
export const Flow: React.FC<{x1: number; y: number; x2: number; color: string; speed?: number; count?: number; opacity?: number}> = ({x1, y, x2, color, speed = 3, count = 4, opacity = 1}) => {
  const frame = useCurrentFrame();
  const len = x2 - x1;
  return (
    <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={`${color}44`} strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
      {Array.from({length: count}).map((_, i) => {
        const p = (((frame * speed) / Math.abs(len) + i / count) % 1 + 1) % 1;
        return <circle key={i} cx={x1 + p * len} cy={y} r={6} fill={color} opacity={opacity * Math.sin(p * Math.PI)} />;
      })}
    </svg>
  );
};

/** Encrypted-tunnel wrapper glow around a device for the VPN scene. */
export const TunnelGlow: React.FC<{x: number; y: number; w: number; h: number; color: string; on: number}> = ({x, y, w, h, color, on}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 22,
      top: y - 22,
      width: w + 44,
      height: h + 44,
      borderRadius: 60,
      border: `2px solid ${color}`,
      boxShadow: `0 0 ${30 + on * 50}px ${color}${Math.round(on * 130).toString(16).padStart(2, '0')}, inset 0 0 ${20 + on * 40}px ${color}44`,
      opacity: interpolate(on, [0, 1], [0, 1], CLAMP),
    }}
  />
);

export const Cross: React.FC<{size: number; color: string; t: number}> = ({size, color, t}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{opacity: t}}>
    <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="3" fill={`${color}22`} />
    <path d="M13 13l14 14M27 13L13 27" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDashoffset={(1 - t) * 40} strokeDasharray="40" />
  </svg>
);

export const Check: React.FC<{size: number; color: string; t: number}> = ({size, color, t}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{opacity: t}}>
    <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="3" fill={`${color}22`} />
    <path d="M12 21l5 5 11-12" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={(1 - t) * 30} />
  </svg>
);

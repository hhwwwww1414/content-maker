import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import timeline from '../../generated/timeline-two-networks.json';
import {colors} from '../../theme/colors';
import {manrope, unbounded} from '../../theme/fonts';
import {ease} from '../../theme/tokens';

/**
 * Phone-first hero for the two-networks reel: one crisp device, a network badge
 * that switches Wi-Fi -> Mobile, and on-screen playback that runs smoothly then
 * buffers. The VPN chip stays lit the whole time (VPN unchanged) — only the
 * network, and therefore the result, changes.
 */

const CLAMP = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const mint = colors.mint;
const paleMint = '#B8FFF3';
const white = colors.white;
const error = '#FF6B61';
const ink = '#070C0D';

const fps = timeline.fps;
const toFrame = (ms: number) => Math.round((ms / 1000) * fps);
const seg = (id: string) => timeline.segments.find((s) => s.id === id);
const start = (id: string) => toFrame(seg(id)?.startMs ?? 0);

const smooth = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], {...CLAMP, easing: ease.inOut});

// Phone geometry (centered, clear of headlines above and all safe zones).
const PW = 404;
const PH = 762;
const PX = (1080 - PW) / 2; // 338
const PY = 476;

const WifiGlyph: React.FC<{color: string}> = ({color}) => (
  <svg width="40" height="30" viewBox="0 0 40 30" fill="none">
    <path d="M3 10.5C13 1.5 27 1.5 37 10.5" stroke={color} strokeWidth="3.4" strokeLinecap="round" opacity="0.5" />
    <path d="M9 16.5C15.5 10.5 24.5 10.5 31 16.5" stroke={color} strokeWidth="3.4" strokeLinecap="round" opacity="0.8" />
    <path d="M15 22.5C18 19.5 22 19.5 25 22.5" stroke={color} strokeWidth="3.4" strokeLinecap="round" />
    <circle cx="20" cy="27" r="2.6" fill={color} />
  </svg>
);

const SignalGlyph: React.FC<{color: string; weak?: boolean}> = ({color, weak}) => (
  <svg width="38" height="30" viewBox="0 0 38 30" fill="none">
    {[0, 1, 2, 3].map((i) => {
      const on = weak ? i < 2 : true;
      return <rect key={i} x={2 + i * 9} y={22 - i * 6} width="6" height={4 + i * 6} rx="2" fill={on ? color : 'rgba(255,255,255,0.16)'} />;
    })}
  </svg>
);

const ShieldGlyph: React.FC<{color: string}> = ({color}) => (
  <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
    <path d="M13 2L23 6V14C23 21 18.5 26 13 28C7.5 26 3 21 3 14V6L13 2Z" fill={color} opacity="0.16" stroke={color} strokeWidth="2" />
    <path d="M8.5 14.5L11.5 17.5L17.5 11" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Chip: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  accent?: string;
  pulse?: number;
  opacity?: number;
}> = ({x, y, children, accent = paleMint, pulse = 0, opacity = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 22px',
      borderRadius: 999,
      background: 'linear-gradient(180deg, rgba(22,30,32,0.92), rgba(10,15,17,0.92))',
      border: `1px solid ${accent}${pulse > 0.5 ? 'cc' : '3a'}`,
      boxShadow: `0 18px 40px rgba(0,0,0,0.5), 0 0 ${18 + pulse * 34}px ${accent}${Math.round(pulse * 120).toString(16).padStart(2, '0')}`,
      color: white,
      fontFamily: manrope,
      fontWeight: 800,
      fontSize: 26,
      letterSpacing: 0.4,
      whiteSpace: 'nowrap',
      opacity,
    }}
  >
    {children}
  </div>
);

const PhoneScreen: React.FC<{bad: number}> = ({bad}) => {
  const frame = useCurrentFrame();
  // Progress fills smoothly when good; stalls partway when bad.
  const good = 1 - bad;
  const progress = interpolate(frame, [start('s1_wifi'), start('s1_wifi') + 70], [0.05, 0.95], CLAMP);
  const shown = bad > 0.5 ? Math.min(progress, 0.42) : progress;
  const spin = (frame * 7) % 360;
  const resultColor = bad > 0.5 ? error : mint;
  return (
    <div style={{position: 'absolute', inset: 18, borderRadius: 40, background: `linear-gradient(180deg, #0c1416, ${ink})`, overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)'}}>
      {/* status row */}
      <div style={{position: 'absolute', top: 26, left: 30, right: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: manrope, fontWeight: 700, fontSize: 18, color: 'rgba(246,250,249,0.6)'}}>
        <span>9:41</span>
        <span style={{color: resultColor}}>{bad > 0.5 ? 'HD → SD' : '1080p'}</span>
      </div>
      {/* video area */}
      <div style={{position: 'absolute', top: 74, left: 26, right: 26, height: 300, borderRadius: 26, background: 'linear-gradient(150deg, rgba(34,240,208,0.14), rgba(9,16,18,0.9))', border: '1px solid rgba(184,255,243,0.14)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', inset: 0, opacity: good, background: 'radial-gradient(circle at 50% 45%, rgba(34,240,208,0.22), transparent 60%)'}} />
        {/* play / buffering */}
        {bad > 0.5 ? (
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 74, height: 74, marginLeft: -37, marginTop: -37, borderRadius: '50%', border: '6px solid rgba(255,255,255,0.12)', borderTopColor: error, rotate: `${spin}deg`}} />
        ) : (
          <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, marginLeft: -14, marginTop: -22, borderStyle: 'solid', borderWidth: '22px 0 22px 38px', borderColor: `transparent transparent transparent ${white}`, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'}} />
        )}
      </div>
      {/* progress bar */}
      <div style={{position: 'absolute', top: 406, left: 26, right: 26, height: 12, borderRadius: 8, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${shown * 100}%`, borderRadius: 8, background: resultColor, boxShadow: `0 0 16px ${resultColor}`}} />
      </div>
      {/* result label */}
      <div style={{position: 'absolute', top: 452, left: 26, right: 26, textAlign: 'center', fontFamily: unbounded, fontWeight: 700, fontSize: 30, color: resultColor, textShadow: `0 0 22px ${resultColor}66`}}>
        {bad > 0.5 ? 'Буферизация…' : 'Играет плавно'}
      </div>
      {/* three dots equalizer to imply activity */}
      <div style={{position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const h = bad > 0.5 ? 8 + ((i + Math.floor(frame / 8)) % 2) * 6 : 10 + Math.abs(Math.sin(frame / 6 + i)) * 28;
          return <div key={i} style={{width: 8, height: h, borderRadius: 4, background: resultColor, opacity: 0.7}} />;
        })}
      </div>
    </div>
  );
};

export const PhoneStage: React.FC = () => {
  const frame = useCurrentFrame();
  // One clear transition: Wi-Fi (good) -> Mobile (bad) at the "mobile" beat,
  // reinforced by a pulse on the network chip at the "network changes" beat.
  const bad = smooth(frame, start('s1_mobile') - 6, start('s1_mobile') + 24);
  const netPulse = interpolate(
    frame,
    [start('s2_network') - 6, start('s2_network') + 10, start('s2_network') + 46, start('s2_network') + 70],
    [0, 1, 1, 0],
    CLAMP,
  );
  const float = Math.sin(frame / 46) * 6;
  const netColor = bad > 0.5 ? error : mint;
  // In the final takeaway the headline owns the frame — the phone recedes so the
  // network badge never collides with the end text.
  const endStart = start('end_check_vpn');
  const recede = interpolate(frame, [endStart - 10, endStart + 24], [1, 0], {...CLAMP, easing: ease.inOut});
  const receded = 0.16 + recede * 0.84;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 6,
        opacity: receded,
        scale: String(interpolate(recede, [0, 1], [0.92, 1], CLAMP)),
        translate: `0 ${interpolate(recede, [0, 1], [34, 0], CLAMP)}px`,
        transformOrigin: '50% 60%',
      }}
    >
      {/* focal glow behind the phone */}
      <div style={{position: 'absolute', left: 540 - 320, top: PY + PH / 2 - 320, width: 640, height: 640, borderRadius: '50%', background: netColor, filter: 'blur(150px)', opacity: interpolate(bad, [0, 1], [0.24, 0.16], CLAMP)}} />

      {/* phone */}
      <div style={{position: 'absolute', left: PX, top: PY, width: PW, height: PH, translate: `0 ${float}px`}}>
        {/* floor reflection */}
        <div style={{position: 'absolute', left: 30, right: 30, bottom: -46, height: 90, borderRadius: '50%', background: netColor, filter: 'blur(40px)', opacity: 0.18}} />
        {/* body */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 58,
            background: 'linear-gradient(160deg, #202a2c 0%, #121a1c 42%, #0b1113 100%)',
            border: '1px solid rgba(184,255,243,0.16)',
            boxShadow: `0 60px 120px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.10), inset 0 0 60px rgba(0,0,0,0.4)`,
          }}
        >
          {/* dynamic island */}
          <div style={{position: 'absolute', top: 22, left: '50%', width: 118, height: 30, marginLeft: -59, borderRadius: 20, background: '#05090a', border: '1px solid rgba(255,255,255,0.05)', zIndex: 3}} />
          <PhoneScreen bad={bad} />
          {/* screen glass sheen */}
          <div style={{position: 'absolute', inset: 18, borderRadius: 40, background: 'linear-gradient(135deg, rgba(255,255,255,0.10), transparent 40%)', pointerEvents: 'none'}} />
        </div>
      </div>

      {/* Network badge — the variable. Sits at the phone's upper-right, switches state. */}
      <Chip x={PX + PW - 150} y={PY - 34} accent={netColor} pulse={netPulse}>
        {bad > 0.5 ? <SignalGlyph color={netColor} weak /> : <WifiGlyph color={netColor} />}
        <span style={{color: netColor}}>{bad > 0.5 ? 'Mobile' : 'Wi-Fi'}</span>
      </Chip>

      {/* VPN chip — constant. Lower-left of the phone, stays mint the whole time. */}
      <Chip x={PX - 96} y={PY + PH - 150} accent={mint}>
        <ShieldGlyph color={mint} />
        <span>VPN on</span>
      </Chip>
    </div>
  );
};

import type {ReactNode} from 'react';
import {tsColors} from './trafficSignatureConfig';

/**
 * A large sealed, opaque crystal data-capsule. The content is deliberately
 * unreadable — only a glossy black body with an ENCRYPTED seal and a moving
 * specular highlight. Built entirely from stable CSS gradients (no SVG filters).
 */
export const EncryptedDataCapsule: React.FC<{
  cx: number;
  cy: number;
  w?: number;
  h?: number;
  opacity?: number;
  /** 0..1 phase driving the diagonal specular streak across the face. */
  gloss?: number;
  label?: string;
  /** Faint content rendered on the glossy face (used for the mascot reflection). */
  reflection?: ReactNode;
  reflectionOpacity?: number;
  scale?: number;
}> = ({cx, cy, w = 322, h = 486, opacity = 1, gloss = 0.5, label = 'ENCRYPTED', reflection, reflectionOpacity = 0, scale = 1}) => {
  const glossX = (gloss - 0.5) * (w * 1.7);
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        borderRadius: 46,
        overflow: 'hidden',
        background: `linear-gradient(150deg, #101B1F 0%, ${tsColors.crystal} 42%, #060C0E 100%)`,
        border: `1.5px solid ${tsColors.crystalEdge}`,
        boxShadow: `0 40px 120px rgba(0,0,0,.62), inset 0 2px 3px rgba(150,220,230,.16), inset 0 -30px 60px rgba(0,0,0,.55)`,
      }}
    >
      {/* sealed inner facets — vertical cell divisions, kept very dark/unreadable */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 2px, transparent 2px, transparent 46px)',
        }}
      />
      {/* faint reflection layer (mascot reveal) */}
      {reflection ? (
        <div style={{position: 'absolute', inset: 0, opacity: reflectionOpacity, filter: 'saturate(1.2)', mixBlendMode: 'screen'}}>{reflection}</div>
      ) : null}
      {/* left edge specular rim */}
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, rgba(160,230,235,.5), rgba(160,230,235,0) 60%)'}} />
      {/* moving diagonal gloss streak */}
      <div
        style={{
          position: 'absolute',
          top: -h * 0.3,
          bottom: -h * 0.3,
          left: 0,
          width: w * 0.55,
          transform: `translateX(${glossX}px) rotate(18deg)`,
          background: 'linear-gradient(90deg, rgba(180,240,245,0) 0%, rgba(180,240,245,.14) 50%, rgba(180,240,245,0) 100%)',
        }}
      />
      {/* seal label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            border: `2px solid ${tsColors.cyan}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 22px rgba(95,199,230,.32), inset 0 0 14px rgba(95,199,230,.18)`,
          }}
        >
          {/* lock glyph, pure CSS */}
          <div style={{position: 'relative', width: 20, height: 16, borderRadius: 3, background: tsColors.cyan}}>
            <div style={{position: 'absolute', left: 4, top: -9, width: 12, height: 12, borderRadius: '50%', border: `2.5px solid ${tsColors.cyan}`, borderBottomColor: 'transparent'}} />
          </div>
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 25,
            letterSpacing: 4,
            color: 'rgba(200,240,245,.9)',
            textShadow: '0 0 18px rgba(95,199,230,.4)',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

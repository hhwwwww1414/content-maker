import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LAYERS} from '../layers';
import {CANVAS, captionSlot, IG_UNSAFE, SAFE} from './safe-area';

/**
 * Safe layout primitives. Compose content inside <SafeArea> instead of
 * positioning against the raw 1080x1920 canvas — this makes the red zones
 * unreachable by construction.
 */

/**
 * Positioned box whose coordinate origin is the top-left of the SAFE rectangle.
 * Children use left/top RELATIVE to the safe area, so you cannot accidentally
 * place text under the Instagram UI.
 */
export const SafeArea: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Set false to allow content to bleed past the safe box (e.g. full-bleed cards). */
  clip?: boolean;
}> = ({children, style, clip = false}) => (
  <div
    style={{
      position: 'absolute',
      left: SAFE.x,
      top: SAFE.y,
      width: SAFE.width,
      height: SAFE.height,
      overflow: clip ? 'hidden' : 'visible',
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * Fixed caption slot: horizontally centered, sitting above the bottom unsafe
 * zone. Feed it your caption node; it guarantees vertical position and width.
 */
export const CaptionSafeArea: React.FC<{
  children: React.ReactNode;
  height?: number;
  style?: React.CSSProperties;
}> = ({children, height = 160, style}) => {
  const slot = captionSlot(height);
  return (
    <div
      style={{
        position: 'absolute',
        left: slot.x,
        top: slot.y,
        width: slot.width,
        minHeight: slot.height,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: LAYERS.CAPTIONS,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Debug overlay: draws ALL Instagram unsafe zones + the safe boundary from the
 * single source of truth. Enable with the `show` prop (wired to REEL_OVERLAY env
 * or a Studio toggle). Renders above everything.
 */
export const SafeZoneOverlay: React.FC<{show?: boolean}> = ({show}) => {
  const enabled =
    show ??
    (typeof process !== 'undefined' && process.env && process.env.REEL_OVERLAY === '1');
  if (!enabled) return null;
  const zone = (
    box: {x: number; y: number; width: number; height: number},
    label: string,
  ): React.ReactNode => (
    <div
      key={label}
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        border: '2px dashed rgba(248,113,113,0.9)',
        background: 'rgba(248,113,113,0.10)',
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontFamily: 'monospace',
          fontSize: 20,
          color: 'rgba(248,113,113,0.95)',
        }}
      >
        {label}
      </span>
    </div>
  );
  return (
    <AbsoluteFill style={{zIndex: LAYERS.DEBUG, pointerEvents: 'none'}}>
      {zone(IG_UNSAFE.top, 'IG top')}
      {zone(IG_UNSAFE.bottom, 'IG bottom')}
      {zone(IG_UNSAFE.right, 'IG right')}
      <div
        style={{
          position: 'absolute',
          left: SAFE.x,
          top: SAFE.y,
          width: SAFE.width,
          height: SAFE.height,
          border: '2px solid rgba(34,240,208,0.8)',
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CANVAS.width,
          height: CANVAS.height,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

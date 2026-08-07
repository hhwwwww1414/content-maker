import type {CSSProperties} from 'react';

/** A bare crystal-glass maze wall. Fully controlled by the caller's own interpolated
 * opacity/translateY/blur so a scene can rise it, dissolve it or hold it steady without
 * this component ever making its own boolean jump. */
export const GlassPanel: React.FC<{
  width: number;
  height: number;
  opacity: number;
  translateY?: number;
  blur?: number;
  radius?: number;
  tint?: string;
  style?: CSSProperties;
}> = ({width, height, opacity, translateY = 0, blur = 0, radius = 20, tint = 'rgba(155,168,165,.14)', style}) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      background: tint,
      border: '1px solid rgba(140,255,233,.22)',
      opacity,
      translate: `0 ${translateY}px`,
      filter: blur ? `blur(${blur}px)` : undefined,
      ...style,
    }}
  />
);

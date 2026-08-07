import type {ReactNode} from 'react';
import {colors} from '../theme/colors';

export const PhoneFrame: React.FC<{children: ReactNode; width?: number; height?: number; danger?: boolean; glow?: boolean}> = ({
  children,
  width = 460,
  height = 720,
  danger = false,
  glow = false,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: 72,
      padding: 16,
      background: '#05080A',
      border: `3px solid ${danger ? 'rgba(255,90,82,.55)' : glow ? 'rgba(140,255,233,.55)' : 'rgba(140,255,233,.24)'}`,
      boxShadow: danger ? '0 30px 100px rgba(255,90,82,.22)' : glow ? '0 0 90px rgba(34,240,208,.32), 0 30px 110px rgba(0,0,0,.5)' : '0 30px 110px rgba(0,0,0,.55)',
      boxSizing: 'border-box',
      position: 'relative',
    }}
  >
    <div style={{width: 140, height: 22, borderRadius: 20, background: '#05080A', position: 'absolute', left: '50%', translate: '-50% 8px', zIndex: 2}} />
    <div style={{height: '100%', borderRadius: 58, overflow: 'hidden', background: colors.surface, position: 'relative'}}>{children}</div>
  </div>
);

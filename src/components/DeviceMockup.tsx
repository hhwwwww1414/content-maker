import type {ReactNode} from 'react';
import {colors} from '../theme/colors';

export const DeviceMockup: React.FC<{children: ReactNode; width?: number; height?: number; error?: boolean}> = ({children, width = 520, height = 900, error = false}) => (
  <div style={{width, height, borderRadius: 76, padding: 18, background: '#070A0B', border: `3px solid ${error ? 'rgba(255,102,90,.5)' : 'rgba(140,255,233,.3)'}`, boxShadow: error ? '0 30px 100px rgba(255,102,90,.2)' : '0 30px 110px rgba(34,240,208,.14)', boxSizing: 'border-box'}}>
    <div style={{width: 150, height: 25, borderRadius: 20, background: '#070A0B', position: 'absolute', left: '50%', translate: '-50% 10px', zIndex: 2}} />
    <div style={{height: '100%', borderRadius: 59, overflow: 'hidden', background: colors.surface, position: 'relative'}}>{children}</div>
  </div>
);

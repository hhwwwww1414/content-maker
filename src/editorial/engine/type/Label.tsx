import React from 'react';
import {useShot, roleOf, movingAttr} from '../context';

/** Small supporting text. Sentence case, real size, always measured by the guard. */
export const Label: React.FC<{children: React.ReactNode; style?: React.CSSProperties; role?: 'label' | 'body' | 'mono'; size?: number; color?: string; moving?: boolean; min?: number; id?: string}> = ({children, style, role = 'label', size = 34, color, moving, min, id}) => {
  const {art, palette} = useShot();
  const font = roleOf(art, role);
  return <div id={id} data-qa="text" data-qa-min={min} {...movingAttr(!!moving)} style={{fontFamily: font.family, fontWeight: font.weight, fontSize: size, lineHeight: font.leading, letterSpacing: font.tracking * (size / 100), color: color ?? palette.muted, ...style}}>{children}</div>;
};

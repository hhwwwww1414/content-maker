import React from 'react';
import {Backdrop} from '../../Frame';
import {movingAttr, useShot} from '../../context';
import {lerp} from '../../motion/core';

const BASE = 1250, START = 420, HIGH = 900, LOW = 110, WIDTH = 300, CENTERS = [295, 725];

/** Two equal columns part ways on the spoken words: the picture is the whole claim, one rises while the other sinks. */
export const WantGauges: React.FC<{likeLabel: string; wantLabel: string; riseCue: string; fallCue: string}> = ({likeLabel, wantLabel, riseCue, fallCue}) => {
  const {art, palette, frame, tween} = useShot();
  const rise = tween(riseCue, 1.3, 'inOut'), fall = tween(fallCue, 1.1, 'inOut');
  const breath = Math.sin(frame / 22) * 5;
  const columns = [
    {label: likeLabel, height: lerp(START, LOW, fall), color: palette.line, ink: palette.muted, moving: fall > 0 && fall < 1},
    {label: wantLabel, height: lerp(START, HIGH, rise), color: palette.accent, ink: palette.accent, moving: rise > 0 && rise < 1},
  ];
  return (
    <>
      <Backdrop/>
      {columns.map((column, i) => (
        <React.Fragment key={column.label}>
          <div data-qa-focal {...movingAttr(column.moving)} style={{position: 'absolute', left: CENTERS[i] - WIDTH / 2, top: BASE - column.height - breath, width: WIDTH, height: column.height + breath, background: column.color, borderRadius: '24px 24px 0 0'}}/>
          <div data-qa="text" style={{position: 'absolute', left: CENTERS[i] - 210, width: 420, top: BASE + 26, textAlign: 'center', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 76, lineHeight: 1.2, letterSpacing: art.display.tracking, color: column.ink}}>{column.label}</div>
        </React.Fragment>
      ))}
      <div style={{position: 'absolute', left: 80, width: 860, top: BASE, height: 6, background: palette.ink, borderRadius: 3}}/>
    </>
  );
};

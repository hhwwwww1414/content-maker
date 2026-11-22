import React from 'react';
import {Backdrop} from '../../Frame';
import {movingAttr, useShot} from '../../context';
import {clamp01} from '../../motion/core';

const COLUMNS = 6, ROWS = 7;
const CELL = {width: 143, height: 148};
const TOP = 332;
const HOME = {row: 3, column: 2};
const LETTERS = 'КМАТБЖОЛФУЕРШВНДЮЗПГЫСЭИЦХЧЩКАМДОЖТЛНУВЕБФЗГ';
const HUES = ['#F5F0E6', '#FF9AD0', '#7BE495', '#C3A0FF', '#FFA24D', '#5FD6C6'];
const FLIP = 8;

/** Every letter lives its own way until one "Я" starts turning the rest into itself, spreading out from where it stands. */
export const LetterWall: React.FC<{spreadCue: string; lockCue: string}> = ({spreadCue, lockCue}) => {
  const {art, palette, frame, start} = useShot();
  const from = start(spreadCue), to = start(lockCue);
  const reach = Math.hypot(ROWS - 1 - HOME.row, COLUMNS - 1 - HOME.column);
  const locked = frame - to;
  const beat = locked < 0 ? 0 : Math.exp(-locked / 5);
  return (
    <>
      <Backdrop/>
      <div data-qa-focal {...movingAttr(frame < to)} style={{position: 'absolute', left: 540 - (COLUMNS * CELL.width) / 2, top: TOP, width: COLUMNS * CELL.width, height: ROWS * CELL.height}}>
        {Array.from({length: ROWS * COLUMNS}, (_, i) => {
          const row = Math.floor(i / COLUMNS), column = i % COLUMNS;
          const home = row === HOME.row && column === HOME.column;
          const delay = (Math.hypot(row - HOME.row, column - HOME.column) / reach) * Math.max(1, to - from - FLIP);
          const flip = home ? 1 : clamp01((frame - from - delay) / FLIP);
          const turned = flip >= 0.5;
          const free = home ? 0 : 1 - flip;
          const swing = Math.sin(frame / (7 + (i % 5)) + i * 1.7) * free;
          const pop = home && frame >= from ? Math.exp(-(frame - from) / 6) * 0.35 : 0;
          return (
            <div key={i} style={{position: 'absolute', left: column * CELL.width, top: row * CELL.height, width: CELL.width, height: CELL.height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 128, lineHeight: 1, color: turned ? palette.accent : HUES[i % HUES.length], transform: `translateY(${swing * 12}px) rotate(${swing * (8 + (i % 4) * 5)}deg) scale(${Math.abs(Math.cos(flip * Math.PI)) * (1 + beat * 0.12 + pop)}, ${1 + beat * 0.12 + pop})`}}>
              {turned ? 'Я' : LETTERS[i]}
            </div>
          );
        })}
      </div>
    </>
  );
};

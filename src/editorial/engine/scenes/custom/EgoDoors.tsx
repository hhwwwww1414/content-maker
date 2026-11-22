import React from 'react';
import {Backdrop} from '../../Frame';
import {movingAttr, useShot} from '../../context';
import {clamp01, lerp} from '../../motion/core';
import {alpha} from '../../tokens';

const DOOR = {width: 300, height: 400};
const COLUMNS = [300, 780];
const ROWS = [400, 820, 1240];
/** Every second door. The camera ends on the jammed one in the middle row. */
const TARGET = {x: COLUMNS[0], y: ROWS[1], zoom: 2, screenY: 800};
/** Wider, not taller: the letter is too fat for the opening, and the lintel stays in sight. */
const FAT = 1.32;
const CALM = ['К', 'М', 'А'];
const CRACKS = ['M0 0 L-46 -38 L-70 -92', 'M0 0 L-60 14 L-112 2', 'M300 0 L352 -44 L366 -104', 'M300 0 L362 22 L418 8', 'M0 400 L-52 438 L-104 430', 'M300 400 L348 446 L420 440'];

/** A blow that rings out: 1 on the frame it lands, then a fading wobble. */
const useBlow = () => {
  const {frame, start} = useShot();
  return (cue: string) => {
    const f = frame - start(cue);
    return f < 0 ? 0 : Math.exp(-f / 6) * Math.cos(f / 1.5);
  };
};

/** The hook: every second door has an "Я" too wide for it. The camera picks one; on "свободой" it gets its label. */
export const EgoDoors: React.FC<{zoomCue: string; shoveCue: string; jamCue: string; labelCue: string; label: string}> = ({zoomCue, shoveCue, jamCue, labelCue, label}) => {
  const {art, palette, frame, tween} = useShot();
  const blow = useBlow();
  const zoom = tween(zoomCue, 0.5, 'inOut');
  const shove = blow(shoveCue) + blow(jamCue);
  const split = clamp01(tween(shoveCue, 0.14, 'out') * 0.45 + tween(jamCue, 0.14, 'out') * 0.55);
  const stamp = tween(labelCue, 0.18, 'out');
  const scale = lerp(1, TARGET.zoom, zoom);
  const x = lerp(0, 540 - TARGET.x * TARGET.zoom, zoom) + shove * 14;
  const y = lerp(0, TARGET.screenY - TARGET.y * TARGET.zoom, zoom) + shove * 8;
  return (
    <>
      <Backdrop/>
      <div {...movingAttr(zoom < 1)} style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${x}px, ${y}px) scale(${scale})`}}>
        {ROWS.flatMap((top, r) => COLUMNS.map((left, c) => {
          const jammed = (r + c) % 2 === 1;
          const main = left === TARGET.x && top === TARGET.y;
          const spread = main ? split * 15 : 6;
          const breath = 1 + Math.sin(frame / 5 + r + c) * 0.012;
          return (
            <div key={`${r}${c}`} style={{opacity: main ? 1 : 1 - zoom, position: 'absolute', left: left - DOOR.width / 2, top: top - DOOR.height / 2, width: DOOR.width, height: DOOR.height}}>
              <div style={{position: 'absolute', left: jammed ? -spread : 0, right: jammed ? -spread : 0, top: 0, bottom: 0, background: alpha(palette.ink, 0.1), border: `9px solid ${palette.ink}`, borderBottomWidth: 0, borderRadius: '6px 6px 0 0'}}/>
              <div style={{position: 'absolute', left: -70, right: -70, bottom: -5, height: 10, background: palette.ink}}/>
              {jammed
                ? <>
                    {main && <svg width={DOOR.width} height={DOOR.height} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: split}}>{CRACKS.map((path) => <path key={path} d={path} fill="none" stroke={palette.ink} strokeWidth={4}/>)}</svg>}
                    <div {...(main ? {'data-qa-focal': true} : {})} style={{position: 'absolute', left: -120, width: DOOR.width + 240, top: 0, height: DOOR.height, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 520, lineHeight: 0.82, color: palette.accent, transformOrigin: '50% 100%', transform: `scale(${FAT * (main ? 1 - shove * 0.05 : 1) * breath}, ${(main ? 1 + shove * 0.05 : 1) * breath})`}}>Я</div>
                  </>
                : <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 170, lineHeight: 1, color: palette.ink}}>{CALM[r]}</div>}
            </div>
          );
        }))}
      </div>
      {stamp > 0 && <div data-qa="text" {...movingAttr(stamp < 1)} style={{position: 'absolute', left: 240, width: 600, top: 760, padding: '10px 0', textAlign: 'center', background: palette.ink, color: palette.bg, fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: 96, lineHeight: 1.1, opacity: clamp01(stamp * 3), transform: `rotate(-7deg) scale(${lerp(1.7, 1, stamp)})`}}>{label}</div>}
    </>
  );
};

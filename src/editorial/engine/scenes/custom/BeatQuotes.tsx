import React from 'react';
import {Img} from 'remotion';
import {Backdrop} from '../../Frame';
import {movingAttr, useShot} from '../../context';
import {assetUrl} from '../../library';
import {clamp01, lerp} from '../../motion/core';

const MARKER = '#E4EA2E';
const LEFT = 92, WIDTH = 836, ROW = 176, BAR = 128, SIZE = 100;
type Word = {word: string; cue: string};

/** Highlighter strips are on the page before the words: each word lands on its beat and the whole sheet kicks with it. */
const MarkerLines: React.FC<{lines: Word[][]; top: number}> = ({lines, top}) => {
  const {art, palette, frame, start} = useShot();
  const display = art.display;
  const hits = lines.flat().map((w) => start(w.cue));
  const last = hits.filter((h) => h <= frame).at(-1);
  const kick = last === undefined ? 0 : Math.exp(-(frame - last) / 4);
  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${1 + frame * 0.00012 + kick * 0.012})`, transformOrigin: '50% 48%'}}>
      {lines.map((line, row) => (
        <div key={row} data-qa-focal style={{position: 'absolute', left: LEFT, top: top + row * ROW, width: WIDTH, height: ROW}}>
          <div style={{position: 'absolute', left: -12, right: -4, top: (ROW - BAR) / 2, height: BAR, background: MARKER, opacity: 0.86, transform: `rotate(${row % 2 ? 0.45 : -0.4}deg)`, borderRadius: 3}}/>
          <div style={{position: 'absolute', left: 8, top: 0, height: ROW, display: 'flex', alignItems: 'center', gap: 26, whiteSpace: 'nowrap'}}>
            {line.map((w) => {
              const at = start(w.cue);
              const p = clamp01((frame - at) / 3);
              return frame < at ? null : <span key={w.cue} data-qa="text" {...movingAttr(p < 1)} style={{fontFamily: display.family, fontWeight: display.weight, fontSize: SIZE, lineHeight: 1.25, letterSpacing: display.tracking, color: palette.ink, transform: `translateY(${lerp(10, 0, p)}px)`, opacity: lerp(0.4, 1, p)}}>{w.word}</span>;
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/** The opening quote types itself on paper; near the end a card with the next picture hits the frame, as a preview of the cut. */
export const BeatPaper: React.FC<{lines: Word[][]; cardCue: number; asset: string; focus?: [number, number]}> = ({lines, cardCue, asset, focus = [0.5, 0.5]}) => {
  const {assets, frame, start, spring} = useShot();
  const entry = assets[asset];
  const at = start(cardCue);
  const p = spring(cardCue, 'snap');
  return (
    <>
      <Backdrop light={[0.5, 0.52]}/>
      {/* The landed card covers the whole quote, which is then gone from the frame. */}
      {p < 1 && <MarkerLines lines={lines} top={690}/>}
      {entry && <Img src={assetUrl(entry)} style={{position: 'absolute', width: 1, height: 1, opacity: 0}}/>}
      {frame >= at && (
        <div data-qa-focal {...movingAttr(p < 0.98)} style={{position: 'absolute', left: 30, top: 520, width: 1020, height: 860, border: '22px solid #F7F6F1', boxShadow: '0 40px 90px rgba(0,0,0,.45)', transform: `scale(${lerp(0.5, 1, p)}) rotate(-2deg)`, overflow: 'hidden', background: '#111'}}>
          {entry && <Img src={assetUrl(entry)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`}}/>}
        </div>
      )}
    </>
  );
};

/** One line on paper, then a hard cut into dusk: the sentence you say to yourself is crossed out on the beat and corrected. */
export const BeatStrike: React.FC<{lines: Word[][]; cutCue: number; struck: string; strikeCue: string; fix: Word[]; asset: string; focus?: [number, number]}> = ({lines, cutCue, struck, strikeCue, fix, asset, focus = [0.5, 0.5]}) => {
  const {art, assets, frame, fps, start} = useShot();
  const entry = assets[asset];
  const cut = start(cutCue), strike = start(strikeCue);
  const dark = art.palettes.block, display = art.display;
  const sweep = clamp01((frame - strike) / 4);
  const zoom = 1.08 + Math.max(0, frame - cut) / fps * 0.05;
  return (
    <>
      <Backdrop light={[0.5, 0.52]}/>
      {frame < cut && <MarkerLines lines={lines} top={600}/>}
      {entry && <Img src={assetUrl(entry)} style={{position: 'absolute', width: 1, height: 1, opacity: 0}}/>}
      {frame >= cut && (
        <div style={{position: 'absolute', inset: 0, background: dark.bg}}>
          {entry && <Img src={assetUrl(entry)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`, transform: `scale(${zoom})`}}/>}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.72) 0%, rgba(0,0,0,.45) 44%, rgba(0,0,0,0) 62%)'}}/>
          <div style={{position: 'absolute', left: LEFT, top: 330, width: WIDTH}}>
            <div style={{position: 'relative', display: 'inline-block'}}>
              <div data-qa="text" style={{fontFamily: display.family, fontWeight: display.weight, fontSize: 118, lineHeight: 1.1, letterSpacing: display.tracking, color: dark.ink, opacity: lerp(1, 0.72, sweep), whiteSpace: 'nowrap'}}>{struck}</div>
              <div style={{position: 'absolute', left: -10, right: -10, top: '52%', height: 14, background: MARKER, transform: `scaleX(${sweep})`, transformOrigin: 'left center'}}/>
            </div>
            <div style={{display: 'flex', gap: 24, marginTop: 34, whiteSpace: 'nowrap'}}>
              {fix.map((w) => frame < start(w.cue) ? null : <span key={w.cue} data-qa="text" style={{fontFamily: display.family, fontWeight: display.weight, fontSize: 118, lineHeight: 1.1, letterSpacing: display.tracking, color: MARKER}}>{w.word}</span>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

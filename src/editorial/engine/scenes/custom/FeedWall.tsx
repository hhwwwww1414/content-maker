import {Heart, MessageCircle, Send} from 'lucide-react';
import React from 'react';
import {Img} from 'remotion';
import {Backdrop, Depth} from '../../Frame';
import {movingAttr, useRegion, useShot} from '../../context';
import {assetUrl} from '../../library';
import {lerp, range} from '../../motion/core';
import {alpha} from '../../tokens';
import {Headline, textDefaults} from '../../type/Headline';

const CARD = {width: 356, height: 632, gap: 26};
const STEP = CARD.height + CARD.gap;
/** Half an hour passes in under a second: the words "полчаса назад" leave no more before the next scene. */
const RUSH = 0.8;
const COLUMNS = [-0.03, 0.34, 0.18, 0.52];

/** Scroll distance as a function of time: an idle thumb, then the half hour that went by. */
const useScroll = (cue: string, settle: string) => {
  const {frame, fps, start} = useShot();
  const at = (f: number) => {
    const t = f / fps;
    const local = range(f, [start(cue), start(cue) + Math.round(RUSH * fps)], [0, 1], 'inOut');
    const stop = range(f, [start(settle), start(settle) + Math.round(0.9 * fps)], [0, 1], 'outSoft');
    return t * lerp(330, 150, stop) + local * 6400;
  };
  return {position: at(frame), speed: Math.abs(at(frame) - at(frame - 1)) * fps};
};

const FeedCard: React.FC<{asset: string; y: number}> = ({asset, y}) => {
  const {assets} = useShot();
  const entry = assets[asset];
  return (
    <div style={{position: 'absolute', left: 0, top: y, width: CARD.width, height: CARD.height, borderRadius: 34, overflow: 'hidden', background: '#16161d', boxShadow: '0 30px 70px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.14)'}}>
      {entry && <Img src={assetUrl(entry)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}/>}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.66) 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0) 82%, rgba(0,0,0,.24) 100%)'}}/>
      <div style={{position: 'absolute', right: 20, bottom: 70, display: 'flex', flexDirection: 'column', gap: 24, color: '#fff'}}>
        <Heart size={40} strokeWidth={2.4}/><MessageCircle size={40} strokeWidth={2.4}/><Send size={40} strokeWidth={2.4}/>
      </div>
      <div style={{position: 'absolute', left: 24, bottom: 34, width: 170, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.82)'}}/>
      <div style={{position: 'absolute', left: 24, bottom: 62, width: 104, height: 14, borderRadius: 7, background: 'rgba(255,255,255,.48)'}}/>
    </div>
  );
};

/** One column of the digit strip while it rolls. A settled clock renders as plain text, so the guard can measure it. */
const RollingDigit: React.FC<{value: number; size: number; width: number}> = ({value, size, width}) => (
  <span style={{display: 'inline-block', width, height: size, overflow: 'hidden', position: 'relative', verticalAlign: 'top'}}>
    <span style={{position: 'absolute', left: 0, width, top: -(((value % 10) + 10) % 10) * size, textAlign: 'center'}}>
      {Array.from({length: 11}, (_, i) => <span key={i} style={{display: 'block', height: size, lineHeight: `${size}px`}}>{i % 10}</span>)}
    </span>
  </span>
);

/** The hook: a wall of reels behind a bedtime that was true half an hour ago. Words say "just one more", the clock says otherwise. */
export const FeedWall: React.FC<{cards: string[]; from: string; to: string; line: string; rushCue: string; settleCue: string}> = ({cards, from, to, line, rushCue, settleCue}) => {
  const {art, palette, tween} = useShot();
  const region = useRegion();
  const {position, speed} = useScroll(rushCue, settleCue);
  const blur = Math.min(7, Math.max(0, (speed - 900) / 650));
  const rush = tween(rushCue, RUSH, 'inOut');
  const rolling = rush > 0 && rush < 1;
  const heat = tween(rushCue, 0.5, 'out', RUSH * 0.6);
  const size = 268;
  const digit = Math.round(size * 0.6), colon = Math.round(size * 0.3);
  const glyphs = (rush >= 1 ? to : from).split('');
  const clockColor = heat > 0.5 ? palette.accent2 : palette.ink;
  const total = cards.length * STEP;
  return (
    <>
      <Backdrop/>
      <Depth z={-0.15}>
        <div style={{position: 'absolute', left: 540, top: 960, width: 0, height: 0, perspective: 2300}}>
          <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: 'rotateX(20deg) rotateY(-16deg) rotateZ(9deg)', filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
            {COLUMNS.map((phase, c) => {
              const direction = 1 + c * 0.12;
              return (
                <div key={c} style={{position: 'absolute', left: (c - 2) * (CARD.width + CARD.gap), top: 0, width: CARD.width}}>
                  {cards.map((_, i) => {
                    const slot = (i * STEP + phase * total + total * 8 - position * direction) % total;
                    return <FeedCard key={i} asset={cards[(i + c * 5) % cards.length]} y={slot - total / 2}/>;
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Depth>
      {/* Night falls over the wall: the clock owns the middle, the wall keeps its colour at the edges. */}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 92% 40% at 50% 34%, ${alpha(palette.bg, 0.93)} 0%, ${alpha(palette.bg, 0.8)} 56%, ${alpha(palette.bg, 0.18)} 100%), linear-gradient(to bottom, ${alpha(palette.bg, 0.5)} 0%, ${alpha(palette.bg, 0)} 60%, ${alpha(palette.bg, 0.3)} 100%)`}}/>
      <Depth z={-0.45}>
        <div data-qa-focal style={{position: 'absolute', left: 540 - (digit * 4 + colon) / 2, top: 400, width: digit * 4 + colon, height: size, fontFamily: art.display.family, fontWeight: art.display.weight, fontSize: size, lineHeight: `${size}px`, letterSpacing: 0, color: clockColor, whiteSpace: 'nowrap', fontFeatureSettings: '"tnum"'}}>
          {rolling
            ? <div {...movingAttr(true)}>
                <RollingDigit value={2} size={size} width={digit}/><RollingDigit value={3} size={size} width={digit}/>
                <span style={{display: 'inline-block', width: colon, textAlign: 'center', verticalAlign: 'top'}}>:</span>
                <RollingDigit value={lerp(Number(from[3]), Number(to[3]), rush)} size={size} width={digit}/>
                <RollingDigit value={lerp(Number(from[4]), Number(to[4]) + 40, rush)} size={size} width={digit}/>
              </div>
            : <div data-qa="text" data-qa-slack={80}>{glyphs.map((g, i) => <span key={i} style={{display: 'inline-block', width: g === ':' ? colon : digit, textAlign: 'center', verticalAlign: 'top'}}>{g}</span>)}</div>}
        </div>
        <Headline spec={textDefaults(line, {reveal: 'none', role: 'statement', emphasis: 'strike', emphasisCue: rushCue, align: 'center'})} box={{left: region.left + 24, top: 730, width: region.width - 48, height: 150}} maxSize={84} minSize={56} anchor="top"/>
      </Depth>
    </>
  );
};

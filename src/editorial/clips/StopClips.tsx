import React from 'react';
import {Composition, Easing, Img, interpolate, random, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import {FontGate} from '../engine/fonts';

// Source of the clips in the "noBottom" scene of reels-scroll-claude. Rendered to files and used as `media` plates,
// so they are ordinary licensed assets for the reel. Frame numbers are clip frames at 30 fps, timed to the measured take.

const W = 1080, H = 1920;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const OUT = Easing.bezier(0.16, 1, 0.3, 1), IN = Easing.bezier(0.55, 0, 1, 0.45), IO = Easing.bezier(0.65, 0, 0.35, 1);
const photo = (id: string) => staticFile(`library/media/scroll-${id}.jpg`);
const SERIF = 'Noto Serif Display', SANS = 'Inter Tight';

// --- Book --------------------------------------------------------------------------------------

const PAGE = {w: 372, h: 540};
const LEAVES = 20;
const LAST_FLIP = 46, CLOSE = [52, 60] as const;
const PAPER = '#efe6d3', BOARD = '#7d1d12';

const Lines: React.FC<{seed: number}> = ({seed}) => (
  <div style={{position: 'absolute', inset: '46px 40px', display: 'flex', flexDirection: 'column', gap: 15}}>
    {Array.from({length: 15}, (_, i) => <div key={i} style={{height: 7, borderRadius: 3, background: 'rgba(40,30,20,.34)', width: `${i === 14 ? 46 : 78 + random(`l${seed}${i}`) * 22}%`}}/>)}
  </div>
);

const Stack: React.FC<{side: 'left' | 'right'; depth: number}> = ({side, depth}) => {
  const layers = Math.max(1, Math.round(depth / 3));
  return <>
    {Array.from({length: layers}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: side === 'left' ? -PAGE.w : 0, top: 0, width: PAGE.w, height: PAGE.h, background: i === layers - 1 ? PAPER : i % 2 ? '#d8cdb6' : '#c7bba2', transform: `translateZ(${4 + i * 3}px)`, boxShadow: i === 0 ? '0 0 60px rgba(0,0,0,.6)' : undefined}}>
        {i === layers - 1 && <Lines seed={side === 'left' ? 1 : 2}/>}
        {i === layers - 1 && <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${side === 'left' ? 'to left' : 'to right'}, rgba(50,30,10,.34) 0%, rgba(50,30,10,0) 16%)`}}/>}
      </div>
    ))}
  </>;
};

/** A leaf turns around the spine, faster and faster: the last pages go almost at once. */
const leafStart = (i: number) => 6 + (LAST_FLIP - 11) * (1 - (1 - i / (LEAVES - 1)) ** 1.5);

const Leaf: React.FC<{i: number; frame: number; base: number}> = ({i, frame, base}) => {
  const s = leafStart(i);
  const p = interpolate(frame, [s, s + 9], [0, 1], {...clamp, easing: IO});
  if (p <= 0 || p >= 1) return null;
  const angle = -180 * p;
  const shade = Math.sin(p * Math.PI);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: PAGE.w, height: PAGE.h, transformOrigin: '0 50%', transform: `translateZ(${base + 6 + shade * 26}px) rotateY(${angle}deg)`, transformStyle: 'preserve-3d'}}>
      <div style={{position: 'absolute', inset: 0, background: PAPER, backfaceVisibility: 'hidden'}}><Lines seed={i * 2 + 3}/><div style={{position: 'absolute', inset: 0, background: `rgba(30,20,10,${0.34 * shade})`}}/></div>
      <div style={{position: 'absolute', inset: 0, background: '#e8ddc8', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)'}}><Lines seed={i * 2 + 4}/><div style={{position: 'absolute', inset: 0, background: `rgba(30,20,10,${0.22 * shade})`}}/></div>
    </div>
  );
};

const Book: React.FC = () => {
  const frame = useCurrentFrame();
  const flipped = Array.from({length: LEAVES}, (_, i) => frame >= leafStart(i) + 9).filter(Boolean).length;
  const rightDepth = 54 * (1 - flipped / LEAVES) + 3, leftDepth = 6 + 51 * (flipped / LEAVES);
  const close = interpolate(frame, [CLOSE[0], CLOSE[1]], [0, 1], {...clamp, easing: IN});
  const closed = frame >= CLOSE[1];
  const impact = interpolate(frame, [CLOSE[1], CLOSE[1] + 14], [1, 0], clamp);
  const shake = impact * Math.sin((frame - CLOSE[1]) * 2.6) * 16;
  const slide = interpolate(frame, [CLOSE[0] + 2, CLOSE[1] + 4], [0, PAGE.w * 0.5], {...clamp, easing: IO});
  const push = interpolate(frame, [0, 45], [0.96, 1.06], {...clamp, easing: OUT}) + impact * 0.02;
  const lastPage = interpolate(frame, [LAST_FLIP - 3, LAST_FLIP + 2], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 88% 40% at 50% 60%, #6b4c30 0%, #241a12 58%, #0b0b10 100%)'}}>
      <div style={{position: 'absolute', left: 540, top: 1120, width: 0, height: 0, perspective: 2000, transform: `translate(${shake * 0.3}px, ${shake}px) scale(${push})`}}>
        <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `rotateX(44deg) rotateZ(-9deg) translate(${slide}px, ${-PAGE.h / 2}px)`}}>
          <div style={{position: 'absolute', left: -PAGE.w - 14, top: -14, width: PAGE.w * 2 + 28, height: PAGE.h + 28, background: BOARD, borderRadius: 6, boxShadow: `0 ${closed ? 40 : 60}px 110px rgba(0,0,0,.7)`, clipPath: close > 0 ? `inset(-200px ${PAGE.w + 14}px -200px -200px)` : undefined}}/>
          <Stack side="left" depth={leftDepth}/>
          {close < 0.5 && <Stack side="right" depth={rightDepth}/>}
          {close < 0.5 && lastPage > 0 && <div style={{position: 'absolute', left: 0, top: 0, width: PAGE.w, height: PAGE.h, opacity: lastPage, background: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 88, color: '#1d140c', transform: `translateZ(${rightDepth + 8}px)`}}>Конец</div>}
          {Array.from({length: LEAVES}, (_, i) => <Leaf key={i} i={i} frame={frame} base={Math.max(leftDepth, rightDepth)}/>)}
          {/* The back cover swings over and shuts everything inside. */}
          {close > 0 && (
            <div style={{position: 'absolute', left: 0, top: -14, width: PAGE.w + 14, height: PAGE.h + 28, transformOrigin: '0 50%', transformStyle: 'preserve-3d', transform: `translateZ(${leftDepth + 6}px) rotateY(${-180 * close}deg)`}}>
              <div style={{position: 'absolute', inset: 0, background: PAPER, backfaceVisibility: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 88, color: '#1d140c'}}>Конец</div>
              <div style={{position: 'absolute', inset: 0, background: `linear-gradient(120deg, #9c2a1b, ${BOARD} 44%, #581208)`, borderRadius: 6, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: 'inset 0 0 0 10px rgba(255,210,160,.12)'}}/>
            </div>
          )}
        </div>
        {/* Air thrown out by the slam. */}
        {impact > 0 && Array.from({length: 26}, (_, i) => {
          const a = random(`da${i}`) * Math.PI * 2, reach = (1 - impact) * (240 + random(`dr${i}`) * 420);
          return <div key={i} style={{position: 'absolute', left: Math.cos(a) * reach, top: Math.sin(a) * reach * 0.5 + 40, width: 8, height: 8, borderRadius: '50%', background: '#f3e6cc', opacity: impact * 0.75}}/>;
        })}
      </div>
    </div>
  );
};

// --- Series ------------------------------------------------------------------------------------

const EPISODES = ['surf', 'concert', 'sunrise', 'traffic', 'puppy', 'ramen-dark', 'fireworks2', 'cat'];
const CREDITS = ['Режиссёр', 'Сценарий', 'В ролях', 'Оператор', 'Музыка', 'Конец'];
const SCREEN = {w: 940, h: 560};

const Series: React.FC = () => {
  const frame = useCurrentFrame();
  const riffle = interpolate(frame, [10, 30], [0, 1], {...clamp, easing: Easing.bezier(0.3, 0.1, 0.25, 1)});
  const position = riffle * (EPISODES.length - 1);
  const speed = Math.abs(position - interpolate(frame - 1, [10, 30], [0, 1], {...clamp, easing: Easing.bezier(0.3, 0.1, 0.25, 1)}) * (EPISODES.length - 1));
  const creditsIn = interpolate(frame, [30, 33], [0, 1], clamp);
  const roll = interpolate(frame, [31, 45], [0, 1], clamp);
  const offY = interpolate(frame, [45, 50], [1, 0.006], {...clamp, easing: IN});
  const offX = interpolate(frame, [50, 54], [1, 0], {...clamp, easing: IN});
  const dead = frame >= 54;
  const flash = frame >= 45 && frame < 55 ? interpolate(frame, [45, 50, 55], [0, 1, 0], clamp) : 0;
  const glow = dead ? 0 : (1 - creditsIn * 0.7) * offY;
  const push = interpolate(frame, [0, 70], [1, 1.08], clamp);
  return (
    <div style={{position: 'absolute', inset: 0, background: '#07070c'}}>
      <div style={{position: 'absolute', inset: 0, opacity: glow, background: 'radial-gradient(ellipse 80% 46% at 50% 54%, rgba(120,140,255,.5) 0%, rgba(40,44,110,.24) 54%, rgba(0,0,0,0) 100%)'}}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1430, height: 490, opacity: glow * 0.5, background: 'linear-gradient(to bottom, rgba(120,140,255,.26), rgba(0,0,0,0))'}}/>
      <div style={{position: 'absolute', left: (W - SCREEN.w) / 2, top: 700, width: SCREEN.w, height: SCREEN.h, transform: `perspective(2400px) rotateY(-9deg) rotateX(2deg) scale(${push})`, borderRadius: 26, background: '#101016', boxShadow: '0 60px 120px rgba(0,0,0,.8), inset 0 0 0 3px rgba(255,255,255,.14)'}}>
        <div style={{position: 'absolute', inset: 14, borderRadius: 14, overflow: 'hidden', background: '#000'}}>
          <div style={{position: 'absolute', inset: 0, transform: `scale(${offX}, ${offY})`, transformOrigin: '50% 50%', background: '#000', overflow: 'hidden'}}>
            {creditsIn < 1 && EPISODES.map((id, i) => {
              const x = (i - position) * (SCREEN.w + 16);
              if (Math.abs(x) > SCREEN.w + 40) return null;
              const last = i === EPISODES.length - 1;
              return (
                <div key={id} style={{position: 'absolute', left: x, top: 0, width: SCREEN.w - 28, height: SCREEN.h - 28, filter: speed > 0.05 ? `blur(${Math.min(9, speed * 30).toFixed(1)}px)` : undefined}}>
                  <Img src={photo(id)} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
                  <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,0) 56%)'}}/>
                  <div style={{position: 'absolute', left: 36, bottom: 28, fontFamily: SANS, fontWeight: 900, fontSize: 74, color: '#fff'}}>Серия {i + 1}{last ? <span style={{marginLeft: 22, fontSize: 40, padding: '6px 18px', borderRadius: 12, background: '#ff5a44', verticalAlign: 'middle'}}>финал</span> : null}</div>
                </div>
              );
            })}
            {creditsIn > 0 && (
              <div style={{position: 'absolute', inset: 0, background: '#000', opacity: creditsIn}}>
                <div style={{position: 'absolute', left: 0, right: 0, top: interpolate(roll, [0, 1], [SCREEN.h * 0.5, -CREDITS.length * 96 + SCREEN.h * 0.6]), textAlign: 'center'}}>
                  {CREDITS.map((line, i) => <div key={i} style={{height: 96, lineHeight: '96px', fontFamily: SERIF, fontWeight: 500, fontSize: i === CREDITS.length - 1 ? 84 : 56, color: '#f5f1e6'}}>{line}</div>)}
                </div>
              </div>
            )}
          </div>
          {flash > 0 && <div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 8, marginTop: -4, transform: `scaleX(${offX})`, background: '#fff', boxShadow: '0 0 60px 18px rgba(190,205,255,.9)', opacity: flash}}/>}
        </div>
      </div>
    </div>
  );
};

// --- Feed --------------------------------------------------------------------------------------

const FEED = ['cat', 'surf', 'ramen', 'corgi', 'concert', 'puppy', 'sunrise', 'food', 'fireworks2', 'ramen-dark'];
const CARD = {w: 660, h: 1120, gap: 34};

const Feed: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (f: number) => 1500 * (f / 30) + 1500 * (f / 30) ** 2;
  const y = at(frame);
  const speed = (at(frame) - at(frame - 1)) * 30;
  const blur = Math.min(11, speed / 900);
  const column = (width: number, height: number, x: number, rate: number, offset: number, dim: number, soft: number) => {
    const step = height + CARD.gap * (width / CARD.w);
    const total = step * FEED.length;
    return FEED.map((id, i) => {
      const top = ((i * step + offset - y * rate) % total + total) % total - step;
      if (top > H + 200) return null;
      return (
        <div key={`${x}${id}`} style={{position: 'absolute', left: x, top, width, height, borderRadius: 40 * (width / CARD.w), overflow: 'hidden', background: '#16161d', filter: soft > 0.3 ? `blur(${soft.toFixed(1)}px)` : undefined, boxShadow: '0 40px 90px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.14)'}}>
          <Img src={photo(id)} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
          <div style={{position: 'absolute', inset: 0, background: `rgba(7,7,12,${dim})`}}/>
        </div>
      );
    });
  };
  return (
    <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #15162a 0%, #0b0b12 40%, #020204 100%)', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transform: 'perspective(2400px) rotateX(10deg) rotateZ(-4deg) scale(1.16)', transformOrigin: '50% 60%'}}>
        {column(300, 510, -100, 0.55, 240, 0.62, blur * 0.5)}
        {column(300, 510, 880, 0.55, 90, 0.62, blur * 0.5)}
        {column(CARD.w, CARD.h, (W - CARD.w) / 2, 1, 200, 0.05, blur)}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 760, background: 'linear-gradient(to top, #020204 0%, rgba(2,2,4,.74) 42%, rgba(2,2,4,0) 100%)'}}/>
    </div>
  );
};

const gated = (Clip: React.FC) => () => <FontGate><Clip/></FontGate>;
const Root = () => (
  <>
    <Composition id="ClipBook" component={gated(Book)} width={W} height={H} fps={30} durationInFrames={92}/>
    <Composition id="ClipSeries" component={gated(Series)} width={W} height={H} fps={30} durationInFrames={72}/>
    <Composition id="ClipFeed" component={gated(Feed)} width={W} height={H} fps={30} durationInFrames={104}/>
  </>
);
registerRoot(Root);

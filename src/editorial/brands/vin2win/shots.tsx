// vin2win shots for the directed engine. Every beat is keyed to a spoken word, every frame has an object in motion:
// cards, price tags, a phone with real screens. Text is a headline at the top, never the picture itself.
import React from 'react';
import {Img, useCurrentFrame} from 'remotion';
import {useShot} from '../../engine/context';
import {CARS, GRID, HOME, REQUEST, REQUEST_ROWS} from './data';
import {
  BenefitChip, BoardCard, C, Cam, CarGlyph, EASE, FONT, Flash, GRAY, Headline, Outro, PBox, PT, Phone, Pill, RCover, REST, RSpot, Real, Stage, Tap, TopScrim,
  camAt, mix, pt, ptCam, ramp, realFile, shakeAt,
} from './kit';

type Cue = string | number;
type Head = {text: string; cue: Cue; off?: number; size?: number};

/** Frames on the sequence clock for a spoken cue (the kit works in absolute frames of the scene). */
const useAt = () => {
  const {start, preRoll, fps, durationFrames} = useShot();
  return {at: (cue: Cue, off = 0) => start(cue) + preRoll + Math.round(off * fps), end: durationFrames + preRoll, fps};
};

/** Headlines in sequence: each holds until the next one arrives. */
const Heads: React.FC<{heads: Head[]; y?: number}> = ({heads, y = 230}) => {
  const {at, end} = useAt();
  const starts = heads.map((h) => at(h.cue, h.off ?? -0.08));
  return <>{heads.map((h, i) => <Headline key={i} text={h.text} at={starts[i]} out={i < heads.length - 1 ? starts[i + 1] - 4 : end + 20} y={y} size={h.size ?? 76}/>)}</>;
};

const boxOf = (ref: string | PBox): PBox => {
  if (typeof ref !== 'string') return ref;
  const [car, key] = ref.split('.');
  const groups: Record<string, Record<string, PBox>> = {request: {...REQUEST, ...REQUEST_ROWS}, home: HOME, grid: GRID};
  const found = groups[car]?.[key] ?? (CARS as Record<string, {box: Record<string, PBox>}>)[car]?.box[key];
  if (!found) throw new Error(`vin2win: unknown box "${ref}"`);
  return found;
};

const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ───────────── 1. Comparing in three tabs, then the answer ─────────────

const LABELS = ['Авито', 'Авто.ру', 'Дром'];
/** Price digits cycle: a person compares and gets no answer (a convention, not real marketplace prices). */
const Scramble: React.FC<{seed: number; lead: string; frozen?: boolean}> = ({seed, lead, frozen}) => {
  const f = useCurrentFrame();
  const tick = frozen ? 0 : Math.floor(f / 2);
  const d = (k: number) => Math.floor(Math.abs(Math.sin((tick + k * 7 + seed * 13) * 12.9898) * 43758) % 10);
  return <div style={{margin: '14px 24px', font: `800 46px ${FONT}`, color: GRAY.ink, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>{`${lead} ${d(2)}${d(3)}0 000 ₽`}</div>;
};

/**
 * Three marketplace cards stand in a 3D fan and take turns at the front on the spoken words. Every look throws a
 * price tag into a growing pile. On `fallCue` the cards and the pile drop out of frame, and the vin2win catalogue
 * rises with the benefit badge lit: the answer is already in the card.
 */
export const V2wCompare: React.FC<{heads: Head[]; switchCues: Cue[]; fallCue: Cue; lead?: string; tags?: string[]}> = ({heads, switchCues, fallCue, lead = '4', tags = ['4 350 000 ₽', 'а в руки?', '4 290 000 ₽', '4 410 000 ₽', 'торг?', '4 300 000 ₽', 'выгодно?', '4 380 000 ₽', '4 290 000 ₽']}) => {
  const f = useCurrentFrame();
  const {at, fps} = useAt();
  const switches = switchCues.map((c) => at(c, -0.05));
  const fall = at(fallCue, -0.12);
  const passed = switches.filter((s) => f >= s);
  const active = passed.length ? passed.length % 3 : 1;
  const lastSwitch = passed.length ? passed[passed.length - 1] : 0;
  // Tags leave the front card faster and faster until the drop.
  const first = switches[0] ?? 0;
  const span = Math.max(1, fall - first - 4);
  const tagAt = tags.map((_, i) => first + Math.round(span * Math.sqrt(i / tags.length)));
  const fallT = (delay: number) => Math.max(0, f - fall - delay) / fps;
  const drop = (delay: number) => 0.5 * 9000 * fallT(delay) ** 2;
  const g = f >= fall;
  const cam = camAt(f, [
    {at: fall, ...REST, fy: 2700},
    {at: fall + Math.round(0.43 * fps), ...REST},
    {at: fall + Math.round(1.2 * fps), ...ptCam(201, 330, 2.2, 540, 1150)},
  ]);
  return (
    <>
      <Stage strength={g ? 1 : 0.5}>
        <div style={{position: 'absolute', inset: 0, transform: shakeAt(f, [fall], 16)}}>
          {/* the fan */}
          <div data-qa-focal style={{position: 'absolute', inset: 0, perspective: 1800, perspectiveOrigin: '540px 1050px'}}>
            {LABELS.map((label, i) => {
              const enter = ramp(f, 2 + i * 3, 18, EASE.snappy);
              const isA = i === active && !g;
              const pulse = isA ? 1 + 0.05 * Math.max(0, 1 - (f - lastSwitch) / 8) : 1;
              const lift = ramp(f, isA ? lastSwitch : 0, 10, EASE.snappy);
              const float = Math.sin(f / 26 + i * 2) * 10;
              const d = drop(i * 2);
              return (
                <div key={label} style={{position: 'absolute', left: 540 + (i - 1) * 215 - 200, top: mix(1800, 780, enter) + float + d, width: 400, height: 560, zIndex: isA ? 3 : i === 1 ? 2 : 1,
                  transform: `rotateY(${((i - 1) * -24 + (isA ? (i - 1) * 14 * lift : 0)).toFixed(2)}deg) rotateZ(${((i - 1) * 4 + fallT(i * 2) * (i - 1 || 1) * 140).toFixed(2)}deg) translateZ(${isA ? 160 * lift : 0}px) scale(${pulse.toFixed(3)})`, transformOrigin: '50% 60%'}}>
                  <BoardCard w={400} h={560} label={label} style={{filter: isA ? undefined : 'brightness(0.68)'}}>
                    <Scramble seed={i} lead={lead}/>
                  </BoardCard>
                </div>
              );
            })}
          </div>
          {/* the pile of prices: compared, piling up, answering nothing */}
          <div data-qa-allow-overlap style={{position: 'absolute', inset: 0}}>
            {tags.map((tag, i) => {
              if (f < tagAt[i]) return null;
              const k = ramp(f, tagAt[i], 12, EASE.overshoot);
              const x0 = 540 + (active - 1) * 215, y0 = 900;
              const x1 = 110 + hash(i * 3 + 1) * 640, y1 = 1180 + hash(i * 7 + 2) * 330 - i * 6;
              const arc = Math.sin(Math.PI * Math.min(1, k)) * -140;
              const question = /\?$/.test(tag);
              const d = drop(3 + (i % 4));
              return (
                <div key={i} style={{position: 'absolute', left: mix(x0, x1, k), top: mix(y0, y1, k) + arc + d, transform: `translate(-10%,0) rotate(${((hash(i) - 0.5) * 18 + fallT(3) * (hash(i * 5) - 0.5) * 300).toFixed(2)}deg) scale(${mix(0.4, 1, Math.min(1, k)).toFixed(3)})`, opacity: Math.min(1, k * 2), padding: '18px 30px', borderRadius: 30, borderBottomLeftRadius: 8, background: question ? '#2a2f31' : GRAY.card, color: question ? '#d9e0e0' : GRAY.ink, font: `800 44px ${FONT}`, letterSpacing: '-0.02em', whiteSpace: 'nowrap', boxShadow: '0 18px 40px rgba(0,0,0,0.5)'}}>{tag}</div>
              );
            })}
          </div>
          {/* the answer rises */}
          {g && (
            <>
              <Phone cam={cam} rz={mix(-10, 0, ramp(f, fall, 14, EASE.snappy))} ry={Math.sin(f / 40) * 3} rx={4} glare={ramp(f, fall, 30)}>
                <Real src="grid-benefit.jpg">
                  <RCover box={GRID.count} bg="#0a0a0a"/>
                  <RSpot box={GRID.badgeFirst} t={ramp(f, fall + Math.round(0.6 * fps), 8)} color={C.benefit} r={8} dim={0.35}/>
                </Real>
              </Phone>
              <TopScrim t={ramp(f, fall + Math.round(0.8 * fps), 10)}/>
            </>
          )}
          <Heads heads={heads} y={250}/>
        </div>
        <Flash at={fall} max={0.8}/>
      </Stage>
    </>
  );
};

// ───────────── 2. The real card in a phone, read by the camera ─────────────

type CamCue = {cue: Cue; off?: number; x?: number; y?: number; k: number; fx?: number; fy?: number};
type ScreenCue = {cue: Cue; src: string; video?: boolean; trim?: number};
type SpotCue = {cue: Cue; off?: number; box: string | PBox; color?: string};

/**
 * A phone with real screens. The camera moves between parts of the screen on the spoken words, a green ring lights
 * the part being said, and the phone keeps breathing in 3D so the frame never stands still.
 */
export const V2wPhone: React.FC<{screens: ScreenCue[]; cams: CamCue[]; spots?: SpotCue[]; heads: Head[]; chip?: {text: string; cue: Cue; y?: number; size?: number}; tilt?: [number, number]; flash?: boolean; hitCues?: Cue[]; covers?: (string | PBox)[]; taps?: {cue: Cue; box: string | PBox}[]}> = ({screens, cams, spots = [], heads, chip, tilt = [-8, -3], flash = true, hitCues = [], covers = [], taps = []}) => {
  const f = useCurrentFrame();
  const {at, end} = useAt();
  const keys = cams.map((c) => ({at: at(c.cue, c.off ?? 0), ...(c.x === undefined ? {...REST, k: c.k, fy: c.fy ?? REST.fy} : ptCam(c.x, c.y ?? 0, c.k, c.fx ?? 540, c.fy ?? 1120))} as Cam & {at: number}));
  const cam = camAt(f, keys);
  const screen = [...screens].reverse().find((s) => f >= at(s.cue, -0.1)) ?? screens[0];
  const spotStarts = spots.map((s) => at(s.cue, s.off ?? -0.2));
  const si = spotStarts.reduce((acc, s, i) => (f >= s ? i : acc), -1);
  const spot = si >= 0 ? spots[si] : null;
  const first = at(screens[0].cue, -0.1);
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, transform: shakeAt(f, hitCues.map((c) => at(c)), 12)}}>
        <Phone cam={cam} ry={mix(tilt[0], tilt[1], ramp(f, first, end - first, EASE.smooth)) + Math.sin(f / 38) * 1.6} rx={3 + Math.cos(f / 44) * 1.2} glare={ramp(f, first, 40)}>
          <Real src={screen.src} video={screen.video} trim={screen.trim}>
            {covers.map((c, i) => <RCover key={i} box={boxOf(c)} bg="#1c2023"/>)}
            {spot && <RSpot box={boxOf(spot.box)} t={ramp(f, spotStarts[si], 8)} color={spot.color ?? C.greenText} r={12}/>}
            {taps.map((t, i) => { const b = boxOf(t.box); return <Tap key={i} at={at(t.cue)} x={b.x + b.w / 2} y={b.y + b.h / 2}/>; })}
          </Real>
        </Phone>
        <TopScrim t={1} h={580}/>
        <Heads heads={heads}/>
        {chip && <BenefitChip text={chip.text} at={at(chip.cue)} y={chip.y ?? 1500} size={chip.size ?? 104}/>}
      </div>
      {flash && <Flash at={first} max={0.3}/>}
    </Stage>
  );
};

// ───────────── 3. A block of the screen pulled out as an object ─────────────

/**
 * The phone sinks back and a block of its real screen comes forward as a thick card in 3D, so the number the voice
 * says is the object in frame. A second block (the disclaimer) can follow it.
 */
export const V2wPull: React.FC<{src: string; heads: Head[]; blocks: {box: string | PBox; cue: Cue; scale?: number; y?: number}[]; chip?: {text: string; cue: Cue; y?: number; size?: number}; pills?: {text: string; cue: Cue; x: number; y: number}[]; covers?: (string | PBox)[]}> = ({src, heads, blocks, chip, pills = [], covers = []}) => {
  const f = useCurrentFrame();
  const {at} = useAt();
  const begin = at(blocks[0].cue, -0.15);
  const back = ramp(f, begin, 18, EASE.smooth);
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, transform: shakeAt(f, chip ? [at(chip.cue)] : [], 14)}}>
        <div style={{position: 'absolute', inset: 0, filter: `blur(${(back * 8).toFixed(1)}px) brightness(${mix(1, 0.45, back).toFixed(3)})`}}>
          <Phone cam={{...ptCam(201, 560, mix(2.4, 1.7, back), 540, mix(1110, 1250, back))}} ry={-4 + Math.sin(f / 40) * 2} rx={4}>
            <Real src={src}>{covers.map((c, i) => <RCover key={i} box={boxOf(c)} bg="#1c2023"/>)}</Real>
          </Phone>
        </div>
        <div style={{position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '540px 900px'}}>
          {blocks.map((b, i) => {
            const box = boxOf(b.box);
            const s0 = at(b.cue, -0.1);
            if (f < s0) return null;
            const k = ramp(f, s0, 16, EASE.overshoot);
            const prev = blocks[i + 1] ? ramp(f, at(blocks[i + 1].cue, -0.1), 14, EASE.smooth) : 0;
            // The card answers each detail with a small jolt.
            const jolt = pills.reduce((acc, p) => { const d = f - at(p.cue, -0.05); return acc + (d >= 0 && d < 10 ? Math.sin(d * 0.9) * (1 - d / 10) * 0.05 : 0); }, 0);
            const scale = (b.scale ?? 2.45) * mix(0.6, 1, Math.min(1, k)) * (1 + jolt);
            const w = box.w * PT * scale, h = box.h * PT * scale;
            const y = (b.y ?? 860) - prev * 250;
            return (
              <div key={i} data-qa-focal style={{position: 'absolute', left: 540 - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 16 * scale, overflow: 'hidden', opacity: Math.min(1, k * 2) * (1 - prev * 0.55),
                transform: `rotateX(${(8 + Math.sin(f / 30 + i) * 3).toFixed(2)}deg) rotateY(${(Math.cos(f / 36 + i) * 6).toFixed(2)}deg) translateZ(${(mix(-300, 0, Math.min(1, k)) - prev * 200).toFixed(1)}px)`,
                boxShadow: `0 ${10 * scale}px 0 #050606, 0 60px 120px rgba(0,0,0,0.75), 0 0 0 3px ${C.greenText}, 0 0 60px rgba(34,197,94,0.4)`, background: '#0a0a0a'}}>
                <Img src={realFile(src)} style={{position: 'absolute', left: -pt(box.x) * scale, top: -pt(box.y) * scale, width: 402 * PT * scale, height: 874 * PT * scale}}/>
              </div>
            );
          })}
        </div>
        <TopScrim t={1} h={560}/>
        <Heads heads={heads}/>
        {chip && <BenefitChip text={chip.text} at={at(chip.cue)} y={chip.y ?? 1290} size={chip.size ?? 112}/>}
        {pills.map((p, i) => <Pill key={i} text={p.text} at={at(p.cue, -0.05)} x={p.x} y={p.y} size={54}/>)}
      </div>
      <Flash at={begin} max={0.2}/>
    </Stage>
  );
};

// ───────────── 5. The chat flood, and the request that drowns in it ─────────────

const MSG = ['X5 2021, 6,9 млн, кто?', '+', 'в лс', 'фото есть?', 'Camry 70, 2,4 в руки', 'уже ушла', 'кто заберёт срочно', '+', 'есть Prado?', 'документы норм', 'торг у капота', 'скинь вин', 'Tiguan, 2,7', '+', 'в лс', 'ещё актуально?', 'Kia K5 в наличии', 'беру'];

/** The request as an object: a green message card with a car, the same card in both shots. */
const RequestCard: React.FC<{x: number; y: number; scale?: number; rot?: number; blur?: number; opacity?: number; text: string}> = ({x, y, scale = 1, rot = 0, blur = 0, opacity = 1, text}) => (
  <div data-qa-focal style={{position: 'absolute', left: x - 310, top: y - 80, width: 620, height: 160, borderRadius: 34, background: '#123321', border: `3px solid ${C.greenText}`, boxShadow: '0 0 50px rgba(34,197,94,0.45), 0 30px 60px rgba(0,0,0,0.6)', opacity, transform: `rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`, filter: blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
    <div style={{position: 'absolute', left: 22, top: 24, width: 150, height: 112, borderRadius: 20, background: '#eef2f1', overflow: 'hidden'}}><CarGlyph color="#15803d" style={{bottom: '16%'}}/></div>
    <div style={{position: 'absolute', left: 194, top: 30, right: 20, font: `800 40px/1.1 ${FONT}`, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>{text}</div>
    <div style={{position: 'absolute', left: 194, bottom: 26, font: `600 30px ${FONT}`, color: C.greenText}}>запрос покупателя</div>
  </div>
);

/**
 * A market chat on a tilted plane: messages stream up faster and faster, the unread counter runs to 999+.
 * The request lands on `askCue` and drowns on `sinkCue`: the stream rushes over it and it sinks out of focus.
 */
export const V2wChat: React.FC<{heads: Head[]; askCue: Cue; fastCue: Cue; sinkCue: Cue; ask: string}> = ({heads, askCue, fastCue, sinkCue, ask}) => {
  const f = useCurrentFrame();
  const {at} = useAt();
  const fast = at(fastCue), askAt = at(askCue, 0), sink = at(sinkCue, -0.2);
  // The feed is already full on frame 0: the first messages start mid-screen.
  const scroll = 700 + (f < fast ? f * 8 : fast * 8 + (f - fast) * 30);
  const unread = Math.min(999, Math.round(Math.pow(1.12, Math.max(0, f))));
  const pop = ramp(f, askAt, 14, EASE.overshoot);
  const down = ramp(f, sink, 30, EASE.exit);
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '540px 700px'}}>
        <div style={{position: 'absolute', inset: 0, transform: 'rotateX(16deg) translateZ(-60px)', transformOrigin: '540px 1200px'}}>
          {f >= askAt && f < sink + 40 && <RequestCard x={540} y={mix(1000, 1780, down) - (f >= sink ? 0 : 0)} scale={mix(0.3, 1, Math.min(1, pop)) * mix(1, 0.8, down)} rot={mix(-2, 10, down)} blur={down * 8} opacity={Math.min(1, pop * 2) * (1 - down * 0.85)} text={ask}/>}
          {Array.from({length: 44}).map((_, i) => {
            const y = 1950 + i * 112 - scroll;
            if (y < 360 || y > 2000) return null;
            const right = i % 3 === 1;
            const near = 1 - Math.min(1, Math.abs(y - 1000) / 900);
            return <div key={i} style={{position: 'absolute', top: y, [right ? 'right' : 'left']: 70 + ((i * 37) % 120), padding: '18px 28px', borderRadius: 30, [right ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 8, background: right ? '#2c3a31' : '#2a2f31', color: '#d9e0e0', font: `600 40px ${FONT}`, whiteSpace: 'nowrap', opacity: 0.55 + 0.4 * near, boxShadow: '0 14px 30px rgba(0,0,0,0.45)', zIndex: f >= sink ? 2 : 0}}>{MSG[i % MSG.length]}</div>;
          })}
        </div>
      </div>
      <div style={{position: 'absolute', right: 150, top: 1560, padding: '14px 30px', borderRadius: 999, background: '#ef4444', color: '#fff', font: `800 40px ${FONT}`, fontVariantNumeric: 'tabular-nums', boxShadow: '0 12px 30px rgba(239,68,68,0.35)'}}>{unread >= 999 ? '999+' : unread} непрочитанных</div>
      <TopScrim t={1} h={560}/>
      <Heads heads={heads}/>
    </Stage>
  );
};

/**
 * The stream drains away, the phone rises, and the drowned request floats up out of the dark and flies into the
 * catalogue tile where requests are kept. The ring lights the tile as it lands.
 */
export const V2wRescue: React.FC<{heads: Head[]; riseCue: Cue; liftCue: Cue; landCue: Cue; ask: string; screen: string; tile: string | PBox}> = ({heads, riseCue, liftCue, landCue, ask, screen, tile}) => {
  const f = useCurrentFrame();
  const {at, fps} = useAt();
  const rise = at(riseCue, -0.1), lift = at(liftCue, -0.1), land = at(landCue, -0.15);
  const box = boxOf(tile);
  const tc = {x: box.x + box.w / 2, y: box.y + box.h / 2};
  const cam = camAt(f, [
    {at: rise, ...REST, fy: 2700},
    {at: rise + Math.round(0.45 * fps), ...REST},
    {at: land - Math.round(0.6 * fps), ...ptCam(tc.x, tc.y + 60, 2.0, 540, 1150)},
  ]);
  const tx = cam.fx + (pt(tc.x) - cam.sx) * cam.k, ty = cam.fy + (pt(tc.y) - cam.sy) * cam.k;
  const fly = ramp(f, lift, Math.max(6, land - lift), EASE.smooth);
  const arc = Math.sin(Math.PI * fly) * -260;
  return (
    <Stage>
      {/* the last of the stream falls away */}
      {Array.from({length: 8}).map((_, i) => {
        const d = Math.max(0, f - (rise - 6) - i) / fps;
        return <div key={i} style={{position: 'absolute', left: 80 + hash(i) * 600, top: 500 + hash(i * 3) * 900 + 0.5 * 7000 * d * d, transform: `rotate(${((hash(i * 7) - 0.5) * 40 * d * 4).toFixed(1)}deg)`, padding: '18px 28px', borderRadius: 30, background: '#2a2f31', color: '#d9e0e0', font: `600 40px ${FONT}`, whiteSpace: 'nowrap', opacity: 0.8}}>{MSG[(i * 5) % MSG.length]}</div>;
      })}
      <Phone cam={cam} rz={mix(-10, 0, ramp(f, rise, 14, EASE.snappy))} ry={Math.sin(f / 40) * 3} rx={4} glare={ramp(f, rise, 30)}>
        <Real src={screen}><RSpot box={box} t={ramp(f, land, 8)} r={18}/></Real>
      </Phone>
      {f >= lift && f < land + 8 && <RequestCard x={mix(540, tx, fly)} y={mix(1820, ty, fly) + arc} scale={mix(1, 0.22, fly)} rot={mix(8, 0, fly)} opacity={1 - ramp(f, land, 8)} text={ask}/>}
      <TopScrim t={ramp(f, rise + Math.round(0.5 * fps), 10)} h={580}/>
      <Heads heads={heads}/>
      <Flash at={rise} max={0.6}/>
      <Flash at={land} max={0.25}/>
    </Stage>
  );
};

// ───────────── 4. Outro ─────────────

/** Logo, then the slogan lines from `heads` (the first cue starts it), then the address. */
export const V2wOutro: React.FC<{heads: Head[]}> = ({heads}) => {
  const {at} = useAt();
  return <Stage><Outro at={at(heads[0].cue, -0.08)} line={heads.map((h) => h.text).join('|')} lineAt={heads.map((h, i) => (i === 0 ? at(h.cue, 0.2) : at(h.cue, h.off ?? -0.05)))}/></Stage>;
};

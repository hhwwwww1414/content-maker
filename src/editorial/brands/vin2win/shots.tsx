// vin2win shots for the directed engine. Every beat is keyed to a spoken word, every frame has an object in motion:
// cards, price tags, a phone with real screens. Text is a headline at the top, never the picture itself.
import React from 'react';
import {Img, useCurrentFrame} from 'remotion';
import {useShot} from '../../engine/context';
import {CARS, GRID} from './data';
import {
  BenefitChip, BoardCard, C, Cam, EASE, FONT, Flash, GRAY, Headline, Outro, PBox, PT, Phone, RCover, REST, RSpot, Real, Stage, TopScrim,
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
  const found = (CARS as Record<string, {box: Record<string, PBox>}>)[car]?.box[key] ?? (GRID as Record<string, PBox>)[key];
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
export const V2wPhone: React.FC<{screens: ScreenCue[]; cams: CamCue[]; spots?: SpotCue[]; heads: Head[]; chip?: {text: string; cue: Cue; y?: number; size?: number}; tilt?: [number, number]; flash?: boolean; hitCues?: Cue[]}> = ({screens, cams, spots = [], heads, chip, tilt = [-8, -3], flash = true, hitCues = []}) => {
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
            {spot && <RSpot box={boxOf(spot.box)} t={ramp(f, spotStarts[si], 8)} color={spot.color ?? C.greenText} r={12}/>}
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
export const V2wPull: React.FC<{src: string; heads: Head[]; blocks: {box: string | PBox; cue: Cue; scale?: number; y?: number}[]; chip?: {text: string; cue: Cue; y?: number; size?: number}}> = ({src, heads, blocks, chip}) => {
  const f = useCurrentFrame();
  const {at} = useAt();
  const begin = at(blocks[0].cue, -0.15);
  const back = ramp(f, begin, 18, EASE.smooth);
  return (
    <Stage>
      <div style={{position: 'absolute', inset: 0, transform: shakeAt(f, chip ? [at(chip.cue)] : [], 14)}}>
        <div style={{position: 'absolute', inset: 0, filter: `blur(${(back * 8).toFixed(1)}px) brightness(${mix(1, 0.45, back).toFixed(3)})`}}>
          <Phone cam={{...ptCam(201, 560, mix(2.4, 1.7, back), 540, mix(1110, 1250, back))}} ry={-4 + Math.sin(f / 40) * 2} rx={4}>
            <Real src={src}/>
          </Phone>
        </div>
        <div style={{position: 'absolute', inset: 0, perspective: 1600, perspectiveOrigin: '540px 900px'}}>
          {blocks.map((b, i) => {
            const box = boxOf(b.box);
            const s0 = at(b.cue, -0.1);
            if (f < s0) return null;
            const k = ramp(f, s0, 16, EASE.overshoot);
            const prev = blocks[i + 1] ? ramp(f, at(blocks[i + 1].cue, -0.1), 14, EASE.smooth) : 0;
            const scale = (b.scale ?? 2.45) * mix(0.6, 1, Math.min(1, k));
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
      </div>
      <Flash at={begin} max={0.2}/>
    </Stage>
  );
};

// ───────────── 4. Outro ─────────────

/** Logo, then the slogan lines from `heads` (the first cue starts it), then the address. */
export const V2wOutro: React.FC<{heads: Head[]}> = ({heads}) => {
  const {at} = useAt();
  return <Stage><Outro at={at(heads[0].cue, -0.08)} line={heads.map((h) => h.text).join('|')} lineAt={heads.map((h, i) => (i === 0 ? at(h.cue, 0.2) : at(h.cue, h.off ?? -0.05)))}/></Stage>;
};

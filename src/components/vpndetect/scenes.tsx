import React from 'react';
import {interpolate} from 'remotion';
import {night} from '../vibe/theme';
import {unbounded} from '../../theme/fonts';
import {enterStyle, useEnter, useExit, useMs} from '../vibe/primitives';
import {Caption, Glass, NightChip} from '../vpn/glass';

/**
 * Scenes for the "how a site figures out you are on a VPN" reel.
 *
 * One evolving canvas over the looping background: the phone the site cannot
 * see into, then three traces it can see (address, crowding, reputation), then
 * all of them folded into a single risk score. Everything lives inside the body
 * slot (x 90..990, y 608..~950) so it stays clear of the Instagram unsafe zones.
 */

const BODY = {left: 90, top: 608, width: 900} as const;

/** Progress 0..1 of an element that appears at `atMs`. */
const useOn = (atMs: number | null, durationMs = 380) => {
  const ms = useMs();
  if (atMs === null) return 0;
  return interpolate(ms, [atMs, atMs + durationMs], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const rise = (on: number, distance = 10): React.CSSProperties => ({
  opacity: on,
  transform: `translateY(${(1 - on) * distance}px)`,
});

const Headline: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({
  children,
  color = night.text,
  size = 34,
  style,
}) => (
  <div
    style={{
      fontFamily: unbounded,
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1.08,
      color,
      textShadow: night.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ chapter 1 */

/** Phone with a VPN switch on screen — the thing the site never actually sees. */
const PhoneGlyph: React.FC<{banner: number; hidden: number}> = ({banner, hidden}) => (
  <svg width={196} height={228} viewBox="0 0 196 228">
    <rect x={38} y={6} width={120} height={216} rx={20} fill="rgba(255,255,255,0.07)" stroke={night.line} strokeWidth={3} />
    <rect x={78} y={16} width={40} height={7} rx={3.5} fill={night.textFaint} />

    {/* the site's demand, rendered inside the page the user is looking at */}
    <g opacity={banner}>
      <rect x={50} y={36} width={96} height={44} rx={8} fill="rgba(255,107,90,0.20)" stroke={night.red} strokeWidth={2.5} />
      <g stroke={night.red} strokeWidth={3} strokeLinecap="round">
        <line x1={60} y1={52} x2={136} y2={52} />
        <line x1={60} y1={65} x2={112} y2={65} />
      </g>
    </g>

    {/* the VPN toggle: on the device, never transmitted */}
    <g opacity={hidden}>
      <rect x={50} y={104} width={96} height={40} rx={20} fill="rgba(63,224,168,0.16)" stroke={night.mint} strokeWidth={2.5} />
      <circle cx={126} cy={124} r={13} fill={night.mint} />
      <text
        x={98}
        y={172}
        textAnchor="middle"
        style={{fontFamily: unbounded, fontWeight: 800, fontSize: 20, fill: night.mint}}
      >
        VPN
      </text>
    </g>

    {/* the site's line of sight, struck through */}
    <g opacity={hidden}>
      <line x1={12} y1={190} x2={184} y2={126} stroke={night.red} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      <circle cx={16} cy={192} r={7} fill="none" stroke={night.red} strokeWidth={3} />
    </g>
  </svg>
);

export const HookScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  bannerAtMs: number | null;
  crossAtMs: number | null;
  notSureAtMs: number | null;
  unknownAtMs: number | null;
  tracesAtMs: number | null;
  labels: {card: string; banner: string; cross: string; notSure: string; unknown: string; traces: string};
}> = ({atMs, untilMs, bannerAtMs, crossAtMs, notSureAtMs, unknownAtMs, tracesAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 1, rise: 0});
  const exit = useExit(untilMs, 320);
  const banner = useOn(bannerAtMs, 440);
  const cross = useOn(crossAtMs, 560);
  const notSure = useOn(notSureAtMs, 440);
  const unknown = useOn(unknownAtMs, 460);
  const traces = useOn(tracesAtMs, 440);
  if (enter.opacity * exit <= 0.001) return null;

  // "on or off" — the two states the site genuinely cannot tell apart.
  const states = labels.unknown.split('·').map((part) => part.trim()).filter(Boolean);

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, opacity: exit}}>
      <div style={{display: 'flex', gap: 26, alignItems: 'flex-start'}}>
        <div style={{flexShrink: 0}}>
          <Caption style={{fontSize: 18, letterSpacing: 2.2, marginBottom: 8}}>{labels.card}</Caption>
          <PhoneGlyph banner={banner} hidden={cross} />
        </div>

        <div style={{flex: 1, paddingTop: 22}}>
          <div style={{...rise(banner, 12)}}>
            <NightChip label={labels.banner} tone="danger" size={26} />
          </div>

          <div style={{marginTop: 20, ...rise(cross, 10)}}>
            <Caption style={{fontSize: 19, letterSpacing: 1.2, color: night.red}}>{labels.cross}</Caption>
          </div>

          <div style={{marginTop: 20, ...rise(notSure, 12)}}>
            <Headline size={34} color={night.mint}>
              {labels.notSure}
            </Headline>
          </div>

          {/* both readings stay on screen, neither one resolved */}
          <div style={{display: 'flex', gap: 10, marginTop: 16, minHeight: 46}}>
            {states.map((state) => (
              <div key={state} style={{...rise(unknown, 10)}}>
                <NightChip label={state} tone="neutral" size={20} />
              </div>
            ))}
          </div>

          <div style={{marginTop: 12, ...rise(traces, 10)}}>
            <Headline size={28} color={night.yellow}>
              {labels.traces}
            </Headline>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 2 */

/** A parcel whose return-address label is the metaphor for the public IP. */
const ParcelGlyph: React.FC<{label: number}> = ({label}) => (
  <svg width={228} height={182} viewBox="0 0 228 182">
    <rect x={16} y={44} width={196} height={124} rx={10} fill="rgba(255,255,255,0.08)" stroke={night.line} strokeWidth={3} />
    <line x1={16} y1={78} x2={212} y2={78} stroke={night.line} strokeWidth={3} />
    <path d="M92 44 L114 20 L136 44" fill="none" stroke={night.line} strokeWidth={3} strokeLinejoin="round" />
    <g opacity={label}>
      <rect x={38} y={96} width={126} height={54} rx={7} fill="rgba(255,210,74,0.18)" stroke={night.yellow} strokeWidth={2.5} />
      <g stroke={night.yellow} strokeWidth={3} strokeLinecap="round">
        <line x1={50} y1={114} x2={152} y2={114} />
        <line x1={50} y1={130} x2={124} y2={130} />
      </g>
    </g>
  </svg>
);

export type IpField = {label: string; atMs: number | null};

export const IpScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  labelAtMs: number | null;
  cardAtMs: number | null;
  fields: IpField[];
  asnAtMs: number | null;
  labels: {card: string; label: string; ipCard: string; asn: string};
}> = ({atMs, untilMs, labelAtMs, cardAtMs, fields, asnAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const label = useOn(labelAtMs, 460);
  const card = useOn(cardAtMs, 440);
  const asn = useOn(asnAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>
      <div style={{display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: 12}}>
        <div style={{flexShrink: 0}}>
          <ParcelGlyph label={label} />
          <div style={{marginTop: 2, ...rise(label, 8)}}>
            <Caption style={{fontSize: 18, letterSpacing: 1.4, color: night.yellow}}>{labels.label}</Caption>
          </div>
        </div>

        <div style={{flex: 1, paddingTop: 8, ...rise(card, 12)}}>
          <Glass accent={night.yellow} style={{padding: '16px 20px'}}>
            <Headline size={28} color={night.yellow}>
              {labels.ipCard}
            </Headline>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14}}>
              {fields.map((field) => {
                const fieldOn = on(field.atMs);
                return (
                  <div key={field.label} style={{display: 'flex', alignItems: 'center', gap: 12, ...rise(fieldOn, 8)}}>
                    <div style={{width: 26, height: 3, borderRadius: 2, background: night.textSoft, flexShrink: 0}} />
                    <Headline size={26}>{field.label}</Headline>
                  </div>
                );
              })}
            </div>
          </Glass>
          {/* ASN is never spoken — it only ever appears explained, in small type */}
          <div style={{marginTop: 12, minHeight: 24, ...rise(asn, 6)}}>
            <Caption style={{fontSize: 17, letterSpacing: 0.8}}>{labels.asn}</Caption>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 3 */

const HouseGlyph: React.FC = () => (
  <svg width={150} height={128} viewBox="0 0 150 128">
    <path d="M20 60 L75 16 L130 60" fill="none" stroke={night.mint} strokeWidth={3.5} strokeLinejoin="round" />
    <rect x={32} y={60} width={86} height={54} rx={6} fill="rgba(63,224,168,0.14)" stroke={night.mint} strokeWidth={3} />
    <rect x={64} y={82} width={22} height={32} rx={3} fill="none" stroke={night.mint} strokeWidth={2.5} />
    <line x1={75} y1={114} x2={75} y2={124} stroke={night.mint} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const RackGlyph: React.FC = () => (
  <svg width={150} height={128} viewBox="0 0 150 128">
    <rect x={38} y={8} width={74} height={110} rx={7} fill="rgba(255,210,74,0.12)" stroke={night.yellow} strokeWidth={3} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={46} y={18 + i * 25} width={58} height={16} rx={3} fill="none" stroke={night.yellow} strokeWidth={2} />
        <circle cx={96} cy={26 + i * 25} r={2.6} fill={night.yellow} />
      </g>
    ))}
    {/* many outgoing lines: the visual tell of a shared exit point */}
    {[0, 1, 2, 3, 4].map((i) => (
      <line key={i} x1={112} y1={30 + i * 18} x2={146} y2={16 + i * 24} stroke={night.yellow} strokeWidth={2} strokeLinecap="round" opacity={0.75} />
    ))}
  </svg>
);

export const CompareScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  homeAtMs: number | null;
  homeDetailAtMs: number | null;
  dcAtMs: number | null;
  dcDetailAtMs: number | null;
  labels: {home: string; homeDetail: string; dc: string; dcDetail: string};
}> = ({atMs, untilMs, homeAtMs, homeDetailAtMs, dcAtMs, dcDetailAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const home = useOn(homeAtMs, 440);
  const homeDetail = useOn(homeDetailAtMs, 420);
  const dc = useOn(dcAtMs, 440);
  const dcDetail = useOn(dcDetailAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  const side = (
    glyph: React.ReactNode,
    title: string,
    detail: string,
    on: number,
    detailOn: number,
    color: string,
  ) => (
    <div style={{flex: 1, ...rise(on, 12)}}>
      <Glass accent={color} style={{padding: '16px 18px', textAlign: 'center'}}>
        <div style={{display: 'flex', justifyContent: 'center'}}>{glyph}</div>
        <div style={{marginTop: 8}}>
          <Headline size={23} color={color}>
            {title}
          </Headline>
        </div>
        {/* reserved so the two columns stay the same height as details land */}
        <div style={{minHeight: 46, marginTop: 8, ...rise(detailOn, 6)}}>
          <Caption style={{fontSize: 17, letterSpacing: 0.6, lineHeight: 1.25}}>{detail}</Caption>
        </div>
      </Glass>
    </div>
  );

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 18, alignItems: 'stretch'}}>
        {side(<HouseGlyph />, labels.home, labels.homeDetail, home, homeDetail, night.mint)}
        <div
          style={{
            flexShrink: 0,
            alignSelf: 'center',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 26,
            color: night.textSoft,
            opacity: dc,
            textShadow: night.shadow,
          }}
        >
          VS
        </div>
        {side(<RackGlyph />, labels.dc, labels.dcDetail, dc, dcDetail, night.yellow)}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 4 */

/** Counter that climbs 1 -> 10 -> 100 -> 500 between two scripted beats. */
const useCount = (fromMs: number | null, toMs: number | null) => {
  const ms = useMs();
  if (fromMs === null || toMs === null || toMs <= fromMs) return 1;
  const progress = interpolate(ms, [fromMs, toMs], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Stepped so the number reads as a jump between orders of magnitude.
  const steps = [1, 10, 100, 500];
  const index = Math.min(steps.length - 1, Math.floor(progress * steps.length));
  return steps[index];
};

export const SharedScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  ipAtMs: number | null;
  countFromMs: number | null;
  countToMs: number | null;
  flatAtMs: number | null;
  footnoteAtMs: number | null;
  labels: {card: string; ip: string; flat: string; footnote: string};
}> = ({atMs, untilMs, ipAtMs, countFromMs, countToMs, flatAtMs, footnoteAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ip = useOn(ipAtMs, 440);
  const flat = useOn(flatAtMs, 440);
  const footnote = useOn(footnoteAtMs, 420);
  const count = useCount(countFromMs, countToMs);
  const fill = useOn(countFromMs, 1400);
  if (enter.opacity * exit <= 0.001) return null;

  // 24 users converging on one address; how many are lit tracks the counter.
  const lit = Math.round(fill * 24);

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>

      <div style={{display: 'flex', gap: 24, alignItems: 'center', marginTop: 14}}>
        <div style={{flex: '0 0 316px'}}>
          <svg width={316} height={168} viewBox="0 0 316 168">
            {Array.from({length: 24}, (_, i) => {
              const column = i % 8;
              const row = Math.floor(i / 8);
              return (
                <circle
                  key={i}
                  cx={14 + column * 22}
                  cy={22 + row * 30}
                  r={7}
                  fill={i < lit ? night.yellow : 'rgba(255,255,255,0.10)'}
                  stroke={i < lit ? night.yellow : night.line}
                  strokeWidth={2}
                />
              );
            })}
            {/* every dot funnels into the same exit address */}
            <path d="M96 112 C 150 112, 176 128, 208 138" fill="none" stroke={night.yellow} strokeWidth={3} strokeLinecap="round" opacity={fill} />
            <rect x={210} y={116} width={94} height={44} rx={10} fill="rgba(255,210,74,0.18)" stroke={night.yellow} strokeWidth={3} opacity={ip} />
            <text
              x={257}
              y={145}
              textAnchor="middle"
              style={{fontFamily: unbounded, fontWeight: 800, fontSize: 22, fill: night.yellow, opacity: ip}}
            >
              {labels.ip}
            </text>
          </svg>
        </div>

        <div style={{flex: 1}}>
          <div
            style={{
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 68,
              lineHeight: 1,
              color: night.yellow,
              textShadow: night.shadow,
              opacity: fill,
            }}
          >
            {count}
          </div>
          <div style={{marginTop: 10, ...rise(flat, 10)}}>
            <Caption style={{fontSize: 18, letterSpacing: 0.8, lineHeight: 1.3}}>{labels.flat}</Caption>
          </div>
        </div>
      </div>

      {/* the honesty note: crowding is a signal, not proof */}
      <div style={{marginTop: 12, minHeight: 24, ...rise(footnote, 8)}}>
        <Caption style={{fontSize: 17, letterSpacing: 0.8, color: night.mint}}>{labels.footnote}</Caption>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 5 */

export type RepMark = {label: string; atMs: number | null};

export const RepScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  marks: RepMark[];
  dropAtMs: number | null;
  labels: {card: string; drop: string; clean: string; unsure: string; bad: string};
}> = ({atMs, untilMs, marks, dropAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const drop = useOn(dropAtMs, 520);
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Every mark that lands pushes the needle further down the scale.
  const landed = marks.reduce((sum, mark) => sum + on(mark.atMs), 0) / Math.max(1, marks.length);
  const needle = Math.max(landed, drop);

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>

      {/* reputation scale, clean -> bad, with a marker that slides right */}
      <div style={{position: 'relative', marginTop: 16, height: 58}}>
        <div
          style={{
            height: 16,
            borderRadius: 8,
            background: `linear-gradient(90deg, ${night.mint} 0%, ${night.yellow} 52%, ${night.red} 100%)`,
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -7,
            left: `calc(${(8 + needle * 84).toFixed(2)}% - 15px)`,
            width: 30,
            height: 30,
            borderRadius: 999,
            background: '#0B0D11',
            border: `4px solid ${night.text}`,
          }}
        />
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12}}>
          <Caption style={{fontSize: 16, letterSpacing: 1, color: night.mint}}>{labels.clean}</Caption>
          <Caption style={{fontSize: 16, letterSpacing: 1, color: night.yellow}}>{labels.unsure}</Caption>
          <Caption style={{fontSize: 16, letterSpacing: 1, color: night.red}}>{labels.bad}</Caption>
        </div>
      </div>

      <div style={{display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap', minHeight: 54}}>
        {marks.map((mark) => {
          const markOn = on(mark.atMs);
          if (markOn <= 0.001) return null;
          return (
            <div key={mark.label} style={{...rise(markOn, 10)}}>
              <NightChip label={mark.label} tone="danger" size={21} />
            </div>
          );
        })}
      </div>

      <div style={{marginTop: 14, ...rise(drop, 12)}}>
        <Headline size={34} color={night.red}>
          {labels.drop}
        </Headline>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 6 */

export type Signal = {label: string; atMs: number | null};
export type Verdict = {label: string; tone: 'mint' | 'warning' | 'danger'; atMs: number | null};

export const RiskScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  signals: Signal[];
  verdicts: Verdict[];
  labels: {card: string};
}> = ({atMs, untilMs, signals, verdicts, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + 420], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const gathered = signals.reduce((sum, signal) => sum + on(signal.atMs), 0) / Math.max(1, signals.length);

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', minHeight: 96}}>
        {signals.map((signal) => {
          const signalOn = on(signal.atMs);
          if (signalOn <= 0.001) return null;
          return (
            <div key={signal.label} style={{...rise(signalOn, 10)}}>
              <NightChip label={signal.label} tone="neutral" size={21} />
            </div>
          );
        })}
      </div>

      {/* all signals funnel into one score */}
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <svg width={40} height={30} viewBox="0 0 40 30">
          <line x1={20} y1={0} x2={20} y2={20 * gathered} stroke={night.line} strokeWidth={3} strokeLinecap="round" />
          <path
            d="M13 18 L20 28 L27 18"
            fill="none"
            stroke={night.line}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={gathered > 0.7 ? 1 : 0}
          />
        </svg>
      </div>

      {/* The box is legible from the moment the chapter opens; what `gathered`
          drives is how charged it looks, not whether it can be read. */}
      <Glass
        strong
        accent={night.yellow}
        style={{
          padding: '14px 20px',
          textAlign: 'center',
          boxShadow: `0 0 ${28 * gathered}px rgba(255,210,74,${0.35 * gathered})`,
        }}
      >
        <Headline size={30} color={night.yellow}>
          {labels.card}
        </Headline>
      </Glass>

      <div style={{display: 'flex', gap: 12, marginTop: 16, justifyContent: 'space-between'}}>
        {verdicts.map((verdict) => {
          const verdictOn = on(verdict.atMs);
          return (
            <div key={verdict.label} style={{flex: 1, ...rise(verdictOn, 12)}}>
              <NightChip
                label={verdict.label}
                tone={verdict.tone}
                size={20}
                style={{width: '100%', justifyContent: 'center'}}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

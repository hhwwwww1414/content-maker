import React from 'react';
import {interpolate} from 'remotion';
import {night} from '../vibe/theme';
import {unbounded} from '../../theme/fonts';
import {enterStyle, useEnter, useExit, useMs} from '../vibe/primitives';
import {Caption, Glass, NightChip, StrikeText} from '../vpn/glass';

/**
 * Scenes for the "why a passkey beats a password" reel.
 *
 * One evolving canvas over the looping background: the fear about Face ID is
 * cancelled on screen, the key splits into two halves that never rejoin, and
 * the same pair is re-tested against a phishing copy and a stolen database.
 * Everything lives inside the body slot (x 90..990, y 608..~950) so it stays
 * clear of the Instagram unsafe zones.
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

export const HookScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  fearAtMs: number | null;
  noAtMs: number | null;
  answerAtMs: number | null;
  labels: {card: string; fear: string; no: string; answer: string};
}> = ({atMs, untilMs, fearAtMs, noAtMs, answerAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 1, rise: 0});
  const exit = useExit(untilMs, 320);
  const fear = useOn(fearAtMs, 440);
  const no = useOn(noAtMs, 420);
  const answer = useOn(answerAtMs, 440);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, opacity: exit}}>
      <Glass strong style={{padding: '20px 24px'}}>
        <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>

        {/* the fear, quoted and then visibly cancelled — never left standing */}
        <div style={{marginTop: 16, minHeight: 44, ...rise(fear, 10)}}>
          <StrikeText label={labels.fear} progress={no} fontSize={26} color={night.textSoft} />
        </div>
      </Glass>

      <div style={{display: 'flex', alignItems: 'center', gap: 22, marginTop: 22, minHeight: 96}}>
        <div
          style={{
            flexShrink: 0,
            padding: '10px 30px',
            borderRadius: 18,
            border: `4px solid ${night.red}`,
            background: 'rgba(255,107,90,0.16)',
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 56,
            color: night.red,
            textShadow: night.shadow,
            opacity: no,
            transform: `scale(${0.86 + 0.14 * no})`,
          }}
        >
          {labels.no}
        </div>
        <Headline size={32} style={{...rise(answer, 12)}}>
          {labels.answer}
        </Headline>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 2 */

/** Phone holding a safe. The unlock arrow points inward, never at the site. */
const PhoneSafeGlyph: React.FC<{unlock: number; key_: number}> = ({unlock, key_}) => (
  <svg width={214} height={230} viewBox="0 0 214 230">
    <rect x={12} y={6} width={140} height={218} rx={20} fill="rgba(255,255,255,0.07)" stroke={night.line} strokeWidth={3} />

    {/* biometric prompt, on-device */}
    <g opacity={1}>
      <rect x={30} y={26} width={104} height={58} rx={10} fill="rgba(255,255,255,0.06)" stroke={night.line} strokeWidth={2.5} />
      <circle cx={82} cy={55} r={19} fill="none" stroke={night.mint} strokeWidth={3} />
      <circle cx={75} cy={50} r={2.6} fill={night.mint} />
      <circle cx={89} cy={50} r={2.6} fill={night.mint} />
      <path d="M73 62 Q82 69 91 62" fill="none" stroke={night.mint} strokeWidth={2.5} strokeLinecap="round" />
    </g>

    {/* the unlock permission travels down into the safe, not outward */}
    <g opacity={unlock > 0.02 ? 1 : 0}>
      <line
        x1={82}
        y1={92}
        x2={82}
        y2={92 + 34 * unlock}
        stroke={night.mint}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M74 120 L82 132 L90 120"
        fill="none"
        stroke={night.mint}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={unlock > 0.75 ? 1 : 0}
      />
    </g>

    {/* the safe with the private half inside */}
    <g opacity={0.4 + 0.6 * key_}>
      <rect x={34} y={136} width={96} height={72} rx={10} fill="rgba(63,224,168,0.14)" stroke={night.mint} strokeWidth={3} />
      <circle cx={82} cy={172} r={17} fill="none" stroke={night.mint} strokeWidth={3} />
      <line x1={82} y1={172} x2={82} y2={158} stroke={night.mint} strokeWidth={3} strokeLinecap="round" />
      <line x1={82} y1={189} x2={82} y2={196} stroke={night.mint} strokeWidth={3} strokeLinecap="round" opacity={key_} />
    </g>

    {/* the site sits outside the phone entirely */}
    <g opacity={0.55}>
      <rect x={166} y={92} width={44} height={54} rx={7} fill="rgba(255,255,255,0.06)" stroke={night.line} strokeWidth={2.5} />
      <line x1={174} y1={108} x2={202} y2={108} stroke={night.textSoft} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={174} y1={120} x2={194} y2={120} stroke={night.textSoft} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  </svg>
);

export const FaceIdScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  faceAtMs: number | null;
  onlyDeviceAtMs: number | null;
  unlockAtMs: number | null;
  keyAtMs: number | null;
  blockedAtMs: number | null;
  labels: {card: string; face: string; onlyDevice: string; unlock: string; key: string; blocked: string};
}> = ({atMs, untilMs, faceAtMs, onlyDeviceAtMs, unlockAtMs, keyAtMs, blockedAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const face = useOn(faceAtMs, 440);
  const onlyDevice = useOn(onlyDeviceAtMs, 420);
  const unlock = useOn(unlockAtMs, 620);
  const key_ = useOn(keyAtMs, 460);
  const blocked = useOn(blockedAtMs, 560);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 24, alignItems: 'flex-start'}}>
        <div style={{flexShrink: 0}}>
          <Caption style={{fontSize: 18, letterSpacing: 2.2, marginBottom: 6}}>{labels.card}</Caption>
          <PhoneSafeGlyph unlock={unlock} key_={key_} />
        </div>

        <div style={{flex: 1, paddingTop: 24}}>
          <div style={{...rise(face, 12)}}>
            <NightChip label={labels.face} tone="mint" size={21} />
          </div>

          <div style={{marginTop: 16, ...rise(onlyDevice, 12)}}>
            <Headline size={30} color={night.mint}>
              {labels.onlyDevice}
            </Headline>
          </div>

          <div style={{marginTop: 16, ...rise(unlock, 10)}}>
            <Caption style={{fontSize: 19, letterSpacing: 1, lineHeight: 1.3}}>{labels.unlock}</Caption>
          </div>

          <div style={{marginTop: 16, ...rise(key_, 10)}}>
            <Headline size={26} color={night.mint}>
              {labels.key}
            </Headline>
          </div>

          {/* the one route that does not exist: biometrics leaving the device */}
          <div style={{marginTop: 18, minHeight: 44}}>
            <StrikeText
              label={labels.blocked}
              progress={blocked}
              fontSize={26}
              color={night.textSoft}
              style={{opacity: blockedAtMs === null ? 0 : Math.min(1, blocked * 3)}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 3 */

/**
 * The key pair. The two halves are drawn as separate objects with a permanent
 * gap between them — they are a matched pair, never one physical key.
 */
const HalfGlyph: React.FC<{side: 'public' | 'private'; on: number}> = ({side, on}) => {
  const color = side === 'public' ? night.yellow : night.mint;
  return (
    <svg width={132} height={92} viewBox="0 0 132 92" style={{opacity: on}}>
      {side === 'public' ? (
        <>
          <circle cx={34} cy={46} r={22} fill="none" stroke={color} strokeWidth={4} />
          <line x1={56} y1={46} x2={112} y2={46} stroke={color} strokeWidth={4} strokeLinecap="round" />
          <line x1={92} y1={46} x2={92} y2={62} stroke={color} strokeWidth={4} strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x={20} y={22} width={92} height={48} rx={9} fill={`rgba(63,224,168,0.14)`} stroke={color} strokeWidth={4} />
          <circle cx={66} cy={46} r={11} fill="none" stroke={color} strokeWidth={4} />
          <line x1={66} y1={46} x2={66} y2={62} stroke={color} strokeWidth={4} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};

export const HalvesScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  splitAtMs: number | null;
  siteAtMs: number | null;
  uselessAtMs: number | null;
  userAtMs: number | null;
  staysAtMs: number | null;
  labels: {card: string; site: string; useless: string; user: string; stays: string};
}> = ({atMs, untilMs, splitAtMs, siteAtMs, uselessAtMs, userAtMs, staysAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const split = useOn(splitAtMs, 620);
  const site = useOn(siteAtMs, 440);
  const useless = useOn(uselessAtMs, 420);
  const user = useOn(userAtMs, 440);
  const stays = useOn(staysAtMs, 440);
  if (enter.opacity * exit <= 0.001) return null;

  // The halves push apart as the metaphor lands and never come back together.
  const gap = 30 * split;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>

      <div style={{display: 'flex', gap: 20, marginTop: 14, alignItems: 'stretch'}}>
        <div style={{flex: 1, transform: `translateX(${-gap}px)`, opacity: site}}>
          <Glass accent={night.yellow} style={{padding: '14px 18px', textAlign: 'center', height: '100%'}}>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <HalfGlyph side="public" on={split} />
            </div>
            <Headline size={22} color={night.yellow}>
              {labels.site}
            </Headline>
            <div style={{minHeight: 46, marginTop: 8, ...rise(useless, 6)}}>
              <Caption style={{fontSize: 17, letterSpacing: 0.6, lineHeight: 1.25}}>{labels.useless}</Caption>
            </div>
          </Glass>
        </div>

        <div style={{flex: 1, transform: `translateX(${gap}px)`, opacity: user}}>
          <Glass accent={night.mint} style={{padding: '14px 18px', textAlign: 'center', height: '100%'}}>
            <div style={{display: 'flex', justifyContent: 'center'}}>
              <HalfGlyph side="private" on={split} />
            </div>
            <Headline size={22} color={night.mint}>
              {labels.user}
            </Headline>
            <div style={{minHeight: 46, marginTop: 8}} />
          </Glass>
        </div>
      </div>

      <div style={{marginTop: 16, ...rise(stays, 12)}}>
        <Headline size={30} color={night.mint}>
          {labels.stays}
        </Headline>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 4 */

export type LoginStep = {label: string; atMs: number | null};

export const LoginScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  steps: LoginStep[];
  noPasswordAtMs: number | null;
  noSharedAtMs: number | null;
  labels: {card: string; noPassword: string; noShared: string};
}> = ({atMs, untilMs, steps, noPasswordAtMs, noSharedAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const noPassword = useOn(noPasswordAtMs, 460);
  const noShared = useOn(noSharedAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  const on = (at: number | null) =>
    at === null
      ? 0
      : interpolate(ms, [at, at + 440], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>

      <div style={{marginTop: 12}}>
        {steps.map((step, i) => {
          const stepOn = on(step.atMs);
          return (
            <div key={step.label}>
              {i > 0 ? (
                <svg width={26} height={24} viewBox="0 0 26 24" style={{marginLeft: 24}}>
                  <line x1={13} y1={0} x2={13} y2={16 * stepOn} stroke={night.line} strokeWidth={3} strokeLinecap="round" />
                  <path
                    d="M7 14 L13 22 L19 14"
                    fill="none"
                    stroke={night.line}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={stepOn > 0.75 ? 1 : 0}
                  />
                </svg>
              ) : null}
              <div style={{...rise(stepOn, 10)}}>
                <Glass style={{padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14}}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      flexShrink: 0,
                      borderRadius: 10,
                      border: `2px solid ${night.textSoft}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: unbounded,
                      fontWeight: 800,
                      fontSize: 17,
                      color: night.textSoft,
                    }}
                  >
                    {i + 1}
                  </div>
                  <Headline size={22}>{step.label}</Headline>
                </Glass>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{marginTop: 16, ...rise(noPassword, 12)}}>
        <Headline size={34} color={night.mint}>
          {labels.noPassword}
        </Headline>
      </div>
      <div style={{marginTop: 8, minHeight: 26, ...rise(noShared, 8)}}>
        <Caption style={{fontSize: 18, letterSpacing: 0.8}}>{labels.noShared}</Caption>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 5 */

const SiteGlyph: React.FC<{tone: string; fake?: boolean}> = ({tone, fake = false}) => (
  <svg width={140} height={116} viewBox="0 0 140 116">
    <rect x={16} y={20} width={108} height={86} rx={9} fill="rgba(255,255,255,0.07)" stroke={tone} strokeWidth={3} />
    <line x1={16} y1={44} x2={124} y2={44} stroke={tone} strokeWidth={2.5} />
    <rect x={28} y={28} width={62} height={9} rx={4.5} fill={tone} opacity={0.6} />
    <g stroke={tone} strokeWidth={3} strokeLinecap="round" opacity={0.7}>
      <line x1={30} y1={62} x2={110} y2={62} />
      <line x1={30} y1={78} x2={88} y2={78} />
    </g>
    {/* the counterfeit is marked by the address strip, not by looking different */}
    {fake ? <path d="M96 26 L112 40 M112 26 L96 40" stroke={tone} strokeWidth={3.5} strokeLinecap="round" /> : null}
  </svg>
);

export const PhishScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  realAtMs: number | null;
  fakeAtMs: number | null;
  keyAtMs: number | null;
  failsAtMs: number | null;
  boundAtMs: number | null;
  labels: {real: string; fake: string; key: string; fails: string; bound: string};
}> = ({atMs, untilMs, realAtMs, fakeAtMs, keyAtMs, failsAtMs, boundAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const real = useOn(realAtMs, 440);
  const fake = useOn(fakeAtMs, 440);
  const key_ = useOn(keyAtMs, 620);
  const fails = useOn(failsAtMs, 460);
  const bound = useOn(boundAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <div style={{display: 'flex', gap: 18, alignItems: 'flex-start'}}>
        <div style={{flex: 1, textAlign: 'center', ...rise(real, 12)}}>
          <SiteGlyph tone={night.mint} />
          <Headline size={21} color={night.mint}>
            {labels.real}
          </Headline>
          {/* the key travels only along this route */}
          <svg width={40} height={54} viewBox="0 0 40 54" style={{marginTop: 6}}>
            <line x1={20} y1={0} x2={20} y2={38 * key_} stroke={night.mint} strokeWidth={4} strokeLinecap="round" />
            <path
              d="M12 34 L20 48 L28 34"
              fill="none"
              stroke={night.mint}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={key_ > 0.75 ? 1 : 0}
            />
          </svg>
        </div>

        <div style={{flex: 1, textAlign: 'center', ...rise(fake, 12)}}>
          <SiteGlyph tone={night.red} fake />
          <Headline size={21} color={night.red}>
            {labels.fake}
          </Headline>
          <div style={{marginTop: 14, minHeight: 46, ...rise(fails, 10)}}>
            <NightChip label={labels.fails} tone="danger" size={21} />
          </div>
        </div>
      </div>

      <div style={{marginTop: 8, ...rise(key_, 10)}}>
        <Caption style={{fontSize: 18, letterSpacing: 0.8, color: night.mint, lineHeight: 1.3}}>{labels.key}</Caption>
      </div>
      <div style={{marginTop: 10, ...rise(bound, 10)}}>
        <Headline size={26}>{labels.bound}</Headline>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ chapter 6 */

export const BreachScene: React.FC<{
  atMs: number | null;
  untilMs: number | null;
  rowsAtMs: number | null;
  gapAtMs: number | null;
  verdictAtMs: number | null;
  footnoteAtMs: number | null;
  labels: {card: string; rows: string; gap: string; verdict: string; footnote: string};
}> = ({atMs, untilMs, rowsAtMs, gapAtMs, verdictAtMs, footnoteAtMs, labels}) => {
  const enter = useEnter(atMs, {durationMs: 420, rise: 18});
  const exit = useExit(untilMs, 320);
  const ms = useMs();
  const rows = useOn(rowsAtMs, 460);
  const gap = useOn(gapAtMs, 460);
  const verdict = useOn(verdictAtMs, 460);
  const footnote = useOn(footnoteAtMs, 420);
  if (enter.opacity * exit <= 0.001) return null;

  const rowOn = (index: number) =>
    rowsAtMs === null
      ? 0
      : interpolate(ms, [rowsAtMs + index * 170, rowsAtMs + index * 170 + 320], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <div style={{position: 'absolute', left: BODY.left, top: BODY.top, width: BODY.width, ...enterStyle(enter, exit)}}>
      <Glass strong style={{padding: '16px 20px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <Caption style={{fontSize: 18, letterSpacing: 2.4}}>{labels.card}</Caption>
          <Caption style={{fontSize: 17, letterSpacing: 1, color: night.yellow, opacity: rows}}>{labels.rows}</Caption>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, ...rise(rowOn(i), 6)}}>
              {/* the public half is present… */}
              <div
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 7,
                  border: `2px solid ${night.yellow}`,
                  background: 'rgba(255,210,74,0.14)',
                }}
              />
              {/* …and the private column is a hole, not a value */}
              <div
                style={{
                  flex: '0 0 190px',
                  height: 28,
                  borderRadius: 7,
                  border: `2px dashed rgba(255,255,255,${0.16 + 0.24 * gap})`,
                  background: 'transparent',
                }}
              />
            </div>
          ))}
        </div>

        <div style={{marginTop: 12, minHeight: 26, ...rise(gap, 8)}}>
          <Caption style={{fontSize: 17, letterSpacing: 0.8, color: night.mint}}>{labels.gap}</Caption>
        </div>
      </Glass>

      <div style={{marginTop: 14, ...rise(verdict, 12)}}>
        <Headline size={32} color={night.mint}>
          {labels.verdict}
        </Headline>
      </div>

      {/* a breach is still bad — the reel never claims otherwise */}
      <div style={{marginTop: 10, minHeight: 24, ...rise(footnote, 8)}}>
        <Caption style={{fontSize: 17, letterSpacing: 0.8, lineHeight: 1.3}}>{labels.footnote}</Caption>
      </div>
    </div>
  );
};

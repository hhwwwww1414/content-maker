import React from 'react';
import {interpolate} from 'remotion';
import {slots, vibe} from './theme';
import {manrope, unbounded} from '../../theme/fonts';
import {enterStyle, useEnter, useExit, useMs} from './primitives';

/** Small, permanent attribution. Never spoken, never a Reddit screenshot. */
export const SourceBadge: React.FC<{label: string; atMs: number | null}> = ({label, atMs}) => {
  const enter = useEnter(atMs, {durationMs: 500, rise: 8});
  return (
    <div
      style={{
        position: 'absolute',
        left: slots.sourceBadge.x,
        top: slots.sourceBadge.y,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: manrope,
        fontWeight: 700,
        fontSize: 21,
        letterSpacing: 0.2,
        color: vibe.inkSoft,
        ...enterStyle(enter),
      }}
    >
      <span style={{width: 9, height: 9, borderRadius: 999, background: vibe.mint, display: 'inline-block'}} />
      {label}
    </div>
  );
};

/** Chapter eyebrow + headline. Chapter 1 is on screen from frame 0. */
export const ChapterHead: React.FC<{
  eyebrow: string;
  label: string;
  headline: string;
  atMs: number | null;
  instant?: boolean;
}> = ({eyebrow, label, headline, atMs, instant = false}) => {
  const enter = useEnter(instant ? null : atMs, {durationMs: 420, rise: 18});
  const style = instant ? {opacity: 1, transform: 'none'} : enterStyle(enter);

  return (
    <div style={{position: 'absolute', left: slots.eyebrow.x, top: slots.eyebrow.y, width: slots.eyebrow.width, ...style}}>
      <div
        style={{
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 3,
          color: vibe.inkSoft,
          textTransform: 'uppercase',
        }}
      >
        {eyebrow} · {label}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 62,
          lineHeight: 1.04,
          letterSpacing: -1.2,
          color: vibe.ink,
          whiteSpace: 'pre-line',
        }}
      >
        {headline}
      </div>
    </div>
  );
};

/** Chapter 2: "СКОРОСТЬ" appears, gets struck out, "ДОВЕРИЕ" takes the centre. */
export const SpeedVsTrust: React.FC<{
  speedAtMs: number | null;
  trustAtMs: number | null;
  untilMs: number | null;
}> = ({speedAtMs, trustAtMs, untilMs}) => {
  const ms = useMs();
  const speed = useEnter(speedAtMs, {durationMs: 340});
  const trust = useEnter(trustAtMs, {durationMs: 460, pop: true});
  const exit = useExit(untilMs, 340);

  const strike = speedAtMs === null
    ? 0
    : interpolate(ms, [speedAtMs + 420, speedAtMs + 900], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  return (
    <div style={{position: 'absolute', left: 90, top: 726, width: 900, opacity: exit}}>
      <div style={{position: 'relative', display: 'inline-block', ...enterStyle(speed)}}>
        <div
          style={{
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 66,
            letterSpacing: -1,
            color: vibe.inkSoft,
          }}
        >
          СКОРОСТЬ
        </div>
        <div
          style={{
            position: 'absolute',
            left: -8,
            right: -8,
            top: '52%',
            height: 7,
            borderRadius: 4,
            background: vibe.danger,
            transformOrigin: 'left center',
            transform: `scaleX(${strike})`,
          }}
        />
      </div>

      <div style={{marginTop: 26, ...enterStyle(trust)}}>
        <div
          style={{
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 116,
            lineHeight: 1,
            letterSpacing: -3,
            color: vibe.mint,
          }}
        >
          ДОВЕРИЕ
        </div>
        <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 26, color: vibe.inkSoft, marginTop: 12}}>
          вот настоящее узкое место
        </div>
      </div>
    </div>
  );
};

/**
 * The screenshot frame. Deliberately the calmest composition in the reel:
 * one claim, one chain, nothing moving.
 */
export const MemoryFrame: React.FC<{
  title: string;
  chain: string[];
  atMs: number | null;
  untilMs: number | null;
}> = ({title, chain, atMs, untilMs}) => {
  const enter = useEnter(atMs, {durationMs: 460, rise: 16});
  const exit = useExit(untilMs, 380);
  if (enter.opacity * exit <= 0.001) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        top: 300,
        width: 960,
        boxSizing: 'border-box',
        padding: '64px 56px',
        borderRadius: 36,
        background: vibe.paper,
        border: `3px solid ${vibe.line}`,
        boxShadow: '0 30px 70px rgba(22,22,15,0.10)',
        ...enterStyle(enter, exit),
      }}
    >
      <div
        style={{
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 3,
          color: vibe.inkSoft,
          textTransform: 'uppercase',
        }}
      >
        Сохрани этот кадр
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: unbounded,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.05,
          letterSpacing: -1.6,
          color: vibe.ink,
        }}
      >
        {title}
      </div>
      <div style={{height: 3, background: vibe.inkFaint, margin: '38px 0 34px'}} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        {chain.map((step, i) => (
          <div key={step} style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: vibe.mintSoft,
                border: `2px solid rgba(18,185,129,0.45)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: manrope,
                fontWeight: 800,
                fontSize: 22,
                color: '#0A7A55',
              }}
            >
              {i + 1}
            </div>
            <div style={{fontFamily: unbounded, fontWeight: 700, fontSize: 40, color: vibe.ink, letterSpacing: -0.5}}>
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Binary CTA sitting over the (dimmed but still present) trust diagram. */
export const CtaFrame: React.FC<{
  prompt: string;
  optionA: string;
  divider: string;
  optionB: string;
  teaser: string;
  atMs: number | null;
  optionBAtMs: number | null;
  commentAtMs: number | null;
  teaserAtMs: number | null;
  teaserStepsAtMs: number | null;
}> = ({
  prompt,
  optionA,
  divider,
  optionB,
  teaser,
  atMs,
  optionBAtMs,
  commentAtMs,
  teaserAtMs,
  teaserStepsAtMs,
}) => {
  const enter = useEnter(atMs, {durationMs: 440, rise: 20});
  const optionBEnter = useEnter(optionBAtMs, {durationMs: 400, rise: 14, pop: true});
  const commentEnter = useEnter(commentAtMs, {durationMs: 380, rise: 12});
  const teaserEnter = useEnter(teaserAtMs, {durationMs: 420, rise: 14});
  const stepsEnter = useEnter(teaserStepsAtMs, {durationMs: 420, rise: 10});
  if (enter.opacity <= 0.001) return null;

  return (
    <div style={{position: 'absolute', left: 90, top: 636, width: 900, ...enterStyle(enter)}}>
      {/* Scrim: the trust diagram stays on canvas but stops competing for reading. */}
      <div
        style={{
          position: 'absolute',
          left: -34,
          right: -34,
          top: -30,
          bottom: -30,
          borderRadius: 32,
          background: 'rgba(243,243,239,0.88)',
          zIndex: -1,
        }}
      />
      <div
        style={{
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 2.4,
          color: vibe.inkSoft,
          textTransform: 'uppercase',
        }}
      >
        {prompt}
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 26, marginTop: 34}}>
        <div
          style={{
            padding: '26px 36px',
            borderRadius: 22,
            background: vibe.dangerSoft,
            border: `3px solid rgba(200,80,63,0.45)`,
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 54,
            color: vibe.danger,
            letterSpacing: -1,
          }}
        >
          {optionA}
        </div>
        <div style={{fontFamily: manrope, fontWeight: 700, fontSize: 30, color: vibe.inkSoft, opacity: optionBEnter.opacity}}>
          {divider}
        </div>
        <div
          style={{
            padding: '26px 36px',
            borderRadius: 22,
            background: vibe.mintSoft,
            border: `3px solid rgba(18,185,129,0.5)`,
            fontFamily: unbounded,
            fontWeight: 800,
            fontSize: 54,
            color: '#0A7A55',
            letterSpacing: -1,
            ...enterStyle(optionBEnter),
          }}
        >
          {optionB}
        </div>
      </div>

      <div
        style={{
          marginTop: 30,
          fontFamily: manrope,
          fontWeight: 700,
          fontSize: 30,
          color: vibe.ink,
          ...enterStyle(commentEnter),
        }}
      >
        Одно слово в комментарии.
      </div>

      <div
        style={{
          marginTop: 44,
          paddingTop: 26,
          borderTop: `3px solid ${vibe.inkFaint}`,
          fontFamily: manrope,
          fontWeight: 700,
          fontSize: 28,
          color: vibe.inkSoft,
          ...enterStyle(teaserEnter),
        }}
      >
        {teaser}
      </div>

      {/* The three promised checks land as three slots — the next reel's hook. */}
      <div style={{display: 'flex', gap: 12, marginTop: 18, ...enterStyle(stepsEnter)}}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              border: `2.5px dashed rgba(18,185,129,0.55)`,
              background: vibe.mintSoft,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: unbounded,
              fontWeight: 800,
              fontSize: 24,
              color: '#0A7A55',
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
};

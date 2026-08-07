import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-craft03-box-in-box.json';
import captionsJson from '../../../generated/captions-craft03-box-in-box.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * CRAFT 03 — "Коробка в коробке" (инкапсуляция, RFC 2003).
 *
 * Camera grammar: FIXED OVERHEAD CONVEYOR — камера висит под потолком цеха и не
 * двигается; всё движение приносит лента. Motion grammar: NESTED WRAPPING
 * ASSEMBLY — коробку кладут в коробку, ничего не исчезает и не морфится.
 * Ending: ENVIRONMENTAL-BRAND. Mascot: фоновый наблюдатель.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const KRAFT = '#C8A472';
const KRAFT_DARK = '#8E7247';
const STATION_X = 470;

// --- facility ----------------------------------------------------------------
const Facility: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = 0.2 + 0.02 * Math.sin(frame / 21);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#0A0D0E', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          left: -140,
          top: 120,
          width: 1400,
          height: 760,
          objectFit: 'cover',
          opacity: flicker,
          filter: 'grayscale(0.85) brightness(0.45) blur(3px)',
          transform: 'skewY(-3deg)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 44% 56%, rgba(200,164,114,0.10), transparent 46%), radial-gradient(ellipse at 50% 50%, rgba(10,13,14,0.25), #080B0C 80%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Static grain + timecode: the frame reads as a recording, not a render. */
const CameraOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = frame / clock.fps;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
  const ff = String(Math.floor((seconds % 1) * clock.fps)).padStart(2, '0');
  const blink = Math.sin(frame / 14) > -0.2 ? 1 : 0.25;
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BRAND, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 244,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 24,
          letterSpacing: 2,
          color: 'rgba(226,240,238,0.62)',
        }}
      >
        <span style={{width: 12, height: 12, borderRadius: 12, background: '#FF5A52', opacity: blink}} />
        CAM 03 · {mm}:{ss}:{ff}
      </div>
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.020) 0px, rgba(255,255,255,0.020) 1px, transparent 1px, transparent 3px)',
          opacity: 0.7,
        }}
      />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 260px rgba(0,0,0,0.85)'}} />
    </AbsoluteFill>
  );
};

// --- parcels -----------------------------------------------------------------
const Parcel: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  labelColor?: string;
  opacity?: number;
  dashed?: boolean;
}> = ({x, y, w, h, label, labelColor = '#2A2118', opacity = 1, dashed = false}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 8,
      boxSizing: 'border-box',
      background: dashed ? 'transparent' : `linear-gradient(160deg, ${KRAFT}, ${KRAFT_DARK})`,
      border: dashed ? '2px dashed rgba(226,240,238,0.42)' : '2px solid rgba(60,44,26,0.6)',
      opacity,
      boxShadow: dashed ? 'none' : '0 16px 34px rgba(0,0,0,0.5)',
    }}
  >
    {label ? (
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          right: 12,
          padding: '6px 10px',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.82)',
          fontFamily: manrope,
          fontWeight: 800,
          fontSize: 20,
          letterSpacing: 1,
          color: labelColor,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    ) : null}
  </div>
);

const Belt: React.FC = () => {
  const frame = useCurrentFrame();

  // the hero parcel rides the belt; the belt itself never stops
  const approach = interpolate(frame, [0, clock.at('pk_two')], [-260, STATION_X], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  const leave = interpolate(frame, [clock.at('sn_in') - 10, clock.at('un_wrap')], [0, 340], {
    ...CLAMP,
    easing: Easing.inOut(Easing.quad),
  });
  const heroX = frame < clock.at('sn_in') - 10 ? approach : STATION_X + leave;

  // the outer box descends over it
  const wrap = interpolate(frame, [clock.at('vp_wrap'), clock.at('vp_addr') + 10], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const unwrap = clock.rise(frame, clock.at('un_wrap') + 8, 22);
  const outerVisible = Math.max(0, wrap - unwrap * 0.0);

  const innerLabelFade = interpolate(frame, [clock.at('vp_wrap'), clock.at('vp_wrap') + 18], [1, 0], CLAMP);
  const brandLabel = clock.rise(frame, clock.at('br_ghost'), 20);

  const beltDrift = (frame * 3.2) % 64;

  return (
    <div
      style={{
        position: 'absolute',
        left: -220,
        top: 858,
        width: 1520,
        height: 214,
        transform: 'rotate(-9deg)',
        zIndex: LAYERS.HERO,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #1A2124, #10171A)',
          borderTop: '2px solid rgba(226,240,238,0.16)',
          borderBottom: '2px solid rgba(0,0,0,0.6)',
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 64px)',
          backgroundPosition: `${beltDrift}px 0`,
        }}
      />

      {/* background traffic so the line looks alive */}
      {[0, 1, 2].map((i) => {
        const x = (((frame * 3.2 + i * 520) % 1900) + 1900) % 1900 - 300;
        return <Parcel key={i} x={x} y={64} w={92} h={78} opacity={0.35} />;
      })}

      {/* the inner parcel — the one we are following */}
      <Parcel
        x={heroX + (wrap > 0 ? 22 : 0)}
        y={64 + (wrap > 0 ? 20 : 0)}
        w={168}
        h={124}
        label="10.0.0.7 → сайт"
        opacity={1}
      />
      {innerLabelFade < 0.9 && outerVisible > 0.02 ? (
        <div
          style={{
            position: 'absolute',
            left: heroX + 22,
            top: 84,
            width: 168,
            height: 124,
            border: '2px dashed rgba(226,240,238,0.35)',
            borderRadius: 8,
            opacity: 0.5 * outerVisible,
          }}
        />
      ) : null}

      {/* the outer parcel that arrives from above and swallows it */}
      {outerVisible > 0.005 ? (
        <div style={{position: 'absolute', left: heroX - 24, top: interpolate(outerVisible, [0, 1], [-230, 34], CLAMP)}}>
          <Parcel
            x={0}
            y={0}
            w={236}
            h={172}
            label={brandLabel > 0.5 ? 'GhostPepeBot → сервер' : 'VPN-сервер'}
            labelColor={brandLabel > 0.5 ? '#0B6B5C' : '#2A2118'}
            opacity={outerVisible}
          />
        </div>
      ) : null}

      {/* the unwrapping station lifts the outer shell off again */}
      {unwrap > 0.01 ? (
        <div style={{position: 'absolute', left: heroX - 24, top: 34 - unwrap * 240, opacity: 1 - unwrap * 0.6}}>
          <Parcel x={0} y={0} w={236} h={172} opacity={1} />
        </div>
      ) : null}
    </div>
  );
};

/** Background observer: the mascot stands off the line and watches. */
const Observer: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [clock.at('vp_take'), clock.at('vp_take') + 26], [0, 0.5], CLAMP);
  const bob = Math.sin(frame / 30) * 3;
  return (
    <Img
      src={staticFile(ASSETS.mascot)}
      style={{
        position: 'absolute',
        left: 690,
        top: 618 + bob,
        width: 156,
        height: 156,
        objectFit: 'contain',
        opacity: o,
        filter: 'brightness(0.8) drop-shadow(0 16px 30px rgba(0,0,0,0.6))',
        zIndex: LAYERS.ENVIRONMENT,
      }}
    />
  );
};

/** Surveillance-style callouts pinned to the wall of the facility. */
const Callouts: React.FC = () => {
  const frame = useCurrentFrame();
  const items: {from: string; to: string; kicker: string; value: string; color: string}[] = [
    {from: 'hk_hide', to: 'pk_two', kicker: 'линия упаковки', value: 'посылка идёт открыто', color: 'rgba(226,240,238,0.7)'},
    {from: 'pk_two', to: 'vp_take', kicker: 'структура', value: 'адрес · содержимое', color: KRAFT},
    {from: 'vp_take', to: 'sn_in', kicker: 'операция', value: 'коробка в коробку', color: BRAND.mint},
    {from: 'sn_in', to: 'rf_old', kicker: 'снаружи', value: 'только внешний адрес', color: BRAND.amber},
    {from: 'rf_old', to: 'br_ghost', kicker: 'стандарт', value: 'RFC 2003 · 1994', color: 'rgba(226,240,238,0.7)'},
    {from: 'br_ghost', to: 'en_env', kicker: 'ярлык', value: 'GhostPepeBot', color: BRAND.mint},
  ];
  return (
    <>
      {items.map((item) => {
        const from = clock.at(item.from);
        const to = item.to === 'en_env' ? clock.total : clock.at(item.to);
        const o = interpolate(frame, [from, from + 12, to - 12, to], [0, 1, 1, 0], CLAMP);
        if (o <= 0.002) return null;
        return (
          <div key={item.kicker} style={{position: 'absolute', left: 132, top: 316, opacity: o, zIndex: LAYERS.TEXT}}>
            <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 20, letterSpacing: 3, color: 'rgba(226,240,238,0.45)', textTransform: 'uppercase'}}>
              {item.kicker}
            </div>
            <div style={{fontFamily: manrope, fontWeight: 800, fontSize: 42, color: item.color, marginTop: 6}}>{item.value}</div>
          </div>
        );
      })}
    </>
  );
};

export const GhostPepeCraftBoxInBox: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: '#080B0C', overflow: 'hidden'}}>
      <Facility />
      <Observer />
      <Belt />
      <Callouts />
      <CameraOverlay />
      <BatchCaption pages={pages} fps={clock.fps} frame="bracket" face="manrope" accent={BRAND.mint} fontSize={40} />
      <Audio src={staticFile(voicePath('craft03-box-in-box'))} volume={1} />
      <Audio src={staticFile(ASSETS.ambient)} loop volume={0.03} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

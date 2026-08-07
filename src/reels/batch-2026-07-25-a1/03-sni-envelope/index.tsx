import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timelineJson from '../../../generated/timeline-batch03-sni-envelope.json';
import captionsJson from '../../../generated/captions-batch03-sni-envelope.json';
import {LayoutRegistryProvider} from '../../../reel-system/layout/LayoutRegistry';
import {SafeZoneOverlay} from '../../../reel-system/layout/SafeArea';
import {LAYERS} from '../../../reel-system/layers';
import {manrope, unbounded} from '../../../theme/fonts';
import {BatchCaption} from '../../shared/BatchCaption';
import {ASSETS, BRAND, CLAMP, voicePath} from '../../shared/brand';
import {makeClock, type CaptionPage, type VoiceTimeline} from '../../shared/clock';

/**
 * REEL 03 — "Замок на конверте, адрес снаружи".
 *
 * Camera grammar: STATIC MACRO WITH OBJECT TRANSFORMATION — the camera never
 * moves at all. Motion grammar: PRECISION OBJECT TRANSFORMATION — one recognisable
 * physical object changes mechanically, step by step, and every step carries one
 * idea. Transitions are object morphs. Ending: HARD-THESIS-END.
 * Mascot: reflection inside the wax seal only.
 */

const timeline = timelineJson as VoiceTimeline;
const pages = captionsJson as CaptionPage[];
const clock = makeClock(timeline);

const PAPER = '#E9E2D3';
const PAPER_DARK = '#C9C0AE';
const WAX = '#B4413A';

// --- backdrop: far wall, not a scene ---------------------------------------
const FarWall: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 0.2 + 0.03 * Math.sin(frame / 88);
  return (
    <AbsoluteFill style={{zIndex: LAYERS.BACKGROUND, background: '#040708', overflow: 'hidden'}}>
      <Img
        src={staticFile(ASSETS.background)}
        style={{
          position: 'absolute',
          left: -160,
          top: 560,
          width: 1400,
          height: 720,
          objectFit: 'cover',
          opacity: breathe,
          filter: 'grayscale(0.5) brightness(0.45) blur(2px)',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 34% 62%, rgba(255,238,205,0.13), transparent 40%), radial-gradient(ellipse at 50% 60%, rgba(4,7,8,0.2), #040708 76%)',
        }}
      />
    </AbsoluteFill>
  );
};

// --- the object -------------------------------------------------------------
const OBJ = {left: 190, top: 700, w: 700, h: 440};

const Envelope: React.FC = () => {
  const frame = useCurrentFrame();

  // step 1 — seal lands
  const seal = clock.rise(frame, clock.at('m_claim') + 8, 20);
  // step 2 — the address window appears and becomes legible
  const window = clock.rise(frame, clock.at('h_field'), 20);
  const legible = clock.rise(frame, clock.at('h_plain'), 16);
  // step 3 — ECH cover slides over the window
  const cover = clock.rise(frame, clock.at('e_ech'), 20);
  // step 4 — the cover is cut away
  const cutStart = clock.at('e_cut');
  const cut = interpolate(frame, [cutStart, cutStart + 26], [0, 1], {...CLAMP, easing: Easing.inOut(Easing.quad)});
  // step 5 — the address itself is removed (brand state)
  const erase = clock.rise(frame, clock.at('b_ghost'), 26);

  const coverShown = Math.max(0, cover - cut);
  const addressVisible = Math.max(0, Math.min(window, 1 - coverShown) - erase);

  const light = 0.9 + 0.1 * Math.sin(frame / 64);

  return (
    <svg
      width={OBJ.w}
      height={OBJ.h}
      viewBox="0 0 700 440"
      style={{position: 'absolute', left: OBJ.left, top: OBJ.top, overflow: 'visible'}}
    >
      <defs>
        <linearGradient id="paper" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor={PAPER} stopOpacity={light} />
          <stop offset="100%" stopColor={PAPER_DARK} />
        </linearGradient>
        <clipPath id="sealClip">
          <circle cx="350" cy="230" r="52" />
        </clipPath>
      </defs>

      {/* body */}
      <rect x="10" y="30" width="680" height="380" rx="14" fill="url(#paper)" stroke="rgba(0,0,0,0.28)" strokeWidth="2" />
      {/* flap */}
      <path d="M10 44 L350 250 L690 44" fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth="3" />
      <path d="M10 30 L350 236 L690 30 Z" fill="rgba(0,0,0,0.06)" />

      {/* address window — the whole point of the object */}
      {window > 0.002 ? (
        <g opacity={window}>
          <rect x="58" y="286" width="404" height="96" rx="8" fill="rgba(10,16,18,0.10)" stroke="rgba(0,0,0,0.30)" strokeWidth="2" />
          <text x="76" y="322" fontFamily={manrope} fontSize="21" fontWeight="800" fill="rgba(20,26,26,0.55)" letterSpacing="2">
            SERVER_NAME
          </text>
          <text
            x="76"
            y="362"
            fontFamily={manrope}
            fontSize="34"
            fontWeight="800"
            fill="#161C1C"
            opacity={Math.max(legible, 0.35) * (addressVisible > 0.02 ? 1 : 0)}
          >
            example-site.ru
          </text>
        </g>
      ) : null}

      {/* the address being removed at the brand step */}
      {erase > 0.002 ? (
        <rect x="58" y="286" width="404" height="96" rx="8" fill="url(#paper)" opacity={erase} />
      ) : null}

      {/* RFC 9849 cover plate, and the cut that removes it */}
      {coverShown > 0.002 ? (
        <g>
          <g transform={`translate(${-cut * 130} ${-cut * 40}) rotate(${-cut * 5} 260 334)`}>
            <rect
              x="50"
              y="278"
              width="210"
              height="112"
              rx="8"
              fill="#12191B"
              stroke={BRAND.mint}
              strokeWidth="2"
              opacity={coverShown}
            />
          </g>
          <g transform={`translate(${cut * 150} ${cut * 46}) rotate(${cut * 6} 400 334)`}>
            <rect
              x="260"
              y="278"
              width="212"
              height="112"
              rx="8"
              fill="#12191B"
              stroke={BRAND.mint}
              strokeWidth="2"
              opacity={coverShown}
            />
          </g>
          <text
            x="76"
            y="348"
            fontFamily={unbounded}
            fontSize="30"
            fontWeight="800"
            fill={BRAND.mint}
            opacity={Math.max(0, coverShown - cut * 3)}
          >
            ECH
          </text>
        </g>
      ) : null}

      {/* the cut itself: a single blade pass, never a flash */}
      {cut > 0.001 && cut < 0.999 ? (
        <line
          x1={40 + cut * 500}
          y1="250"
          x2={-40 + cut * 500}
          y2="420"
          stroke={BRAND.danger}
          strokeWidth="3"
          opacity={interpolate(cut, [0, 0.15, 0.85, 1], [0, 1, 1, 0], CLAMP)}
        />
      ) : null}

      {/* wax seal — and the only place the mascot exists in this reel */}
      <g opacity={seal} transform={`scale(${interpolate(seal, [0, 1], [0.7, 1], CLAMP)})`} style={{transformOrigin: '350px 230px'}}>
        <circle cx="350" cy="230" r="52" fill={WAX} stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
        <circle cx="350" cy="230" r="40" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
      </g>
    </svg>
  );
};

/** Mascot as a reflection on the wax, clipped to the seal, never redrawn. */
const SealReflection: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [clock.at('t_two'), clock.at('t_two') + 20, clock.end('b_ghost'), clock.end('b_ghost') + 18],
    [0, 0.26, 0.26, 0],
    CLAMP,
  );
  if (o <= 0.002) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: OBJ.left + 298,
        top: OBJ.top + 178,
        width: 104,
        height: 104,
        borderRadius: '50%',
        overflow: 'hidden',
        opacity: o,
        zIndex: LAYERS.HERO_FRONT,
      }}
    >
      <Img
        src={staticFile(ASSETS.mascot)}
        style={{width: 150, height: 150, objectFit: 'contain', marginLeft: -24, marginTop: -22, mixBlendMode: 'screen'}}
      />
    </div>
  );
};

// --- typography: one large static contradiction -----------------------------
const Contradiction: React.FC = () => {
  const frame = useCurrentFrame();
  const closed = clock.rise(frame, clock.at('m_claim'), 14);
  const open = clock.rise(frame, clock.at('h_first'), 16);
  const fade = interpolate(frame, [clock.at('t_final') - 20, clock.at('t_final')], [1, 0], CLAMP);
  return (
    <div style={{position: 'absolute', left: 118, top: 292, width: 720, zIndex: LAYERS.TEXT, opacity: fade}}>
      <div style={{opacity: closed, display: 'flex', alignItems: 'baseline', gap: 18}}>
        <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 24, letterSpacing: 2.6, color: BRAND.mint, textTransform: 'uppercase'}}>
          закрыто
        </span>
        <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 56, color: BRAND.white, letterSpacing: -1.6}}>содержимое</span>
      </div>
      <div style={{height: 2, background: 'rgba(255,255,255,0.12)', margin: '18px 0', opacity: closed}} />
      <div style={{opacity: open, display: 'flex', alignItems: 'baseline', gap: 18}}>
        <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 24, letterSpacing: 2.6, color: BRAND.danger, textTransform: 'uppercase'}}>
          открыто
        </span>
        <span style={{fontFamily: unbounded, fontWeight: 800, fontSize: 56, color: BRAND.white, letterSpacing: -1.6}}>адресат</span>
      </div>
    </div>
  );
};

/** Technical stamp for the standard, pinned beside the object. */
const RfcStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(
    frame,
    [clock.at('e_rfc'), clock.at('e_rfc') + 14, clock.end('e_cut'), clock.end('e_cut') + 16],
    [0, 1, 1, 0],
    CLAMP,
  );
  if (o <= 0.002) return null;
  const struck = clock.rise(frame, clock.at('e_cut') + 6, 18);
  return (
    <div style={{position: 'absolute', left: 200, top: 1188, opacity: o, zIndex: LAYERS.TEXT}}>
      <div style={{position: 'relative', display: 'inline-block', padding: '10px 20px', border: `2px solid ${BRAND.mint}88`, borderRadius: 8}}>
        <span style={{fontFamily: manrope, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: BRAND.mint}}>RFC 9849 · март 2026</span>
        <span
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            top: '50%',
            height: 3,
            background: BRAND.danger,
            transform: `scaleX(${struck})`,
            transformOrigin: 'left center',
          }}
        />
      </div>
    </div>
  );
};

/** HARD-THESIS-END: the object is empty and one line closes the argument. */
const HardThesis: React.FC = () => {
  const frame = useCurrentFrame();
  const from = clock.at('t_final');
  const o = clock.rise(frame, from - 10, 20);
  if (o <= 0.002) return null;
  return (
    <div style={{position: 'absolute', left: 118, top: 320, width: 720, opacity: o, zIndex: LAYERS.TEXT}}>
      <div style={{width: 90, height: 5, background: BRAND.mint, borderRadius: 4, marginBottom: 24}} />
      <div style={{fontFamily: unbounded, fontWeight: 800, fontSize: 78, lineHeight: 1.0, letterSpacing: -2.6, color: BRAND.white}}>
        Адрес —<br />тоже <span style={{color: BRAND.mint}}>данные</span>
      </div>
    </div>
  );
};

export const GhostPepeBatch03SniEnvelope: React.FC = () => (
  <LayoutRegistryProvider>
    <AbsoluteFill style={{background: '#040708', overflow: 'hidden'}}>
      <FarWall />
      <AbsoluteFill style={{zIndex: LAYERS.HERO}}>
        <Envelope />
      </AbsoluteFill>
      <SealReflection />
      <Contradiction />
      <HardThesis />
      <RfcStamp />
      <BatchCaption pages={pages} fps={clock.fps} frame="rule" face="unbounded" accent={BRAND.mint} fontSize={40} />
      <Audio src={staticFile(voicePath('batch03-sni-envelope'))} volume={1} />
      <Audio src={staticFile(ASSETS.ambient)} loop volume={0.028} />
      <SafeZoneOverlay />
    </AbsoluteFill>
  </LayoutRegistryProvider>
);

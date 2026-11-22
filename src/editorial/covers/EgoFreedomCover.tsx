import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';

const ink = '#101012';
const paper = '#F2EDE4';
const red = '#F13C32';

/** Flat, editable cover art. All lettering and geometry remain vector sharp. */
export const EgoFreedomCover: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: ink, overflow: 'hidden', color: paper}}>
      <style>{`
        @font-face { font-family: CoverTight; src: url('${staticFile('library/fonts/InterTight-normal-900-cyrillic.woff2')}') format('woff2'); font-weight: 900; }
      `}</style>

      <div style={{position: 'absolute', left: 70, top: 128, fontFamily: 'CoverTight', fontWeight: 900, letterSpacing: -8, lineHeight: 0.86}}>
        <div style={{fontSize: 188}}>ЭГО</div>
        <div style={{fontSize: 110, color: red, letterSpacing: -3, marginTop: 18}}>ИЛИ</div>
        <div style={{fontSize: 151, marginTop: 18}}>СВОБОДА?</div>
      </div>

      <svg width="1080" height="1050" viewBox="0 0 1080 1050" style={{position: 'absolute', left: 0, top: 630}} aria-hidden="true">
        {/* The first-scene metaphor: a giant Я forces a square doorway out of shape. */}
        <path d="M244 188 H834 V833 H244 Z" fill="none" stroke={paper} strokeWidth="22" />
        <path d="M244 188 l-62 -79 -70 -28 M244 188 l-95 28 -75 -16 M834 188 l66 -67 21 -76 M834 188 l91 20 81 -30 M244 833 l-78 70 -78 10 M834 833 l66 82 108 12" fill="none" stroke={paper} strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M230 179 h34 v22 h-34 M818 179 h34 v22 h-34 M230 822 h34 v22 h-34 M818 822 h34 v22 h-34" fill={paper} />
        <text x="125" y="802" fill={red} fontFamily="CoverTight" fontWeight="900" fontSize="855" textLength="850" lengthAdjust="spacingAndGlyphs">Я</text>
        <g transform="rotate(-7 590 603)">
          <rect x="360" y="547" width="510" height="116" fill={paper} />
          <text x="392" y="632" fill={ink} fontFamily="CoverTight" fontWeight="900" fontSize="82" textLength="441" lengthAdjust="spacingAndGlyphs">СВОБОДА</text>
        </g>
      </svg>

    </AbsoluteFill>
  );
};

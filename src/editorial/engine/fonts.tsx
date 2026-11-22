import React, {useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import manifest from './fonts.manifest.json';

let ready: Promise<void> | null = null;

/** Vendored OFL faces (studio/vendor-fonts.mjs): rendering does not touch the network. */
export const loadEngineFonts = () => {
  if (ready) return ready;
  ready = Promise.all(manifest.map(async (face) => {
    const font = new FontFace(face.family, `url(${staticFile(face.path)}) format('woff2')`, {weight: face.weight, style: face.style, unicodeRange: face.unicodeRange, display: 'block'});
    await font.load();
    document.fonts.add(font);
  })).then(() => undefined);
  return ready;
};

/** Children mount only after the fonts load, so layout measurements in them are always real. */
export const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [loaded, setLoaded] = useState(false);
  const [handle] = useState(() => delayRender('Loading engine fonts', {timeoutInMilliseconds: 60000}));
  useState(() => {
    loadEngineFonts().then(() => { setLoaded(true); continueRender(handle); }).catch((error) => cancelRender(error));
    return null;
  });
  return loaded ? <>{children}</> : null;
};

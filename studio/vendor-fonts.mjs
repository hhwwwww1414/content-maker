#!/usr/bin/env node
// Copies the engine's OFL fonts into public/library/fonts so a render never depends on the network.
// Run once when the font list changes. Writes the manifest src/editorial/engine/fonts.manifest.json.
import {mkdirSync, writeFileSync, existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {ROOT} from './lib/project.mjs';

const require = createRequire(import.meta.url);
const WANT = {
  NotoSerifDisplay: {normal: ['500', '700'], italic: ['500']},
  SofiaSansExtraCondensed: {normal: ['700', '800']},
  Spectral: {normal: ['500'], italic: ['500']},
  Onest: {normal: ['400', '500', '600', '700', '800']},
  Geologica: {normal: ['500', '700', '900']},
  Unbounded: {normal: ['500', '700']},
  Cormorant: {normal: ['500', '600'], italic: ['500']},
  TenorSans: {normal: ['400']},
  InterTight: {normal: ['500', '700', '900']},
  JetBrainsMono: {normal: ['500', '700']},
};
const SUBSETS = ['cyrillic', 'latin'];
const out = resolve(ROOT, 'public/library/fonts');
mkdirSync(out, {recursive: true});
const faces = [];
for (const [name, styles] of Object.entries(WANT)) {
  const info = require(`@remotion/google-fonts/${name}`).getInfo();
  for (const [style, weights] of Object.entries(styles)) {
    for (const weight of weights) {
      for (const subset of SUBSETS) {
        const url = info.fonts[style]?.[weight]?.[subset];
        if (!url) throw Error(`${name} ${style} ${weight} has no ${subset}`);
        const fileName = `${name}-${style}-${weight}-${subset}.woff2`;
        const dest = resolve(out, fileName);
        if (!existsSync(dest)) {
          const r = await fetch(url);
          if (!r.ok) throw Error(`HTTP ${r.status} for ${url}`);
          writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
        }
        faces.push({family: info.fontFamily, style, weight, subset, path: `library/fonts/${fileName}`, unicodeRange: info.unicodeRanges[subset], sha256: createHash('sha256').update(readFileSync(dest)).digest('hex').slice(0, 16), license: 'OFL-1.1', source: info.url});
      }
    }
  }
}
writeFileSync(resolve(ROOT, 'src/editorial/engine/fonts.manifest.json'), JSON.stringify(faces, null, 1) + '\n');
console.log(`${faces.length} faces vendored`);

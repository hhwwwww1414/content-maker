// The asset manifest is the only way a scene reaches a file: a missing or unlicensed asset is an error, never a substitute.
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT} from './project.mjs';

export {ROOT};
export const MANIFEST = 'public/library/manifest.json';
const file = resolve(ROOT, MANIFEST);
export const readManifest = () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {version: 1, assets: {}});
export const writeManifest = (m) => writeFileSync(file, JSON.stringify(m, null, 1) + '\n');

export const projectAssetIds = (project) => {
  const ids = new Set();
  const walk = (node) => {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (typeof value === 'string' && ['asset', 'fill', 'texture', 'sfx'].includes(key)) ids.add(value);
        else if (key === 'assets' && Array.isArray(value)) value.forEach((v) => ids.add(v));
        else walk(value);
      }
    }
  };
  project.scenes?.forEach((s) => walk(s.direction));
  if (project.art?.music?.asset) ids.add(project.art.music.asset);
  return [...ids];
};

/** The entries a project needs, inlined into its render props so frames never fetch metadata. */
export const libraryOf = (project) => {
  const {assets} = readManifest();
  const out = {};
  for (const id of projectAssetIds(project)) {
    if (!assets[id]) throw Error(`Asset "${id}" is not in ${MANIFEST}. Add it with node studio/assets.mjs add; there is no silent fallback.`);
    if (!existsSync(resolve(ROOT, 'public', assets[id].path))) throw Error(`Asset "${id}" has no file: public/${assets[id].path}`);
    out[id] = assets[id];
  }
  return out;
};

export const libraryIndex = () => {
  const {assets} = readManifest();
  return {
    ids: new Map(Object.values(assets).map((a) => [a.id, {kind: a.kind, width: a.width, height: a.height, license: a.license, file: existsSync(resolve(ROOT, 'public', a.path))}])),
    sfx: new Set(Object.values(assets).filter((a) => a.kind === 'sfx').map((a) => a.id)),
  };
};

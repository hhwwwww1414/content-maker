import manifest from '../../../../public/library/manifest.json';

type Entry = {id: string; kind: string; path: string};
const assets = manifest.assets as unknown as Record<string, Entry>;

/** The manifest entries a Lab project uses. Production reels get the same via studio/render.mjs. */
export const libraryFor = (project: unknown): Record<string, Entry> => {
  const out: Record<string, Entry> = {};
  const walk = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && ['asset', 'fill', 'texture', 'sfx'].includes(key)) { if (!assets[value]) throw new Error(`Lab story uses unknown asset ${value}`); out[value] = assets[value]; }
      else walk(value);
    }
  };
  walk(project);
  return out;
};

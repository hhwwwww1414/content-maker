// Russian line setting: pure, so it runs in the browser with real metrics and in tests with fake ones.

const SHORT = new Set(['в', 'во', 'на', 'с', 'со', 'к', 'ко', 'у', 'о', 'об', 'и', 'а', 'но', 'не', 'ни', 'по', 'за', 'из', 'от', 'до', 'да', 'то', 'что', 'как', 'для', 'при', 'под', 'над', 'без', 'или']);
export const NBSP = ' ';

export type Run = {text: string; accent: boolean};

/** "Он *снял* кадр" -> words with accents. `*two words*` keeps both accented. */
export const parseMarkup = (markup: string): Run[] => {
  const runs: Run[] = [];
  let accent = false;
  for (const raw of markup.trim().split(/\s+/)) {
    const opens = /^[^\p{L}\p{N}]*\*/u.test(raw);
    const closes = /\*[^\p{L}\p{N}]*$/u.test(raw);
    if (opens) accent = true;
    runs.push({text: raw.replace(/\*/g, ''), accent});
    if (closes) accent = false;
  }
  return runs;
};

/** Units are what may not be broken: a short preposition travels with the next word, a dash with the previous one. */
export type Unit = {runs: Run[]};
export const toUnits = (runs: Run[]): Unit[] => {
  const units: Unit[] = [];
  let carry: Run[] = [];
  for (const run of runs) {
    const dash = run.text === '—' || run.text === '–';
    if (dash && units.length) { units[units.length - 1].runs.push(run); continue; }
    if (SHORT.has(run.text.toLowerCase())) { carry.push(run); continue; }
    units.push({runs: [...carry, run]});
    carry = [];
  }
  if (carry.length) {
    if (units.length) units[units.length - 1].runs.push(...carry);
    else units.push({runs: carry});
  }
  return units;
};

/**
 * Knuth-style balanced breaking: minimises the squared slack over all lines, including the last,
 * so a headline never leaves one word stranded. Returns null when a unit alone is too wide.
 */
export const breakUnits = (widths: number[], spaceWidth: number, maxWidth: number, maxLines = Infinity): number[][] | null => {
  const n = widths.length;
  if (widths.some((w) => w > maxWidth + 0.5)) return null;
  const best: Array<{cost: number; prev: number; lines: number}> = Array.from({length: n + 1}, () => ({cost: Infinity, prev: -1, lines: 0}));
  best[0] = {cost: 0, prev: -1, lines: 0};
  for (let end = 1; end <= n; end++) {
    let width = -spaceWidth;
    for (let start = end - 1; start >= 0; start--) {
      width += widths[start] + spaceWidth;
      if (width > maxWidth + 0.5) break;
      const slack = (maxWidth - width) / maxWidth;
      const orphan = end - start === 1 && end === n && n > 1 ? 0.16 : 0;
      const cost = best[start].cost + slack * slack + orphan;
      if (cost < best[end].cost && best[start].lines + 1 <= maxLines) best[end] = {cost, prev: start, lines: best[start].lines + 1};
    }
  }
  if (!Number.isFinite(best[n].cost)) return null;
  const lines: number[][] = [];
  for (let at = n; at > 0; at = best[at].prev) lines.unshift(Array.from({length: at - best[at].prev}, (_, i) => best[at].prev + i));
  return lines;
};

export type SetWord = Run & {width: number};
export type SetLine = {words: SetWord[]; width: number; size: number};
export type Setting = {size: number; lines: SetLine[]; height: number; leading: number};
export type Measure = (text: string, size: number, accent: boolean) => number;

export type FitOptions = {width: number; height: number; maxSize: number; minSize: number; leading: number; maxLines?: number; step?: number};

const lineOf = (units: Unit[], indexes: number[], measure: Measure, size: number): SetLine => {
  const words = indexes.flatMap((i) => units[i].runs).map((r) => ({...r, width: measure(r.text, size, r.accent)}));
  const space = measure(NBSP, size, false);
  return {words, size, width: words.reduce((sum, w) => sum + w.width, 0) + space * Math.max(0, words.length - 1)};
};

/** Largest size at which the text fits the box. Null means it does not fit even at minSize. */
export const fitText = (markup: string, measure: Measure, o: FitOptions): Setting | null => {
  const units = toUnits(parseMarkup(markup));
  for (let size = o.maxSize; size >= o.minSize; size -= o.step ?? 2) {
    const space = measure(NBSP, size, false);
    const widths = units.map((u) => u.runs.reduce((sum, r, i) => sum + measure(r.text, size, r.accent) + (i ? space : 0), 0));
    const broken = breakUnits(widths, space, o.width, o.maxLines ?? Infinity);
    if (!broken) continue;
    const height = broken.length * size * o.leading;
    if (height > o.height) continue;
    return {size, height, leading: o.leading, lines: broken.map((idx) => lineOf(units, idx, measure, size))};
  }
  return null;
};

/** Poster setting: each line is scaled to fill the width exactly. Lines come from `/` or balanced breaks. */
export const fitPoster = (markup: string, measure: Measure, o: FitOptions): Setting | null => {
  const explicit = markup.includes('/');
  const rows = explicit ? markup.split('/').map((s) => s.trim()).filter(Boolean) : null;
  const units = toUnits(parseMarkup(markup.replace(/\//g, ' ')));
  const attempt = (lines: Array<{units: Unit[]}>): Setting | null => {
    const set: SetLine[] = [];
    let height = 0;
    for (const line of lines) {
      const probe = lineOf(line.units, line.units.map((_, i) => i), measure, 100);
      const size = Math.min(o.maxSize, Math.floor((100 * o.width) / probe.width));
      const final = lineOf(line.units, line.units.map((_, i) => i), measure, size);
      set.push(final);
      height += size * o.leading;
    }
    // Too tall when every line fills the width: scale the whole block, keeping the proportions between lines.
    const k = Math.min(1, o.height / height);
    const scaled = k < 1 ? set.map((l) => {
      const size = Math.floor(l.size * k);
      return {size, width: l.width * (size / l.size), words: l.words.map((w) => ({...w, width: w.width * (size / l.size)}))};
    }) : set;
    if (scaled.some((l) => l.size < o.minSize)) return null;
    return {size: Math.max(...scaled.map((l) => l.size)), lines: scaled, height: scaled.reduce((sum, l) => sum + l.size * o.leading, 0), leading: o.leading};
  };
  if (rows) return attempt(rows.map((row) => ({units: toUnits(parseMarkup(row))})));
  for (let count = Math.min(units.length, o.maxLines ?? 5); count >= 1; count--) {
    const size = 100;
    const space = measure(NBSP, size, false);
    const widths = units.map((u) => u.runs.reduce((sum, r, i) => sum + measure(r.text, size, r.accent) + (i ? space : 0), 0));
    const total = widths.reduce((a, b) => a + b, 0) + space * (units.length - 1);
    const broken = breakUnits(widths, space, Math.max(total / count, Math.max(...widths)) * 1.02, count);
    if (!broken) continue;
    const setting = attempt(broken.map((idx) => ({units: idx.map((i) => units[i])})));
    if (setting) return setting;
  }
  return null;
};

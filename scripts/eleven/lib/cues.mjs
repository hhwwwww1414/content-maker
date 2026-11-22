/**
 * Cue resolution: turns authored line ids into measured milliseconds.
 *
 * A grammar spec in `content/<slug>-reel.json` never mentions time. It says
 * `"at": "l13"` — "when line 13 is spoken". After the voiceover is measured,
 * this walks the whole tree and writes the resolved value next to it, so the
 * renderer only ever reads numbers.
 *
 * Conventions, applied at any depth:
 *   {at: "l13", offsetMs?: 400}  -> adds atMs
 *   {until: "l20"}               -> adds untilMs
 *   {<name>At: "l13"}            -> adds <name>AtMs   (strikeAt, revealAt, splitAt…)
 *   {from: "l10", to: "l16"}     -> adds fromMs / toMs (mood windows)
 *
 * Unresolvable ids become `null` rather than throwing: a single bad reference
 * should blank one element, not take down the render.
 */

/** @param {(id: string) => number | null} startOf */
export const resolveCues = (node, startOf) => {
  if (Array.isArray(node)) return node.map((child) => resolveCues(child, startOf));
  if (node === null || typeof node !== 'object') return node;

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    out[key] = resolveCues(value, startOf);
  }

  if (typeof node.at === 'string') {
    const base = startOf(node.at);
    out.atMs = base === null ? null : base + (node.offsetMs ?? 0);
  }
  if (typeof node.until === 'string') {
    out.untilMs = startOf(node.until);
  }
  if (typeof node.from === 'string') {
    out.fromMs = startOf(node.from);
  }
  if (typeof node.to === 'string') {
    out.toMs = startOf(node.to);
  }
  for (const [key, value] of Object.entries(node)) {
    // `strikeAt` -> `strikeAtMs`, but never the bare `at` handled above
    if (key !== 'at' && key.endsWith('At') && typeof value === 'string') {
      out[`${key}Ms`] = startOf(value);
    }
  }

  return out;
};

/**
 * Mood windows are authored as `{alarm: {from, to}}`. A window whose ends did
 * not resolve is dropped, so `MoodTint` never receives a half-defined band.
 */
export const resolveMood = (mood, startOf) => {
  if (!mood) return null;
  const out = {};
  for (const [name, window] of Object.entries(mood)) {
    const resolved = resolveCues(window, startOf);
    if (typeof resolved?.fromMs === 'number' && typeof resolved?.toMs === 'number') {
      out[name] = {fromMs: resolved.fromMs, toMs: resolved.toMs};
    }
  }
  return Object.keys(out).length > 0 ? out : null;
};

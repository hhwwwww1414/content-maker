import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {ROOT} from './env.mjs';

/**
 * Shared ElevenLabs reel pipeline. Every step is slug-parameterised, so a new
 * reel needs only a `content/<slug>-reel.json` plus its Remotion composition.
 */
export const DEFAULT_SLUG = 'vibe-coding-trust';

/** Reads `--slug <name>` from argv, defaulting to the first reel built on this pipeline. */
export const readSlug = (argv = process.argv) => {
  const index = argv.indexOf('--slug');
  if (index === -1) return DEFAULT_SLUG;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error('Флаг --slug требует значение, например: --slug vpn-age-verification');
  }
  return value;
};

export const contentFileFor = (slug) => resolve(ROOT, 'content', `${slug}-reel.json`);

export const loadScript = (slug) => {
  const file = contentFileFor(slug);
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Не читается сценарий ${file}: ${error.message}`);
  }
};

/** `soft` keeps the phrase flowing, `line` is a beat, `block` is a real pause. */
const SEPARATOR = {soft: ' ', line: '\n', block: '\n\n', none: ''};

/**
 * Concatenates the lines into the exact string sent to ElevenLabs and records
 * the [start, end) character range of every line, so character-level alignment
 * can be projected back onto the script structure.
 */
export const buildTtsText = (script) => {
  let text = '';
  const ranges = [];
  script.lines.forEach((line, index) => {
    const charStart = text.length;
    text += line.text;
    ranges.push({...line, index, charStart, charEnd: text.length});
    if (index < script.lines.length - 1) {
      text += SEPARATOR[line.breakAfter] ?? '\n';
    }
  });
  return {text, ranges};
};

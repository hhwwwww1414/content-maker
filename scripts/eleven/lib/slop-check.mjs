/**
 * Script-quality gate: the writing, not the geometry.
 *
 * Every other check in `qa.mjs` measures pixels and milliseconds. This one
 * reads the spoken text and fails the reel on the things that make a script
 * sound machine-written or waste a viewer's seconds:
 *
 *   filler      — connective phrases that carry no information
 *   cliche      — LLM cadence tells ("это не просто X, это Y", triads)
 *   hedge       — softeners that turn a claim into mush
 *   hook        — the opening lines must be short and must not open on a definition
 *   anchors     — the script must name enough checkable things to be worth watching
 *   repetition  — an opener already used by another reel in `content/`
 *
 * Config lives in `content/<slug>-reel.json` under `qa.scriptQuality`; every
 * field is optional and falls back to the defaults below, so a reel opts in by
 * doing nothing. Set `"scriptQuality": {"enabled": false}` to skip.
 */
import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './env.mjs';

/**
 * Phrases that announce content instead of delivering it. Matched
 * case-insensitively against the spoken text of each line.
 */
export const FILLER = [
  'в современном мире',
  'в наше время',
  'ни для кого не секрет',
  'не секрет, что',
  'давайте разберёмся',
  'давайте разберемся',
  'давай разберёмся',
  'давай разберемся',
  'стоит отметить',
  'стоит заметить',
  'важно понимать',
  'важно отметить',
  'как мы уже',
  'как известно',
  'следует отметить',
  'хочу рассказать',
  'сегодня поговорим',
  'в этом видео',
  'в этом ролике',
  'подведём итог',
  'подведем итог',
  'итак, начнём',
  'итак, начнем',
  'на самом деле всё просто',
  'обо всём по порядку',
  'обо всем по порядку',
];

/** Cadence tells: the shapes an LLM reaches for when it has nothing to say. */
export const CLICHE = [
  {id: 'not-just-x-but-y', pattern: 'это\\s+не\\s+просто\\s+\\S+[,\\s]+это\\s+', hint: 'конструкция «это не просто X, это Y»'},
  {id: 'not-about-x-but-y', pattern: '(вопрос|дело)\\s+не\\s+в\\s+том.{0,40}\\s+а\\s+в\\s+том', hint: 'конструкция «дело не в том… а в том…»'},
  {id: 'world-where', pattern: 'мир[еу],?\\s+где', hint: '«в мире, где…»'},
  {id: 'key-to', pattern: 'ключ\\s+к\\s+(успеху|пониманию|безопасности)', hint: '«ключ к успеху/пониманию»'},
  {id: 'game-changer', pattern: '(меняет|изменит)\\s+всё\\s*$', hint: '«меняет всё»'},
  {id: 'imagine-that', pattern: '^представь(те)?[,:]', hint: 'открытие с «представь…» — уже использовано в серии'},
  {id: 'lets-figure-out', pattern: '(разберёмся|разберемся|расскажу),?\\s+(как|что|почему)', hint: 'обещание разобрать вместо разбора'},
];

/** Softeners. One or two are fine; a script built on them states nothing. */
export const HEDGE = [
  'наверное',
  'возможно',
  'вероятно',
  'как бы',
  'в принципе',
  'достаточно часто',
  'довольно часто',
  'в некотором смысле',
  'может быть так',
  'скорее всего',
];

const DEFAULTS = {
  enabled: true,
  /** lines counted as "the hook" — they gate distribution, so they get their own rules */
  hookLines: 3,
  maxHookWordsPerLine: 8,
  /** The very first line is what the 1.7-second scroll decision sees. */
  maxFirstLineWords: 6,
  /** filler/cliche/hedge hits allowed across the whole script */
  maxFiller: 0,
  maxCliche: 0,
  maxHedge: 2,
  /** checkable anchors the whole script must contain (numbers, names, quotes) */
  minAnchors: 3,
  /** compare the opening line against every other reel in content/ */
  checkOpenerReuse: true,
};

const words = (text) => text.trim().split(/\s+/u).filter(Boolean);

/**
 * Numerals that carry a fact when spelled out — a reel says "пять браузеров",
 * not "5 браузеров", because the TTS reads the words.
 */
const NUMERALS = [
  'ноль', 'один', 'одна', 'два', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь',
  'восемь', 'девять', 'десять', 'сто', 'тысяч', 'процент', 'миллион', 'миллиард',
];

/**
 * A line carries an "anchor" when it names something a viewer could go and
 * verify: a digit, a Latin-script term, a spelled-out numeral, a quoted string,
 * or one of the proper nouns the script itself declares in
 * `captionClusters.displayReplacements` (those keys are exactly the brand and
 * research names, transliterated for the TTS).
 *
 * Note: a capitalised-word heuristic is deliberately *not* used. Russian
 * capitalises the first word of every sentence, so it would match everything —
 * and `\b` in JS is ASCII-only, so it silently never matches Cyrillic at all.
 */
const hasAnchor = (text, properNouns) => {
  const lower = text.toLowerCase();
  if (/[0-9]/u.test(text)) return true;
  if (/[A-Za-z]{2,}/u.test(text)) return true;
  if (/«[^»]+»/u.test(text)) return true;
  if (NUMERALS.some((n) => lower.includes(n))) return true;
  return properNouns.some((noun) => lower.includes(noun));
};

const findAll = (lines, needles) => {
  const hits = [];
  for (const line of lines) {
    const haystack = line.text.toLowerCase();
    for (const needle of needles) {
      if (haystack.includes(needle)) hits.push({lineId: line.id, text: line.text, matched: needle});
    }
  }
  return hits;
};

const findPatterns = (lines, rules) => {
  const hits = [];
  for (const line of lines) {
    for (const rule of rules) {
      if (new RegExp(rule.pattern, 'iu').test(line.text)) {
        hits.push({lineId: line.id, text: line.text, matched: rule.id, hint: rule.hint});
      }
    }
  }
  return hits;
};

/** Opening line of every other reel in `content/`, for reuse detection. */
const otherOpeners = (slug) => {
  const dir = path.join(ROOT, 'content');
  const out = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('-reel.json') || name === `${slug}-reel.json`) continue;
    try {
      const script = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
      const first = script.lines?.[0]?.text ?? script.voiceoverSegments?.[0]?.text;
      if (first) out.push({file: name, text: first});
    } catch {
      // a malformed sibling script must not take the gate down
    }
  }
  return out;
};

/** Shared-word overlap of two short strings, 0..1. */
const overlap = (a, b) => {
  const setA = new Set(words(a.toLowerCase()).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')));
  const setB = new Set(words(b.toLowerCase()).map((w) => w.replace(/[^\p{L}\p{N}]/gu, '')));
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  for (const w of setA) if (setB.has(w)) shared += 1;
  return shared / Math.min(setA.size, setB.size);
};

export const checkScriptQuality = (script) => {
  const config = {...DEFAULTS, ...(script.qa?.scriptQuality ?? {})};
  if (!config.enabled) return {applicable: false, passed: true, failures: []};

  const lines = (script.lines ?? []).filter((line) => typeof line.text === 'string');
  if (lines.length === 0) return {applicable: false, passed: true, failures: []};

  const filler = findAll(lines, FILLER);
  const hedge = findAll(lines, HEDGE);
  const cliche = findPatterns(lines, CLICHE);

  const properNouns = Object.keys(script.captionClusters?.displayReplacements ?? {}).map((k) => k.toLowerCase());

  const hook = lines.slice(0, config.hookLines);
  const longHookLines = hook.filter((line) => words(line.text).length > config.maxHookWordsPerLine);
  const firstLineWords = words(lines[0].text).length;
  // A hook that opens by defining its subject has already lost the scroll.
  const definitionOpener = /^\s*\S+\s+—\s+это\b|^\s*что\s+такое\b/iu.test(lines[0].text);

  const anchored = lines.filter((line) => hasAnchor(line.text, properNouns));

  let openerReuse = null;
  if (config.checkOpenerReuse) {
    const opener = lines[0].text;
    for (const other of otherOpeners(script.id)) {
      const score = overlap(opener, other.text);
      if (score >= 0.6 && (!openerReuse || score > openerReuse.score)) {
        openerReuse = {file: other.file, text: other.text, score: Number(score.toFixed(2))};
      }
    }
  }

  const failures = [];
  if (filler.length > config.maxFiller) {
    failures.push(`вода: ${filler.map((h) => `«${h.matched}» (${h.lineId})`).join(', ')}`);
  }
  if (cliche.length > config.maxCliche) {
    failures.push(`шаблон: ${cliche.map((h) => `${h.hint} (${h.lineId})`).join(', ')}`);
  }
  if (hedge.length > config.maxHedge) {
    failures.push(`смягчители: ${hedge.length} > ${config.maxHedge} — ${hedge.map((h) => h.matched).join(', ')}`);
  }
  if (longHookLines.length > 0) {
    failures.push(
      `хук длинный: ${longHookLines.map((l) => `${l.id} (${words(l.text).length} слов)`).join(', ')} ` +
        `> ${config.maxHookWordsPerLine}`,
    );
  }
  if (firstLineWords > config.maxFirstLineWords) {
    failures.push(`первая реплика ${firstLineWords} слов > ${config.maxFirstLineWords} — хук не успевает сработать`);
  }
  if (definitionOpener) {
    failures.push(`хук открывается определением: «${lines[0].text}»`);
  }
  if (anchored.length < config.minAnchors) {
    failures.push(
      `проверяемых фактов ${anchored.length} < ${config.minAnchors} — ролик держится на общих словах`,
    );
  }
  if (openerReuse) {
    failures.push(`первая реплика повторяет ${openerReuse.file} (совпадение ${openerReuse.score}): «${openerReuse.text}»`);
  }

  return {
    applicable: true,
    passed: failures.length === 0,
    lineCount: lines.length,
    filler,
    cliche,
    hedge,
    hookWordCounts: hook.map((line) => ({id: line.id, words: words(line.text).length})),
    definitionOpener,
    firstLineWords,
    anchorCount: anchored.length,
    anchorLines: anchored.map((line) => line.id),
    openerReuse,
    failures,
  };
};

/**
 * Russian numerals, spelled out deterministically.
 *
 * This exists because language models cannot do it. Across free and paid models
 * the same task produced «МАЙ ДВАДЦАТЬ ЧЕТЫРЕХТЫСЯЧ», «Май двести двадцать
 * четвёртый» and «на семнадцатом пять» for what should be «май две тысячи
 * двадцать четвёртого» and «семнадцать и пять». Spelling a number is
 * arithmetic, so it belongs in code.
 *
 * The pipeline needs it because `eleven_multilingual_v2` / `eleven_v3` read
 * digits unpredictably in Russian, and because a digit in a spoken line is also
 * how a Latin-script version string sneaks in. The written form stays on screen
 * through `captionClusters.displayReplacements`.
 */

const ONES_M = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const ONES_F = ['ноль', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const TEENS = [
  'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать',
  'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать',
];
const TENS = [
  '', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят',
  'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто',
];
const HUNDREDS = [
  '', 'сто', 'двести', 'триста', 'четыреста',
  'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот',
];

/** Ordinals in the genitive — the form a date takes: «двадцать четвёртого». */
const ORD_GEN_ONES = [
  '', 'первого', 'второго', 'третьего', 'четвёртого', 'пятого',
  'шестого', 'седьмого', 'восьмого', 'девятого',
];
const ORD_GEN_TEENS = [
  'десятого', 'одиннадцатого', 'двенадцатого', 'тринадцатого', 'четырнадцатого',
  'пятнадцатого', 'шестнадцатого', 'семнадцатого', 'восемнадцатого', 'девятнадцатого',
];
const ORD_GEN_TENS = [
  '', '', 'двадцатого', 'тридцатого', 'сорокового', 'пятидесятого',
  'шестидесятого', 'семидесятого', 'восьмидесятого', 'девяностого',
];
const ORD_GEN_HUNDREDS = [
  '', 'сотого', 'двухсотого', 'трёхсотого', 'четырёхсотого',
  'пятисотого', 'шестисотого', 'семисотого', 'восьмисотого', 'девятисотого',
];

/** Picks the right plural form: 1 файл / 2 файла / 5 файлов. */
export const plural = (n, [one, few, many]) => {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

const under1000 = (n, feminine) => {
  const out = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) out.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) {
    out.push(TEENS[rest - 10]);
  } else {
    const t = Math.floor(rest / 10);
    const o = rest % 10;
    if (t) out.push(TENS[t]);
    if (o) out.push((feminine ? ONES_F : ONES_M)[o]);
  }
  return out.filter(Boolean).join(' ');
};

/** Cardinal number in words. `feminine` matters for 1 and 2 (одна/две). */
export const spellCardinal = (n, {feminine = false} = {}) => {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n === 0) return 'ноль';

  const out = [];
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;

  if (millions) out.push(under1000(millions, false), plural(millions, ['миллион', 'миллиона', 'миллионов']));
  if (thousands) out.push(under1000(thousands, true), plural(thousands, ['тысяча', 'тысячи', 'тысяч']));
  if (rest) out.push(under1000(rest, feminine));
  return out.filter(Boolean).join(' ');
};

/**
 * A year in the genitive, the way it is said in a date: 2024 → «две тысячи
 * двадцать четвёртого». Only the final component becomes ordinal.
 */
export const spellYear = (year) => {
  if (!Number.isFinite(year)) return String(year);
  const thousands = Math.floor(year / 1000);
  const rest = year % 1000;

  // Round thousands have their own ordinal stem: 2000 is «двухтысячного»,
  // not «две тысячи …ного».
  const ROUND_THOUSAND = [
    '', 'тысячного', 'двухтысячного', 'трёхтысячного', 'четырёхтысячного',
    'пятитысячного', 'шеститысячного', 'семитысячного', 'восьмитысячного', 'девятитысячного',
  ];
  if (rest === 0 && thousands >= 1 && thousands <= 9) return ROUND_THOUSAND[thousands];

  const head = [];
  if (thousands === 1) head.push('тысяча');
  else if (thousands > 1) head.push(under1000(thousands, true), 'тысячи');

  const h = Math.floor(rest / 100);
  const tail = rest % 100;
  const parts = [...head];

  if (h && tail === 0) return [...parts, ORD_GEN_HUNDREDS[h]].filter(Boolean).join(' ');
  if (h) parts.push(HUNDREDS[h]);

  if (tail >= 10 && tail < 20) {
    parts.push(ORD_GEN_TEENS[tail - 10]);
  } else {
    const t = Math.floor(tail / 10);
    const o = tail % 10;
    if (t && o === 0) parts.push(ORD_GEN_TENS[t]);
    else {
      if (t) parts.push(TENS[t]);
      if (o) parts.push(ORD_GEN_ONES[o]);
    }
  }
  return parts.filter(Boolean).join(' ');
};

/** Version strings: 17.5 → «семнадцать и пять», 4.0 → «четыре ноль». */
export const spellVersion = (text) => {
  const [major, ...minor] = text.split('.');
  const head = spellCardinal(Number(major));
  if (minor.length === 0) return head;
  const tail = minor.map((part) => spellCardinal(Number(part))).join(' ');
  return `${head} и ${tail}`;
};

const MONTHS = [
  'январ', 'феврал', 'март', 'апрел', 'ма', 'июн',
  'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр',
];
const MONTH_RE = new RegExp(`(${MONTHS.join('|')})\\p{L}*`, 'iu');

/**
 * Replaces every digit group in a spoken line with its spoken form, choosing
 * the case from what surrounds it.
 *
 * The replacement is keyed by the *whole* spelled phrase, not its first word:
 * «две тысячи двадцать пятого» is one token on screen («2025»), and keying it
 * by «две» left the rest of the phrase printed literally — and made «двадцать»
 * from a year collide with «двадцать девять» from an unrelated number.
 *
 * @returns {{text: string, replacements: Record<string,string>}} the spoken text
 *   plus a display map, so the screen keeps «2024» while the voice says the words.
 */
export const spellNumbers = (line) => {
  const replacements = {};
  let text = line;

  // Percentages first: the number and its unit are one phrase.
  text = text.replace(/(\d+)\s*%/gu, (match, digits) => {
    const n = Number(digits);
    const words = `${spellCardinal(n)} ${plural(n, ['процент', 'процента', 'процентов'])}`;
    replacements[words] = `${digits}%`;
    return words;
  });

  // Versions and decimals: 17.5, 4.0, 2.1.3
  text = text.replace(/\b\d+(?:\.\d+)+\b/gu, (match) => {
    const words = spellVersion(match);
    replacements[words] = match;
    return words;
  });

  // Bare integers. A 1900–2099 value next to a month or a date preposition is
  // a year and takes the genitive; everything else is a plain cardinal.
  text = text.replace(/\b\d{1,7}\b/gu, (match, offset, whole) => {
    const n = Number(match);
    const before = whole.slice(Math.max(0, offset - 24), offset);
    const after = whole.slice(offset + match.length, offset + match.length + 16);
    const looksLikeYear =
      n >= 1900 &&
      n <= 2099 &&
      (MONTH_RE.test(before) ||
        /(^|\s)год\p{L}*/iu.test(after) ||
        /(^|\s)(в|во|с|со|до|от|к|по)\s+$/iu.test(before));

    const words = looksLikeYear ? spellYear(n) : spellCardinal(n);
    replacements[words] = match;
    return words;
  });

  return {text, replacements};
};

/** True when a line still contains something the TTS would read unpredictably. */
export const hasUnspokenDigits = (text) => /\d/u.test(text);

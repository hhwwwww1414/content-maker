/**
 * ElevenLabs character-level alignment -> word timings -> kinetic caption clusters.
 * Pure functions, no I/O, no network. Deterministic.
 */

const PUNCT = /^[.,!?;:—–\-«»"'()…]+$/u;
const stripPunct = (word) => word.replace(/^[.,!?;:—–«»"'()…]+|[.,!?;:—–«»"'()…]+$/gu, '');

/**
 * ElevenLabs returns `characters` that should reproduce the request text 1:1.
 * If it does not (normalisation, stripped characters), we re-anchor by walking
 * both strings so the per-line character ranges stay correct.
 */
export const indexAlignment = (alignment, text) => {
  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const joined = chars.join('');

  if (joined === text) {
    return chars.map((char, i) => ({char, textIndex: i, startMs: starts[i] * 1000, endMs: ends[i] * 1000}));
  }

  // Fallback: greedy walk that keeps alignment entries in text order.
  const out = [];
  let cursor = 0;
  for (let i = 0; i < chars.length; i++) {
    const found = text.indexOf(chars[i], cursor);
    if (found === -1) continue;
    cursor = found + 1;
    out.push({char: chars[i], textIndex: found, startMs: starts[i] * 1000, endMs: ends[i] * 1000});
  }
  return out;
};

/** Groups the timed characters of one [charStart, charEnd) range into words. */
export const wordsForRange = (timedChars, charStart, charEnd) => {
  const words = [];
  let current = null;
  for (const entry of timedChars) {
    if (entry.textIndex < charStart || entry.textIndex >= charEnd) continue;
    if (/\s/u.test(entry.char)) {
      if (current) {
        words.push(current);
        current = null;
      }
      continue;
    }
    if (!current) current = {text: entry.char, startMs: entry.startMs, endMs: entry.endMs};
    else {
      current.text += entry.char;
      current.endMs = Math.max(current.endMs, entry.endMs);
    }
  }
  if (current) words.push(current);

  return words
    .map((word) => ({
      text: word.text,
      clean: stripPunct(word.text),
      startMs: Math.round(word.startMs),
      endMs: Math.round(word.endMs),
    }))
    // `[calm]` and friends are instructions to the voice, not words on screen.
    .filter((word) => !/^\[[^\]]*\]$/u.test(word.text))
    .filter((word) => word.clean.length > 0 || !PUNCT.test(word.text));
};

/**
 * A spelled-out number occupies several spoken words ("две тысячи двадцать
 * пятого") but exactly one written token on screen ("2025"). Substituting word
 * by word would replace only the part that happens to match and print
 * "ТЫСЯЧИ 29", so the whole run is merged into a single word before clustering.
 * Merging also stops a cluster boundary from landing inside a number.
 */
const mergeDisplayPhrases = (words, display) => {
  const phrases = [...display.keys()]
    .filter((key) => key.includes(' '))
    .map((key) => ({key, parts: key.split(/\s+/u)}))
    .sort((a, b) => b.parts.length - a.parts.length);
  if (phrases.length === 0) return words;

  const out = [];
  for (let i = 0; i < words.length; ) {
    const match = phrases.find(({parts}) =>
      parts.every((part, offset) => words[i + offset]?.clean.toLowerCase() === part),
    );
    if (!match) {
      out.push(words[i]);
      i += 1;
      continue;
    }
    const span = words.slice(i, i + match.parts.length);
    out.push({...span[0], clean: match.key, text: match.key, endMs: span[span.length - 1].endMs});
    i += match.parts.length;
  }
  return out;
};

/**
 * Builds 1-3 word kinetic clusters inside a single spoken line.
 *
 * Rules (in priority order):
 *  1. never end a cluster on a preposition / bare function word;
 *  2. never leave a function word alone;
 *  3. keep growing while the cluster is shorter than `minSeconds`;
 *  4. hard stop at `maxWords`.
 */
export const clusterLine = (words, options) => {
  const {minSeconds = 0.55, maxSeconds = 0.85, maxWords = 3, functionWords} = options;
  const isFunction = (word) => functionWords.has(word.clean.toLowerCase());
  const clusters = [];

  let i = 0;
  while (i < words.length) {
    const group = [words[i]];
    i += 1;
    while (i < words.length) {
      const duration = (group[group.length - 1].endMs - group[0].startMs) / 1000;
      const lastIsFunction = isFunction(group[group.length - 1]);
      const soleFunction = group.length === 1 && isFunction(group[0]);
      const tooShort = duration < minSeconds;
      const roomLeft = group.length < maxWords;

      // Rules 1 & 2 may exceed maxWords by one — a dangling "в" is worse.
      if (lastIsFunction || soleFunction) {
        group.push(words[i]);
        i += 1;
        continue;
      }
      if (!roomLeft) break;
      // Adding a word must not blow past the upper target by much.
      const projected = (words[i].endMs - group[0].startMs) / 1000;
      if (tooShort && projected <= maxSeconds + 0.35) {
        group.push(words[i]);
        i += 1;
        continue;
      }
      break;
    }
    clusters.push(group);
  }

  // A cluster that lingers well past the upper target reads as a static line,
  // not a kinetic beat — split it, as long as neither half strands a function word.
  const SPLIT_ABOVE_SECONDS = 1.05;
  for (let c = 0; c < clusters.length; c++) {
    const group = clusters[c];
    if (group.length < 2) continue;
    if ((group[group.length - 1].endMs - group[0].startMs) / 1000 <= SPLIT_ABOVE_SECONDS) continue;
    const cut = Math.ceil(group.length / 2);
    const head = group.slice(0, cut);
    const tail = group.slice(cut);
    if (isFunction(head[head.length - 1])) continue;
    if (tail.length === 1 && isFunction(tail[0])) continue;
    clusters.splice(c, 1, head, tail);
    c += 1;
  }

  // A trailing 1-word cluster that is a function word gets folded backwards.
  if (clusters.length > 1) {
    const last = clusters[clusters.length - 1];
    if (last.length === 1 && isFunction(last[0])) {
      clusters[clusters.length - 2].push(last[0]);
      clusters.pop();
    }
  }
  return clusters;
};

const LINE_BREAK_HINT = 2; // >= 3 words in a cluster wrap onto a second line

/**
 * `highlightWords` is either a flat list (one accent colour) or a map of
 * tone -> words, e.g. {mint: [...], yellow: [...], red: [...]}.
 * @returns Map<word, tone>
 */
const buildHighlightMap = (highlightWords) => {
  const map = new Map();
  if (Array.isArray(highlightWords)) {
    for (const word of highlightWords) map.set(word.toLowerCase(), 'accent');
    return map;
  }
  for (const [tone, words] of Object.entries(highlightWords ?? {})) {
    if (!Array.isArray(words)) continue;
    for (const word of words) map.set(word.toLowerCase(), tone);
  }
  return map;
};

/**
 * @returns caption clusters shaped like the repo's existing TikTokPage captions
 * (startMs / durationMs / tokens) plus the extra fields the kinetic renderer uses.
 */
export const buildCaptions = (lineRanges, timedChars, config) => {
  const functionWords = new Set(config.functionWords.map((word) => word.toLowerCase()));
  const highlight = buildHighlightMap(config.highlightWords);
  // Words transliterated for the TTS ("ви-пи-эн") must render as themselves on
  // screen ("VPN"). Matching still happens on the spoken form.
  const display = new Map(
    Object.entries(config.displayReplacements ?? {}).map(([from, to]) => [from.toLowerCase(), to]),
  );
  const shown = (word) => display.get(word.clean.toLowerCase()) ?? (word.clean || word.text);
  const [targetMin, maxSeconds] = config.targetSeconds;
  // Clusters stop growing a little before the lower target: the visible hold
  // below tops each one up into the 0.55-0.85 s window.
  const minSeconds = config.growUntilSeconds ?? targetMin;

  const captions = [];
  const lineTimings = [];

  for (const range of lineRanges) {
    const words = mergeDisplayPhrases(wordsForRange(timedChars, range.charStart, range.charEnd), display);
    if (words.length === 0) {
      lineTimings.push({...range, startMs: null, endMs: null, wordCount: 0});
      continue;
    }
    lineTimings.push({
      id: range.id,
      chapter: range.chapter,
      text: range.text,
      index: range.index,
      startMs: words[0].startMs,
      endMs: words[words.length - 1].endMs,
      wordCount: words.length,
    });

    for (const group of clusterLine(words, {minSeconds, maxSeconds, maxWords: config.maxWords, functionWords})) {
      captions.push({
        lineId: range.id,
        chapter: range.chapter,
        text: group.map(shown).join(' '),
        startMs: group[0].startMs,
        endMs: group[group.length - 1].endMs,
        durationMs: group[group.length - 1].endMs - group[0].startMs,
        twoLines: group.length > LINE_BREAK_HINT,
        tokens: group.map((word) => {
          const tone = highlight.get(word.clean.toLowerCase()) ?? null;
          return {
            text: shown(word),
            fromMs: word.startMs,
            toMs: word.endMs,
            highlight: tone !== null,
            tone,
          };
        }),
      });
    }
  }

  // Hold each cluster until the next one starts, so the caption slot never goes
  // blank inside a sentence, but never lingers longer than a beat after a line.
  const MAX_HOLD_MS = 260;
  captions.forEach((caption, index) => {
    const next = captions[index + 1];
    const naturalEnd = caption.endMs + MAX_HOLD_MS;
    caption.visibleUntilMs = next ? Math.min(next.startMs, naturalEnd) : naturalEnd;
    caption.durationMs = caption.visibleUntilMs - caption.startMs;
  });

  return {captions, lineTimings};
};

export const summarizeCaptions = (captions, [minSeconds, maxSeconds]) => {
  const spans = captions.map((caption) => caption.visibleUntilMs - caption.startMs);
  const average = spans.reduce((sum, value) => sum + value, 0) / (spans.length || 1);
  const outside = captions
    .map((caption, index) => ({index, text: caption.text, seconds: spans[index] / 1000}))
    .filter((entry) => entry.seconds < minSeconds || entry.seconds > maxSeconds);
  const wordCounts = captions.map((caption) => caption.tokens.length);
  return {
    count: captions.length,
    averageSeconds: Number((average / 1000).toFixed(3)),
    outsideTarget: outside.map((entry) => ({...entry, seconds: Number(entry.seconds.toFixed(2))})),
    withinWordLimit: wordCounts.filter((count) => count >= 1 && count <= 3).length,
    maxWords: Math.max(...wordCounts),
  };
};

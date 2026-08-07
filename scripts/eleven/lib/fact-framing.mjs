/**
 * Fact-framing gate.
 *
 * The reel talks about a sensational headline ("VPN will be banned") that it
 * exists to debunk, so a naive keyword ban would fail on its own hook. Instead
 * every string in the content JSON that asserts a ban must be explicitly
 * declared as quoted myth (`framing: "myth"` on the element, or a chapter whose
 * `framing` is "myth"), and the corrective statements must actually be present.
 *
 * Config lives in `content/<slug>-reel.json` under `qa.factFraming`:
 *   banPatterns   – regexes that look like "VPN is banned" assertions
 *   requiredTexts – substrings that must appear somewhere in the reel
 *   mythChapters  – chapter ids whose visible text may carry the myth
 */

/** Walks the content JSON and yields every user-visible string with its origin. */
export const collectTexts = (script) => {
  const out = [];
  const push = (text, origin, framing) => {
    if (typeof text === 'string' && text.trim()) out.push({text, origin, framing: framing ?? null});
  };

  for (const line of script.lines ?? []) push(line.text, `line:${line.id}`, line.framing);

  for (const chapter of script.chapters ?? []) {
    push(chapter.headline, `chapter:${chapter.id}:headline`, chapter.framing);
    push(chapter.label, `chapter:${chapter.id}:label`, chapter.framing);
    push(chapter.eyebrow, `chapter:${chapter.id}:eyebrow`, chapter.framing);
  }

  const chapterFraming = new Map((script.chapters ?? []).map((c) => [c.id, c.framing ?? null]));
  for (const action of script.canvasActions ?? []) {
    const inherited = action.framing ?? chapterFraming.get(action.chapter) ?? null;
    push(action.label, `action:${action.id}:label`, inherited);
    for (const item of action.items ?? []) push(item, `action:${action.id}:item`, inherited);
  }

  const memory = script.memoryFrame ?? {};
  push(memory.title, 'memoryFrame:title', memory.framing);
  for (const item of memory.items ?? memory.chain ?? []) push(item, 'memoryFrame:item', memory.framing);

  const cta = script.cta ?? {};
  for (const key of ['prompt', 'optionA', 'optionB', 'divider', 'teaser']) {
    push(cta[key], `cta:${key}`, cta.framing);
  }
  return out;
};

export const checkFactFraming = (script) => {
  const config = script.qa?.factFraming;
  if (!config) return {applicable: false, passed: true, unmarkedClaims: [], missingRequired: []};

  const banPatterns = (config.banPatterns ?? []).map((source) => new RegExp(source, 'iu'));
  const mythChapters = new Set(config.mythChapters ?? []);
  const texts = collectTexts(script);

  const chapterOf = new Map();
  for (const line of script.lines ?? []) chapterOf.set(`line:${line.id}`, line.chapter);
  for (const chapter of script.chapters ?? []) {
    chapterOf.set(`chapter:${chapter.id}:headline`, chapter.id);
    chapterOf.set(`chapter:${chapter.id}:label`, chapter.id);
    chapterOf.set(`chapter:${chapter.id}:eyebrow`, chapter.id);
  }

  const unmarkedClaims = [];
  for (const entry of texts) {
    const matched = banPatterns.find((pattern) => pattern.test(entry.text));
    if (!matched) continue;
    const declaredMyth = entry.framing === 'myth' || mythChapters.has(chapterOf.get(entry.origin));
    if (!declaredMyth) unmarkedClaims.push({origin: entry.origin, text: entry.text, pattern: String(matched)});
  }

  const corpus = texts.map((entry) => entry.text).join('\n').toLowerCase();
  const missingRequired = (config.requiredTexts ?? []).filter(
    (required) => !corpus.includes(required.toLowerCase()),
  );

  return {
    applicable: true,
    passed: unmarkedClaims.length === 0 && missingRequired.length === 0,
    checkedStrings: texts.length,
    unmarkedClaims,
    missingRequired,
  };
};

/**
 * Everything that can be judged before a single credit is spent.
 *
 * ElevenLabs bills per character, and a reel that turns out to be 67 seconds or
 * to open on a cliche is worth exactly as much as one that was never made — but
 * it has already cost the month's quota. So every gate that reads text rather
 * than pixels runs here, in front of the API call.
 *
 * Per reel:  budget, predicted duration, cue references, grammar validity,
 *            script quality (slop), fact framing, publication metadata.
 * Per batch: repeated openers, shared 5-grams, grammar monotony.
 */
import {checkScriptQuality} from '../../eleven/lib/slop-check.mjs';
import {checkFactFraming} from '../../eleven/lib/fact-framing.mjs';
import {predictSeconds, scriptCost, uncachedCost} from './quota.mjs';

const GRAMMAR_TYPES = new Set([
  'statement',
  'compare',
  'tiles',
  'document',
  'counters',
  'steps',
  'flow',
  'split',
]);

/** The field each grammar cannot render without. A model that declares `flow`
 *  but fills `tiles` produces a spec that crashes the engine, so it fails here. */
const REQUIRED_FIELD = {
  statement: null,
  compare: 'rows',
  tiles: 'tiles',
  document: 'hidden',
  counters: 'counters',
  steps: 'steps',
  flow: 'nodes',
  split: 'subject',
};

const NGRAM = 5;

const words = (text) =>
  text
    .toLowerCase()
    .replace(/[«»"'(),.!?—–:;]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const ngrams = (list, n) => {
  const out = new Set();
  for (let i = 0; i + n <= list.length; i += 1) out.add(list.slice(i, i + n).join(' '));
  return out;
};

/** Every cue reference in the script, so a typo fails here instead of blanking a slot. */
const collectRefs = (node, out = []) => {
  if (Array.isArray(node)) {
    for (const child of node) collectRefs(child, out);
    return out;
  }
  if (node === null || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && (key === 'at' || key === 'until' || key === 'from' || key === 'to' || (key.endsWith('At') && key !== 'at'))) {
      out.push({key, value});
    } else {
      collectRefs(value, out);
    }
  }
  return out;
};

const collectGrammarTypes = (script) =>
  (script.chapters ?? []).map((chapter) => chapter.grammar?.type).filter(Boolean);

/** Judges one script. Returns `{slug, passed, failures, warnings, stats}`. */
export const preflightScript = (script, {durationWindow = [30, 60]} = {}) => {
  const failures = [];
  const warnings = [];

  const chars = scriptCost(script);
  const seconds = predictSeconds(script);
  const [minSeconds, maxSeconds] = script.qa?.durationSeconds ?? durationWindow;

  if (seconds > maxSeconds) {
    const overshoot = seconds - maxSeconds;
    const cut = Math.ceil(overshoot * (chars / (seconds || 1)));
    failures.push(`прогноз ${seconds}s > ${maxSeconds}s — убрать примерно ${cut} символов текста`);
  }
  if (seconds < minSeconds) {
    failures.push(`прогноз ${seconds}s < ${minSeconds}s — ролик слишком короткий для объяснения`);
  }

  // --- cue references --------------------------------------------------------
  const lineIds = new Set((script.lines ?? []).map((line) => line.id));
  const scope = {chapters: script.chapters, chips: script.chips, mood: script.mood, cta: script.cta};
  for (const ref of collectRefs(scope)) {
    if (!lineIds.has(ref.value)) failures.push(`ссылка на несуществующую реплику: ${ref.key} = "${ref.value}"`);
  }
  for (const anchor of ['memoryFrame']) {
    const node = script[anchor];
    if (!node) continue;
    for (const key of ['fromLine', 'untilLine']) {
      if (node[key] && !lineIds.has(node[key])) failures.push(`${anchor}.${key} = "${node[key]}" — такой реплики нет`);
    }
  }
  for (const chapter of script.chapters ?? []) {
    for (const key of ['fromLine', 'toLine']) {
      if (chapter[key] && !lineIds.has(chapter[key])) {
        failures.push(`глава ${chapter.id}: ${key} = "${chapter[key]}" — такой реплики нет`);
      }
    }
  }

  // --- grammars --------------------------------------------------------------
  const grammars = collectGrammarTypes(script);
  for (const chapter of script.chapters ?? []) {
    const type = chapter.grammar?.type;
    if (type && !GRAMMAR_TYPES.has(type)) {
      failures.push(`глава ${chapter.id}: неизвестная грамматика "${type}"`);
      continue;
    }
    const required = type ? REQUIRED_FIELD[type] : null;
    if (required && chapter.grammar[required] === undefined) {
      const present = Object.keys(chapter.grammar).filter((key) => key !== 'type' && key !== 'card');
      failures.push(
        `глава ${chapter.id}: грамматика "${type}" требует поле "${required}", а есть: ${present.join(', ') || '—'}`,
      );
    }
  }
  if (grammars.length === 0) {
    warnings.push('ни одна глава не объявляет грамматику — холст будет пустым');
  }
  if (grammars.length > 1 && new Set(grammars).size === 1) {
    warnings.push(`все главы используют одну грамматику (${grammars[0]}) — ролик будет однообразным`);
  }

  // --- required structure ----------------------------------------------------
  // The rail sits above the body slot and wraps; a fourth chip pushes the second
  // row down into the memory frame.
  const chips = script.chips ?? [];
  if (chips.length > 3) {
    failures.push(`чипов ${chips.length}, максимум 3 — иначе лента наезжает на кадр-запоминалку`);
  }
  // The rail auto-shrinks to stay on one row, but below ~14 px it stops being
  // readable, so the total label length is capped here.
  const railChars = chips.reduce((sum, chip) => sum + chip.label.length, 0);
  if (railChars > 54) {
    failures.push(`подписи чипов суммарно ${railChars} символов — лента станет нечитаемой (максимум 54)`);
  }
  if (!script.memoryFrame) {
    warnings.push('нет кадра-запоминалки — теряется причина сохранить ролик');
  } else {
    const items = (script.memoryFrame.items ?? []).filter((item) => typeof item === 'string' && item.trim());
    if (items.length < 3) failures.push(`кадр-запоминалка содержит ${items.length} строк из 3`);
  }
  if (!script.cta) failures.push('нет CTA');
  // A value that still carries its own field label means the parse leaked.
  for (const [key, value] of Object.entries(script.cta ?? {})) {
    if (typeof value === 'string' && /^(ВОПРОС|ДАЛЬШЕ|КОММЕНТАРИЙ|ВАРИАНТ)\s*:/i.test(value)) {
      failures.push(`cta.${key} содержит служебную метку: «${value.slice(0, 40)}»`);
    }
  }
  if (Object.keys(script.publish?.sources ?? {}).length === 0) {
    failures.push('нет publish.sources — атрибуцию нечем подтвердить');
  }

  // Labels the model filled with placeholders or with line ids would render
  // literally on screen. Nothing else in the stack looks at what a label says.
  // Whole-label match only: «ЗАГОЛОВОК SEC-CH-UA-MOBILE» is real content,
  // «ЗАГОЛОВОК» on its own is the model filling in the field name.
  const PLACEHOLDER = /^(ТЕКСТ|ТЕКСТ ГЛАВЫ|ЗАГОЛОВОК|ПОДПИСЬ|НАЗВАНИЕ|LABEL|CARD|ВЫВОД|СТАТУС|ИТОГ)$/i;
  const LINE_ID = /^l\d{1,3}$/i;
  const auditLabels = (node, origin) => {
    if (Array.isArray(node)) {
      for (const child of node) auditLabels(child, origin);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (typeof value === 'string' && ['label', 'note', 'card', 'badge', 'claim', 'visible', 'subject'].includes(key)) {
        const text = value.trim();
        if (PLACEHOLDER.test(text)) failures.push(`${origin}.${key}: подпись-заглушка «${value}»`);
        if (LINE_ID.test(text)) failures.push(`${origin}.${key}: в подпись попал id реплики «${value}»`);
        // Longer than this and the label wraps out of its card.
        if (text.length > 32) failures.push(`${origin}.${key}: подпись ${text.length} символов, максимум 32`);
      } else {
        auditLabels(value, origin);
      }
    }
  };
  for (const chapter of script.chapters ?? []) {
    if (chapter.grammar) auditLabels(chapter.grammar, `грамматика ${chapter.id}`);
    if (/ГЛАВА\s*:|\|/.test(chapter.label ?? '')) {
      failures.push(`глава ${chapter.id}: в кикер попала служебная разметка «${chapter.label}»`);
    }
    const lines = (chapter.headline ?? '').split('\n');
    if (lines.length > 2) failures.push(`глава ${chapter.id}: заголовок в ${lines.length} строки, максимум 2`);
    const longest = Math.max(0, ...lines.map((line) => line.length));
    if (longest > 24) failures.push(`глава ${chapter.id}: строка заголовка ${longest} символов, максимум 24`);
  }

  // Latin letters in a spoken line make the multilingual voice switch language
  // mid-sentence. Names must be transliterated for the TTS and restored on
  // screen through `captionClusters.displayReplacements`.
  for (const line of script.lines ?? []) {
    if (/[A-Za-z]{2,}/u.test(line.text)) {
      failures.push(`${line.id}: латиница в произносимом тексте — «${line.text}»`);
    }
  }

  // --- text gates ------------------------------------------------------------
  const quality = checkScriptQuality(script);
  if (quality.applicable && !quality.passed) failures.push(...quality.failures);

  const framing = checkFactFraming(script);
  if (framing.applicable && !framing.passed) {
    if (framing.unmarkedClaims.length) {
      failures.push(`непомеченные утверждения: ${framing.unmarkedClaims.map((c) => c.origin).join(', ')}`);
    }
    if (framing.missingRequired.length) {
      failures.push(`нет обязательных формулировок: ${framing.missingRequired.join(' | ')}`);
    }
  }

  return {
    slug: script.id,
    passed: failures.length === 0,
    failures,
    warnings,
    stats: {
      chars,
      seconds,
      model: script.tts?.modelId ?? process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2',
      lines: (script.lines ?? []).length,
      grammars,
      anchors: quality.anchorCount ?? 0,
    },
  };
};

/** Judges the batch as a whole: reels must differ from each other, not just be individually fine. */
export const preflightBatch = (scripts, options = {}) => {
  const reports = scripts.map((script) => preflightScript(script, options));
  const batchFailures = [];

  const texts = scripts.map((script) => ({
    slug: script.id,
    opener: script.lines?.[0]?.text ?? '',
    grams: ngrams(words((script.lines ?? []).map((line) => line.text).join(' ')), NGRAM),
  }));

  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      for (const gram of texts[i].grams) {
        if (texts[j].grams.has(gram)) {
          batchFailures.push(`общая 5-грамма у ${texts[i].slug} и ${texts[j].slug}: "${gram}"`);
        }
      }
      const a = new Set(words(texts[i].opener));
      const b = new Set(words(texts[j].opener));
      const shared = [...a].filter((word) => b.has(word)).length;
      if (a.size && b.size && shared / Math.min(a.size, b.size) >= 0.6) {
        batchFailures.push(`одинаковый заход у ${texts[i].slug} и ${texts[j].slug}: «${texts[i].opener}»`);
      }
    }
  }

  // The whole batch reading as one reel is the failure mode of a grammar library.
  const signatures = scripts.map((script) => collectGrammarTypes(script).join('>'));
  const unique = new Set(signatures.filter(Boolean));
  if (signatures.length > 2 && unique.size < Math.ceil(signatures.length / 2)) {
    batchFailures.push(
      `батч однообразен: ${unique.size} различных последовательностей грамматик на ${signatures.length} роликов`,
    );
  }

  const totalChars = reports.reduce((sum, report) => sum + report.stats.chars, 0);
  // What the run would really cost: cached chunks are free.
  const billableChars = scripts.reduce((sum, script) => sum + uncachedCost(script), 0);

  return {
    reports,
    batchFailures,
    passed: batchFailures.length === 0 && reports.every((report) => report.passed),
    totalChars,
    billableChars,
  };
};

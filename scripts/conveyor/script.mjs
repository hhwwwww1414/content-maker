#!/usr/bin/env node
/**
 * Turns a verified idea into a complete `content/<slug>-reel.json`.
 *
 *   npm run conveyor:script -- --batch 2026-08-08 --slug ai-voice-scam-48k
 *   npm run conveyor:script -- --batch 2026-08-08            # все идеи батча
 *
 * Three stages, each given to whoever is good at it:
 *
 *   1. text model      writes the Russian script: chapters, lines, headlines,
 *                      the cheat-sheet and the closing question;
 *   2. node            assigns line ids, chapter ranges, avatar poses and every
 *                      house setting — mechanical work a model should not touch;
 *   3. structure model turns each chapter into a grammar spec with cue ids.
 *
 * Then preflight judges the result and its complaints are fed back to stage 1.
 * A script that cannot pass in `--repairs` rounds is written out anyway with a
 * `.rejected.json` suffix so the failure can be read, not guessed at.
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from '../eleven/lib/env.mjs';
import {buildSystemPrompt, complete, fetchCredits, parseJson, readOpenRouterEnv} from './lib/openrouter.mjs';
import {avatarStatesFor, buildContent} from './lib/template.mjs';
import {preflightScript} from './lib/preflight.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BATCH_ID = flag('batch', new Date().toISOString().slice(0, 10));
const ONLY = flag('slug', null);
const MAX_REPAIRS = Number(flag('repairs', '3'));
const CHAR_BUDGET = Number(flag('chars', '900'));

const batchDir = path.join(ROOT, 'runs', 'conveyor', BATCH_ID);

const GRAMMARS = 'statement, compare, tiles, document, counters, steps, flow, split';

const scriptPrompt = (idea, complaints) => `Напиши сценарий вертикального ролика.

ТЕМА: ${idea.title}
ТЕЗИС: ${idea.thesis ?? ''}
ФАКТ, на котором всё держится: ${idea.fact?.claim ?? ''}
ИСТОЧНИК: ${idea.fact?.publisher ?? ''}, ${idea.fact?.date ?? ''}
ЗАГОТОВКА ХУКА: ${(idea.hook ?? []).join(' / ')}

ЖЁСТКИЕ ОГРАНИЧЕНИЯ:
— Суммарно не больше ${CHAR_BUDGET} символов текста реплик. Это примерно ${Math.round(CHAR_BUDGET / 16.8 + 1)} секунд. Считай.
— 5–7 глав. В каждой 3–8 реплик.
— Каждая реплика 3–9 слов, одна мысль.

ХУК — САМОЕ ВАЖНОЕ. Решение «смотреть или листать» зритель принимает за 1.7 секунды.
— Первая реплика: МАКСИМУМ 6 слов. Вторая и третья: максимум 8.
— Первая реплика бьёт сразу: без разгона, без «сегодня поговорим», без определения.
— Работающие формы, выбери одну:
  · разрыв шаблона — обыденное действие с неправильным результатом («Ты ничего не нажимал.»);
  · любопытный разрыв — факт без объяснения, объяснение дальше («Сайт уже знает твою систему.»);
  · прямой вопрос, на который зритель не знает ответа про себя.
— Три первые реплики — это лестница: каждая следующая хуже предыдущей для зрителя.
— В хуке должно быть то, что зритель может проверить на себе прямо сейчас.
— Запрещено в хуке: «представь», «знаешь ли ты», «в этом ролике», любая формулировка про сам ролик.
— Минимум 4 проверяемых факта: число, дата, имя, название, латиница или прямая цитата.
  Факт — это то, что зритель может пойти и проверить. «Много данных» фактом не является.
— Предпоследняя глава — поворот: то, ради чего ролик перешлют.
— Последняя глава — вопрос зрителю.
— Обращение на «ты».
— В РЕПЛИКАХ НЕ ДОЛЖНО БЫТЬ НИ ОДНОЙ ЛАТИНСКОЙ БУКВЫ. Пиши так, как произносится:
  VPN → «ви-пи-эн», Chrome → «хром», Accept-CH → «эксепт-си-эйч», HTTP → «эйч-ти-ти-пи»,
  Sec-CH-UA → «сек-си-эйч-ю-эй». В подписях на экране латиница разрешена и даже нужна.
${complaints ? `\nПРЕДЫДУЩАЯ ВЕРСИЯ НЕ ПРОШЛА ПРОВЕРКУ. Исправь ровно это:\n${complaints.map((c) => `— ${c}`).join('\n')}\n` : ''}
ФОРМАТ ОТВЕТА, без пояснений:

ГЛАВА: id-латиницей | КИКЕР ЗАГЛАВНЫМИ | ЗАГОЛОВОК СТРОКА 1 // ЗАГОЛОВОК СТРОКА 2

ЗАГОЛОВОК ГЛАВЫ — ЖЁСТКО:
— Ровно две строки, разделитель //.
— КАЖДАЯ строка максимум 24 символа. Считай символы, это жёсткий предел вёрстки.
— Это не пересказ главы, а её суть в двух ударах. Пример: «ТРИ СЕКУНДЫ — // И ГОЛОС ТВОЙ».
— Не копируй в заголовок текст реплик.
- реплика
- реплика
ГЛАВА: …

ЗАПОМНИ: ЗАГОЛОВОК КАДРА
- строка 1 заглавными
- строка 2 заглавными
- строка 3 заглавными

ВОПРОС: ТЕКСТ ВОПРОСА ЗАГЛАВНЫМИ
ВАРИАНТ: ОДНО СЛОВО
ВАРИАНТ: ОДНО СЛОВО
КОММЕНТАРИЙ: короткая просьба ответить
ДАЛЬШЕ: ТИЗЕР СЛЕДУЮЩЕГО РОЛИКА ЗАГЛАВНЫМИ`;

const TO_JSON = (prose) => `Преобразуй сценарий в JSON. Только перенеси, ничего не добавляй и не сокращай.

${prose}

Строго такой формат:
{"chapters":[{"id":"","label":"","headline":"строка1\\nстрока2","lines":["реплика","реплика"]}],
 "memory":{"title":"","items":["","",""]},
 "cta":{"prompt":"","options":["",""],"comment":"","teaser":""}}`;

const grammarPrompt = (chapter, lines) => `Подбери грамматику сцены для главы ролика.

Заголовок главы: ${chapter.headline.replace('\n', ' ')}
Реплики с идентификаторами:
${lines.map((line) => `${line.id}: ${line.text}`).join('\n')}

Доступные типы: ${GRAMMARS}.
Выбери ОДИН тип, который лучше всего показывает содержание этой главы.

У каждого типа СВОЁ обязательное поле. Без него сцена не отрисуется:
  statement → claim        compare  → rows      tiles → tiles     document → hidden
  counters  → counters     steps    → steps     flow  → nodes     split    → subject

Правила:
— Все подписи (label, card, note, badge, claim, visible, subject) — ЗАГЛАВНЫМИ по-русски, коротко, до 32 символов.
— ЗАПРЕЩЕНО писать в подписи слова-заглушки: «ТЕКСТ», «ЗАГОЛОВОК», «ПОДПИСЬ», «НАЗВАНИЕ», «СТАТУС», «ВЫВОД».
  Подпись — это конкретное содержание из реплик, а не имя поля.
— ЗАПРЕЩЕНО писать в подпись идентификатор реплики («l04»).
— Каждое поле "at" — идентификатор реплики из списка выше, на которой элемент появляется.
— Элементы должны появляться в том же порядке, что и реплики. Один элемент — одна реплика.
— tone: mint (норма), yellow (внимание/цена), red (опасность), neutral.

Примеры правильных ответов:
{"type":"tiles","card":"ЧТО УХОДИТ НА КАЖДОМ ЗАПРОСЕ","tiles":[{"label":"БРАУЗЕР","tone":"yellow","at":"l03"},{"label":"ВЕРСИЯ","tone":"yellow","at":"l04"}],"verdict":{"label":"БЕЗ ЕДИНОЙ КУКИ","tone":"red","at":"l05"}}
{"type":"steps","card":"КАК ЭТО РАБОТАЕТ","steps":[{"label":"САЙТ ПРОСИТ ACCEPT-CH","note":"ОДНА СТРОКА В ОТВЕТЕ","at":"l10","noteAt":"l11"}]}
{"type":"split","card":"ДВА НАБОРА","subject":"ЗАГОЛОВКИ БРАУЗЕРА","splitAt":"l12","left":{"label":"ШЛЁТ ВСЕГДА","tone":"yellow","at":"l12"},"right":{"label":"ТОЛЬКО ПО ЗАПРОСУ","tone":"mint","at":"l13"}}
{"type":"flow","card":"ПУТЬ ЗАПРОСА","nodes":[{"label":"БРАУЗЕР","at":"l06"},{"label":"САЙТ","at":"l07"}]}`;

/** Parses the prose script; tolerant of the small formatting drift models add. */
const parseProse = (text) => {
  const chapters = [];
  const memory = {title: '', items: []};
  const cta = {prompt: '', options: [], comment: '', teaser: ''};
  let mode = 'none';
  let current = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const chapterMatch = line.match(/^ГЛАВА:\s*(.+)$/i);
    if (chapterMatch) {
      const [id, label, headline] = chapterMatch[1].split('|').map((part) => part.trim());
      current = {
        id: (id || `ch${chapters.length + 1}`).replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || `ch${chapters.length + 1}`,
        label: label ?? '',
        headline: (headline ?? '').replace(/\s*\/\/\s*/, '\n'),
        lines: [],
      };
      chapters.push(current);
      mode = 'chapter';
      continue;
    }
    if (/^ЗАПОМНИ:/i.test(line)) {
      memory.title = line.replace(/^ЗАПОМНИ:\s*/i, '').trim();
      mode = 'memory';
      continue;
    }
    if (/^ВОПРОС:/i.test(line)) {
      cta.prompt = line.replace(/^ВОПРОС:\s*/i, '').trim();
      mode = 'cta';
      continue;
    }
    if (/^ВАРИАНТ:/i.test(line)) {
      cta.options.push(line.replace(/^ВАРИАНТ:\s*/i, '').trim());
      continue;
    }
    if (/^КОММЕНТАРИЙ:/i.test(line)) {
      cta.comment = line.replace(/^КОММЕНТАРИЙ:\s*/i, '').trim();
      continue;
    }
    if (/^ДАЛЬШЕ:/i.test(line)) {
      cta.teaser = line.replace(/^ДАЛЬШЕ:\s*/i, '').trim();
      continue;
    }
    const bullet = line.match(/^[-—•*]\s*(.+)$/);
    if (bullet) {
      if (mode === 'chapter' && current) current.lines.push(bullet[1].trim());
      else if (mode === 'memory') memory.items.push(bullet[1].trim());
      continue;
    }
  }
  return {chapters, memory, cta};
};

/**
 * The cheat-sheet is a held frame, not narration. Models often return it as a
 * trailing chapter of all-caps lines; that has to become `memory`, or the reel
 * reads its own summary out loud and the frame stays empty.
 */
const extractMemoryChapter = (parsed) => {
  const last = parsed.chapters[parsed.chapters.length - 1];
  if (!last) return;
  const looksLikeMemory =
    /запомни|memory|итог/i.test(`${last.id} ${last.label}`) ||
    (last.lines.length >= 2 && last.lines.every((line) => line === line.toUpperCase()));
  if (!looksLikeMemory) return;
  if (!parsed.memory.items || parsed.memory.items.filter(Boolean).length < 2) {
    parsed.memory = {title: last.label || parsed.memory.title || 'ЗАПОМНИ', items: last.lines.slice(0, 3)};
  }
  parsed.chapters.pop();
};

/** Layout limits. These are arithmetic, not judgement — see `fitHeadline`. */
const HEADLINE_MAX_LINE = 24;
const LABEL_MAX = 32;

/**
 * Forces a headline into two lines of at most `HEADLINE_MAX_LINE` characters.
 *
 * Asking a model to count characters does not work — twelve regeneration rounds
 * produced headlines of 30, 46 and 68 characters, and a second "compress this"
 * call was no more reliable. Since a headline is already written as the chapter's
 * essence in two beats, keeping the leading words and dropping the tail preserves
 * the meaning, and it always terminates.
 */
const fitHeadline = (headline) => {
  const words = String(headline ?? '')
    // `//` is the authored line break, not a word — collapse it first.
    .replace(/\s*\/\/\s*/g, ' ')
    .replace(/\n/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.length > HEADLINE_MAX_LINE ? word.slice(0, HEADLINE_MAX_LINE) : word));
  if (words.length === 0) return '';

  const lines = [''];
  for (const word of words) {
    const current = lines[lines.length - 1];
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= HEADLINE_MAX_LINE) {
      lines[lines.length - 1] = candidate;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      break; // both lines are full — the rest of the headline is dropped
    }
  }
  return lines.filter(Boolean).join('\n');
};

/** Trims a label to the card width at a word boundary. */
const fitLabel = (text) => {
  const clean = String(text).trim();
  if (clean.length <= LABEL_MAX) return clean;
  const cut = clean.slice(0, LABEL_MAX);
  const boundary = cut.lastIndexOf(' ');
  return (boundary > LABEL_MAX * 0.6 ? cut.slice(0, boundary) : cut).replace(/[\s,;:—·-]+$/, '');
};

const LINE_ID_ONLY = /^l\d{1,3}$/i;
const PLACEHOLDER_ONLY = /^(ТЕКСТ|ТЕКСТ ГЛАВЫ|ЗАГОЛОВОК|ПОДПИСЬ|НАЗВАНИЕ|LABEL|CARD|ВЫВОД|СТАТУС|ИТОГ)$/i;

/**
 * Cleans a grammar spec of the three things models reliably get wrong and that
 * no amount of prompting fixes: labels longer than the card, line ids left in a
 * label, and field names used as content.
 */
const sanitiseGrammar = (node) => {
  if (Array.isArray(node)) return node.map(sanitiseGrammar);
  if (node === null || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && ['label', 'note', 'card', 'badge', 'claim', 'visible', 'subject'].includes(key)) {
      const text = value.trim();
      if (LINE_ID_ONLY.test(text) || PLACEHOLDER_ONLY.test(text)) continue; // drop, do not render
      out[key] = fitLabel(text);
    } else {
      out[key] = sanitiseGrammar(value);
    }
  }
  return out;
};

/** Assigns l01…lNN and turns the parsed prose into content-JSON structures. */
const assemble = (idea, parsed) => {
  const lines = [];
  const chapters = [];
  let counter = 0;

  extractMemoryChapter(parsed);

  for (const chapter of parsed.chapters) {
    if (chapter.lines.length === 0) continue;
    const chapterLines = chapter.lines.map((text, i) => {
      counter += 1;
      const id = `l${String(counter).padStart(2, '0')}`;
      const last = i === chapter.lines.length - 1;
      lines.push({id, chapter: chapter.id, text, breakAfter: last ? 'block' : 'line'});
      return {id, text};
    });
    chapters.push({
      id: chapter.id,
      label: chapter.label,
      headline: fitHeadline(chapter.headline || chapter.label),
      fromLine: chapterLines[0].id,
      toLine: chapterLines[chapterLines.length - 1].id,
      _lines: chapterLines,
    });
  }
  if (lines.length > 0) lines[lines.length - 1].breakAfter = 'none';
  // A malformed model answer must surface as "empty script", not as a crash.
  if (chapters.length < 2) return {lines: [], chapters: [], memory: null, cta: null};

  const last = chapters[chapters.length - 1];
  const beforeLast = chapters[chapters.length - 2] ?? last;

  // The cheat-sheet rides the penultimate chapter and covers the whole body
  // slot, so that chapter must not also carry a grammar — otherwise its scene
  // is rendered and then hidden, and the twist is spent on nothing.
  beforeLast.noGrammar = true;

  // The cheat-sheet rides the penultimate chapter; the question owns the last.
  const memory = {
    fromLine: beforeLast._lines[0].id,
    untilLine: last.fromLine,
    maxHoldMs: 9000,
    staggerMs: 560,
    minHoldSeconds: 2.8,
    title: parsed.memory.title || 'ЗАПОМНИ',
    items: (parsed.memory.items ?? []).filter(Boolean).slice(0, 3),
  };

  last.noGrammar = true;
  const ctaLines = last._lines;
  const cta = {
    fromLine: last.fromLine,
    prompt: parsed.cta.prompt || 'ЧТО ВЫБЕРЕШЬ?',
    divider: 'или',
    options: parsed.cta.options.slice(0, 2).map((label, i) => ({
      label,
      tone: i === 0 ? 'yellow' : 'mint',
      at: ctaLines[Math.min(i + 1, ctaLines.length - 1)].id,
    })),
    comment: parsed.cta.comment || 'Одно слово в комментарии.',
    teaser: parsed.cta.teaser || '',
    hint: {at: ctaLines[Math.max(0, ctaLines.length - 2)].id},
    teaserCue: {at: ctaLines[ctaLines.length - 1].id},
    teaserDetailCue: {at: ctaLines[ctaLines.length - 1].id, offsetMs: 700},
  };

  return {lines, chapters, memory, cta};
};

const buildScript = async (idea, config, complaints) => {
  const prose = await complete({
    model: config.ideas,
    fallbacks: [process.env.OPENROUTER_MODEL_IDEAS_FALLBACK].filter(Boolean),
    system: buildSystemPrompt(),
    user: scriptPrompt(idea, complaints),
    maxTokens: 9000,
    temperature: complaints ? 0.6 : 0.85,
  });

  const structured = await complete({
    model: config.structure,
    fallbacks: [process.env.OPENROUTER_MODEL_STRUCTURE_FALLBACK].filter(Boolean),
    system: 'Возвращай только валидный JSON без пояснений.',
    user: TO_JSON(prose.text),
    json: true,
    maxTokens: 8000,
    temperature: 0,
  });

  const parsed = parseJson(structured.text);
  // Models routinely leave the field label inside the value ("ВОПРОС: …").
  const strip = (value) =>
    typeof value === 'string'
      ? value.replace(/^\s*(ВОПРОС|ДАЛЬШЕ|КОММЕНТАРИЙ|ВАРИАНТ|ЗАПОМНИ|ГЛАВА)\s*:\s*/i, '').trim()
      : value;
  if (parsed.cta) {
    for (const key of ['prompt', 'comment', 'teaser']) parsed.cta[key] = strip(parsed.cta[key]);
    if (Array.isArray(parsed.cta.options)) parsed.cta.options = parsed.cta.options.map(strip);
  }
  if (parsed.memory) {
    parsed.memory.title = strip(parsed.memory.title);
    if (Array.isArray(parsed.memory.items)) parsed.memory.items = parsed.memory.items.map(strip).filter(Boolean);
  }
  // `ВАРИАНТ: ДА` and friends are CTA metadata. If they survive into a chapter's
  // lines they get spoken aloud, so they are lifted out here, not filtered later.
  const META = /^\s*(ВАРИАНТ|КОММЕНТАРИЙ|ДАЛЬШЕ|ВОПРОС)\s*:\s*(.+)$/i;
  const rescued = {options: [], comment: '', teaser: '', prompt: ''};
  const cleanLines = (raw) => {
    const kept = [];
    for (const line of Array.isArray(raw) ? raw : []) {
      if (typeof line !== 'string' || !line.trim()) continue;
      const meta = line.match(META);
      if (!meta) {
        kept.push(line.trim());
        continue;
      }
      const [, tag, value] = meta;
      const upper = tag.toUpperCase();
      if (upper === 'ВАРИАНТ') rescued.options.push(value.trim());
      else if (upper === 'КОММЕНТАРИЙ') rescued.comment = value.trim();
      else if (upper === 'ДАЛЬШЕ') rescued.teaser = value.trim();
      else rescued.prompt = value.trim();
    }
    return kept;
  };

  const normalised = {
    chapters: (parsed.chapters ?? []).map((chapter, i) => ({
      id: (chapter.id || `ch${i + 1}`).toString().replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || `ch${i + 1}`,
      // Models return the whole source line here — strip the field marker and
      // anything after the separator, which belongs to the headline.
      label: String(chapter.label ?? '')
        .replace(/^\s*ГЛАВА\s*:?\s*/i, '')
        .split('|')[0]
        .split('//')[0]
        .trim()
        .slice(0, 40),
      headline: chapter.headline ?? chapter.label ?? '',
      lines: cleanLines(chapter.lines),
    })),
    memory: parsed.memory ?? {title: '', items: []},
    cta: parsed.cta ?? {prompt: '', options: [], comment: '', teaser: ''},
  };
  // Whatever was rescued out of the lines wins: it was authored as CTA content.
  if (rescued.options.length) normalised.cta.options = rescued.options;
  if (rescued.comment) normalised.cta.comment = rescued.comment;
  if (rescued.teaser) normalised.cta.teaser = rescued.teaser;
  if (rescued.prompt && !normalised.cta.prompt) normalised.cta.prompt = rescued.prompt;
  normalised.chapters = normalised.chapters.filter((chapter) => chapter.lines.length > 0);
  // The prose parser is the fallback when the structure model drops content.
  if (normalised.chapters.length < 3) return {...parseProse(prose.text), proseFallback: true};
  return normalised;
};

/** Field each grammar renders from, plus the names models reach for instead. */
const GRAMMAR_SHAPE = {
  compare: {field: 'rows', aliases: ['items', 'sides']},
  tiles: {field: 'tiles', aliases: ['items', 'cards']},
  document: {field: 'hidden', aliases: ['injected', 'secret']},
  counters: {field: 'counters', aliases: ['numbers', 'items']},
  steps: {field: 'steps', aliases: ['rules', 'items']},
  flow: {field: 'nodes', aliases: ['flow', 'steps', 'items']},
  split: {field: 'subject', aliases: ['object', 'title']},
};

/**
 * Models mislabel a spec far more often than they malform it: `type: "flow"`
 * with a `tiles` array is the common case. Retyping to whatever the fields
 * actually describe is cheaper and truer than another round trip.
 */
const normaliseGrammar = (grammar) => {
  if (!grammar?.type) return grammar;
  const shape = GRAMMAR_SHAPE[grammar.type];
  if (!shape || grammar[shape.field] !== undefined) return grammar;

  // Does another grammar's required field sit here under its own name?
  for (const [type, candidate] of Object.entries(GRAMMAR_SHAPE)) {
    if (type !== grammar.type && grammar[candidate.field] !== undefined) {
      return {...grammar, type};
    }
  }
  // Otherwise rename the closest alias into the field this type needs.
  for (const alias of shape.aliases) {
    if (grammar[alias] !== undefined) {
      const {[alias]: value, ...rest} = grammar;
      return {...rest, [shape.field]: value};
    }
  }
  return grammar;
};

const addGrammars = async (chapters, config) => {
  for (const chapter of chapters) {
    // The recap chapter is the memory frame; the CTA chapter is the CtaFrame.
    if (chapter.noGrammar) {
      chapter.grammar = null;
      continue;
    }
    try {
      const response = await complete({
        model: config.structure,
        fallbacks: [process.env.OPENROUTER_MODEL_STRUCTURE_FALLBACK].filter(Boolean),
        system: 'Возвращай только валидный JSON грамматики сцены.',
        user: grammarPrompt(chapter, chapter._lines),
        json: true,
        maxTokens: 1200,
        temperature: 0.2,
      });
      chapter.grammar = sanitiseGrammar(normaliseGrammar(parseJson(response.text)));
    } catch {
      // A chapter without a grammar still renders its headline and captions.
      chapter.grammar = null;
    }
  }
};
const finalise = (idea, assembled) => {
  const chapters = assembled.chapters.map(({_lines, ...rest}) => rest);
  const content = buildContent({
    slug: idea.slug,
    title: idea.title,
    lines: assembled.lines,
    chapters,
    memory: assembled.memory,
    cta: assembled.cta,
    source: {
      primary: idea.fact?.publisher ?? '',
      secondary: '',
      topic: idea.title,
    },
    tts: {
      direction: 'Хук — быстро и с нажимом. Поворот — медленнее и тише. Финал — дружелюбно.',
    },
    publish: {
      cover: idea.title.toUpperCase(),
      coverSub: idea.thesis ?? '',
      caption: [idea.thesis ?? '', '', idea.fact?.claim ?? '', '', idea.why ?? ''].join('\n'),
      hashtags: ['#кибербезопасность', '#приватность', '#интернет'],
      sources: idea.fact?.url ? {[idea.fact.publisher || 'Источник']: idea.fact.url} : {},
    },
  });
  content.avatarStates = avatarStatesFor(chapters);
  return content;
};

const main = async () => {
  const config = readOpenRouterEnv();
  const ideasFile = path.join(batchDir, 'ideas.json');
  if (!existsSync(ideasFile)) throw new Error(`нет ${path.relative(ROOT, ideasFile)} — сначала npm run conveyor:ideas`);

  const {accepted} = JSON.parse(readFileSync(ideasFile, 'utf8'));
  const targets = ONLY ? accepted.filter((idea) => idea.slug === ONLY) : accepted;
  if (targets.length === 0) throw new Error(ONLY ? `идея "${ONLY}" не найдена в батче` : 'в батче нет принятых идей');

  mkdirSync(path.join(ROOT, 'content'), {recursive: true});
  const summary = [];

  for (const idea of targets) {
    console.log(`\n══ ${idea.slug} — ${idea.title}`);
    let complaints = null;
    let content = null;
    let report = null;

    for (let attempt = 1; attempt <= MAX_REPAIRS + 1; attempt += 1) {
      const parsed = await buildScript(idea, config, complaints);
      const assembled = assemble(idea, parsed);
      if (assembled.lines.length === 0) {
        complaints = ['модель вернула пустой сценарий — перепиши по формату'];
        continue;
      }
      await addGrammars(assembled.chapters, config);
      content = finalise(idea, assembled);
      report = preflightScript(content);

      const chars = report.stats.chars;
      console.log(
        `  попытка ${attempt}: ${chars} симв · ~${report.stats.seconds}s · ${report.stats.lines} реплик · ` +
          `грамматики ${report.stats.grammars.join('>') || '—'} · ${report.passed ? 'ПРОШЁЛ' : 'провал'}`,
      );
      if (report.passed) break;
      for (const failure of report.failures) console.log(`      ✗ ${failure}`);
      complaints = report.failures;
    }

    const file = path.join(ROOT, 'content', `${idea.slug}-reel.json`);
    const target = report?.passed ? file : file.replace(/\.json$/, '.rejected.json');
    writeFileSync(target, `${JSON.stringify(content, null, 2)}\n`);
    console.log(`  → ${path.relative(ROOT, target)}`);
    summary.push({slug: idea.slug, passed: Boolean(report?.passed), failures: report?.failures ?? []});
  }

  const credits = await fetchCredits();
  console.log('\n══ итог');
  for (const item of summary) console.log(`${item.passed ? '✓' : '✗'} ${item.slug}`);
  if (credits) console.log(`\nOpenRouter: осталось $${credits.remaining}`);

  const ok = summary.filter((item) => item.passed).length;
  console.log(`${ok}/${summary.length} сценариев прошли препролёт`);
  process.exit(ok > 0 ? 0 : 1);
};

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});

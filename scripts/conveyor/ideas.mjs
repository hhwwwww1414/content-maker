#!/usr/bin/env node
/**
 * Generates reel ideas and verifies that their evidence actually exists.
 *
 *   npm run conveyor:ideas -- --batch 2026-08-08 --count 6
 *
 * A language model asked for "trending topics" will confidently invent a study,
 * a date and a URL. That is the single biggest source of slop in an automated
 * channel, and no wording gate catches it — the sentence reads perfectly.
 *
 * So every idea must arrive with a source, and every source is fetched. An idea
 * whose URL does not resolve is dropped, not fixed: a topic that cannot be
 * checked has no business in a reel that claims to state facts.
 */
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from '../eleven/lib/env.mjs';
import {buildSystemPrompt, complete, fetchCredits, parseJson, readOpenRouterEnv} from './lib/openrouter.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BATCH_ID = flag('batch', new Date().toISOString().slice(0, 10));
const COUNT = Number(flag('count', '6'));
const THEME = flag('theme', 'интернет, приватность, безопасность, ИИ-агенты');
/** Ask for more than needed: verification always kills some. */
const OVERSHOOT = Number(flag('overshoot', '2'));

const batchDir = path.join(ROOT, 'runs', 'conveyor', BATCH_ID);

const existingTopics = () => {
  const dir = path.join(ROOT, 'content');
  return readdirSync(dir)
    .filter((name) => name.endsWith('-reel.json'))
    .map((name) => {
      try {
        const script = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
        return {slug: script.id ?? '', title: script.title ?? ''};
      } catch {
        return null;
      }
    })
    .filter((topic) => topic && topic.slug);
};

/** Reachable? Follows redirects; a 2xx or 3xx counts, anything else does not. */
const verifyUrl = async (url) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let response = await fetch(url, {method: 'HEAD', redirect: 'follow', signal: controller.signal});
    // Plenty of sites reject HEAD but serve GET.
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {method: 'GET', redirect: 'follow', signal: controller.signal});
    }
    clearTimeout(timer);
    return {ok: response.ok, status: response.status};
  } catch (error) {
    return {ok: false, status: error.name === 'AbortError' ? 'timeout' : 'unreachable'};
  }
};

const PROMPT = (topics) => `Предложи ${COUNT + OVERSHOOT} идей для коротких вертикальных роликов.

Тематика канала: ${THEME}.
Аудитория: обычные люди, не инженеры. Язык — русский, обращение на «ты».

КРИТИЧЕСКИ ВАЖНО про источники:
— Каждая идея опирается на один конкретный проверяемый факт.
— У факта обязан быть РЕАЛЬНЫЙ источник с рабочей ссылкой. Я проверю каждую ссылку запросом.
— Если ты не уверен, что ссылка существует и рабочая — не предлагай эту идею.
— Лучше 3 идеи с настоящими источниками, чем ${COUNT + OVERSHOOT} с выдуманными.
— Не выдумывай названия исследований, отчётов, компаний и дат.

Уже сняты эти темы, повторять нельзя:
${topics.map((t) => `- ${t.slug}: ${t.title}`).join('\n')}

Формат ответа — по одной идее подряд, ничего лишнего:

СЛАГ: короткий-слаг-латиницей
ЗАГОЛОВОК: заголовок по-русски
ХУК: реплика 1 / реплика 2 / реплика 3
ТЕЗИС: одно предложение, что зритель поймёт
ФАКТ: проверяемое утверждение
ИСТОЧНИК: издатель, YYYY-MM, https://…
ПОЧЕМУ: почему это перешлют другу

Хук: каждая реплика до 8 слов, не определение, конкретное действие с неправильным результатом.`;

/** Turns the prose list into JSON. The writing model and the formatting model are
 *  deliberately different: strong free models often ignore `response_format`, and
 *  the cheap structured one costs fractions of a cent. */
const TO_JSON = (prose) => `Преобразуй этот список идей в JSON. Ничего не добавляй и не выдумывай — только перенеси.

${prose}

Верни строго:
{"ideas":[{"slug":"","title":"","hook":["",""],"thesis":"","fact":{"claim":"","publisher":"","date":"","url":""},"why":""}]}`;

const main = async () => {
  const config = readOpenRouterEnv();
  const topics = existingTopics();
  const known = new Set(topics.map((topic) => topic.slug));

  console.log(`идеи: модель ${config.ideas}`);
  console.log(`  уже снято ${topics.length} тем, прошу ${COUNT + OVERSHOOT}, нужно ${COUNT}\n`);

  const response = await complete({
    model: config.ideas,
    fallbacks: [process.env.OPENROUTER_MODEL_IDEAS_FALLBACK].filter(Boolean),
    system: buildSystemPrompt(),
    user: PROMPT(topics),
    maxTokens: 9000,
    temperature: 0.9,
  });

  const structured = await complete({
    model: config.structure,
    fallbacks: [process.env.OPENROUTER_MODEL_STRUCTURE_FALLBACK].filter(Boolean),
    system: 'Возвращай только валидный JSON без пояснений и без markdown-ограждений.',
    user: TO_JSON(response.text),
    json: true,
    maxTokens: 8000,
    temperature: 0,
  });

  const parsed = parseJson(structured.text);
  const raw = Array.isArray(parsed.ideas) ? parsed.ideas : [];
  console.log(`модель ${response.model} вернула ${raw.length} идей, проверяю источники…\n`);

  const accepted = [];
  const rejected = [];

  for (const idea of raw) {
    const url = idea.fact?.url;
    if (!url) {
      rejected.push({idea, reason: 'нет ссылки на источник'});
      continue;
    }
    if (known.has(idea.slug)) {
      rejected.push({idea, reason: 'тема уже снята'});
      continue;
    }
    const check = await verifyUrl(url);
    if (!check.ok) {
      rejected.push({idea, reason: `источник не отвечает (${check.status})`});
      console.log(`  ✗ ${idea.slug} — ${url} → ${check.status}`);
      continue;
    }
    console.log(`  ✓ ${idea.slug} — источник отвечает`);
    accepted.push({...idea, sourceVerified: true});
  }

  const chosen = accepted.slice(0, COUNT);
  mkdirSync(batchDir, {recursive: true});
  writeFileSync(
    path.join(batchDir, 'ideas.json'),
    `${JSON.stringify({batchId: BATCH_ID, model: response.model, generatedAt: new Date().toISOString(), accepted: chosen, rejected}, null, 2)}\n`,
  );

  // Fill the batch slots so preflight/build can find the slugs.
  const batchFile = path.join(batchDir, 'batch.json');
  if (existsSync(batchFile)) {
    const batch = JSON.parse(readFileSync(batchFile, 'utf8'));
    batch.slots = chosen.map((idea, i) => ({index: i + 1, slug: idea.slug, status: 'IDEA', title: idea.title}));
    writeFileSync(batchFile, `${JSON.stringify(batch, null, 2)}\n`);
  }

  const credits = await fetchCredits();
  console.log(`\nпринято ${chosen.length} из ${raw.length}, отклонено ${rejected.length}`);
  for (const idea of chosen) console.log(`  · ${idea.slug} — ${idea.title}`);
  if (credits) console.log(`\nOpenRouter: потрачено $${credits.used.toFixed(4)}, осталось $${credits.remaining}`);
  console.log(`→ runs/conveyor/${BATCH_ID}/ideas.json`);

  if (chosen.length < COUNT) {
    console.log(`\n! Набрано ${chosen.length} из ${COUNT}. Запусти ещё раз или подними --overshoot.`);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});

/**
 * OpenRouter client for the conveyor.
 *
 * Two jobs, two models, because they have opposite requirements:
 *
 *   OPENROUTER_MODEL_IDEAS      — writes Russian prose that must not read as
 *                                 machine output. Quality dominates; the volume
 *                                 is a few thousand tokens per reel.
 *   OPENROUTER_MODEL_STRUCTURE  — emits chapters, grammars and cue ids as JSON.
 *                                 Mechanical work: cheap and predictable wins.
 *
 * Both are configured in `.env`, so switching a model never touches code.
 *
 * Note on "skills": an OpenRouter model cannot load Claude Code skills — those
 * are a harness feature. The equivalent here is explicit: the craft rules from
 * `docs/REEL_CRAFT.md` and the grammar reference from `docs/GRAMMARS.md` are
 * injected into the system prompt by `buildSystemPrompt`.
 */
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT, loadDotEnv, redact} from '../../eleven/lib/env.mjs';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export const readOpenRouterEnv = () => {
  loadDotEnv();
  const apiKey = process.env.OPENROUTER_API_KEY ?? '';
  if (!apiKey) {
    throw new Error('Нет OPENROUTER_API_KEY. Скопируй .env.example в .env и заполни (.env в .gitignore).');
  }
  return {
    apiKey,
    ideas: process.env.OPENROUTER_MODEL_IDEAS || 'nvidia/nemotron-3-ultra-550b-a55b:free',
    structure: process.env.OPENROUTER_MODEL_STRUCTURE || 'inclusionai/ling-2.6-flash',
  };
};

/** Remaining credit on the account, or null when the call fails. */
export const fetchCredits = async () => {
  const {apiKey} = readOpenRouterEnv();
  try {
    const response = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: {Authorization: `Bearer ${apiKey}`},
    });
    if (!response.ok) return null;
    const {data} = await response.json();
    return {
      total: data.total_credits ?? 0,
      used: data.total_usage ?? 0,
      remaining: Number(((data.total_credits ?? 0) - (data.total_usage ?? 0)).toFixed(4)),
    };
  } catch {
    return null;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One chat completion with retries. Free models are rate-limited and
 * occasionally unavailable, so `fallbacks` are tried in order before giving up.
 */
export const complete = async ({
  model,
  system,
  user,
  json = false,
  maxTokens = 4000,
  temperature = 0.8,
  fallbacks = [],
  attempts = 3,
  /** Reasoning models otherwise spend the budget thinking out loud in `content`. */
  excludeReasoning = true,
}) => {
  const {apiKey} = readOpenRouterEnv();
  const candidates = [model, ...fallbacks];
  let lastError = null;

  for (const candidate of candidates) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            // OpenRouter uses these for attribution; harmless and polite.
            'HTTP-Referer': 'https://github.com/hhwwwww1414/content-maker',
            'X-Title': 'content-maker conveyor',
          },
          body: JSON.stringify({
            model: candidate,
            messages: [
              ...(system ? [{role: 'system', content: system}] : []),
              {role: 'user', content: user},
            ],
            max_tokens: maxTokens,
            temperature,
            ...(excludeReasoning ? {reasoning: {exclude: true}} : {}),
            ...(json ? {response_format: {type: 'json_object'}} : {}),
          }),
        });

        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(`${candidate}: HTTP ${response.status}`);
          await sleep(attempt * 2000);
          continue;
        }
        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          lastError = new Error(`${candidate}: HTTP ${response.status} ${redact(detail).slice(0, 300)}`);
          break; // a 4xx will not fix itself on retry — move to the next model
        }

        const payload = await response.json();
        const text = payload.choices?.[0]?.message?.content ?? '';
        if (!text.trim()) {
          lastError = new Error(`${candidate}: пустой ответ`);
          await sleep(attempt * 1500);
          continue;
        }
        return {
          text,
          model: payload.model ?? candidate,
          usage: payload.usage ?? null,
          cost: payload.usage?.cost ?? null,
        };
      } catch (error) {
        lastError = error;
        await sleep(attempt * 1500);
      }
    }
  }
  throw new Error(`OpenRouter не ответил ни одной моделью. Последняя ошибка: ${lastError?.message ?? 'неизвестна'}`);
};

/** Strips ```json fences some models add around JSON output. */
export const parseJson = (text) => {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Last resort: the first balanced {...} block in the response.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error(`Модель вернула не JSON: ${cleaned.slice(0, 200)}`);
  }
};

const readDoc = (relative) => {
  const file = path.join(ROOT, relative);
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
};

/**
 * The system prompt is assembled from the project's own documentation, so the
 * rules a model is held to are the same ones the gates enforce. When the craft
 * doc changes, the prompt changes with it — there is no second copy to drift.
 */
export const buildSystemPrompt = ({includeGrammars = false} = {}) => {
  const craft = readDoc('docs/REEL_CRAFT.md');
  const grammars = includeGrammars ? readDoc('docs/GRAMMARS.md') : '';

  return [
    'Ты — сценарист русскоязычного канала коротких объясняющих роликов про интернет,',
    'приватность и безопасность. Пишешь для зрителя, который листает ленту.',
    '',
    'Жёсткие требования:',
    '— Никакой воды. Каждая реплика либо сообщает факт, либо двигает мысль.',
    '— Запрещены обороты: «в современном мире», «важно понимать», «давайте разберёмся»,',
    '  «стоит отметить», «это не просто X, это Y», «дело не в том… а в том…»,',
    '  «представь…», «разберёмся, как…».',
    '— Не смягчай: «возможно», «наверное», «скорее всего» — максимум дважды на ролик.',
    '— Каждое утверждение должно быть проверяемым: имя, дата, число, цитата.',
    '— Не выдумывай факты. Если не уверен — не пиши.',
    '— Пиши короткими репликами: одна мысль = одна реплика, 3–9 слов.',
    '',
    '=== ПРАВИЛА РЕМЕСЛА (docs/REEL_CRAFT.md) ===',
    craft,
    ...(grammars ? ['', '=== ГРАММАТИКИ СЦЕН (docs/GRAMMARS.md) ===', grammars] : []),
  ].join('\n');
};

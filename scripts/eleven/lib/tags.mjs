/**
 * Stage 3 — Audio Tags.
 *
 * `eleven_v3` takes emotion from inline tags, which makes the markup a real
 * lever and a real hazard: a model asked to "add emotion" will sprinkle
 * `[excited]` and `[laughs]` over every second line and the read turns into
 * amateur theatre. So the markup is proposed by an LLM and then passed through
 * a validator that is allowed to delete but never to invent.
 *
 * The rules are the brief's, enforced here rather than requested in a prompt:
 *   · only the whitelist survives;
 *   · at most one tag per two sentences;
 *   · `[whispers]` at most once, and only in the hook;
 *   · no SSML — `<break>` is not supported by v3 and is stripped;
 *   · accents belong to punctuation (… , CAPS), not to tags.
 */
import {TAGS} from '../../../config/voice.config.mjs';

const ALLOWED = new Set(TAGS.allowed.map((tag) => tag.toLowerCase()));

/** Every `[something]` in the text, with its position. */
const TAG_RE = /\[([^\]\n]{1,40})\]/gu;

/** `<break time="1s"/>`, `<speak>`, anything angle-bracketed. */
const SSML_RE = /<[^>]{1,80}>/gu;

const sentenceCount = (text) =>
  Math.max(1, text.split(/[.!?…]+(?:\s|$)/u).filter((part) => part.trim().length > 0).length);

/**
 * Strips everything the brief forbids.
 *
 * @param {string} text markup produced by the model
 * @param {{hookChars?: number}} options `hookChars` marks how much of the script
 *   counts as the hook, the only place `[whispers]` is allowed.
 * @returns {{text: string, kept: string[], removed: {tag: string, reason: string}[]}}
 */
export const sanitiseTags = (text, {hookChars = 0} = {}) => {
  const removed = [];
  const kept = [];

  let working = text.replace(SSML_RE, (match) => {
    removed.push({tag: match, reason: 'SSML не поддерживается v3'});
    return '';
  });

  const allowedPerScript = Math.floor(sentenceCount(working) / TAGS.density.sentencesPerTag);
  let whispersUsed = 0;
  let used = 0;

  working = working.replace(TAG_RE, (match, inner, offset) => {
    const tag = inner.trim().toLowerCase();

    if (!ALLOWED.has(tag)) {
      removed.push({tag: match, reason: 'вне whitelist'});
      return '';
    }
    if (tag === 'whispers') {
      const inHook = offset <= hookChars;
      if (!inHook && TAGS.density.whispersHookOnly) {
        removed.push({tag: match, reason: 'whispers разрешён только в хуке'});
        return '';
      }
      if (whispersUsed >= TAGS.density.whispersPerReel) {
        removed.push({tag: match, reason: 'whispers уже использован'});
        return '';
      }
      whispersUsed += 1;
    }
    if (used >= allowedPerScript) {
      removed.push({tag: match, reason: `плотность: не больше 1 тега на ${TAGS.density.sentencesPerTag} предложения`});
      return '';
    }
    used += 1;
    kept.push(tag);
    return `[${tag}]`;
  });

  // Deleting a tag leaves a double space or a space before punctuation.
  working = working
    .replace(/[ \t]{2,}/gu, ' ')
    .replace(/[ \t]+([.,!?;:…»])/gu, '$1')
    .replace(/(^|\n)[ \t]+/gu, '$1')
    .replace(/[ \t]+(\n|$)/gu, '$1');

  return {text: working, kept, removed};
};

/** Prompt for the markup step. Deliberately narrow: tag placement only. */
export const markupPrompt = (lines) => `Расставь Audio Tags в сценарии ролика.

РАЗРЕШЕНЫ ТОЛЬКО ЭТИ ТЕГИ: ${TAGS.allowed.map((t) => `[${t}]`).join(' ')}
Любые другие теги будут удалены автоматически — не трать их.

Правила:
— Не больше одного тега на два предложения. Перебор звучит как переигрывание.
— [whispers] максимум один раз и только в первых трёх репликах.
— Тег ставится ПЕРЕД репликой, к которой относится.
— Большинство реплик остаётся вообще без тегов. Это нормально.
— Не меняй сам текст: ни слова, ни знаки препинания. Только добавь теги.
— Не используй SSML и <break>.

Реплики:
${lines.map((line) => `${line.id}: ${line.text}`).join('\n')}

Верни строго JSON: {"lines":[{"id":"l01","tag":"calm"},{"id":"l04","tag":null}]}
Для реплик без тега ставь null. Верни ВСЕ реплики в том же порядке.`;

/**
 * Applies a model's tag choices to the script lines.
 * The result still goes through `sanitiseTags` — this only places them.
 */
export const applyTags = (lines, choices) => {
  const byId = new Map((choices ?? []).map((choice) => [choice.id, choice.tag]));
  return lines.map((line) => {
    const tag = byId.get(line.id);
    const clean = typeof tag === 'string' ? tag.trim().toLowerCase().replace(/^\[|\]$/g, '') : null;
    return clean && ALLOWED.has(clean) ? {...line, text: `[${clean}] ${line.text}` } : line;
  });
};

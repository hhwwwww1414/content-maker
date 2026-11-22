/**
 * ElevenLabs budget planning.
 *
 * The conveyor is not limited by ideas or by render time — it is limited by TTS
 * credits. On the free tier that is 10 000 characters a month, about nine reels.
 * Planning a batch of six without checking leaves the last two dead on a 401,
 * so every run starts here.
 */
import {createHash} from 'node:crypto';
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {ROOT, loadDotEnv, readElevenLabsEnv} from '../../eleven/lib/env.mjs';
import {buildTtsText} from '../../eleven/lib/script.mjs';
import {buildChunks} from '../../eleven/lib/chunks.mjs';

/**
 * Speech rate in characters per second, measured from finished reels:
 *
 *   eleven_multilingual_v2  speed 1.2  1114 chars → 65.88 s = 16.91 c/s
 *   eleven_multilingual_v2  speed 1.2   630 chars → 38.16 s = 16.51 c/s
 *   eleven_v3               speed 1.1   639 chars → 47.49 s = 13.46 c/s
 *
 * v2 scales with `speed` (~13.9 × speed). **v3 ignores `voice_settings.speed`
 * entirely** — raising it from 1.0 to 1.1 made a reel longer, not shorter — so
 * its rate is a constant. Getting this wrong makes the duration gate useless:
 * the same script was predicted at 38.9 s and came out at 47.5 s.
 */
const RATE = {
  eleven_v3: () => 13.5,
  eleven_multilingual_v2: (speed) => 13.9 * speed,
  eleven_turbo_v2_5: (speed) => 13.9 * speed,
  eleven_flash_v2_5: (speed) => 13.9 * speed,
};

loadDotEnv();

const modelOf = (script) =>
  script.tts?.modelId ?? process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';

export const CHARS_PER_SECOND = (speed = 1, modelId = 'eleven_multilingual_v2') =>
  (RATE[modelId] ?? RATE.eleven_multilingual_v2)(speed);

/** Exact number of characters a script will be billed for. */
export const scriptCost = (script) => buildTtsText(script).text.length;

/** Predicted finished length, model-aware. */
export const predictSeconds = (script) => {
  const chars = scriptCost(script);
  const speech = chars / CHARS_PER_SECOND(script.tts?.speed ?? 1, modelOf(script));
  return Number((speech + (script.finalHoldMs ?? 1500) / 1000).toFixed(1));
};

const fetchOne = async (apiKey) => {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
      headers: {'xi-api-key': apiKey},
    });
    if (!response.ok) return null;
    const data = await response.json();
    const used = data.character_count ?? 0;
    const limit = data.character_limit ?? 0;
    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      tier: data.tier ?? 'unknown',
      resetsAt: data.next_character_count_reset_unix
        ? new Date(data.next_character_count_reset_unix * 1000).toISOString().slice(0, 10)
        : null,
    };
  } catch {
    return null;
  }
};

/**
 * Combined budget across every configured key. The pipeline fails over between
 * them, so what a batch can afford is the sum, not the first account's balance.
 */
export const fetchQuota = async () => {
  const config = readElevenLabsEnv();
  const keys = config.keys?.length ? config.keys : [config.apiKey];
  const accounts = (await Promise.all(keys.map(fetchOne))).filter(Boolean);
  if (accounts.length === 0) return null;
  return {
    accounts: accounts.map(({remaining, limit, tier, resetsAt}) => ({remaining, limit, tier, resetsAt})),
    used: accounts.reduce((sum, a) => sum + a.used, 0),
    limit: accounts.reduce((sum, a) => sum + a.limit, 0),
    remaining: accounts.reduce((sum, a) => sum + a.remaining, 0),
    tier: accounts.map((a) => a.tier).join('+'),
    resetsAt: accounts.map((a) => a.resetsAt).filter(Boolean).sort()[0] ?? null,
  };
};

/**
 * How many reels of `averageChars` still fit, and what that means for a batch.
 * Cached voiceovers cost nothing, so slugs already generated are free to rerun.
 */
export const planBatch = (quota, {averageChars = 1100, requested = 6} = {}) => {
  if (!quota) {
    return {fits: requested, capped: false, reason: 'квота недоступна — планирую по запросу'};
  }
  const fits = Math.floor(quota.remaining / averageChars);
  if (fits >= requested) {
    return {fits: requested, capped: false, reason: `хватает на ${fits}, запрошено ${requested}`};
  }
  return {
    fits: Math.max(0, fits),
    capped: true,
    reason:
      `осталось ${quota.remaining} символов из ${quota.limit} (тариф ${quota.tier})` +
      `${quota.resetsAt ? `, сброс ${quota.resetsAt}` : ''} — хватает на ${Math.max(0, fits)} из ${requested}`,
  };
};


/**
 * What a run would actually be billed, given what is already on disk.
 *
 * A chunk whose take is cached costs nothing, so a rebuild after a layout-only
 * change must not be blocked by the budget gate. Chunk hashes depend on the
 * *marked-up* text, which is only known inside the voice step, so this matches
 * on the chunk index instead — good enough to tell "nothing to buy" from
 * "a whole reel to buy".
 */
export const uncachedCost = (script, takes = 1) => {
  const chunks = buildChunks(script);
  const dir = path.join(ROOT, 'public', 'generated', script.id, 'takes');
  if (!existsSync(dir)) return chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) * takes;

  const present = readdirSync(dir);
  let cost = 0;
  for (const chunk of chunks) {
    const cached = present.filter((name) => name.startsWith(`chunk-${chunk.index}-take-`) && name.endsWith('.mp3')).length;
    const missing = Math.max(0, takes - cached);
    cost += chunk.text.length * missing;
  }
  return cost;
};

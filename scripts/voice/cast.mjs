#!/usr/bin/env node
/**
 * Stage 1 — voice casting.
 *
 *   node scripts/voice/cast.mjs --probe          # один короткий запрос: проверить доступ
 *   node scripts/voice/cast.mjs --shortlist      # только отбор, без генерации
 *   node scripts/voice/cast.mjs                  # отбор + озвучка + index.html
 *
 * Picks candidates from the public Voice Library, runs one real reel script
 * through each, and builds a local page to listen to them side by side.
 * No custom voice is created and nothing is cloned.
 *
 * Character budget is the binding constraint on a free tier, so the script
 * prints the cost before spending anything and refuses to start when the
 * remaining quota cannot cover the run.
 */
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT, readElevenLabsEnv} from '../eleven/lib/env.mjs';
import {CASTING, GENERATION} from '../../config/voice.config.mjs';

const args = process.argv.slice(2);
const has = (name) => args.includes(`--${name}`);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const OUT_DIR = path.join(ROOT, CASTING.outputDir);
/** Free accounts cannot call Voice Library voices; premade ones always work. */
const PREMADE = has('premade');
const SCRIPT_SLUG = flag('script', 'ai-voice-scam-48k');

/* ------------------------------------------------------------------ casting text */

/**
 * A real reel, not a demo phrase — but cut to the four passages that actually
 * discriminate between voices: the hook, spoken-out numbers, transliterated
 * brand names, and the closing question. Casting the full 630-character script
 * across ten voices would cost 6 300 characters of a 9 400-character budget.
 */
const CASTING_LINE_IDS = ['l01', 'l02', 'l03', 'l04', 'l05', 'l06', 'l13', 'l16', 'l18'];

const buildCastingText = (slug) => {
  const file = path.join(ROOT, 'content', `${slug}-reel.json`);
  if (!existsSync(file)) throw new Error(`нет content/${slug}-reel.json`);
  const script = JSON.parse(readFileSync(file, 'utf8'));
  const wanted = new Set(CASTING_LINE_IDS);
  const lines = script.lines.filter((line) => wanted.has(line.id)).map((line) => line.text);
  if (lines.length === 0) throw new Error(`в ${slug} не нашлись реплики ${CASTING_LINE_IDS.join(', ')}`);
  return {text: lines.join(' '), lines, title: script.title};
};

/* ------------------------------------------------------------------ discovery */

const fetchSharedVoices = async (apiKey) => {
  const seen = new Map();
  for (let page = 0; page < 6; page += 1) {
    const url =
      'https://api.elevenlabs.io/v1/shared-voices' +
      `?page_size=100&language=ru&page=${page}`;
    const response = await fetch(url, {headers: {'xi-api-key': apiKey}});
    if (!response.ok) throw new Error(`shared-voices: HTTP ${response.status}`);
    const data = await response.json();
    for (const voice of data.voices ?? []) seen.set(voice.voice_id, voice);
    if (!data.has_more) break;
  }
  return [...seen.values()];
};

/** Words that promise the "sales push" the brief rules out. */
const PUSHY = /energet|vibrant|dramatic|hype|excit|powerful|bold|intense|loud/i;
/** Words that promise the delivery we want. */
const WANTED = /calm|clear|natural|confident|neutral|warm|trust|smooth|engaging|pleasant|informative|narrat/i;

const scoreVoice = (voice) => {
  const description = `${voice.name} ${voice.description ?? ''}`;
  let score = Math.log10((voice.cloned_by_count ?? 0) + 10) * 10;
  if (WANTED.test(description)) score += 18;
  if (PUSHY.test(description)) score -= 22;
  if (voice.use_case === 'informative_educational') score += 14;
  if (voice.use_case === 'narrative_story') score += 8;
  if (voice.category === 'high_quality') score += 5;
  if (voice.age === 'middle_aged' || voice.age === 'young') score += 3;
  return Math.round(score);
};

const shortlist = (voices) => {
  const eligible = voices.filter(
    (voice) =>
      voice.free_users_allowed &&
      CASTING.categories.includes(voice.category) &&
      CASTING.useCases.includes(voice.use_case) &&
      (voice.cloned_by_count ?? 0) >= CASTING.minClonedByCount &&
      (voice.verified_languages ?? []).some((entry) => entry.language === 'ru'),
  );

  const ranked = eligible
    .map((voice) => ({...voice, score: scoreVoice(voice)}))
    .sort((a, b) => b.score - a.score);

  // Keep the comparison honest: mostly male (the channel's existing register
  // and its avatar), but two female voices so the choice is a real one.
  const males = ranked.filter((voice) => voice.gender === 'male');
  const females = ranked.filter((voice) => voice.gender === 'female');
  const picked = [...males.slice(0, CASTING.shortlistSize - 2), ...females.slice(0, 2)];
  return {eligible: eligible.length, picked: picked.slice(0, CASTING.shortlistSize)};
};

/**
 * The account's own voice list — on a free plan that is the 21 premade voices.
 * Their metadata lives in `labels`, not in the shared-library fields, so they
 * are normalised into the same shape the rest of the script expects.
 */
const fetchPremadeVoices = async (apiKey) => {
  const response = await fetch('https://api.elevenlabs.io/v1/voices?page_size=100', {
    headers: {'xi-api-key': apiKey},
  });
  if (!response.ok) throw new Error(`voices: HTTP ${response.status}`);
  const data = await response.json();
  // Library voices already added to an account are still refused to free users
  // (402 paid_plan_required), so only genuinely premade ones may enter the pool.
  return (data.voices ?? []).filter((voice) => voice.category === 'premade').map((voice) => {
    const labels = voice.labels ?? {};
    return {
      voice_id: voice.voice_id,
      name: voice.name,
      description: voice.description || labels.description || '',
      category: voice.category,
      use_case: labels.use_case ?? '',
      gender: labels.gender ?? '',
      age: labels.age ?? '',
      accent: labels.accent ?? '',
      cloned_by_count: 0,
      preview_url: voice.preview_url,
      free_users_allowed: true,
    };
  });
};

const shortlistPremade = (voices) => {
  const {excludeUseCases, excludeNames, baseline} = CASTING.premade;
  const shortName = (voice) => voice.name.split(/\s*[-—]\s*/)[0].trim();

  const eligible = voices.filter(
    (voice) =>
      !excludeUseCases.includes(voice.use_case) &&
      !excludeNames.includes(shortName(voice)),
  );

  const ranked = eligible
    .map((voice) => ({...voice, score: scoreVoice(voice)}))
    .sort((a, b) => b.score - a.score);

  const males = ranked.filter((voice) => voice.gender === 'male' || voice.gender === 'neutral');
  const females = ranked.filter((voice) => voice.gender === 'female');
  let picked = [...males.slice(0, CASTING.shortlistSize - 2), ...females.slice(0, 2)].slice(0, CASTING.shortlistSize);

  // The voice currently in .env must be in the line-up, or there is nothing to
  // compare a change against.
  if (baseline && !picked.some((voice) => shortName(voice) === baseline)) {
    const incumbent = ranked.find((voice) => shortName(voice) === baseline);
    if (incumbent) picked = [incumbent, ...picked.slice(0, CASTING.shortlistSize - 1)];
  }
  return {eligible: eligible.length, picked};
};

/* ------------------------------------------------------------------ generation */

const quotaFor = async (apiKey) => {
  const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
    headers: {'xi-api-key': apiKey},
  });
  if (!response.ok) return null;
  const data = await response.json();
  return {remaining: (data.character_limit ?? 0) - (data.character_count ?? 0), tier: data.tier};
};

/** Format actually used; downgraded once if the tier refuses the configured one. */
let activeFormat = GENERATION.outputFormat;

const synthesise = async ({apiKey, voiceId, text, format = activeFormat}) => {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}` +
    `?output_format=${encodeURIComponent(format)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {'xi-api-key': apiKey, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      text,
      model_id: GENERATION.modelId,
      voice_settings: GENERATION.voiceSettings,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    // The configured bitrate is a paid-tier feature; casting does not need it.
    if (/output_format_not_allowed/.test(detail) && format !== GENERATION.fallbackOutputFormat) {
      console.log(`    формат ${format} недоступен тарифу → ${GENERATION.fallbackOutputFormat}`);
      activeFormat = GENERATION.fallbackOutputFormat;
      return synthesise({apiKey, voiceId, text, format: activeFormat});
    }
    return {ok: false, status: response.status, detail: detail.slice(0, 300)};
  }
  return {ok: true, buffer: Buffer.from(await response.arrayBuffer())};
};

const safeName = (voice) =>
  voice.name
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

/* ------------------------------------------------------------------ page */

const buildIndexHtml = ({candidates, castingText, lines, slug, title, blocked}) => `<!doctype html>
<meta charset="utf-8">
<title>Кастинг голоса — ${candidates.length} кандидатов</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; background:#0d0f13; color:#e8e8ea;
         font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
  header { padding:28px 32px 18px; border-bottom:1px solid #24262d; }
  h1 { margin:0 0 6px; font-size:22px; letter-spacing:-.2px; }
  .sub { color:#9a9ba3; font-size:13px; }
  .wrap { display:grid; grid-template-columns:minmax(0,1fr) 380px; gap:0; align-items:start; }
  .list { padding:18px 32px 60px; }
  .script { position:sticky; top:0; padding:24px 28px; border-left:1px solid #24262d;
            background:#101319; height:100vh; overflow:auto; box-sizing:border-box; }
  .script h2 { font-size:13px; text-transform:uppercase; letter-spacing:2px; color:#9a9ba3; margin:0 0 14px; }
  .script p { margin:0 0 10px; font-size:16px; }
  .card { padding:16px 0; border-bottom:1px solid #1e2027; display:grid;
          grid-template-columns:34px minmax(0,1fr); gap:14px; }
  .rank { color:#5b5e69; font-variant-numeric:tabular-nums; font-size:13px; padding-top:3px; }
  .name { font-weight:650; font-size:16px; }
  .meta { color:#9a9ba3; font-size:12.5px; margin:3px 0 9px; }
  .desc { color:#c3c4cb; font-size:13.5px; margin-bottom:10px; }
  audio { width:100%; max-width:520px; height:34px; }
  .tag { display:inline-block; padding:1px 7px; border-radius:20px; font-size:11px;
         border:1px solid #2f323b; color:#a8aab3; margin-right:5px; }
  .id { font-family:ui-monospace,Menlo,monospace; font-size:11px; color:#63666f; }
  .warn { margin-top:14px; padding:12px 14px; border:1px solid #4a3a1c; background:#1c1710;
          border-radius:8px; color:#e2cfa4; font-size:13px; max-width:760px; }
  .lab { font-size:11px; text-transform:uppercase; letter-spacing:1.4px; color:#7e8189; margin:8px 0 3px; }
  a { color:#6fd3a6; }
  @media (max-width:900px){ .wrap{grid-template-columns:1fr} .script{position:static;height:auto;border-left:0;border-top:1px solid #24262d} }
</style>
<header>
  <h1>Кастинг голоса — ${candidates.length} кандидатов</h1>
  <div class="sub">
    Модель <b>${GENERATION.modelId}</b> · stability ${GENERATION.voiceSettings.stability} ·
    similarity ${GENERATION.voiceSettings.similarity_boost} · style ${GENERATION.voiceSettings.style} ·
    ${activeFormat}${activeFormat === GENERATION.outputFormat ? '' : ` (в конфиге ${GENERATION.outputFormat}, требует Creator)`}<br>
    Текст — реальный сценарий ролика «${title}» (<span class="id">${slug}</span>), ${castingText.length} символов.
    Теги не размечены: это этап 3, здесь сравниваем сам голос.
  </div>
  ${blocked ? `<div class="warn">
    <b>Наш скрипт этими голосами пока не озвучен.</b> ElevenLabs не даёт бесплатному тарифу
    обращаться к голосам Voice Library через API (<span class="id">402 paid_plan_required</span>).
    Ниже — официальные превью из библиотеки: тембр и манеру по ним слышно.
    После апгрейда тарифа <span class="id">npm run voice:cast</span> добавит к каждому голосу
    дубль с нашим текстом.
  </div>` : ''}
</header>
<div class="wrap">
  <div class="list">
${candidates
  .map(
    (voice, i) => `    <div class="card">
      <div class="rank">${String(i + 1).padStart(2, '0')}</div>
      <div>
        <div class="name">${voice.name}</div>
        <div class="meta">
          <span class="tag">${voice.gender ?? '—'}</span>
          <span class="tag">${voice.age ?? '—'}</span>
          <span class="tag">${voice.use_case ?? '—'}</span>
          ${voice.cloned_by_count ? `<span class="tag">клонов: ${voice.cloned_by_count.toLocaleString('ru')}</span>` : ''}
          <span class="id">${voice.voice_id}</span>
        </div>
        <div class="desc">${(voice.description ?? '').replace(/</g, '&lt;')}</div>
        <div class="lab">Превью из библиотеки</div>
        <audio controls preload="none" src="${voice.preview_url}"></audio>
        ${voice.hasTake ? `<div class="lab">Наш скрипт</div>
        <audio controls preload="none" src="./${voice.file}"></audio>` : ''}
      </div>
    </div>`,
  )
  .join('\n')}
  </div>
  <div class="script">
    <h2>Что читают</h2>
${lines.map((line) => `    <p>${line.replace(/</g, '&lt;')}</p>`).join('\n')}
  </div>
</div>
`;

/* ------------------------------------------------------------------ main */

const main = async () => {
  const config = readElevenLabsEnv();
  const keys = config.keys?.length ? config.keys : [config.apiKey];
  const {text: castingText, lines, title} = buildCastingText(SCRIPT_SLUG);

  console.log(`кастинг: сценарий «${title}» (${SCRIPT_SLUG})`);
  console.log(`  текст для прослушивания: ${castingText.length} символов\n`);

  const voices = PREMADE ? await fetchPremadeVoices(keys[0]) : await fetchSharedVoices(keys[0]);
  const {eligible, picked} = PREMADE ? shortlistPremade(voices) : shortlist(voices);
  const pool = PREMADE ? 'premade-голосов аккаунта' : 'русских голосов библиотеки';
  console.log(`пул: ${voices.length} ${pool}, подходят под фильтры ${eligible}, в шортлист ${picked.length}\n`);

  mkdirSync(OUT_DIR, {recursive: true});
  const candidates = picked.map((voice) => ({
    voice_id: voice.voice_id,
    name: voice.name,
    description: voice.description ?? '',
    category: voice.category,
    use_case: voice.use_case,
    gender: voice.gender,
    age: voice.age,
    accent: voice.accent,
    cloned_by_count: voice.cloned_by_count ?? 0,
    preview_url: voice.preview_url,
    score: voice.score,
    file: `${safeName(voice)}.mp3`,
  }));

  for (const [i, voice] of candidates.entries()) {
    console.log(`${String(i + 1).padStart(2, '0')}. ${voice.name}`);
    console.log(
      `    ${voice.gender}/${voice.age} · ${voice.use_case}` +
        `${voice.cloned_by_count ? ` · клонов ${voice.cloned_by_count.toLocaleString('ru')}` : ''} · score ${voice.score}`,
    );
  }

  writeFileSync(
    path.join(OUT_DIR, 'candidates.json'),
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        script: {slug: SCRIPT_SLUG, title, lineIds: CASTING_LINE_IDS, text: castingText, chars: castingText.length},
        settings: {modelId: GENERATION.modelId, outputFormat: activeFormat, configuredOutputFormat: GENERATION.outputFormat, ...GENERATION.voiceSettings},
        poolSize: voices.length,
        eligible,
        candidates,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`\n→ ${CASTING.outputDir}/candidates.json`);

  if (has('shortlist')) return;

  const writePage = (blocked) => {
    for (const voice of candidates) voice.hasTake = existsSync(path.join(OUT_DIR, voice.file));
    writeFileSync(
      path.join(OUT_DIR, 'index.html'),
      buildIndexHtml({candidates, castingText, lines, slug: SCRIPT_SLUG, title, blocked}),
    );
  };

  if (has('page')) {
    writePage(true);
    console.log(`\n→ ${CASTING.outputDir}/index.html — страница на официальных превью`);
    return;
  }

  // --- budget ---------------------------------------------------------------
  const probeOnly = has('probe');
  const targets = probeOnly ? candidates.slice(0, 1) : candidates;
  const cost = castingText.length * targets.length;
  const quotas = await Promise.all(keys.map(quotaFor));
  const remaining = quotas.filter(Boolean).reduce((sum, q) => sum + q.remaining, 0);

  console.log(`\nбюджет: ${targets.length} × ${castingText.length} = ${cost} символов, доступно ${remaining}`);
  if (cost > remaining) {
    console.error(`✗ Квоты не хватает (нужно ещё ${cost - remaining}). Ничего не сгенерировано.`);
    process.exit(1);
  }

  // --- generation -----------------------------------------------------------
  const done = [];
  for (const voice of targets) {
    const file = path.join(OUT_DIR, voice.file);
    const hash = createHash('sha256')
      .update([castingText, voice.voice_id, GENERATION.modelId, GENERATION.outputFormat, JSON.stringify(GENERATION.voiceSettings)].join('|'))
      .digest('hex')
      .slice(0, 12);

    if (existsSync(file) && !has('force')) {
      console.log(`  = ${voice.name} — уже есть, пропускаю`);
      done.push(voice);
      continue;
    }

    let saved = false;
    for (const [index, apiKey] of keys.entries()) {
      const result = await synthesise({apiKey, voiceId: voice.voice_id, text: castingText});
      if (result.ok) {
        writeFileSync(file, result.buffer);
        console.log(`  ✓ ${voice.name} → ${voice.file} (${(result.buffer.length / 1024).toFixed(0)} КБ, hash ${hash})`);
        done.push(voice);
        saved = true;
        break;
      }
      const quotaIssue = /quota_exceeded|character limit/i.test(result.detail);
      if (!quotaIssue) {
        console.log(`  ✗ ${voice.name} — HTTP ${result.status}: ${result.detail}`);
        break;
      }
      if (index < keys.length - 1) console.log(`    … ключ #${index + 1} исчерпан, пробую следующий`);
    }
    if (!saved && !done.includes(voice)) voice.failed = true;
  }

  const playable = candidates.filter((voice) => existsSync(path.join(OUT_DIR, voice.file)));
  writePage(playable.length === 0);

  console.log(`\nозвучено ${playable.length} из ${targets.length}`);
  console.log(`→ ${CASTING.outputDir}/index.html — открой в браузере`);
};

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});

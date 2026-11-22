#!/usr/bin/env node
/**
 * Voice pre-render for any ElevenLabs reel.
 *
 *   node scripts/eleven/generate-voice.mjs --slug <name> [--force] [--takes N]
 *
 * Pipeline, in order:
 *   1. numbers are spelled out deterministically (models cannot do this)
 *   2. Audio Tags are proposed by an LLM and cut down by a hard validator
 *   3. the script is chunked by scene, never by sentence
 *   4. every chunk is synthesised N times with neighbour context, cached by hash
 *   5. the chosen takes are high-passed, de-silenced, stitched and normalised
 *   6. per-chunk alignments are stitched into one timeline
 *
 * No network access happens during the Remotion render itself.
 */
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT, readElevenLabsEnv, redact} from './lib/env.mjs';
import {readSlug, loadScript} from './lib/script.mjs';
import {indexAlignment, buildCaptions, summarizeCaptions} from './lib/timings.mjs';
import {probeDurationMs} from './lib/audio.mjs';
import {resolveCues, resolveMood} from './lib/cues.mjs';
import {spellNumbers} from './lib/numerals.mjs';
import {applyTags, markupPrompt, sanitiseTags} from './lib/tags.mjs';
import {buildChunks, chunkCost, joinLines} from './lib/chunks.mjs';
import {buildTrack} from './lib/audio-post.mjs';
import {CHUNKING, GENERATION, VOICE} from '../../config/voice.config.mjs';

const SLUG = readSlug();
const args = process.argv.slice(2);
const force = args.includes('--force');
/**
 * Re-resolves the timeline from the content JSON using the line timings that
 * were already measured, without touching audio or the API.
 *
 * A grammar cue, a chip or a headline is layout, not speech: changing one used
 * to force the whole voice step, which on a cache miss means re-buying the reel.
 */
const layoutOnly = args.includes('--layout-only');
const takesFlag = args.indexOf('--takes');
const TAKES = takesFlag >= 0 && args[takesFlag + 1] ? Number(args[takesFlag + 1]) : CHUNKING.takesPerChunk;

const AVATAR_DIR = path.join(ROOT, 'public', 'assets', 'avatar');
const REQUIRED_AVATARS = [
  'avatar-question.png', 'avatar-excited.png', 'avatar-shocked.png', 'avatar-thinking.png',
  'avatar-skeptical.png', 'avatar-angry.png', 'avatar-sad.png', 'avatar-approved.png',
  'avatar-facepalm.png', 'avatar-idea.png',
];

const PUBLIC_OUT = path.join(ROOT, 'public', 'generated', SLUG);
const TAKES_DIR = path.join(PUBLIC_OUT, 'takes');
const TMP_DIR = path.join(PUBLIC_OUT, '.work');
const SRC_OUT = path.join(ROOT, 'src', 'generated');

const log = (...parts) => console.log(...parts.map((p) => (typeof p === 'string' ? redact(p) : p)));

const assertAvatars = () => {
  const missing = REQUIRED_AVATARS.filter((name) => !existsSync(path.join(AVATAR_DIR, name)));
  if (missing.length > 0) {
    throw new Error(
      `Не найдены PNG аватара в public/assets/avatar:\n  ${missing.join('\n  ')}\n` +
        `Положи файлы и запусти снова (ElevenLabs не вызывался, кредиты не потрачены).`,
    );
  }
};

/* ------------------------------------------------------------------ text prep */

/**
 * Digits are read unpredictably in Russian, so they are spelled out before the
 * request and restored on screen through `displayReplacements`.
 */
const prepareText = (script) => {
  const display = {...(script.captionClusters?.displayReplacements ?? {})};
  const lines = script.lines.map((line) => {
    const {text, replacements} = spellNumbers(line.text);
    for (const [word, original] of Object.entries(replacements)) display[word.toLowerCase()] = original;
    return {...line, text};
  });
  return {lines, display};
};

/**
 * Asks the markup model for tags, then removes everything the brief forbids.
 *
 * The result is cached against a hash of the *source* lines. Markup is a
 * sampled model output: without this, every rerun produces slightly different
 * tags, which changes the chunk text, which changes the chunk hash — and the
 * paid voiceover cache never hits. One layout tweak would re-buy the whole reel.
 */
const markupCacheFile = path.join(PUBLIC_OUT, 'markup.json');

const addTags = async (lines, script) => {
  if (script.tts?.tags === false) return {lines, kept: [], removed: [], model: null};

  const sourceHash = createHash('sha256').update(lines.map((l) => `${l.id}:${l.text}`).join('\n')).digest('hex');
  if (existsSync(markupCacheFile) && !force) {
    try {
      const cached = JSON.parse(readFileSync(markupCacheFile, 'utf8'));
      if (cached.sourceHash === sourceHash) {
        const byId = new Map(cached.lines.map((line) => [line.id, line.text]));
        log('✓ разметка тегов: из кэша (текст не менялся)');
        return {
          lines: lines.map((line) => ({...line, text: byId.get(line.id) ?? line.text})),
          kept: cached.kept ?? [],
          removed: [],
          model: cached.model ?? null,
          cached: true,
        };
      }
    } catch {
      // an unreadable cache just means re-tagging
    }
  }

  let choices = [];
  let model = null;
  try {
    const {complete, parseJson, readOpenRouterEnv} = await import('../conveyor/lib/openrouter.mjs');
    const config = readOpenRouterEnv();
    const response = await complete({
      model: config.structure,
      fallbacks: [process.env.OPENROUTER_MODEL_STRUCTURE_FALLBACK].filter(Boolean),
      system: 'Возвращай только валидный JSON.',
      user: markupPrompt(lines),
      json: true,
      maxTokens: 2500,
      temperature: 0.3,
    });
    choices = parseJson(response.text).lines ?? [];
    model = response.model;
  } catch (error) {
    // Markup is an enhancement: a reel without tags is still a correct reel.
    log(`… разметка тегов пропущена: ${error.message.slice(0, 120)}`);
    return {lines, kept: [], removed: [], model: null};
  }

  const tagged = applyTags(lines, choices);
  // Density and the whispers rule are per-script, so the whole script is
  // validated as one string and then split back into lines.
  const hookChars = tagged.slice(0, 3).reduce((sum, line) => sum + line.text.length + 1, 0);
  const {text, kept, removed} = sanitiseTags(tagged.map((line) => line.text).join('\n'), {hookChars});
  const rebuilt = text.split('\n');

  const finalLines = tagged.map((line, i) => ({...line, text: (rebuilt[i] ?? line.text).trim()}));
  mkdirSync(PUBLIC_OUT, {recursive: true});
  writeFileSync(
    markupCacheFile,
    JSON.stringify({sourceHash, model, kept, lines: finalLines.map(({id, text}) => ({id, text}))}, null, 2),
  );

  return {lines: finalLines, kept, removed, model};
};

/* ------------------------------------------------------------------ synthesis */

const requestChunk = async ({apiKey, voiceId, modelId, outputFormat}, chunk) => {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps` +
    `?output_format=${encodeURIComponent(outputFormat)}`;

  const body = {text: chunk.text, model_id: modelId, voice_settings: GENERATION.voiceSettings};
  // Context keeps intonation continuous across a seam and is not billed — but
  // v3 rejects the parameters outright, so it is sent only where supported.
  if (GENERATION.supportsNeighbourContext.includes(modelId)) {
    if (chunk.previousText) body.previous_text = chunk.previousText;
    if (chunk.nextText) body.next_text = chunk.nextText;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {'xi-api-key': apiKey, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    if (/output_format_not_allowed/.test(detail) && outputFormat !== GENERATION.fallbackOutputFormat) {
      log(`… формат ${outputFormat} недоступен тарифу → ${GENERATION.fallbackOutputFormat}`);
      return requestChunk({apiKey, voiceId, modelId, outputFormat: GENERATION.fallbackOutputFormat}, chunk);
    }
    return {
      ok: false,
      quotaExhausted: /quota_exceeded|character limit/i.test(detail),
      error: `ElevenLabs ${response.status}: ${redact(detail).slice(0, 300)}`,
    };
  }
  return {ok: true, payload: await response.json()};
};

/** Tries every configured key; a key out of characters is skipped, not fatal. */
const synthesise = async (config, chunk) => {
  const keys = config.keys?.length ? config.keys : [config.apiKey];
  const problems = [];
  for (const [index, apiKey] of keys.entries()) {
    const result = await requestChunk({...config, apiKey}, chunk);
    if (result.ok) return result.payload;
    problems.push(`ключ #${index + 1}: ${result.error}`);
    if (!result.quotaExhausted) break;
    log(`… ключ #${index + 1}: квота исчерпана, пробую следующий`);
  }
  throw new Error(problems.join('\n'));
};

/* ------------------------------------------------------------------ alignment */

/**
 * Shifts a chunk's character times onto the finished track.
 *
 * A chunk's alignment is relative to its own audio *before* trimming, so the
 * silence removed from its head comes off every timestamp and the chunk's
 * position in the stitched track is added. Getting this wrong desynchronises
 * every caption in the reel, which is why it is one expression in one place.
 */
const shiftAlignment = (timedChars, {startMs, trimmedLeadingMs}) =>
  timedChars.map((entry) => ({
    ...entry,
    startMs: entry.startMs - trimmedLeadingMs + startMs,
    endMs: entry.endMs - trimmedLeadingMs + startMs,
  }));

/* ------------------------------------------------------------------ timeline */

const resolveTimes = (script, lineTimings) => {
  const byId = new Map(lineTimings.map((line) => [line.id, line]));
  const startOf = (id) => byId.get(id)?.startMs ?? null;
  const endOf = (id) => byId.get(id)?.endMs ?? null;

  return {
    chapters: (script.chapters ?? []).map((chapter) => ({
      ...chapter,
      grammar: chapter.grammar ? resolveCues(chapter.grammar, startOf) : null,
      startMs: startOf(chapter.fromLine),
      endMs: endOf(chapter.toLine),
    })),
    avatarStates: (script.avatarStates ?? []).map((state) => ({...state, atMs: startOf(state.at)})),
    actions: (script.canvasActions ?? []).map((action) => ({
      ...action,
      atMs: (startOf(action.at) ?? 0) + (action.offsetMs ?? 0),
      untilMs: action.untilLine ? startOf(action.untilLine) : null,
    })),
    memoryFrame: script.memoryFrame
      ? {
          ...script.memoryFrame,
          startMs: startOf(script.memoryFrame.fromLine),
          endMs: Math.min(
            startOf(script.memoryFrame.untilLine) ?? Infinity,
            (startOf(script.memoryFrame.fromLine) ?? 0) + (script.memoryFrame.maxHoldMs ?? 4000),
          ),
        }
      : null,
    cta: script.cta ? {...resolveCues(script.cta, startOf), startMs: startOf(script.cta.fromLine)} : null,
    chips: script.chips ? resolveCues(script.chips, startOf) : null,
    mood: resolveMood(script.mood, startOf),
  };
};

/* ------------------------------------------------------------------ main */

/** Rewrites `timeline-<slug>.json` from the content JSON. No network, no audio. */
const relayout = () => {
  const script = loadScript(SLUG);
  const file = path.join(SRC_OUT, `timeline-${SLUG}.json`);
  if (!existsSync(file)) throw new Error(`нет ${path.relative(ROOT, file)} — сначала обычный прогон озвучки`);

  const timeline = JSON.parse(readFileSync(file, 'utf8'));
  if (timeline.placeholder) throw new Error('таймлайн — заглушка, измеренных таймингов ещё нет');
  if (!Array.isArray(timeline.lines) || timeline.lines.length === 0) throw new Error('в таймлайне нет реплик');

  const known = new Set(timeline.lines.map((line) => line.id));
  const missing = script.lines.filter((line) => !known.has(line.id)).map((line) => line.id);
  if (missing.length > 0) {
    throw new Error(
      `в сценарии появились новые реплики (${missing.join(', ')}) — это меняет речь, нужен обычный прогон`,
    );
  }

  const updated = {...timeline, ...resolveTimes(script, timeline.lines)};
  writeFileSync(file, JSON.stringify(updated, null, 2));
  log(`✓ раскладка пересобрана без обращения к API`);
  log(`  глав ${updated.chapters.length}, чипов ${(updated.chips ?? []).length}, длительность без изменений`);
  log(`  → src/generated/timeline-${SLUG}.json`);
};

const main = async () => {
  if (layoutOnly) return relayout();

  const script = loadScript(SLUG);
  assertAvatars();
  log(`✓ аватары: ${REQUIRED_AVATARS.length}/10 на месте`);

  let background = null;
  if (script.background?.type === 'loop-video') {
    const file = path.join(ROOT, 'public', script.background.file);
    if (!existsSync(file)) throw new Error(`Не найден фоновый ролик public/${script.background.file}.`);
    const bgMs = probeDurationMs(file);
    if (!bgMs) throw new Error('Не удалось определить длительность фонового ролика.');
    background = {...script.background, sourceSeconds: Number((bgMs / 1000).toFixed(3))};
    log(`✓ фон: public/${script.background.file} — ${(bgMs / 1000).toFixed(2)} s`);
  }

  const config = readElevenLabsEnv();

  // 1. numbers ---------------------------------------------------------------
  const {lines: spelled, display} = prepareText(script);
  const spelledCount = spelled.filter((line, i) => line.text !== script.lines[i].text).length;
  if (spelledCount > 0) log(`✓ числа прописью: ${spelledCount} реплик`);

  // 2. tags ------------------------------------------------------------------
  const tagged = await addTags(spelled, script);
  if (tagged.model) {
    log(`✓ теги: оставлено ${tagged.kept.length}, вырезано ${tagged.removed.length} (${tagged.model})`);
    for (const item of tagged.removed.slice(0, 5)) log(`    − ${item.tag} — ${item.reason}`);
  }

  // 3. chunks ----------------------------------------------------------------
  const chunks = buildChunks({...script, lines: tagged.lines});
  if (chunks.length === 0) throw new Error('в сценарии нет реплик');
  log(
    `✓ чанков: ${chunks.length} по сценам (${chunks.map((c) => c.text.length).join(' + ')} симв), ` +
      `дублей ${TAKES} → до ${chunkCost(chunks, TAKES)} символов`,
  );

  mkdirSync(TAKES_DIR, {recursive: true});
  mkdirSync(TMP_DIR, {recursive: true});
  mkdirSync(SRC_OUT, {recursive: true});

  const paramsHash = createHash('sha256')
    .update([config.voiceId, config.modelId, config.outputFormat, JSON.stringify(GENERATION.voiceSettings)].join('|'))
    .digest('hex')
    .slice(0, 16);

  // 4. synthesis, cached per chunk -------------------------------------------
  const takes = [];
  const alignments = [];
  let billed = 0;

  for (const chunk of chunks) {
    const chunkHash = createHash('sha256').update(`${chunk.text}|${paramsHash}`).digest('hex').slice(0, 16);
    const chosen = [];

    for (let take = 1; take <= TAKES; take += 1) {
      const audioFile = path.join(TAKES_DIR, `chunk-${chunk.index}-take-${take}-${chunkHash}.mp3`);
      const metaFile = `${audioFile}.json`;

      if (existsSync(audioFile) && existsSync(metaFile) && !force) {
        chosen.push({file: audioFile, alignment: JSON.parse(readFileSync(metaFile, 'utf8')).alignment});
        continue;
      }
      const payload = await synthesise(config, chunk);
      if (!payload.audio_base64) throw new Error('ElevenLabs вернул ответ без audio_base64.');
      if (!payload.alignment?.characters) throw new Error('ElevenLabs вернул ответ без alignment.');

      writeFileSync(audioFile, Buffer.from(payload.audio_base64, 'base64'));
      writeFileSync(metaFile, JSON.stringify({alignment: payload.alignment, chunk: chunk.index, take}, null, 2));
      billed += chunk.text.length;
      chosen.push({file: audioFile, alignment: payload.alignment});
    }

    // Take selection is its own step. The first take is used and the rest stay
    // on disk with their durations in the manifest, so they can be compared.
    takes.push({
      index: chunk.index,
      chapterIds: chunk.chapterIds,
      file: chosen[0].file,
      alternatives: chosen.slice(1).map((t) => path.relative(ROOT, t.file)),
    });
    alignments.push(chosen[0].alignment);
  }
  log(`✓ озвучка: ${billed > 0 ? `${billed} символов списано` : 'всё из кэша, кредиты не тронуты'}`);

  // 5. post-processing --------------------------------------------------------
  const outputWav = path.join(PUBLIC_OUT, 'voiceover.wav');
  const track = buildTrack(takes, {outputWav, tmpDir: TMP_DIR});
  log(
    `✓ мастеринг: ${(track.durationMs / 1000).toFixed(2)} s · ${track.targetLufs} LUFS ` +
      `(вход ${track.measuredInputLufs ?? '?'}) · пик ${track.outputPeakDb} dBFS · ` +
      `HPF ${track.highPassHz} Гц · гап ${track.gapMs} мс`,
  );

  // 6. alignment stitching ----------------------------------------------------
  const allChars = [];
  const allRanges = [];
  let charOffset = 0;

  chunks.forEach((chunk, i) => {
    const timed = indexAlignment(alignments[i], chunk.text);
    for (const entry of shiftAlignment(timed, track.chunks[i])) {
      allChars.push({...entry, textIndex: entry.textIndex + charOffset});
    }
    for (const range of chunk.ranges) {
      allRanges.push({...range, charStart: range.charStart + charOffset, charEnd: range.charEnd + charOffset});
    }
    charOffset += chunk.text.length + 2; // the chunks are conceptually joined by "\n\n"
  });

  const clusterConfig = {...script.captionClusters, displayReplacements: display};
  const {captions, lineTimings} = buildCaptions(allRanges, allChars, clusterConfig);
  const summary = summarizeCaptions(captions, script.captionClusters.targetSeconds);

  const finalHoldMs = script.finalHoldMs ?? 1500;
  const totalDurationMs = track.durationMs + finalHoldMs;
  const fps = script.fps ?? 30;

  const timeline = {
    id: SLUG,
    compositionId: script.compositionId,
    visualEngine: script.visualEngine,
    captionMode: script.captionMode,
    fps,
    width: script.width,
    height: script.height,
    ttsProvider: 'elevenlabs',
    modelId: config.modelId,
    outputFormat: config.outputFormat,
    voice: VOICE.name,
    audioSrc: `generated/${SLUG}/voiceover.wav`,
    voiceDurationMs: track.durationMs,
    finalHoldMs,
    totalDurationMs,
    durationInFrames: Math.round((totalDurationMs / 1000) * fps),
    source: script.source,
    background,
    audio: {
      targetLufs: track.targetLufs,
      measuredInputLufs: track.measuredInputLufs,
      peakDb: track.outputPeakDb,
      highPassHz: track.highPassHz,
      gapMs: track.gapMs,
      sampleRate: track.sampleRate,
      takesPerChunk: TAKES,
      neighbourContext: GENERATION.supportsNeighbourContext.includes(config.modelId),
      chunks: track.chunks.map((chunk, i) => ({...chunk, alternatives: takes[i].alternatives})),
    },
    tags: {kept: tagged.kept, removed: tagged.removed.length},
    lines: lineTimings,
    ...resolveTimes(script, lineTimings),
    captionSummary: summary,
  };

  writeFileSync(path.join(SRC_OUT, `timeline-${SLUG}.json`), JSON.stringify(timeline, null, 2));
  writeFileSync(path.join(SRC_OUT, `captions-${SLUG}.json`), JSON.stringify(captions, null, 2));
  writeFileSync(path.join(PUBLIC_OUT, 'captions.json'), JSON.stringify(captions, null, 2));
  writeFileSync(
    path.join(PUBLIC_OUT, 'voiceover-manifest.json'),
    JSON.stringify(
      {slug: SLUG, generatedAt: new Date().toISOString(), spokenText: chunks.map((c) => c.text), ...timeline.audio},
      null,
      2,
    ),
  );

  rmSync(TMP_DIR, {recursive: true, force: true});

  log('');
  log(`  озвучка      ${(track.durationMs / 1000).toFixed(2)} s`);
  log(`  видео        ${(totalDurationMs / 1000).toFixed(2)} s (${timeline.durationInFrames} кадров @ ${fps}fps)`);
  log(`  кластеров    ${summary.count}, средняя смена ${summary.averageSeconds.toFixed(2)} s`);
  log(`  1–3 слова    ${summary.withinWordLimit}/${summary.count}`);
  log('');
  log(`  → src/generated/timeline-${SLUG}.json`);
  log(`  → public/generated/${SLUG}/{voiceover.wav, voiceover-manifest.json, captions.json, takes/}`);
};

main().catch((error) => {
  console.error(`\n✗ ${redact(error.message)}`);
  process.exit(1);
});

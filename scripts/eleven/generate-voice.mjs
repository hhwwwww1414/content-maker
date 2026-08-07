#!/usr/bin/env node
/**
 * Pre-render step for any ElevenLabs-voiced reel in this repo.
 *
 * 1. validates env + avatar assets
 * 2. calls ElevenLabs `/with-timestamps` (cached by content hash)
 * 3. projects character alignment back onto the script lines
 * 4. emits word timings, kinetic caption clusters and the render timeline
 *
 * No network access happens during the Remotion render itself.
 *
 * Usage: node scripts/eleven/generate-voice.mjs [--slug <name>] [--force]
 */
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT, readElevenLabsEnv, redact} from './lib/env.mjs';
import {readSlug, loadScript, buildTtsText} from './lib/script.mjs';
import {indexAlignment, buildCaptions, summarizeCaptions} from './lib/timings.mjs';
import {probeDurationMs} from './lib/audio.mjs';

const SLUG = readSlug();

const AVATAR_DIR = path.join(ROOT, 'public', 'assets', 'avatar');
const REQUIRED_AVATARS = [
  'avatar-question.png',
  'avatar-excited.png',
  'avatar-shocked.png',
  'avatar-thinking.png',
  'avatar-skeptical.png',
  'avatar-angry.png',
  'avatar-sad.png',
  'avatar-approved.png',
  'avatar-facepalm.png',
  'avatar-idea.png',
];

const PUBLIC_OUT = path.join(ROOT, 'public', 'generated', SLUG);
const SRC_OUT = path.join(ROOT, 'src', 'generated');
const TIMELINE_FILE = path.join(SRC_OUT, `timeline-${SLUG}.json`);
const CAPTIONS_FILE = path.join(SRC_OUT, `captions-${SLUG}.json`);

const log = (...args) => console.log(...args.map((a) => (typeof a === 'string' ? redact(a) : a)));

const assertAvatars = () => {
  const missing = REQUIRED_AVATARS.filter((name) => !existsSync(path.join(AVATAR_DIR, name)));
  if (missing.length > 0) {
    throw new Error(
      `Не найдены PNG аватара в public/assets/avatar:\n  ${missing.join('\n  ')}\n` +
        `Положи файлы и запусти снова (ElevenLabs не вызывался, кредиты не потрачены).`,
    );
  }
  log(`✓ аватары: ${REQUIRED_AVATARS.length}/10 на месте`);
};

const requestSpeech = async ({apiKey, voiceId, modelId, outputFormat}, text, speed) => {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps` +
    `?output_format=${encodeURIComponent(outputFormat)}`;

  // Only `speed` is overridden — everything else falls back to the voice's saved
  // settings. No `language_code`: eleven_multilingual_v2 rejects the parameter.
  const body = {text, model_id: modelId};
  if (speed && speed !== 1) body.voice_settings = {speed};

  const response = await fetch(url, {
    method: 'POST',
    headers: {'xi-api-key': apiKey, 'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `ElevenLabs ${response.status} ${response.statusText}: ${redact(detail).slice(0, 600)}`,
    );
  }
  return response.json();
};

const resolveTimes = (script, lineTimings) => {
  const byId = new Map(lineTimings.map((line) => [line.id, line]));
  const startOf = (id) => byId.get(id)?.startMs ?? null;
  const endOf = (id) => byId.get(id)?.endMs ?? null;

  const chapters = script.chapters.map((chapter) => ({
    ...chapter,
    startMs: startOf(chapter.fromLine),
    endMs: endOf(chapter.toLine),
  }));

  const avatarStates = script.avatarStates.map((state) => ({
    ...state,
    atMs: startOf(state.at),
  }));

  const actions = script.canvasActions.map((action) => ({
    ...action,
    atMs: (startOf(action.at) ?? 0) + (action.offsetMs ?? 0),
    untilMs: action.untilLine ? startOf(action.untilLine) : null,
  }));

  const memoryFrame = {
    ...script.memoryFrame,
    startMs: startOf(script.memoryFrame.fromLine),
    // capped so the cheat-sheet is a held beat, not a dead stretch of canvas
    endMs: Math.min(
      startOf(script.memoryFrame.untilLine) ?? Infinity,
      (startOf(script.memoryFrame.fromLine) ?? 0) + (script.memoryFrame.maxHoldMs ?? 4000),
    ),
  };

  const cta = {...script.cta, startMs: startOf(script.cta.fromLine)};

  return {chapters, avatarStates, actions, memoryFrame, cta};
};

const main = async () => {
  const force = process.argv.includes('--force');
  const script = loadScript(SLUG);

  assertAvatars();
  let background = null;
  if (script.background?.type === 'loop-video') {
    const file = path.join(ROOT, 'public', script.background.file);
    if (!existsSync(file)) {
      throw new Error(
        `Не найден фоновый ролик public/${script.background.file}.
` +
          `Ожидаемые пути: public/assets/background.mp4, public/background.mp4, public/assets/background/background.mp4`,
      );
    }
    const bgMs = probeDurationMs(file);
    if (!bgMs) throw new Error('Не удалось определить длительность фонового ролика через ffprobe.');
    background = {...script.background, sourceSeconds: Number((bgMs / 1000).toFixed(3))};
    log(`✓ фон: public/${script.background.file} — ${(bgMs / 1000).toFixed(2)} s`);
  }


  const config = readElevenLabsEnv();
  const {text, ranges} = buildTtsText(script);
  const speed = script.tts?.speed ?? 1;
  const hash = createHash('sha256')
    .update([text, config.voiceId, config.modelId, config.outputFormat, String(speed)].join('|'))
    .digest('hex');

  mkdirSync(PUBLIC_OUT, {recursive: true});
  mkdirSync(SRC_OUT, {recursive: true});

  const audioFile = path.join(PUBLIC_OUT, 'voiceover.mp3');
  const alignmentFile = path.join(PUBLIC_OUT, 'alignment.json');
  const metaFile = path.join(PUBLIC_OUT, 'voiceover-meta.json');

  const cached =
    !force &&
    existsSync(audioFile) &&
    existsSync(alignmentFile) &&
    existsSync(metaFile) &&
    JSON.parse(readFileSync(metaFile, 'utf8')).hash === hash;

  let alignment;
  if (cached) {
    log(`✓ кэш совпал (hash ${hash.slice(0, 12)}…) — ElevenLabs не вызывался`);
    alignment = JSON.parse(readFileSync(alignmentFile, 'utf8'));
  } else {
    log(
      `→ ElevenLabs: model=${config.modelId} format=${config.outputFormat} ` +
        `speed=${speed} chars=${text.length} (${force ? '--force' : 'нет кэша'})`,
    );
    const payload = await requestSpeech(config, text, speed);
    if (!payload.audio_base64) throw new Error('ElevenLabs вернул ответ без audio_base64.');
    if (!payload.alignment?.characters) {
      throw new Error('ElevenLabs вернул ответ без character alignment — таймкоды построить нельзя.');
    }
    writeFileSync(audioFile, Buffer.from(payload.audio_base64, 'base64'));
    alignment = payload.alignment;
    writeFileSync(alignmentFile, JSON.stringify(alignment, null, 2));
    writeFileSync(
      metaFile,
      JSON.stringify(
        {
          hash,
          slug: SLUG,
          modelId: config.modelId,
          outputFormat: config.outputFormat,
          speed,
          voiceIdFingerprint: createHash('sha256').update(config.voiceId).digest('hex').slice(0, 12),
          characterCount: text.length,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    log(`✓ аудио сохранено: public/generated/${SLUG}/voiceover.mp3`);
  }

  const timedChars = indexAlignment(alignment, text);
  const exact = alignment.characters.join('') === text;
  log(`✓ alignment: ${timedChars.length} символов${exact ? '' : ' (пересобран по тексту)'}`);

  const {captions, lineTimings} = buildCaptions(ranges, timedChars, script.captionClusters);
  const summary = summarizeCaptions(captions, script.captionClusters.targetSeconds);

  const wordTimings = ranges.map((range) => {
    const line = lineTimings.find((entry) => entry.id === range.id);
    return {
      id: range.id,
      chapter: range.chapter,
      text: range.text,
      startMs: line?.startMs ?? null,
      endMs: line?.endMs ?? null,
      words: captions
        .filter((caption) => caption.lineId === range.id)
        .flatMap((caption) => caption.tokens.map((t) => ({text: t.text, fromMs: t.fromMs, toMs: t.toMs}))),
    };
  });

  const probed = probeDurationMs(audioFile);
  const alignmentEndMs = Math.round(
    alignment.character_end_times_seconds[alignment.character_end_times_seconds.length - 1] * 1000,
  );
  const voiceDurationMs = probed ?? alignmentEndMs + 200;
  const finalHoldMs = script.finalHoldMs ?? 1500;
  const totalDurationMs = voiceDurationMs + finalHoldMs;
  const fps = script.fps ?? 30;

  const resolved = resolveTimes(script, lineTimings);

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
    audioSrc: script.voiceoverFile,
    voiceDurationMs,
    alignmentEndMs,
    finalHoldMs,
    totalDurationMs,
    durationInFrames: Math.round((totalDurationMs / 1000) * fps),
    source: script.source,
    // Background clips are measured here so the composition never probes at render time.
    background: background,
    lines: lineTimings,
    chapters: resolved.chapters,
    avatarStates: resolved.avatarStates,
    actions: resolved.actions,
    memoryFrame: resolved.memoryFrame,
    cta: resolved.cta,
    captionSummary: summary,
  };

  writeFileSync(TIMELINE_FILE, JSON.stringify(timeline, null, 2));
  writeFileSync(CAPTIONS_FILE, JSON.stringify(captions, null, 2));
  writeFileSync(path.join(PUBLIC_OUT, 'captions.json'), JSON.stringify(captions, null, 2));
  writeFileSync(path.join(PUBLIC_OUT, 'word-timings.json'), JSON.stringify(wordTimings, null, 2));

  log('');
  log(`  озвучка      ${(voiceDurationMs / 1000).toFixed(2)} s`);
  log(`  видео        ${(totalDurationMs / 1000).toFixed(2)} s (${timeline.durationInFrames} кадров @ ${fps}fps)`);
  log(`  кластеров    ${summary.count}, средняя смена ${summary.averageSeconds.toFixed(2)} s`);
  log(`  1–3 слова    ${summary.withinWordLimit}/${summary.count} (максимум ${summary.maxWords})`);
  log(`  вне окна     ${summary.outsideTarget.length}`);
  log('');
  log(`  → src/generated/timeline-${SLUG}.json`);
  log(`  → src/generated/captions-${SLUG}.json`);
  log(`  → public/generated/${SLUG}/{voiceover.mp3, alignment.json, word-timings.json, captions.json}`);
};

main().catch((error) => {
  console.error(`\n✗ ${redact(error.message)}`);
  process.exit(1);
});

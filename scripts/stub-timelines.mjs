#!/usr/bin/env node
/**
 * Placeholder timelines for a fresh clone.
 *
 * `src/generated/` is gitignored, but `src/Root.tsx` imports every timeline and
 * caption file statically — so right after `git clone` the webpack bundle fails
 * on the first missing JSON and *nothing* can be rendered or type-checked, not
 * even a reel whose own voiceover was generated.
 *
 * This script writes a structurally valid placeholder for every generated file
 * that does not exist yet, with timings estimated from the script text instead
 * of measured from audio. Placeholders carry `"placeholder": true` and are never
 * written over real output — running the reel's own `voice:generate` /
 * `reel:<name>:voice` step replaces them with measured timings.
 *
 * Usage: node scripts/stub-timelines.mjs [--force] [--quiet]
 */
import {existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveCues, resolveMood} from './eleven/lib/cues.mjs';
import {buildCaptions, summarizeCaptions} from './eleven/lib/timings.mjs';
import {joinLines} from './eleven/lib/chunks.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const GENERATED = path.join(SRC, 'generated');
const CONTENT = path.join(ROOT, 'content');

const force = process.argv.includes('--force');
const quiet = process.argv.includes('--quiet');
const log = (...args) => {
  if (!quiet) console.log(...args);
};

/**
 * Russian TTS speed. `eleven_v3` measures at 13.5 characters per second and
 * ignores the `speed` setting, so a placeholder built at this rate lands within
 * a second or two of the real thing — close enough to judge pacing.
 */
const CHARS_PER_SECOND = 13.5;
const estimateMs = (text) => Math.max(320, Math.round((text.length / CHARS_PER_SECOND) * 1000));

/** Every `../generated/<file>.json` imported anywhere under src/. */
const collectImports = () => {
  const files = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'generated') walk(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const source = readFileSync(full, 'utf8');
      for (const match of source.matchAll(/generated\/([A-Za-z0-9._-]+\.json)/g)) {
        files.add(match[1]);
      }
    }
  };
  walk(SRC);
  return [...files].sort();
};

/** `timeline-foo.json` -> `content/foo-reel.json`; `timeline.json` -> `content/reel.json`. */
const contentFileFor = (generatedFile) => {
  const slug = generatedFile.replace(/^(timeline|captions)-?/, '').replace(/\.json$/, '');
  const name = slug ? `${slug}-reel.json` : 'reel.json';
  const file = path.join(CONTENT, name);
  return existsSync(file) ? file : null;
};

/**
 * Silero-era reels: the composition reads `segments` (and the scene-frame
 * helpers throw at import time when an id is missing), so ids must be real.
 */
const stubSileroTimeline = (script) => {
  const fps = script.fps ?? 30;
  let cursor = 0;
  const segments = (script.voiceoverSegments ?? []).map((segment) => {
    const durationMs = estimateMs(segment.text ?? segment.id ?? '');
    const pauseAfterMs = segment.pauseAfterMs ?? 0;
    const entry = {
      id: segment.id,
      text: segment.text ?? '',
      startMs: cursor,
      durationMs,
      endMs: cursor + durationMs,
      pauseAfterMs,
    };
    cursor += durationMs + pauseAfterMs;
    return entry;
  });

  const finalHoldMs = script.finalHoldMs ?? 1500;
  const totalDurationMs = cursor + finalHoldMs;
  return {
    placeholder: true,
    id: script.id,
    fps,
    width: script.width ?? 1080,
    height: script.height ?? 1920,
    finalHoldMs,
    voiceDurationMs: cursor,
    totalDurationMs,
    durationInFrames: Math.max(1, Math.round((totalDurationMs / 1000) * fps)),
    audioSrc: script.voiceoverFile ?? 'generated/voiceover.wav',
    segments,
  };
};

/**
 * Word timings invented from the estimated line durations.
 *
 * Captions are built from character-level alignment, which only exists after a
 * paid synthesis. Distributing each line's estimated duration across its
 * characters produces an alignment of the right shape, so the real clusterer
 * runs unchanged and a placeholder reel has subtitles instead of a blank strip.
 * The rhythm is an estimate; the layout and the cluster logic are real.
 */
const syntheticCaptions = (lines, script) => {
  const {ranges} = joinLines(lines);
  const timedChars = [];

  ranges.forEach((range, i) => {
    const line = lines[i];
    const span = Math.max(1, line.endMs - line.startMs);
    const length = Math.max(1, range.charEnd - range.charStart);
    for (let offset = 0; offset < length; offset += 1) {
      const from = line.startMs + (offset / length) * span;
      timedChars.push({
        char: range.text[offset] ?? ' ',
        textIndex: range.charStart + offset,
        startMs: from,
        endMs: from + span / length,
      });
    }
  });

  const config = script.captionClusters ?? {targetSeconds: [0.55, 0.85], maxWords: 3, functionWords: []};
  const {captions} = buildCaptions(ranges, timedChars, config);
  return {captions, summary: summarizeCaptions(captions, config.targetSeconds ?? [0.55, 0.85])};
};

/** ElevenLabs reels: same shape `scripts/eleven/generate-voice.mjs` emits. */
const stubElevenTimeline = (script) => {
  const fps = script.fps ?? 30;
  let cursor = 0;
  const lines = (script.lines ?? []).map((line) => {
    const durationMs = estimateMs(line.text ?? '');
    const entry = {...line, startMs: cursor, endMs: cursor + durationMs};
    cursor += durationMs + (line.breakAfter === 'block' ? 420 : line.breakAfter === 'line' ? 140 : 60);
    return entry;
  });

  const startOf = (id) => lines.find((line) => line.id === id)?.startMs ?? null;
  const endOf = (id) => lines.find((line) => line.id === id)?.endMs ?? null;

  const finalHoldMs = script.finalHoldMs ?? 1500;
  const totalDurationMs = cursor + finalHoldMs;

  return {
    placeholder: true,
    id: script.id,
    compositionId: script.compositionId,
    visualEngine: script.visualEngine,
    captionMode: script.captionMode,
    fps,
    width: script.width ?? 1080,
    height: script.height ?? 1920,
    ttsProvider: 'elevenlabs',
    // The path stays a string so the legacy compositions still type-check; the
    // engine skips the audio tag on `placeholder` instead.
    audioSrc: script.voiceoverFile,
    voiceDurationMs: cursor,
    finalHoldMs,
    totalDurationMs,
    durationInFrames: Math.max(1, Math.round((totalDurationMs / 1000) * fps)),
    source: script.source ?? {},
    // A placeholder never measures the clip, so the loop length falls back to
    // the composition's own default rather than claiming a wrong duration.
    background: script.background ? {...script.background, sourceSeconds: null} : null,
    lines,
    chapters: (script.chapters ?? []).map((chapter) => ({
      ...chapter,
      grammar: chapter.grammar ? resolveCues(chapter.grammar, startOf) : null,
      startMs: startOf(chapter.fromLine),
      endMs: endOf(chapter.toLine),
    })),
    chips: script.chips ? resolveCues(script.chips, startOf) : null,
    mood: resolveMood(script.mood, startOf),
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
    captionSummary: null,
  };
};

const main = () => {
  mkdirSync(GENERATED, {recursive: true});

  const wanted = collectImports();
  const written = [];
  const kept = [];
  const skipped = [];

  for (const file of wanted) {
    const target = path.join(GENERATED, file);
    if (existsSync(target)) {
      // `--force` refreshes placeholders, never measured output: a real timeline
      // costs API credits to rebuild and must not be clobbered by a stub.
      let isPlaceholder = false;
      try {
        const parsed = JSON.parse(readFileSync(target, 'utf8'));
        if (Array.isArray(parsed)) {
          // A captions file is a bare array with nowhere to carry a flag, so it
          // inherits the state of the timeline it belongs to.
          const sibling = path.join(GENERATED, file.replace(/^captions/, 'timeline'));
          isPlaceholder = existsSync(sibling)
            ? JSON.parse(readFileSync(sibling, 'utf8'))?.placeholder === true
            : true;
        } else {
          isPlaceholder = parsed?.placeholder === true;
        }
      } catch {
        isPlaceholder = true; // unreadable file is safe to replace
      }
      if (!force || !isPlaceholder) {
        kept.push(file);
        continue;
      }
    }

    const contentFile = contentFileFor(file);
    if (!contentFile) {
      // A captions file with no script behind it still has to exist to build.
      if (file.startsWith('captions')) {
        writeFileSync(target, '[]\n');
        written.push(file);
      } else {
        skipped.push(file);
      }
      continue;
    }

    const script = JSON.parse(readFileSync(contentFile, 'utf8'));

    if (file.startsWith('captions')) {
      const captions = script.lines ? syntheticCaptions(stubElevenTimeline(script).lines, script).captions : [];
      writeFileSync(target, `${JSON.stringify(captions, null, 2)}\n`);
      written.push(file);
      continue;
    }

    const timeline = script.voiceoverSegments ? stubSileroTimeline(script) : stubElevenTimeline(script);
    if (!script.voiceoverSegments && script.lines) {
      timeline.captionSummary = syntheticCaptions(timeline.lines, script).summary;
    }
    writeFileSync(target, `${JSON.stringify(timeline, null, 2)}\n`);
    written.push(file);
  }

  log(`заглушки: ${written.length} создано, ${kept.length} уже на месте`);
  if (skipped.length > 0) {
    log(`⚠ нет сценария в content/ для: ${skipped.join(', ')}`);
  }
  if (written.length > 0) {
    log('Это оценочные тайминги. Реальные появятся после voice:generate / reel:<name>:voice.');
  }
};

main();

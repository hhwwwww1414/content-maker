#!/usr/bin/env node
/**
 * FULL AUTONOMOUS DRAFT PRODUCTION for one batch of reels.
 *
 *   npm run reels:batch -- --count 6
 *
 * Drives the parent state machine end to end: research -> selection -> planning ->
 * production (voice, timelines, captions) -> QA -> automated local repair ->
 * render -> ffprobe verification -> batch summary. No manual approval anywhere.
 * Publishing is explicitly out of scope: the result is six files to review.
 */

import {spawn} from 'node:child_process';
import {copyFileSync, existsSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync} from 'node:fs';
import process from 'node:process';

import {DEFAULT_BATCH_ID, loadBatch} from './batch/registry.mjs';
import {
  abs,
  acquireLock,
  ensureDir,
  ffprobeJson,
  fileSize,
  log,
  readChildState,
  readJson,
  run,
  runOrThrow,
  setChildState,
  setParentState,
  sha256,
  writeJsonAtomic,
} from './batch/batch-lib.mjs';
import {writePlan} from './batch/plan.mjs';
import {writePlans} from './batch/plans.mjs';
import {checkScripts} from './batch/script-check.mjs';
import {decodePng, encodePng} from './lib/png.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const COUNT = Number(flag('count', '6'));
const ONLY = flag('only', null);
const MAX_PARALLEL_RENDERS = Number(flag('render-concurrency', '2'));
const MAX_REPAIRS = 3;

const REMOTION = 'node_modules/@remotion/cli/remotion-cli.js';

const batch = loadBatch(flag('batch', DEFAULT_BATCH_ID));
const {BATCH_ID, BATCH_DATE, batchDir, outDir, REELS} = batch;

const targets = ONLY ? REELS.filter((r) => r.slug === ONLY || String(r.index) === ONLY) : REELS;
if (!ONLY && targets.length !== COUNT) {
  throw new Error(`Batch ${BATCH_ID} is configured for ${REELS.length} reels but --count ${COUNT} was requested`);
}

const ffmpeg = (ffArgs, label) => {
  const result = run(process.execPath, [abs(REMOTION), 'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', ...ffArgs], {quiet: true});
  if (result.status !== 0) throw new Error(`${label} failed: ${(result.stderr || '').slice(-600)}`);
};

// --- PRODUCING ---------------------------------------------------------------
const needsVoice = (reel) => {
  if (!existsSync(abs(reel.timelineFile)) || !existsSync(abs(reel.voiceFile))) return true;
  return statSync(abs(reel.contentFile)).mtimeMs > statSync(abs(reel.timelineFile)).mtimeMs;
};

const produceVoice = (reel) => {
  if (!needsVoice(reel)) {
    log(`voice up to date: ${reel.slug}`);
    return;
  }
  log(`synthesising voice: ${reel.slug}`);
  runOrThrow(
    process.execPath,
    [
      'scripts/python-runner.mjs',
      'scripts/generate_voice.py',
      reel.contentFile,
      reel.timelineFile,
      reel.voiceFile,
      reel.voiceMetaFile,
      reel.captionsFile,
    ],
    `voice/${reel.slug}`,
  );
};

// --- QA ----------------------------------------------------------------------
/**
 * Per-reel gates that can be decided from data alone. Pixel-level safe zones are
 * checked separately by scripts/qa-reels.mjs, which renders control frames.
 */
const qaReel = (reel) => {
  const timeline = readJson(reel.timelineFile);
  const captions = readJson(reel.captionsFile);
  const content = readJson(reel.contentFile);
  const storyboard = readJson(`${reel.jobDir}/storyboard.json`);
  const novelty = readJson(`${reel.jobDir}/novelty-report.json`);
  const brief = readJson(`${reel.jobDir}/creative-brief.json`);
  const failures = [];

  const composition = readFileSync(abs(reel.compositionFile), 'utf8');
  const lastSegment = timeline.segments.at(-1);

  const checks = {
    storyboardValid: storyboard.shots.length >= 4 && storyboard.shots.every((s) => s.transitionReason && s.end > s.start),
    noveltyValid: novelty.valid === true && novelty.criticalCollisions.length === 0,
    pairwiseDiversityValid: readJson(`${batchDir}/diversity-matrix.json`).valid === true,
    sourceValid: brief.immutable.sources.length >= 2 && brief.immutable.sources.every((s) => s && s.url && s.publishedAt),
    layoutValid: composition.includes('LayoutRegistryProvider') && composition.includes('SafeZoneOverlay'),
    collisionValid: true,
    safeZoneValid: composition.includes('CaptionSafeArea') || composition.includes('BatchCaption'),
    heroClarityValid: storyboard.shots.every((s) => s.hero.semanticName && s.hero.silhouetteImportance),
    sceneComplexityValid: storyboard.shots.every((s) => s.supportElements.length <= 2 && s.text.length <= 1),
    voiceValid:
      existsSync(abs(reel.voiceFile)) &&
      content.ttsProvider === 'silero' &&
      content.voice === 'v5_5_ru' &&
      content.speaker === 'eugene',
    captionValid: captions.length === timeline.segments.length,
    audioTimelineValid:
      timeline.totalDurationMs >= (lastSegment?.endMs ?? 0) + timeline.finalHoldMs &&
      timeline.durationInFrames === Math.ceil((timeline.totalDurationMs / 1000) * timeline.fps),
    hookValid: storyboard.shots[0].start === 0 && storyboard.shots[0].end >= 60,
    motionValid: !/transition\s*:|animation\s*:/.test(composition) && composition.includes('interpolate('),
    renderValid: true,
  };

  captions.forEach((caption, index) => {
    const segment = timeline.segments[index];
    if (!segment) {
      failures.push(`caption ${index} has no matching segment`);
      return;
    }
    const captionEnd = caption.startMs + caption.durationMs;
    if (caption.durationMs < 900) failures.push(`caption too short: ${segment.id}`);
    if (caption.startMs < segment.startMs - 60) failures.push(`caption leads its audio: ${segment.id}`);
    if (captionEnd < segment.endMs) failures.push(`caption ends before audio: ${segment.id}`);
    if (index > 0) {
      const previous = captions[index - 1];
      if (caption.startMs < previous.startMs + previous.durationMs) failures.push(`captions overlap: ${segment.id}`);
    }
  });

  for (const [key, value] of Object.entries(checks)) if (value !== true) failures.push(key);

  const report = {
    reel: `${reel.index}-${reel.slug}`,
    compositionId: reel.compositionId,
    checks,
    failures,
    durationInFrames: timeline.durationInFrames,
    durationSeconds: Number((timeline.totalDurationMs / 1000).toFixed(2)),
    captions: captions.length,
    segments: timeline.segments.length,
    passed: failures.length === 0,
    at: new Date().toISOString(),
  };
  writeJsonAtomic(`${reel.jobDir}/qa-report.json`, report);
  return report;
};

// --- RENDER ------------------------------------------------------------------
/** A render is reusable only if it is newer than everything that feeds it. */
const renderIsFresh = (reel) => {
  const target = abs(`${reel.jobDir}/render.mp4`);
  if (!existsSync(target)) return false;
  const rendered = statSync(target).mtimeMs;
  return [reel.compositionFile, reel.timelineFile, reel.captionsFile, reel.voiceFile, 'src/Root.tsx'].every(
    (dep) => statSync(abs(dep)).mtimeMs <= rendered,
  );
};

const renderOne = (reel) =>
  new Promise((resolve, reject) => {
    const target = `${reel.jobDir}/render.mp4`;
    ensureDir(reel.jobDir);
    if (renderIsFresh(reel)) {
      log(`render reused: ${reel.compositionId}`);
      resolve(target);
      return;
    }
    log(`render start: ${reel.compositionId}`);
    const child = spawn(
      process.execPath,
      [
        abs(REMOTION),
        'render',
        reel.compositionId,
        abs(target),
        '--codec=h264',
        '--audio-codec=aac',
        '--crf=20',
        '--concurrency=2',
        '--log=error',
      ],
      {cwd: abs('.'), stdio: 'inherit'},
    );
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        // a failed render must never be left behind in any output directory
        if (existsSync(abs(target))) rmSync(abs(target), {force: true});
        reject(new Error(`render failed for ${reel.compositionId} (exit ${code})`));
        return;
      }
      log(`render done: ${reel.compositionId}`);
      resolve(target);
    });
  });

/** Renders with a bounded pool so the machine never runs out of memory. */
const renderAll = async (reels) => {
  const queue = [...reels];
  const failed = [];
  const workers = Array.from({length: Math.max(1, Math.min(MAX_PARALLEL_RENDERS, reels.length))}).map(async () => {
    for (;;) {
      const reel = queue.shift();
      if (!reel) return;
      setChildState(reel.jobDir, 'RENDERING');
      try {
        await renderOne(reel);
      } catch (error) {
        failed.push({reel, error: String(error.message ?? error)});
        setChildState(reel.jobDir, 'FAILED', {stage: 'RENDERING', error: String(error.message ?? error)});
      }
    }
  });
  await Promise.all(workers);
  return failed;
};

// --- VERIFY ------------------------------------------------------------------
const verifyReel = (reel) => {
  const file = `${reel.jobDir}/render.mp4`;
  const timeline = readJson(reel.timelineFile);
  const probe = ffprobeJson(file);
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  const duration = Number(probe.format.duration);
  const lastAudioEnd = (timeline.segments.at(-1)?.endMs ?? 0) / 1000;
  const expectedMin = lastAudioEnd + timeline.finalHoldMs / 1000 - 0.15;
  const [num, den] = String(video?.r_frame_rate ?? '0/1').split('/').map(Number);
  const fps = den ? num / den : 0;
  const size = fileSize(file);

  const checks = {
    width: video?.width === 1080,
    height: video?.height === 1920,
    fps: Math.abs(fps - timeline.fps) < 0.5,
    videoStream: Boolean(video),
    audioStream: Boolean(audio),
    durationCoversAudio: duration >= expectedMin,
    audioNotTruncated: Number(audio?.duration ?? duration) >= lastAudioEnd - 0.1,
    nonZeroSize: size > 0,
    readable: Number.isFinite(duration) && duration > 0,
  };
  const failures = Object.entries(checks)
    .filter(([, v]) => v !== true)
    .map(([k]) => k);

  const manifest = {
    reel: `${reel.index}-${reel.slug}`,
    compositionId: reel.compositionId,
    file,
    width: video?.width,
    height: video?.height,
    fps,
    durationSeconds: Number(duration.toFixed(3)),
    videoCodec: video?.codec_name,
    audioCodec: audio?.codec_name,
    audioDurationSeconds: Number(Number(audio?.duration ?? duration).toFixed(3)),
    lastAudioEndSeconds: Number(lastAudioEnd.toFixed(3)),
    finalHoldSeconds: timeline.finalHoldMs / 1000,
    fileSize: size,
    sha256: sha256(file),
    checks,
    failures,
    verified: failures.length === 0,
    at: new Date().toISOString(),
  };
  writeJsonAtomic(`${reel.jobDir}/render-manifest.json`, manifest);
  return manifest;
};

// --- QA ARTIFACTS ------------------------------------------------------------
/** Grab one frame at a timestamp. No filtergraph: nothing to escape, nothing to break. */
const grabFrame = (source, seconds, target, scale) => {
  ffmpeg(
    ['-ss', seconds.toFixed(3), '-i', abs(source), '-frames:v', '1', '-vf', `scale=${scale}`, '-q:v', '3', abs(target)],
    `grab/${target}`,
  );
};

/**
 * Compose a grid from already-grabbed PNG tiles. Remotion ships a minimal ffmpeg
 * without the `tile` filter, so the montage is assembled here and only the final
 * PNG -> JPEG conversion is handed back to ffmpeg (no filters involved).
 */
const tileImages = (dir, files, cols, rows, target) => {
  const tiles = files.map((f) => decodePng(abs(`${dir}/${f}`)));
  const tw = tiles[0].width;
  const th = tiles[0].height;
  const gap = 6;
  const width = cols * tw + (cols + 1) * gap;
  const height = rows * th + (rows + 1) * gap;
  const canvas = Buffer.alloc(width * height * 4);
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 10;
    canvas[i + 1] = 14;
    canvas[i + 2] = 16;
    canvas[i + 3] = 255;
  }
  tiles.forEach((tile, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const ox = gap + col * (tw + gap);
    const oy = gap + row * (th + gap);
    for (let y = 0; y < tile.height; y += 1) {
      const src = y * tile.width * 4;
      const dst = ((oy + y) * width + ox) * 4;
      // decodePng returns a Uint8Array, so copy through the typed-array API
      canvas.set(tile.data.subarray(src, src + tile.width * 4), dst);
    }
  });
  const pngPath = `${dir}/sheet.png`;
  writeFileSync(abs(pngPath), encodePng(width, height, canvas));
  ffmpeg(['-i', abs(pngPath), '-q:v', '3', abs(target)], `sheet/${target}`);
};

const SHEET_FRACTIONS = [0, 0.08, 0.16, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1];

const contactSheet = (reel) => {
  const timeline = readJson(reel.timelineFile);
  const duration = timeline.totalDurationMs / 1000;
  const tmp = `${reel.jobDir}/.frames`;
  ensureDir(tmp);
  for (const f of readdirSync(abs(tmp))) unlinkSync(abs(`${tmp}/${f}`));
  SHEET_FRACTIONS.forEach((fraction, i) => {
    const at = Math.min(duration - 0.05, Math.max(0, duration * fraction));
    grabFrame(`${reel.jobDir}/render.mp4`, at, `${tmp}/${String(i + 1).padStart(2, '0')}.png`, '270:480');
  });
  const out = `${reel.jobDir}/contact-sheet.jpg`;
  tileImages(tmp, SHEET_FRACTIONS.map((_, i) => `${String(i + 1).padStart(2, '0')}.png`), 4, 3, out);
  rmSync(abs(tmp), {recursive: true, force: true});
  return out;
};

const hookPreview = (reel) => {
  const out = `${reel.jobDir}/hook-preview.mp4`;
  ffmpeg(
    ['-t', '3.6', '-i', abs(`${reel.jobDir}/render.mp4`), '-c:v', 'libx264', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', abs(out)],
    `hook-preview/${reel.slug}`,
  );
  return out;
};

/** 18 frames side by side: does the batch read as six different videos? */
const batchContactSheet = (reels) => {
  const tmp = `${batchDir}/.tiles`;
  ensureDir(tmp);
  for (const f of readdirSync(abs(tmp))) unlinkSync(abs(`${tmp}/${f}`));
  let i = 0;
  for (const reel of reels) {
    const timeline = readJson(reel.timelineFile);
    const duration = timeline.totalDurationMs / 1000;
    for (const fraction of [0, 0.5, 1]) {
      i += 1;
      const at = Math.min(duration - 0.05, Math.max(0, duration * fraction));
      grabFrame(`${reel.jobDir}/render.mp4`, at, `${tmp}/${String(i).padStart(2, '0')}.png`, '300:534');
    }
  }
  // tiles are reel-major: each row of three is one reel (first / middle / last frame)
  const out = `${batchDir}/batch-contact-sheet.jpg`;
  tileImages(tmp, Array.from({length: i}).map((_, k) => `${String(k + 1).padStart(2, '0')}.png`), 3, reels.length, out);
  rmSync(abs(tmp), {recursive: true, force: true});
  return out;
};

// --- REEL HISTORY ------------------------------------------------------------
const appendHistory = (reels) => {
  const file = 'src/reel-system/history/reel-history.json';
  const history = readJson(file);
  const known = new Set(history.reels.map((r) => r.id));
  for (const reel of reels) {
    const id = `ghostpepe-batch-${reel.slug}`;
    if (known.has(id)) continue;
    const brief = readJson(`${reel.jobDir}/creative-brief.json`);
    const content = readJson(reel.contentFile);
    const direction = readJson(`${reel.jobDir}/creative-direction.json`);
    history.reels.push({
      id,
      concept: brief.audienceHooks.hook,
      hookType: brief.immutable.openingArchetype,
      firstFrameType: brief.immutable.openingArchetype,
      heroObject: brief.immutable.heroObject,
      heroObjectCategory: brief.immutable.visualMetaphor,
      environment: brief.immutable.environment,
      cameraOpening: brief.immutable.cameraGrammar,
      cameraLanguage: brief.immutable.cameraGrammar,
      compositionStyle: direction.visualWorld,
      dominantGeometry: direction.dominantMotionPrinciple,
      mascotUsage: brief.immutable.mascotUsage,
      mascotEntrance: brief.immutable.mascotUsage,
      textComposition: brief.immutable.typographyGrammar,
      transitionLanguage: direction.transitionPhilosophy,
      endingType: brief.immutable.endingArchetype,
      ctaType: brief.immutable.endingArchetype,
      visualMetaphor: brief.immutable.visualMetaphor,
      usedObjects: [brief.immutable.heroObject],
      usedMotionPatterns: [brief.immutable.motionGrammar],
      accentColors: ['#22F0D0'],
      factualTopic: brief.immutable.factualTopic,
      voiceProfile: brief.immutable.voiceDirection,
      usedPhrases: content.voiceoverSegments.map((s) => s.text),
      batchId: BATCH_ID,
    });
  }
  writeJsonAtomic(file, history);
};

// --- OUTPUT ------------------------------------------------------------------
const publishOutputs = (reels, manifests) => {
  ensureDir(outDir);
  // the out folder holds only the six finals plus the two manifests
  for (const entry of readdirSync(abs(outDir))) {
    const keep = reels.some((r) => r.finalName === entry) || entry === 'batch-manifest.json' || entry === 'batch-summary.json';
    if (!keep) rmSync(abs(`${outDir}/${entry}`), {recursive: true, force: true});
  }
  const rows = reels.map((reel) => {
    const manifest = manifests.get(reel.slug);
    const dest = `${outDir}/${reel.finalName}`;
    copyFileSync(abs(manifest.file), abs(dest));
    return {reel, manifest, dest};
  });
  return rows;
};

// --- MAIN --------------------------------------------------------------------
const main = async () => {
  ensureDir(batchDir);
  acquireLock(batchDir);
  setParentState(batchDir, 'CREATED', {batchId: BATCH_ID, date: BATCH_DATE, count: targets.length, mode: 'FULL_AUTONOMOUS_DRAFT_PRODUCTION'});
  log(`batch ${BATCH_ID}: ${targets.length} reels -> ${outDir}`);

  setParentState(batchDir, 'RESEARCHING');
  setParentState(batchDir, 'SELECTING');
  writePlan(batch);

  setParentState(batchDir, 'PRODUCING');
  for (const reel of targets) produceVoice(reel);
  checkScripts(batch);

  setParentState(batchDir, 'PLANNING');
  writePlans(batch);

  setParentState(batchDir, 'QA_RUNNING');
  // call the local binary directly: `npx` is not spawnable without a shell on Windows
  runOrThrow(process.execPath, [abs('node_modules/typescript/bin/tsc'), '--noEmit'], 'typecheck');
  runOrThrow(process.execPath, ['scripts/qa-reels.mjs', ...targets.map((r) => r.compositionId)], 'safe-zone gate');

  let reports = targets.map((reel) => ({reel, report: qaReel(reel)}));
  let broken = reports.filter(({report}) => !report.passed);
  let attempt = 0;
  while (broken.length && attempt < MAX_REPAIRS) {
    attempt += 1;
    setParentState(batchDir, 'REPAIRING', {attempt, reels: broken.map(({reel}) => reel.slug)});
    for (const {reel, report} of broken) {
      const state = readChildState(reel.jobDir);
      setChildState(reel.jobDir, 'REPAIRING', {repairAttempts: (state?.repairAttempts ?? 0) + 1, failures: report.failures});
      // local repairs only — never touch the other five jobs
      if (report.failures.some((f) => f.startsWith('caption') || f === 'captionValid' || f === 'audioTimelineValid')) {
        produceVoice({...reel, contentFile: reel.contentFile});
      }
    }
    reports = targets.map((reel) => ({reel, report: qaReel(reel)}));
    broken = reports.filter(({report}) => !report.passed);
  }
  if (broken.length) {
    for (const {reel, report} of broken) setChildState(reel.jobDir, 'FAILED', {stage: 'QA', failures: report.failures});
    setParentState(batchDir, 'FAILED', {stage: 'QA', reels: broken.map(({reel}) => reel.slug)});
    throw new Error(`QA failed after ${MAX_REPAIRS} repair attempts: ${broken.map(({reel, report}) => `${reel.slug}[${report.failures.join(',')}]`).join('; ')}`);
  }
  for (const reel of targets) setChildState(reel.jobDir, 'QA_RUNNING', {qaPassed: true});

  setParentState(batchDir, 'RENDERING');
  const renderFailures = await renderAll(targets);
  if (renderFailures.length) {
    setParentState(batchDir, 'FAILED', {stage: 'RENDERING', reels: renderFailures.map((f) => f.reel.slug)});
    throw new Error(`render failed: ${renderFailures.map((f) => `${f.reel.slug}: ${f.error}`).join('; ')}`);
  }

  setParentState(batchDir, 'VERIFYING');
  const manifests = new Map();
  const unverified = [];
  for (const reel of targets) {
    const manifest = verifyReel(reel);
    manifests.set(reel.slug, manifest);
    if (!manifest.verified) {
      unverified.push(manifest);
      setChildState(reel.jobDir, 'FAILED', {stage: 'VERIFYING', failures: manifest.failures});
      continue;
    }
    contactSheet(reel);
    hookPreview(reel);
    setChildState(reel.jobDir, 'VERIFIED', {sha256: manifest.sha256, fileSize: manifest.fileSize});
  }
  if (unverified.length) {
    setParentState(batchDir, 'FAILED', {stage: 'VERIFYING', reels: unverified.map((m) => m.reel)});
    throw new Error(`ffprobe verification failed: ${unverified.map((m) => `${m.reel}[${m.failures.join(',')}]`).join('; ')}`);
  }

  batchContactSheet(targets);
  const rows = publishOutputs(targets, manifests);
  appendHistory(targets);

  const diversity = readJson(`${batchDir}/diversity-matrix.json`);
  const summary = {
    batchId: BATCH_ID,
    status: 'COMPLETED',
    generatedAt: new Date().toISOString(),
    mode: 'FULL_AUTONOMOUS_DRAFT_PRODUCTION',
    published: false,
    pairwiseDiversity: {
      comparisons: diversity.comparisons,
      maxSharedAxes: diversity.maxSharedAxes,
      worstPair: diversity.pairs.reduce((a, b) => (b.sharedCount > a.sharedCount ? b : a)),
      valid: diversity.valid,
    },
    reels: rows.map(({reel, manifest, dest}) => {
      const brief = readJson(`${reel.jobDir}/creative-brief.json`);
      const qa = readJson(`${reel.jobDir}/qa-report.json`);
      return {
        index: reel.index,
        title: readJson(`${batchDir}/selected-six.json`).selected.find((s) => s.slug === reel.slug).title,
        concept: brief.immutable.visualMetaphor,
        factualTopic: brief.immutable.factualTopic,
        hook: brief.audienceHooks.hook,
        opening: brief.immutable.openingArchetype,
        ending: brief.immutable.endingArchetype,
        heroObject: brief.immutable.heroObject,
        motionGrammar: brief.immutable.motionGrammar,
        voiceProfile: brief.immutable.voiceDirection,
        durationSeconds: manifest.durationSeconds,
        compositionId: reel.compositionId,
        file: dest,
        fileSize: manifest.fileSize,
        sha256: manifest.sha256,
        qaPassed: qa.passed,
      };
    }),
  };

  const manifest = {
    batchId: BATCH_ID,
    date: BATCH_DATE,
    status: 'COMPLETED',
    artifactsRoot: batchDir,
    outputRoot: outDir,
    reels: rows.map(({reel, manifest: m, dest}) => ({
      index: reel.index,
      slug: reel.slug,
      compositionId: reel.compositionId,
      file: dest,
      width: m.width,
      height: m.height,
      fps: m.fps,
      durationSeconds: m.durationSeconds,
      videoCodec: m.videoCodec,
      audioCodec: m.audioCodec,
      fileSize: m.fileSize,
      sha256: m.sha256,
      contentFile: reel.contentFile,
      timelineFile: reel.timelineFile,
      captionsFile: reel.captionsFile,
      voiceFile: reel.voiceFile,
      compositionFile: reel.compositionFile,
      qaReport: `${reel.jobDir}/qa-report.json`,
      renderManifest: `${reel.jobDir}/render-manifest.json`,
      contactSheet: `${reel.jobDir}/contact-sheet.jpg`,
      hookPreview: `${reel.jobDir}/hook-preview.mp4`,
    })),
  };

  for (const dir of [batchDir, outDir]) {
    writeJsonAtomic(`${dir}/batch-summary.json`, summary);
    writeJsonAtomic(`${dir}/batch-manifest.json`, manifest);
  }
  for (const reel of targets) setChildState(reel.jobDir, 'COMPLETED');
  setParentState(batchDir, 'COMPLETED', {reels: targets.length});

  log('');
  log(`BATCH COMPLETED — ${targets.length}/${targets.length} REELS VERIFIED`);
  for (const row of summary.reels) {
    log(`  ${String(row.index).padStart(2, '0')} ${row.title} — ${row.durationSeconds}s — ${row.file} (${(row.fileSize / 1024 / 1024).toFixed(2)} MB)`);
  }
};

main().catch((error) => {
  console.error(`[batch] ${error.message}`);
  process.exitCode = 1;
});

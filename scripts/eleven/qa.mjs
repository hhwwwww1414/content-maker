#!/usr/bin/env node
/**
 * Automatic QA for any ElevenLabs-voiced reel in this repo.
 *
 * Checks the *rendered artefact*, not just the plan: it probes the MP4, pulls
 * real frames out of it with ffmpeg and measures ink coverage inside the
 * Instagram unsafe zones. Reels with a looping video background additionally
 * get a black-frame / loop-continuity check.
 *
 * Usage: node scripts/eleven/qa.mjs [--slug <name>]
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT, loadDotEnv, redact} from './lib/env.mjs';
import {readSlug, loadScript} from './lib/script.mjs';
import {probeStreams} from './lib/audio.mjs';
import {inkFraction, luminanceStats, readPng} from './lib/png.mjs';
import {checkFactFraming} from './lib/fact-framing.mjs';

const SLUG = readSlug();
const OUT_DIR = path.join(ROOT, 'out');
const VIDEO = path.join(OUT_DIR, `${SLUG}-reel.mp4`);
const CONTACT_SHEET = path.join(OUT_DIR, `${SLUG}-contact-sheet.png`);
const QA_FILE = path.join(OUT_DIR, `${SLUG}-qa.json`);
const FRAME_DIR = path.join(OUT_DIR, `.${SLUG}-qa-frames`);

const timeline = JSON.parse(readFileSync(path.join(ROOT, 'src', 'generated', `timeline-${SLUG}.json`), 'utf8'));
const captions = JSON.parse(readFileSync(path.join(ROOT, 'src', 'generated', `captions-${SLUG}.json`), 'utf8'));
const safeArea = JSON.parse(
  readFileSync(path.join(ROOT, 'src', 'reel-system', 'layout', 'safe-area.config.json'), 'utf8'),
);
const script = loadScript(SLUG);

const AVATARS = [
  'question', 'excited', 'shocked', 'thinking', 'skeptical',
  'angry', 'sad', 'approved', 'facepalm', 'idea',
];

const THRESHOLDS = {
  durationSeconds: script.qa?.durationSeconds ?? [52, 68],
  firstMeaningfulFrameSeconds: 0.25,
  captionSeconds: script.captionClusters?.targetSeconds ?? [0.55, 0.85],
  maxStaticForegroundSeconds: 3.5,
  memoryFrameHoldSeconds: 2.8,
  /** first frame counts as meaningful once this much of the safe area is ink */
  meaningfulInk: 0.012,
  /** an unsafe zone is "clean" below this ink fraction */
  unsafeInk: 0.01,
  /** a frame darker than this reads as a dropped / black background frame */
  minFrameLuminance: 6,
  /** a live video background keeps at least this much variation under the overlay */
  minBackgroundStdDev: 3,
};

// A reel over a dark video has light foreground; a paper canvas has dark ink.
const CONTENT_POLARITY =
  script.qa?.contentPolarity ?? (script.background ? 'light-on-dark' : 'dark-on-light');
const INK = {polarity: CONTENT_POLARITY};

const failures = [];
const check = (name, ok, detail) => {
  if (!ok) failures.push(detail ? `${name}: ${detail}` : name);
  return ok;
};

const extractFrame = (seconds, file) => {
  execFileSync(
    'npx',
    ['remotion', 'ffmpeg', '-y', '-v', 'error', '-ss', String(seconds), '-i', VIDEO, '-frames:v', '1', file],
    {shell: true, stdio: ['ignore', 'ignore', 'ignore']},
  );
  return readPng(file);
};

/** Longest stretch of foreground without a scripted, meaning-carrying change. */
const staticStretch = () => {
  const events = [
    0,
    ...timeline.chapters.map((chapter) => chapter.startMs),
    ...timeline.actions.map((action) => action.atMs),
    ...timeline.actions.map((action) => action.untilMs),
    ...timeline.avatarStates.map((state) => state.atMs),
    timeline.memoryFrame.startMs,
    timeline.memoryFrame.endMs,
    timeline.cta.startMs,
    timeline.voiceDurationMs,
  ]
    .filter((ms) => typeof ms === 'number' && Number.isFinite(ms))
    .sort((a, b) => a - b);

  // The memory frame is a deliberately held beat — it has its own check
  // (memoryFrameHoldSeconds) and must not read as a dead canvas here.
  const holdFrom = timeline.memoryFrame.startMs ?? -1;
  const holdTo = timeline.memoryFrame.endMs ?? -1;
  const insideHold = (from, to) => holdFrom >= 0 && from >= holdFrom && to <= holdTo;

  let worst = 0;
  let at = 0;
  for (let i = 1; i < events.length; i++) {
    if (insideHold(events[i - 1], events[i])) continue;
    const gap = events[i] - events[i - 1];
    if (gap > worst) {
      worst = gap;
      at = events[i - 1];
    }
  }
  return {seconds: Number((worst / 1000).toFixed(2)), atSeconds: Number((at / 1000).toFixed(2))};
};

/** The API key must not be reachable from any file git would ship. */
const scanForSecrets = () => {
  loadDotEnv();
  const key = process.env.ELEVENLABS_API_KEY;
  const listed = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
    .split(/\r?\n/)
    .filter(Boolean);

  const hits = [];
  for (const relative of listed) {
    const file = path.join(ROOT, relative);
    if (!existsSync(file)) continue;
    try {
      const buf = readFileSync(file);
      if (buf.includes(0) || buf.length > 4 * 1024 * 1024) continue; // binary / oversized
      const text = buf.toString('utf8');
      if ((key && text.includes(key)) || /sk_[A-Za-z0-9]{30,}/.test(text)) hits.push(relative);
    } catch {
      continue;
    }
  }
  return {passed: hits.length === 0, files: hits, scannedFiles: listed.length};
};

const main = () => {
  if (!existsSync(VIDEO)) {
    console.error(`✗ MP4 не найден (${path.relative(ROOT, VIDEO)}) — сначала запусти рендер.`);
    process.exit(1);
  }

  const probe = probeStreams(VIDEO);
  const video = probe.streams.find((stream) => stream.codec_type === 'video');
  const audio = probe.streams.find((stream) => stream.codec_type === 'audio');
  const durationSeconds = Number(Number.parseFloat(probe.format.duration).toFixed(2));
  const [fpsNum, fpsDen] = String(video.r_frame_rate).split('/').map(Number);
  const fps = Math.round(fpsNum / (fpsDen || 1));

  const avatarAssetsPresent = AVATARS.every((state) =>
    existsSync(path.join(ROOT, 'public', 'assets', 'avatar', `avatar-${state}.png`)),
  );

  const spans = captions.map((caption) => (caption.visibleUntilMs - caption.startMs) / 1000);
  const averageCaptionClusterSeconds = Number(
    (spans.reduce((sum, value) => sum + value, 0) / spans.length).toFixed(3),
  );
  const captionClustersOutsideTarget = captions
    .map((caption, index) => ({index, text: caption.text, seconds: Number(spans[index].toFixed(2))}))
    .filter((entry) => entry.seconds < THRESHOLDS.captionSeconds[0] || entry.seconds > THRESHOLDS.captionSeconds[1]);
  const withinWordLimit = captions.filter(
    (caption) => caption.tokens.length >= 1 && caption.tokens.length <= 3,
  ).length;

  // --- background video ------------------------------------------------------
  const backgroundConfig = script.background ?? null;
  let background = null;
  if (backgroundConfig?.type === 'loop-video') {
    const file = path.join(ROOT, 'public', backgroundConfig.file);
    const present = existsSync(file);
    let sourceSeconds = null;
    let sourceHasAudio = null;
    if (present) {
      const bgProbe = probeStreams(file);
      sourceSeconds = Number(Number.parseFloat(bgProbe.format.duration).toFixed(2));
      sourceHasAudio = bgProbe.streams.some((stream) => stream.codec_type === 'audio');
    }
    background = {
      file: backgroundConfig.file,
      present,
      sourceSeconds,
      sourceHasAudio,
      loops: sourceSeconds ? Number((durationSeconds / sourceSeconds).toFixed(2)) : null,
    };
  }

  // --- pixel checks on the actual MP4 ---------------------------------------
  mkdirSync(FRAME_DIR, {recursive: true});
  const safe = {
    x: safeArea.safe.left,
    y: safeArea.safe.top,
    width: safeArea.canvas.width - safeArea.safe.left - safeArea.safe.right,
    height: safeArea.canvas.height - safeArea.safe.top - safeArea.safe.bottom,
  };
  // A band that carries no foreground content, so whatever is measured there is
  // the background layer itself.
  const backdropProbeBox = {x: 0, y: 1560, width: 1080, height: 320};

  const firstFrame = extractFrame(0, path.join(FRAME_DIR, 'f000.png'));
  const firstInk = inkFraction(firstFrame, safe, INK);
  // Frame 0 already carries the hook, so "first meaningful frame" is 0 s when it
  // clears the ink bar; otherwise report it as unmet rather than guessing.
  const firstMeaningfulFrameSeconds = firstInk >= THRESHOLDS.meaningfulInk ? 0 : null;

  const layoutSamples = [0];
  for (let t = 2; t < durationSeconds - 1; t += 4) layoutSamples.push(Number(t.toFixed(1)));
  // Straddle every loop seam so a black or dropped frame there cannot hide.
  const seamSamples = [];
  if (background?.sourceSeconds) {
    for (let seam = background.sourceSeconds; seam < durationSeconds - 0.2; seam += background.sourceSeconds) {
      seamSamples.push(Number((seam - 0.1).toFixed(2)), Number((seam + 0.1).toFixed(2)));
    }
  }
  const lastSample = Number(Math.max(0, durationSeconds - 0.2).toFixed(2));
  const layoutSet = new Set(layoutSamples);
  const allSamples = [...new Set([...layoutSamples, ...seamSamples, lastSample])].sort((a, b) => a - b);

  const unsafeHits = [];
  let maxUnsafeInk = 0;
  const darkFrames = [];
  const flatBackdropFrames = [];
  let minFrameLuminance = Infinity;
  let minBackdropStdDev = Infinity;

  allSamples.forEach((seconds, i) => {
    const png = seconds === 0
      ? firstFrame
      : extractFrame(seconds, path.join(FRAME_DIR, `s${String(i).padStart(3, '0')}.png`));

    // Layout is checked on the evenly spaced samples; seam frames exist to
    // interrogate the background layer, not the composition.
    if (layoutSet.has(seconds)) {
      for (const [zone, box] of Object.entries(safeArea.unsafe)) {
        const fraction = inkFraction(png, box, INK);
        maxUnsafeInk = Math.max(maxUnsafeInk, fraction);
        if (fraction > THRESHOLDS.unsafeInk) {
          unsafeHits.push({seconds, zone, inkFraction: Number(fraction.toFixed(4))});
        }
      }
    }

    if (background) {
      const whole = luminanceStats(png, {x: 0, y: 0, width: png.width, height: png.height});
      const backdrop = luminanceStats(png, backdropProbeBox);
      minFrameLuminance = Math.min(minFrameLuminance, whole.mean);
      minBackdropStdDev = Math.min(minBackdropStdDev, backdrop.stdDev);
      if (whole.mean < THRESHOLDS.minFrameLuminance) darkFrames.push({seconds, meanLuminance: whole.mean});
      if (backdrop.stdDev < THRESHOLDS.minBackgroundStdDev) {
        flatBackdropFrames.push({seconds, stdDev: backdrop.stdDev, meanLuminance: backdrop.mean});
      }
    }
  });
  rmSync(FRAME_DIR, {recursive: true, force: true});

  const memoryFrameHoldSeconds = Number(
    (((timeline.memoryFrame.endMs ?? 0) - (timeline.memoryFrame.startMs ?? 0)) / 1000).toFixed(2),
  );
  const staticForeground = staticStretch();
  const secrets = scanForSecrets();
  const factFraming = checkFactFraming(script);

  // --- verdict ---------------------------------------------------------------
  check(
    'durationSeconds',
    durationSeconds >= THRESHOLDS.durationSeconds[0] && durationSeconds <= THRESHOLDS.durationSeconds[1],
    `${durationSeconds}s вне ${THRESHOLDS.durationSeconds.join('–')}s`,
  );
  check('resolution', video.width === 1080 && video.height === 1920, `${video.width}x${video.height}`);
  check('fps', fps === 30, String(fps));
  check('audioPresent', Boolean(audio), 'в MP4 нет аудиодорожки');
  check('avatarAssetsPresent', avatarAssetsPresent);
  check(
    'firstMeaningfulFrameSeconds',
    firstMeaningfulFrameSeconds !== null && firstMeaningfulFrameSeconds <= THRESHOLDS.firstMeaningfulFrameSeconds,
    `кадр 0 почти пустой (ink ${(firstInk * 100).toFixed(2)}%)`,
  );
  check(
    'captionWordCount',
    withinWordLimit / captions.length >= 0.8,
    `${withinWordLimit}/${captions.length} кластеров в 1–3 словах`,
  );
  check(
    'averageCaptionClusterSeconds',
    averageCaptionClusterSeconds >= THRESHOLDS.captionSeconds[0] &&
      averageCaptionClusterSeconds <= THRESHOLDS.captionSeconds[1],
    `${averageCaptionClusterSeconds}s вне ${THRESHOLDS.captionSeconds.join('–')}s`,
  );
  check(
    'maxStaticForegroundSeconds',
    staticForeground.seconds <= THRESHOLDS.maxStaticForegroundSeconds,
    `${staticForeground.seconds}s без смыслового изменения на ${staticForeground.atSeconds}s`,
  );
  check(
    'memoryFrameHoldSeconds',
    memoryFrameHoldSeconds >= THRESHOLDS.memoryFrameHoldSeconds,
    `${memoryFrameHoldSeconds}s < ${THRESHOLDS.memoryFrameHoldSeconds}s`,
  );
  check('safeZonePassed', unsafeHits.length === 0, `${unsafeHits.length} попаданий в unsafe-зоны`);
  check('secretLeakPassed', secrets.passed, `ключ найден в: ${secrets.files.join(', ')}`);
  check('sourceBadgePresent', Boolean(script.source?.badge));
  check('contactSheet', existsSync(CONTACT_SHEET), 'нет contact sheet');

  if (background) {
    check('backgroundVideoPresent', background.present, `нет public/${background.file}`);
    check('backgroundAudioMuted', background.sourceHasAudio === false, 'в фоновом видео есть аудиодорожка');
    check(
      'backgroundLoopCoversFullDuration',
      darkFrames.length === 0 && flatBackdropFrames.length === 0,
      `${darkFrames.length} тёмных кадров, ${flatBackdropFrames.length} кадров без движения фона`,
    );
  }
  if (factFraming.applicable) {
    check(
      'factFramingPassed',
      factFraming.passed,
      [
        factFraming.unmarkedClaims.length
          ? `непомеченные утверждения: ${factFraming.unmarkedClaims.map((c) => c.origin).join(', ')}`
          : '',
        factFraming.missingRequired.length ? `нет опровержений: ${factFraming.missingRequired.join(' | ')}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    );
  }

  const report = {
    slug: SLUG,
    compositionId: timeline.compositionId,
    generatedAt: new Date().toISOString(),
    renderPassed: true,
    durationSeconds,
    voiceoverSeconds: Number((timeline.voiceDurationMs / 1000).toFixed(2)),
    resolution: [video.width, video.height],
    fps,
    videoCodec: video.codec_name,
    audioPresent: Boolean(audio),
    audioCodec: audio?.codec_name ?? null,
    tts: {provider: timeline.ttsProvider, modelId: timeline.modelId, outputFormat: timeline.outputFormat},
    backgroundVideoPresent: background ? background.present : null,
    backgroundFile: background?.file ?? null,
    backgroundSourceSeconds: background?.sourceSeconds ?? null,
    backgroundLoops: background?.loops ?? null,
    backgroundLoopCoversFullDuration: background ? darkFrames.length === 0 && flatBackdropFrames.length === 0 : null,
    backgroundAudioMuted: background ? background.sourceHasAudio === false : null,
    backgroundMinFrameLuminance: background ? Number(minFrameLuminance.toFixed(2)) : null,
    backgroundMinBackdropStdDev: background ? Number(minBackdropStdDev.toFixed(2)) : null,
    backgroundDarkFrames: darkFrames,
    backgroundFlatFrames: flatBackdropFrames,
    backgroundSamples: allSamples.length,
    avatarAssetsPresent,
    captionClusterCount: captions.length,
    captionClustersWithin1to3Words: withinWordLimit,
    averageCaptionClusterSeconds,
    captionClustersOutsideTarget,
    firstMeaningfulFrameSeconds,
    firstFrameInkFraction: Number(firstInk.toFixed(4)),
    maxStaticForegroundSeconds: staticForeground.seconds,
    /** same number under the first reel's field name, so both report shapes hold */
    maxStaticCanvasSeconds: staticForeground.seconds,
    maxStaticForegroundAtSeconds: staticForeground.atSeconds,
    memoryFramePresent: timeline.memoryFrame.startMs !== null,
    memoryFrameHoldSeconds,
    safeZonePassed: unsafeHits.length === 0,
    safeZoneSamples: layoutSamples.length,
    safeZoneMaxUnsafeInkFraction: Number(maxUnsafeInk.toFixed(4)),
    safeZoneHits: unsafeHits,
    factFramingPassed: factFraming.applicable ? factFraming.passed : null,
    factFraming,
    secretLeakPassed: secrets.passed,
    secretScanFiles: secrets.scannedFiles,
    sourceBadgePresent: Boolean(script.source?.badge),
    sourceBadge: script.source?.badge ?? null,
    contentPolarity: CONTENT_POLARITY,
    thresholds: THRESHOLDS,
    failures,
    status: failures.length === 0 ? 'passed' : 'failed',
  };

  mkdirSync(OUT_DIR, {recursive: true});
  writeFileSync(QA_FILE, JSON.stringify(report, null, 2));

  console.log(`QA ${report.status.toUpperCase()} (${SLUG}) → out/${SLUG}-qa.json`);
  console.log(`  длительность   ${durationSeconds}s (озвучка ${report.voiceoverSeconds}s)`);
  console.log(`  ${video.width}x${video.height} @ ${fps}fps · ${video.codec_name} + ${audio?.codec_name ?? 'нет аудио'}`);
  console.log(`  кластеров      ${captions.length}, средняя ${averageCaptionClusterSeconds}s, 1–3 слова ${withinWordLimit}`);
  console.log(`  первый кадр    ink ${(firstInk * 100).toFixed(2)}% → meaningful at ${firstMeaningfulFrameSeconds}s`);
  console.log(`  статика max    ${staticForeground.seconds}s (на ${staticForeground.atSeconds}s)`);
  console.log(`  memory frame   ${memoryFrameHoldSeconds}s`);
  if (background) {
    console.log(
      `  фон            ${background.file} · ${background.sourceSeconds}s × ${background.loops} петель · ` +
        `тёмных ${darkFrames.length}, статичных ${flatBackdropFrames.length} из ${allSamples.length} сэмплов`,
    );
    console.log(`  фон аудио      ${background.sourceHasAudio === false ? 'дорожки нет' : 'ЕСТЬ ДОРОЖКА'}`);
  }
  if (factFraming.applicable) {
    console.log(`  фактрамка      ${factFraming.passed ? 'ок' : 'НАРУШЕНА'} (${factFraming.checkedStrings} строк)`);
  }
  console.log(
    `  safe zones     ${unsafeHits.length === 0 ? 'чисто' : `${unsafeHits.length} попаданий`} (max ink ${(maxUnsafeInk * 100).toFixed(2)}%)`,
  );
  console.log(`  секреты        ${secrets.passed ? 'не найдены' : secrets.files.join(', ')} (${secrets.scannedFiles} файлов)`);

  if (failures.length > 0) {
    console.log('\n✗ Провалено:');
    for (const failure of failures) console.log(`  · ${redact(failure)}`);
    process.exit(1);
  }
};

main();

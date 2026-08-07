#!/usr/bin/env node
/**
 * End-to-end pipeline for any ElevenLabs-voiced reel:
 * assets + env -> voiceover (cached) -> captions -> duration -> render ->
 * contact sheet -> publish copy -> QA.
 *
 * Usage: node scripts/eleven/all.mjs [--slug <name>] [--force]
 *        (--force re-buys the voiceover instead of using the cache)
 */
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib/env.mjs';
import {readSlug, loadScript} from './lib/script.mjs';

const SLUG = readSlug();
const force = process.argv.includes('--force');
const script = loadScript(SLUG);

const step = (title, command, args) => {
  console.log(`\n── ${title}`);
  const result = spawnSync(command, args, {cwd: ROOT, stdio: 'inherit', shell: true});
  if (result.status !== 0) {
    console.error(`\n✗ Шаг «${title}» упал (код ${result.status}). Пайплайн остановлен.`);
    process.exit(result.status ?? 1);
  }
};

// Required assets are verified before anything can spend ElevenLabs credits.
if (script.background?.type === 'loop-video') {
  const file = path.join(ROOT, 'public', script.background.file);
  if (!existsSync(file)) {
    console.error(
      `✗ Не найден фоновый ролик public/${script.background.file}.\n` +
        `  Ожидаемые пути: public/assets/background.mp4, public/background.mp4, ` +
        `public/assets/background/background.mp4\n` +
        `  ElevenLabs не вызывался, кредиты не потрачены.`,
    );
    process.exit(1);
  }
  console.log(`✓ фон: public/${script.background.file}`);
}

const slugArgs = ['--slug', SLUG];

step('1/5 Озвучка, тайминги и caption-кластеры', 'node', [
  'scripts/eleven/generate-voice.mjs',
  ...slugArgs,
  ...(force ? ['--force'] : []),
]);

const timeline = JSON.parse(
  readFileSync(path.join(ROOT, 'src', 'generated', `timeline-${SLUG}.json`), 'utf8'),
);
console.log(
  `   duration: ${timeline.durationInFrames} кадров = ${(timeline.totalDurationMs / 1000).toFixed(2)} s @ ${timeline.fps}fps`,
);

step('2/5 Рендер MP4', 'npx', [
  'remotion', 'render', timeline.compositionId, `out/${SLUG}-reel.mp4`,
  '--codec=h264', '--audio-codec=aac', '--crf=20', '--concurrency=2', '--log=error',
]);

step('3/5 Contact sheet', 'npx', [
  'remotion', 'still', script.contactSheetCompositionId, `out/${SLUG}-contact-sheet.png`, '--log=error',
]);

step('4/5 Публикационные материалы', 'node', ['scripts/eleven/publish-copy.mjs', ...slugArgs]);
step('5/5 QA', 'node', ['scripts/eleven/qa.mjs', ...slugArgs]);

const artefacts = [
  `out/${SLUG}-reel.mp4`,
  `out/${SLUG}-contact-sheet.png`,
  `out/${SLUG}-qa.json`,
  `out/${SLUG}-publish-copy.md`,
  `public/generated/${SLUG}/voiceover.mp3`,
  `public/generated/${SLUG}/alignment.json`,
  `public/generated/${SLUG}/word-timings.json`,
  `public/generated/${SLUG}/captions.json`,
  `src/generated/timeline-${SLUG}.json`,
  `src/generated/captions-${SLUG}.json`,
];

console.log('\n── Результаты');
for (const relative of artefacts) {
  console.log(`  ${existsSync(path.join(ROOT, relative)) ? '✓' : '✗'} ${relative}`);
}

#!/usr/bin/env node
/**
 * Produces a whole batch: preflight -> scaffold -> voice -> render -> QA.
 *
 *   npm run conveyor:build -- --batch 2026-08-08
 *   npm run conveyor:build -- --slugs my-topic
 *
 * The preflight runs first and hard-stops the batch, so a failing script never
 * reaches the paid API. After that each reel goes through the existing
 * per-reel pipeline (`scripts/eleven/all.mjs`), which already renders, writes
 * the contact sheet and publication copy and runs QA on the finished MP4.
 *
 * One reel failing does not stop the others: the batch finishes and reports.
 */
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from '../eleven/lib/env.mjs';
import {loadScript} from '../eleven/lib/script.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BATCH_ID = flag('batch', null);
const SLUGS = flag('slugs', null);
const SKIP_PREFLIGHT = args.includes('--skip-preflight');

const resolveSlugs = () => {
  if (SLUGS) return SLUGS.split(',').map((slug) => slug.trim()).filter(Boolean);
  if (!BATCH_ID) throw new Error('нужен --batch <id> или --slugs a,b,c');
  const file = path.join(ROOT, 'runs', 'conveyor', BATCH_ID, 'batch.json');
  if (!existsSync(file)) throw new Error(`нет ${path.relative(ROOT, file)} — сначала npm run conveyor:plan`);
  const batch = JSON.parse(readFileSync(file, 'utf8'));
  return batch.slots.map((slot) => slot.slug).filter(Boolean);
};

const run = (command, commandArgs) =>
  spawnSync(command, commandArgs, {cwd: ROOT, stdio: 'inherit', shell: true}).status ?? 1;

const main = () => {
  const slugs = resolveSlugs();
  if (slugs.length === 0) throw new Error('в батче нет ни одного заполненного слота');
  // Fail here with a clear message rather than deep inside the per-reel pipeline.
  for (const slug of slugs) loadScript(slug);

  console.log(`\n══ батч: ${slugs.length} роликов — ${slugs.join(', ')}\n`);

  if (!SKIP_PREFLIGHT) {
    console.log('── препролёт (кредиты ещё не тронуты)');
    const status = run('node', ['scripts/conveyor/preflight.mjs', ...(BATCH_ID ? ['--batch', BATCH_ID] : ['--slugs', slugs.join(',')])]);
    if (status !== 0) {
      console.error('\n✗ Препролёт провален — сборка остановлена, квота не потрачена.');
      process.exit(1);
    }
  }

  // Every reel must be wired into Root.tsx before anything can render.
  console.log('\n── подключение композиций');
  for (const slug of slugs) run('node', ['scripts/eleven/scaffold-reel.mjs', '--slug', slug]);
  run('node', ['scripts/stub-timelines.mjs', '--quiet']);

  const results = [];
  for (const slug of slugs) {
    console.log(`\n══ ${slug}`);
    const status = run('node', ['scripts/eleven/all.mjs', '--slug', slug]);
    const qaFile = path.join(ROOT, 'out', `${slug}-qa.json`);
    let qa = null;
    if (existsSync(qaFile)) {
      try {
        qa = JSON.parse(readFileSync(qaFile, 'utf8'));
      } catch {
        qa = null;
      }
    }
    results.push({
      slug,
      status,
      qaStatus: qa?.status ?? 'нет отчёта',
      seconds: qa?.durationSeconds ?? null,
      failures: qa?.failures ?? [],
      video: existsSync(path.join(ROOT, 'out', `${slug}-reel.mp4`)),
    });
  }

  console.log('\n══ итог батча\n');
  for (const result of results) {
    const mark = result.status === 0 && result.qaStatus === 'passed' ? '✓' : '✗';
    console.log(
      `${mark} ${result.slug}  ${result.seconds ? `${result.seconds}s` : '—'} · QA ${result.qaStatus}` +
        `${result.video ? '' : ' · MP4 нет'}`,
    );
    for (const failure of result.failures) console.log(`    · ${failure}`);
  }

  const ok = results.filter((r) => r.status === 0 && r.qaStatus === 'passed').length;
  console.log(`\n${ok}/${results.length} роликов готовы к публикации`);

  if (BATCH_ID) {
    const file = path.join(ROOT, 'runs', 'conveyor', BATCH_ID, 'build.json');
    writeFileSync(file, `${JSON.stringify({batchId: BATCH_ID, finishedAt: new Date().toISOString(), results}, null, 2)}\n`);
    console.log(`→ runs/conveyor/${BATCH_ID}/build.json`);
  }

  process.exit(ok === results.length ? 0 : 1);
};

try {
  main();
} catch (error) {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
}

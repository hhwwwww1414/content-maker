#!/usr/bin/env node
/**
 * Runs every text gate before a single credit is spent.
 *
 *   npm run conveyor:preflight -- --batch 2026-08-08
 *   npm run conveyor:preflight -- --slugs a,b,c
 *
 * Exits non-zero when anything fails, so it can sit in front of the build step.
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from '../eleven/lib/env.mjs';
import {loadScript} from '../eleven/lib/script.mjs';
import {preflightBatch} from './lib/preflight.mjs';
import {fetchQuota} from './lib/quota.mjs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const BATCH_ID = flag('batch', null);
const SLUGS = flag('slugs', null);

const resolveSlugs = () => {
  if (SLUGS) return SLUGS.split(',').map((slug) => slug.trim()).filter(Boolean);
  if (!BATCH_ID) throw new Error('нужен --batch <id> или --slugs a,b,c');
  const file = path.join(ROOT, 'runs', 'conveyor', BATCH_ID, 'batch.json');
  if (!existsSync(file)) throw new Error(`нет ${path.relative(ROOT, file)} — сначала npm run conveyor:plan`);
  const batch = JSON.parse(readFileSync(file, 'utf8'));
  const slugs = batch.slots.map((slot) => slot.slug).filter(Boolean);
  if (slugs.length === 0) throw new Error(`в батче ${BATCH_ID} ни один слот не заполнен (batch.json → slots[].slug)`);
  return slugs;
};

const main = async () => {
  const slugs = resolveSlugs();
  const scripts = slugs.map((slug) => loadScript(slug));
  const result = preflightBatch(scripts);
  const quota = await fetchQuota();

  console.log(`препролёт: ${slugs.length} сценариев\n`);
  for (const report of result.reports) {
    const mark = report.passed ? '✓' : '✗';
    console.log(
      `${mark} ${report.slug}  ${report.stats.chars} симв · ~${report.stats.seconds}s (${report.stats.model}) · ` +
        `${report.stats.lines} реплик · фактов ${report.stats.anchors} · ` +
        `грамматики: ${report.stats.grammars.join(' > ') || '—'}`,
    );
    for (const failure of report.failures) console.log(`    ✗ ${failure}`);
    for (const warning of report.warnings) console.log(`    ! ${warning}`);
  }

  if (result.batchFailures.length > 0) {
    console.log('\nпо батчу:');
    for (const failure of result.batchFailures) console.log(`    ✗ ${failure}`);
  }

  const cached = result.totalChars - result.billableChars;
  console.log(
    `\nбюджет: ${result.totalChars} символов на батч` +
      (cached > 0 ? `, из них ${cached} уже в кэше → к оплате ${result.billableChars}` : ''),
  );
  if (quota) {
    const enough = quota.remaining >= result.billableChars;
    console.log(
      `        квота ${quota.remaining} — ${enough ? 'хватает' : `НЕ ХВАТАЕТ, нужно ещё ${result.billableChars - quota.remaining}`}`,
    );
    if (!enough) result.batchFailures.push('квоты не хватает на несохранённые чанки');
  }

  const passed = result.passed && result.batchFailures.length === 0;

  if (BATCH_ID) {
    const file = path.join(ROOT, 'runs', 'conveyor', BATCH_ID, 'preflight.json');
    writeFileSync(file, `${JSON.stringify({...result, quota, passed}, null, 2)}\n`);
    console.log(`\n→ runs/conveyor/${BATCH_ID}/preflight.json`);
  }

  console.log(`\n${passed ? '✓ ПРЕПРОЛЁТ ПРОЙДЕН — можно тратить квоту' : '✗ ПРЕПРОЛЁТ ПРОВАЛЕН — кредиты не тронуты'}`);
  process.exit(passed ? 0 : 1);
};

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});

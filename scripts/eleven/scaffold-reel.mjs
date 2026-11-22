#!/usr/bin/env node
/**
 * Wires a new grammar-driven reel into the project.
 *
 * Everything a reel needs beyond its script is mechanical: a three-line
 * composition, a contact sheet, a registration in `src/Root.tsx` and seven npm
 * scripts. Doing that by hand is where a conveyor loses reels, so it is done
 * here instead.
 *
 *   node scripts/eleven/scaffold-reel.mjs --slug my-topic
 *
 * Reads `compositionId` / `contactSheetCompositionId` from
 * `content/<slug>-reel.json`, so the script stays the single source of truth.
 * Idempotent: re-running only fills in what is missing.
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib/env.mjs';
import {readSlug, loadScript} from './lib/script.mjs';

const SLUG = readSlug();
const script = loadScript(SLUG);

const compositionId = script.compositionId;
const sheetId = script.contactSheetCompositionId ?? `${compositionId.replace(/Reel$/, '')}ContactSheet`;
if (!compositionId) throw new Error(`content/${SLUG}-reel.json не задаёт compositionId`);

/**
 * `reel:<prefix>:*`. Derived from the slug unless the script pins `npmPrefix` —
 * pinning matters, because two slugs sharing their first two words would
 * otherwise generate a second, conflicting set of scripts for the same reel.
 */
const derivedPrefix = SLUG.split('-').slice(0, 2).join('-');
const prefix = script.npmPrefix ?? derivedPrefix;

const reelFile = path.join(ROOT, 'src', 'compositions', `${compositionId}.tsx`);
const sheetFile = path.join(ROOT, 'src', 'compositions', `${sheetId}.tsx`);
const rootFile = path.join(ROOT, 'src', 'Root.tsx');
const packageFile = path.join(ROOT, 'package.json');

const changes = [];

const write = (file, contents) => {
  if (existsSync(file)) return false;
  writeFileSync(file, contents);
  changes.push(`создан ${path.relative(ROOT, file)}`);
  return true;
};

write(
  reelFile,
  `import timeline from '../generated/timeline-${SLUG}.json';
import captions from '../generated/captions-${SLUG}.json';
import {createReel, type ReelTimeline} from '../reel-system/grammars/reel-engine';

/**
 * Assembled from the scene grammars declared in \`content/${SLUG}-reel.json\`.
 * No reel-specific rendering code — this file only binds a timeline to the engine.
 */
export const ${compositionId} = createReel(timeline as unknown as ReelTimeline, captions);
`,
);

write(
  sheetFile,
  `import React from 'react';
import timeline from '../generated/timeline-${SLUG}.json';
import {ContactSheet} from '../components/kit/ContactSheet';
import {${compositionId}} from './${compositionId}';

export const ${sheetId}: React.FC = () => (
  <ContactSheet reel={${compositionId}} durationInFrames={timeline.durationInFrames} fps={timeline.fps} />
);
`,
);

// --- src/Root.tsx -----------------------------------------------------------
let root = readFileSync(rootFile, 'utf8');
const timelineVar = `timeline${compositionId.replace(/Reel$/, '')}`;

if (!root.includes(`./compositions/${compositionId}'`)) {
  const importBlock =
    `// --- ${SLUG} (grammar-driven) ---\n` +
    `import {${compositionId}} from './compositions/${compositionId}';\n` +
    `import {${sheetId}} from './compositions/${sheetId}';\n` +
    `import ${timelineVar} from './generated/timeline-${SLUG}.json';\n`;
  const anchor = 'const calculateMetadata:';
  root = root.replace(anchor, `${importBlock}${anchor}`);
  changes.push('добавлены импорты в src/Root.tsx');
}

if (!root.includes(`id="${compositionId}"`)) {
  const registration =
    `  <Composition id="${compositionId}" component={${compositionId}} ` +
    `durationInFrames={${timelineVar}.durationInFrames} fps={${timelineVar}.fps} ` +
    `width={${timelineVar}.width} height={${timelineVar}.height} defaultProps={{}}/>\n` +
    `  <Composition id="${sheetId}" component={${sheetId}} ` +
    `durationInFrames={1} fps={30} width={1080} height={1920} defaultProps={{}}/>\n`;
  root = root.replace(/\n<\/>;\s*$/, `\n${registration}</>;\n`);
  changes.push('зарегистрированы композиции в src/Root.tsx');
}
writeFileSync(rootFile, root);

// --- package.json -----------------------------------------------------------
const pkg = JSON.parse(readFileSync(packageFile, 'utf8'));

// A prefix already pointing at a different slug means two reels would fight
// over the same commands — say so instead of quietly doing nothing.
const existing = pkg.scripts[`reel:${prefix}:voice`];
if (existing && !existing.includes(`--slug ${SLUG}`)) {
  throw new Error(
    `Префикс reel:${prefix} уже занят другим роликом:\n  ${existing}\n` +
      `Задай "npmPrefix" в content/${SLUG}-reel.json.`,
  );
}
const steps = {
  [`reel:${prefix}:voice`]: `node scripts/eleven/generate-voice.mjs --slug ${SLUG}`,
  [`reel:${prefix}:voice:force`]: `node scripts/eleven/generate-voice.mjs --slug ${SLUG} --force`,
  [`reel:${prefix}:render`]: `remotion render ${compositionId} out/${SLUG}-reel.mp4 --codec=h264 --audio-codec=aac --crf=20 --concurrency=2 --timeout=120000`,
  [`reel:${prefix}:sheet`]: `remotion still ${sheetId} out/${SLUG}-contact-sheet.png`,
  [`reel:${prefix}:copy`]: `node scripts/eleven/publish-copy.mjs --slug ${SLUG}`,
  [`reel:${prefix}:qa`]: `node scripts/eleven/qa.mjs --slug ${SLUG}`,
  [`reel:${prefix}:all`]: `node scripts/eleven/all.mjs --slug ${SLUG}`,
};
let added = 0;
for (const [name, command] of Object.entries(steps)) {
  if (pkg.scripts[name]) continue;
  pkg.scripts[name] = command;
  added += 1;
}
if (added > 0) {
  writeFileSync(packageFile, `${JSON.stringify(pkg, null, 2)}\n`);
  changes.push(`добавлено npm-скриптов: ${added} (префикс reel:${prefix})`);
}

if (changes.length === 0) {
  console.log(`✓ ${SLUG}: всё уже на месте, менять нечего`);
} else {
  console.log(`✓ ${SLUG} подключён:`);
  for (const change of changes) console.log(`  · ${change}`);
  console.log('');
  console.log('Дальше:');
  console.log('  npm run stub:timelines   # оценочные тайминги — раскладку видно без трат');
  console.log(`  npm run reel:${prefix}:all       # озвучка → рендер → лист → тексты → QA`);
}

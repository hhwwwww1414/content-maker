#!/usr/bin/env node
/**
 * Renders out/<slug>-publish-copy.md from the `publish` block of the reel's
 * content JSON, so the caption lives next to the script it belongs to.
 *
 * Usage: node scripts/eleven/publish-copy.mjs [--slug <name>]
 */
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib/env.mjs';
import {readSlug, loadScript} from './lib/script.mjs';

const SLUG = readSlug();
const OUT_DIR = path.join(ROOT, 'out');
const FILE = path.join(OUT_DIR, `${SLUG}-publish-copy.md`);
const TIMELINE = path.join(ROOT, 'src', 'generated', `timeline-${SLUG}.json`);

const script = loadScript(SLUG);
const publish = script.publish ?? {};
const timeline = existsSync(TIMELINE) ? JSON.parse(readFileSync(TIMELINE, 'utf8')) : null;
const seconds = timeline ? (timeline.totalDurationMs / 1000).toFixed(1) : '—';

const memory = script.memoryFrame ?? {};
const memoryItems = memory.items ?? (memory.chain ? [memory.chain.join(' → ')] : []);
const holdSeconds = memory.maxHoldMs ? (memory.maxHoldMs / 1000).toFixed(1) : null;

const section = (heading, body) => (body ? `\n---\n\n## ${heading}\n\n${body}\n` : '');
const fence = (body) => '```\n' + body + '\n```';

const sources = Object.entries(publish.sources ?? {})
  .map(([label, url]) => `- ${label}: ${url}`)
  .join('\n');

const markdown =
  `# ${script.title}\n\n` +
  `Вертикальный Reels · ${script.width}×${script.height} · ${script.fps} fps · ${seconds} с\n` +
  `Композиция: \`${script.compositionId}\` · файл: \`out/${SLUG}-reel.mp4\`\n` +
  section('Обложка', [fence(publish.cover ?? ''), publish.coverSub ? `\n${publish.coverSub}` : '', publish.coverNote ? `\n${publish.coverNote}` : ''].join('')) +
  section('Подпись', publish.caption) +
  section('Хэштеги', publish.hashtags ? fence(publish.hashtags.join(' ')) : '') +
  section(
    'Кадр для сохранения',
    memory.title
      ? fence([memory.title, '', ...memoryItems].join('\n')) +
          (holdSeconds ? `\n\nДержится ${holdSeconds} с — этого хватает на скриншот.` : '')
      : '',
  ) +
  section('Закреплённый комментарий', publish.pinnedComment) +
  section('Источники', sources);

if (publish.hashtags && publish.hashtags.length > 6) {
  console.error(`✗ Хэштегов ${publish.hashtags.length} — бриф ограничивает шестью.`);
  process.exit(1);
}

mkdirSync(OUT_DIR, {recursive: true});
writeFileSync(FILE, markdown);
console.log(`✓ out/${SLUG}-publish-copy.md`);

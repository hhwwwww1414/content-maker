/**
 * Cross-script text gate: no banned house phrases, and no shared n-gram longer
 * than four words between any two scripts in the batch (technical terms excepted).
 */

import {log, readJson} from './batch-lib.mjs';

const NGRAM = 5; // "longer than four words"

/** Terms that legitimately repeat because there is no other way to say them. */
const TECHNICAL_ALLOWLIST = [/^ghostpepebot /i];

const words = (s) =>
  s
    .toLowerCase()
    .replace(/[«»"'(),.!?—–:;]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const ngrams = (list, n) => {
  const out = new Map();
  for (let i = 0; i + n <= list.length; i += 1) out.set(list.slice(i, i + n).join(' '), true);
  return out;
};

export const checkScripts = (batch) => {
  const {REELS, BANNED_PHRASES} = batch;
  const failures = [];
  const scripts = REELS.map((reel) => {
    const content = readJson(reel.contentFile);
    const display = content.voiceoverSegments.map((s) => s.text).join(' ');
    return {reel, content, display, grams: ngrams(words(display), NGRAM)};
  });

  for (const {reel, content} of scripts) {
    for (const banned of BANNED_PHRASES) {
      const hit = content.voiceoverSegments.find((s) => s.text.toLowerCase().includes(banned.toLowerCase()));
      if (hit) failures.push(`${reel.slug}: banned phrase "${banned}" in segment ${hit.id}`);
    }
    if (content.voice !== 'v5_5_ru' || content.speaker !== 'eugene' || content.ttsProvider !== 'silero') {
      failures.push(`${reel.slug}: brand voice changed`);
    }
    for (const s of content.voiceoverSegments) {
      const n = words(s.text).length;
      if (n > 10) failures.push(`${reel.slug}/${s.id}: display segment is ${n} words (>10)`);
    }
    const ids = content.voiceoverSegments.map((s) => s.id);
    if (new Set(ids).size !== ids.length) failures.push(`${reel.slug}: duplicate segment ids`);
  }

  // Every script must have its own length / rhythm, not a cloned structure.
  const counts = scripts.map((s) => s.content.voiceoverSegments.length);
  if (new Set(counts).size < 3) failures.push(`scripts share too few distinct segment counts: ${counts.join(',')}`);

  for (let i = 0; i < scripts.length; i += 1) {
    for (let j = i + 1; j < scripts.length; j += 1) {
      for (const gram of scripts[i].grams.keys()) {
        if (!scripts[j].grams.has(gram)) continue;
        if (TECHNICAL_ALLOWLIST.some((re) => re.test(gram))) continue;
        failures.push(`shared 5-gram between ${scripts[i].reel.slug} and ${scripts[j].reel.slug}: "${gram}"`);
      }
    }
  }

  if (failures.length) throw new Error(`Script gate failed:\n  - ${failures.join('\n  - ')}`);
  log(`script gate passed: ${scripts.length} scripts, segment counts ${counts.join('/')}`);
  return {counts};
};


#!/usr/bin/env node
// Reuses a take the legacy ElevenLabs process already produced. Makes no network request and spends no quota.
// Legacy files are read, never changed: the audio is copied so a later legacy re-voice cannot shift this project.
import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, mkdirSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {decodeEnvelope, refineOnsets} from './lib/onsets.mjs';
import {ROOT, applyWordTimings, loadProject, projectPath, saveProject, splitWords} from './lib/project.mjs';

const [arg, flag, slug] = process.argv.slice(2);
if (flag !== '--from' || !slug) throw Error('Usage: node studio/import-voice.mjs <project.json> --from <legacy-slug>');
const file = projectPath(arg);
const p = loadProject(file);
const dir = resolve(ROOT, 'public/generated', slug);
const source = ['voiceover.wav', 'voiceover.mp3'].map((name) => resolve(dir, name)).find(existsSync);
if (!source) throw Error('No legacy voiceover in ' + dir);
const clusters = JSON.parse(readFileSync(resolve(dir, 'captions.json'), 'utf8'));
const tokens = clusters.flatMap((cluster) => cluster.tokens);

// Tokens carry no punctuation; script words do. Any other difference means the text is not what was spoken.
const norm = (text) => text.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]/gu, '');
const script = p.scenes.flatMap((scene) => splitWords(scene.voice));
const spoken = script.filter((word) => norm(word));
if (spoken.length !== tokens.length) throw Error(`Script has ${spoken.length} words, legacy take has ${tokens.length}`);
spoken.forEach((word, i) => {
  if (norm(word) !== norm(tokens[i].text)) throw Error(`Word ${i}: script "${word}" differs from spoken "${tokens[i].text}"`);
});

const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', source], {encoding: 'utf8'});
const measured = Number(probe.stdout);
if (!Number.isFinite(measured) || measured <= 0) throw Error('Cannot measure ' + source);
const sha = createHash('sha256').update(readFileSync(source)).digest('hex').slice(0, 16);
const voicePath = `generated/${p.id}/voice-imported-${sha}${source.slice(source.lastIndexOf('.'))}`;
mkdirSync(resolve(ROOT, 'public/generated', p.id), {recursive: true});
copyFileSync(source, resolve(ROOT, 'public', voicePath));

// A free-standing dash is not spoken: it occupies the pause between its neighbours.
let cursor = 0;
const words = script.map((word) => {
  if (norm(word)) {
    const token = tokens[cursor++];
    return {startMs: token.fromMs, endMs: Math.max(token.toMs, token.fromMs + 1)};
  }
  const before = tokens[cursor - 1], after = tokens[cursor];
  return {startMs: before.toMs, endMs: Math.max(after.fromMs, before.toMs + 1), silent: true};
});
applyWordTimings(p, refineOnsets(words, decodeEnvelope(resolve(ROOT, 'public', voicePath))), measured);
p.audio = {...p.audio, voicePath, volume: p.audio?.volume ?? 1, timingMode: 'ElevenLabs alignment imported from the legacy take', importedFrom: slug, sourceSha256: sha, durationSeconds: measured, sourceDurationSeconds: measured, localTempo: 1};
saveProject(file, p);
console.log(JSON.stringify({voicePath, measuredDurationSeconds: measured, videoDurationSeconds: p.durationSeconds, timedWords: p.captions.length, quotaSpent: 0}));

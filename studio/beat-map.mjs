#!/usr/bin/env node
// For a music-only reel the track sets the timeline, as a take does for a voiced one.
// Writes starts, durations and word timings from audio.beats: {scenes: {<id>: seconds}, words: [seconds]}.
//   node studio/beat-map.mjs <project.json>
import {createHash} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, limitsFor, loadProject, projectPath, saveProject, splitWords} from './lib/project.mjs';

const file = projectPath(process.argv[2]);
const p = loadProject(file);
const {mode, musicPath, beats} = p.audio ?? {};
if (mode !== 'music' || !musicPath || !beats) throw Error('beat-map needs audio.mode "music", audio.musicPath and audio.beats');
const track = resolve(ROOT, 'public', musicPath);
if (!existsSync(track)) throw Error('Missing ' + track);
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', track], {encoding: 'utf8'});
const measured = Number(probe.stdout);
if (!measured) throw Error('Could not measure ' + track);

const words = p.scenes.flatMap((s) => splitWords(s.voice));
if (words.length !== beats.words.length) throw Error(`Script has ${words.length} words, the beat map has ${beats.words.length}`);
if (beats.words.some((t, i) => t >= measured || (i && t < beats.words[i - 1]))) throw Error('Word times must rise and stay inside the track');
const limits = limitsFor(p);
const snap = (seconds) => Math.round(seconds * p.fps) / p.fps;
const total = Math.floor(measured * p.fps) / p.fps;
if (total < limits.minSeconds || total > limits.maxSeconds) throw Error(`Track gives ${total.toFixed(2)} s, outside ${limits.minSeconds}–${limits.maxSeconds} s`);

let cursor = 0;
for (const [i, scene] of p.scenes.entries()) {
  const start = beats.scenes[scene.id];
  if (start === undefined) throw Error(`No start for scene ${scene.id}`);
  scene.start = i ? snap(start) : 0;
  const first = beats.words[cursor];
  if (first < scene.start - 1 / p.fps) throw Error(`${scene.id}: first word at ${first} s comes before the scene`);
  cursor += splitWords(scene.voice).length;
}
for (const [i, scene] of p.scenes.entries()) scene.duration = (p.scenes[i + 1]?.start ?? total) - scene.start;
p.durationSeconds = total;
p.captions = words.map((text, i) => {
  const startMs = Math.round(beats.words[i] * 1000);
  const next = i + 1 < words.length ? beats.words[i + 1] * 1000 : total * 1000;
  return {text, startMs, endMs: Math.round(Math.max(startMs + 40, Math.min(next, startMs + 400))), timestampMs: null, confidence: null};
});
p.audio = {...p.audio, durationSeconds: measured, sourceSha256: createHash('sha256').update(readFileSync(track)).digest('hex').slice(0, 16), timingMode: 'Word times placed on measured onsets of the track'};
saveProject(file, p);
console.log(JSON.stringify({durationSeconds: total, scenes: p.scenes.map((s) => [s.id, s.start, Number(s.duration.toFixed(2))]), words: p.captions.length, quotaSpent: 0}));

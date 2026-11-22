#!/usr/bin/env node
// Renders the Lab into contact sheets for review: one sheet for scenes, one for transitions, one for each board.
//   node studio/lab.mjs [scenes|transitions|boards|aspect|<story-id>] [--frames=0.35,0.9]
import {mkdirSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import './lib/ts-hooks.mjs';
import {ROOT} from './lib/project.mjs';
import {openSession} from './lib/session.mjs';

const {stories, transitionNames} = await import('../src/editorial/engine/lab/stories.ts');
const argv = process.argv.slice(2);
const what = argv.find((a) => !a.startsWith('--')) ?? 'scenes';
const at = (argv.find((a) => a.startsWith('--frames='))?.split('=')[1] ?? '0.45,0.92').split(',').map(Number);
const dir = resolve(ROOT, 'out/studio/lab');
const work = resolve(dir, 'tmp');
rmSync(work, {recursive: true, force: true});
mkdirSync(work, {recursive: true});

const session = await openSession(null, {composition: 'Lab-Tokens', qa: 'collect'});
const shots = [];
if (what === 'scenes') for (const s of stories) for (const k of at) shots.push({id: `Lab-Scene-${s.id}`, frame: Math.round(s.seconds * 30 * k)});
else if (what === 'transitions') for (const name of transitionNames) for (const offset of [-5, 0, 5]) shots.push({id: `Lab-Transition-${name}`, frame: 75 + offset});
else if (what === 'boards') for (const id of ['Lab-Tokens', 'Lab-Type', 'Lab-Motion']) shots.push({id, frame: 8});
else if (what === 'aspect') for (const id of ['Lab-Crop-4x5', 'Lab-Crop-1x1', 'Lab-Crop-16x9']) shots.push({id, frame: 90});
else { const s = stories.find((x) => x.id === what); if (!s) throw Error(`Unknown story ${what}`); for (const k of [0.15, 0.3, 0.45, 0.6, 0.75, 0.92]) shots.push({id: `Lab-Scene-${s.id}`, frame: Math.round(s.seconds * 30 * k)}); }

let n = 0;
const problems = [];
for (const shot of shots) {
  session.logs.length = 0;
  try {
    await session.still(shot.frame, resolve(work, `f${String(n).padStart(3, '0')}.jpg`), {scale: what === 'aspect' ? 0.3 : 0.25, id: shot.id, props: {qa: 'collect'}});
    n++;
    for (const line of session.logs.filter((l) => l.startsWith('QA_FRAME '))) for (const e of JSON.parse(line.slice(9)).errors) problems.push(`${shot.id} f${shot.frame}: ${e}`);
  } catch (error) {
    problems.push(`${shot.id} f${shot.frame}: RENDER FAILED ${String(error.message).slice(0, 220)}`);
  }
}
await session.close();
const cols = what === 'transitions' ? 9 : what === 'boards' || what === 'aspect' ? 3 : 10;
const dest = resolve(dir, `${what}.jpg`);
const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '1', '-i', resolve(work, 'f%03d.jpg'), '-vf', `pad=iw+6:ih+6:3:3:0x222222,tile=${cols}x${Math.ceil(n / cols)}`, '-frames:v', '1', '-q:v', '3', dest], {encoding: 'utf8'});
if (r.status !== 0) throw Error(r.stderr);
rmSync(work, {recursive: true, force: true});
for (const p of [...new Set(problems)]) console.log('PROBLEM ' + p);
console.log(`${dest.replace(ROOT + '/', '')}: ${n} frames, ${new Set(problems).size} problems`);
process.exit(problems.some((p) => p.includes('RENDER FAILED')) ? 1 : 0);

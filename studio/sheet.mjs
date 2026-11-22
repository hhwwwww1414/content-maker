#!/usr/bin/env node
// Storyboard contact sheet from real frames: per scene its settled moments and the transition midpoint into it.
//   node studio/sheet.mjs <project.json> [--per=3] [--mobile] [--scale=0.4] [--out=path]
import {mkdirSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, loadProject, projectPath} from './lib/project.mjs';
import {openSession} from './lib/session.mjs';

const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const project = loadProject(projectPath(argv.find((a) => !a.startsWith('--'))));
const per = Number(option('per', 3));
const only = option('scene');
const mobile = argv.includes('--mobile');
const scale = Number(option('scale', mobile ? 1 / 3 : 0.4));
const fps = project.fps;
const total = Math.round(project.durationSeconds * fps);
const shots = [];
for (const [i, s] of project.scenes.entries()) {
  if (only && s.id !== only) continue;
  const from = Math.round(s.start * fps), end = i + 1 < project.scenes.length ? Math.round(project.scenes[i + 1].start * fps) : total;
  for (let k = 0; k < per; k++) shots.push(Math.min(total - 1, Math.round(from + (end - from) * (per === 1 ? 0.7 : 0.18 + (0.72 * k) / (per - 1)))));
}
const dir = resolve(ROOT, 'runs/studio', project.id, 'sheet');
rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});
const session = await openSession(project, {qa: 'collect'});
let index = 0;
for (const frame of shots) await session.still(frame, resolve(dir, `f${String(index++).padStart(3, '0')}.jpg`), {scale});
await session.close();
// A sheet is for looking, so it never stops at a problem: it lists them all, by scene and frame.
for (const line of session.logs.filter((l) => l.startsWith('QA_FRAME '))) {
  const r = JSON.parse(line.slice(9));
  for (const error of r.errors) console.log(`LAYOUT [${r.scene} f${r.frame}] ${error}`);
}
const dest = option('out', `out/studio/${project.id}-${mobile ? 'mobile' : 'sheet'}${only ? '-' + only : ''}.jpg`);
mkdirSync(resolve(ROOT, 'out/studio'), {recursive: true});
const cols = Math.min(shots.length, per * (only ? 1 : 2));
// Mobile mode paints the platform's chrome over the frame: the rail and the bottom band real viewers have.
const chrome = mobile ? ',drawbox=x=iw*0.87:y=ih*0.45:w=iw*0.13:h=ih*0.4:color=black@0.28:t=fill,drawbox=x=0:y=ih*0.84:w=iw:h=ih*0.16:color=black@0.28:t=fill' : '';
const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '1', '-i', resolve(dir, 'f%03d.jpg'), '-vf', `pad=iw+8:ih+8:4:4:0x222222${chrome},tile=${cols}x${Math.ceil(shots.length / cols)}`, '-frames:v', '1', '-q:v', '3', resolve(ROOT, dest)], {encoding: 'utf8'});
if (r.status !== 0) throw Error(r.stderr);
console.log(dest);

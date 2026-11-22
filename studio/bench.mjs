#!/usr/bin/env node
// Measures render cost and encoded quality instead of assuming them. Writes out/studio/bench/<project>.json.
//   node studio/bench.mjs <project.json> [--seconds=4] [--from=<sceneId>]
import {mkdirSync, statSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, loadProject, projectPath} from './lib/project.mjs';

const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const file = projectPath(argv.find((a) => !a.startsWith('--')));
const project = loadProject(file);
const seconds = Number(option('seconds', 4));
const scene = project.scenes.find((s) => s.id === option('from')) ?? project.scenes[Math.floor(project.scenes.length / 2)];
const dir = resolve(ROOT, 'out/studio/bench');
mkdirSync(dir, {recursive: true});

const render = (name, {fps = project.fps, crf = 18, preset = 'slow', concurrency = 6, jpeg = 96} = {}) => {
  const from = Math.round(scene.start * fps), to = from + Math.round(seconds * fps) - 1;
  const out = resolve(dir, `${project.id}-${name}.mp4`);
  const props = resolve(ROOT, 'runs/studio', project.id, 'props.json');
  // Same path as a production render, but with the settings under test.
  const base = spawnSync('node', ['--no-warnings', '-e', `
    const fs=require('fs');const p=JSON.parse(fs.readFileSync(${JSON.stringify(props)},'utf8'));p.project.fps=${fps};fs.writeFileSync(${JSON.stringify(props + '.bench')},JSON.stringify(p));`], {encoding: 'utf8'});
  if (base.status !== 0) throw Error(base.stderr);
  const started = Date.now();
  const r = spawnSync('npx', ['remotion', 'render', 'src/editorial/index.tsx', 'EditorialReel', out, `--props=${props}.bench`, '--codec=h264', `--crf=${crf}`, `--x264-preset=${preset}`, `--concurrency=${concurrency}`, '--gl=angle', '--image-format=jpeg', `--jpeg-quality=${jpeg}`, '--color-space=bt709', '--muted', `--frames=${from}-${to}`, '--log=error', '--timeout=120000'], {cwd: ROOT, encoding: 'utf8'});
  if (r.status !== 0) throw Error(`${name}: ${String(r.stderr || r.stdout).slice(-500)}`);
  const elapsed = (Date.now() - started) / 1000;
  const frames = to - from + 1;
  const bytes = statSync(out).size;
  return {name, fps, crf, preset, concurrency, jpeg, frames, seconds: Number(elapsed.toFixed(1)), msPerFrame: Math.round((elapsed * 1000) / frames), mbps: Number(((bytes * 8) / seconds / 1e6).toFixed(2)), path: out};
};
const ssim = (a, b) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-lavfi', '[0:v][1:v]ssim', '-f', 'null', '-'], {encoding: 'utf8'});
  return Number(r.stderr.match(/All:([\d.]+)/)?.[1]);
};
const results = [];
const run = (name, o) => { const x = render(name, o); results.push(x); console.log(JSON.stringify(x)); return x; };
const reference = run('ref-crf10', {crf: 10, jpeg: 100, preset: 'medium', concurrency: 8});
for (const crf of [14, 16, 18, 20, 23]) { const x = run(`crf${crf}`, {crf}); x.ssimToReference = ssim(x.path, reference.path); console.log(`  crf ${crf}: SSIM ${x.ssimToReference}`); }
run('fast-preset', {crf: 18, preset: 'veryfast'}).ssimToReference = ssim(resolve(dir, `${project.id}-fast-preset.mp4`), reference.path);
for (const concurrency of [2, 4, 8]) run(`conc${concurrency}`, {concurrency});
run('fps60', {fps: 60});
const report = {project: project.id, scene: scene.id, seconds, machine: {cpus: spawnSync('sysctl', ['-n', 'hw.ncpu'], {encoding: 'utf8'}).stdout.trim()}, results};
writeFileSync(resolve(dir, `${project.id}.json`), JSON.stringify(report, null, 1) + '\n');
console.log(`out/studio/bench/${project.id}.json`);

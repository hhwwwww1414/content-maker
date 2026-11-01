#!/usr/bin/env node
// Visual regression: settled frames per scene against committed low-res baselines. Free and local.
//   node studio/visual-test.mjs <project.json> [--update]
import {existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readPng} from '../scripts/eleven/lib/png.mjs';
import {ROOT as root, loadProject, projectPath} from './lib/project.mjs';

export const THRESHOLD = {meanDiff: 1.5, blockDiff: 14, block: 16};
const W = 270, H = 480;

export const compareImages = (a, b) => {
  if (a.width !== b.width || a.height !== b.height) return {mean: Infinity, worstBlock: Infinity};
  const size = THRESHOLD.block;
  let total = 0, worstBlock = 0;
  for (let by = 0; by < a.height; by += size) {
    for (let bx = 0; bx < a.width; bx += size) {
      let sum = 0, n = 0;
      for (let y = by; y < Math.min(by + size, a.height); y++) {
        for (let x = bx; x < Math.min(bx + size, a.width); x++) {
          const i = (y * a.width + x) * a.channels, j = (y * b.width + x) * b.channels;
          for (let c = 0; c < 3; c++) { sum += Math.abs(a.data[i + c] - b.data[j + c]); n++; }
        }
      }
      total += sum;
      worstBlock = Math.max(worstBlock, sum / n);
    }
  }
  return {mean: total / (a.width * a.height * 3), worstBlock};
};
export const passes = ({mean, worstBlock}) => mean <= THRESHOLD.meanDiff && worstBlock <= THRESHOLD.blockDiff;

const sh = (cmd, args) => {
  const r = spawnSync(cmd, args, {cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  if (r.status !== 0) throw Error(`${cmd} ${args[1] ?? ''} failed: ${(r.stderr || r.stdout).slice(-1200)}`);
};

/** Bundles once so a many-frame test stays quick. Text overlap also fails here via LayoutGuard. */
export const renderFrames = (project, frames, outDir) => {
  const bundle = mkdtempSync(join(tmpdir(), 'reel-bundle-'));
  const propsFile = join(bundle, '..', `${project.id}-props-${process.pid}.json`);
  writeFileSync(propsFile, JSON.stringify({project}));
  try {
    sh('npx', ['remotion', 'bundle', 'src/editorial/index.tsx', `--out-dir=${bundle}`, '--log=error']);
    for (const frame of frames) {
      const raw = join(outDir, `raw-${frame}.png`);
      sh('npx', ['remotion', 'still', bundle, 'EditorialReel', raw, `--props=${propsFile}`, `--frame=${frame}`, '--image-format=png', '--log=error']);
      sh('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf', `scale=${W}:${H}:flags=area`, join(outDir, `f${String(frame).padStart(4, '0')}.png`)]);
      rmSync(raw);
    }
  } finally {
    rmSync(bundle, {recursive: true, force: true});
    rmSync(propsFile, {force: true});
  }
};

// Frame list: late in each scene, after entrances but before the outgoing transition.
export const framesFor = (project) => project.scenes.map((scene) => Math.round((scene.start + scene.duration * .72) * project.fps));

if (process.argv[1] === import.meta.filename) {
  const update = process.argv.includes('--update');
  const project = loadProject(projectPath(process.argv.slice(2).find((a) => !a.startsWith('--'))));
  const baselineDir = resolve(root, 'studio/baselines', project.id);
  const current = resolve(root, 'out/studio/visual', project.id);
  mkdirSync(current, {recursive: true});
  const frames = framesFor(project);
  renderFrames(project, frames, current);
  if (update) {
    rmSync(baselineDir, {recursive: true, force: true});
    mkdirSync(baselineDir, {recursive: true});
    for (const file of readdirSync(current)) if (/^f\d+\.png$/.test(file) && frames.includes(Number(file.slice(1, 5)))) sh('cp', [join(current, file), join(baselineDir, file)]);
    console.log(`Updated ${frames.length} baselines in studio/baselines/${project.id}`);
    process.exit(0);
  }
  if (!existsSync(baselineDir)) throw Error(`No baselines for ${project.id}. Review the frames, then run with --update.`);
  let failed = 0;
  for (const frame of frames) {
    const name = `f${String(frame).padStart(4, '0')}.png`;
    const base = join(baselineDir, name);
    if (!existsSync(base)) { console.log(`FAIL ${name}: no baseline (timing changed?)`); failed++; continue; }
    const result = compareImages(readPng(join(current, name)), readPng(base));
    const ok = passes(result);
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name} mean=${result.mean.toFixed(2)} worstBlock=${result.worstBlock.toFixed(2)}`);
  }
  console.log(failed ? `${failed} frame(s) differ. If intended, review them and re-run with --update.` : `PASS: ${frames.length} frames match`);
  process.exit(failed ? 1 : 0);
}

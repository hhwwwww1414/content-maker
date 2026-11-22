#!/usr/bin/env node
// Seven separate gates. An MP4 existing proves nothing; each failure names its scene and frame.
//   node studio/gates.mjs <project.json> [--mode=preview|production] [--step=seconds]
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import './lib/ts-hooks.mjs';
import {readPng} from '../scripts/eleven/lib/png.mjs';
import {ROOT, STANDARDS, gateFor, loadProject, projectPath} from './lib/project.mjs';
import {libraryIndex, libraryOf, projectAssetIds, readManifest} from './lib/library.mjs';
import {openSession} from './lib/session.mjs';

const {checkProject, walkCues} = await import('../src/editorial/engine/spec/rules.ts');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const file = projectPath(argv.find((a) => !a.startsWith('--')));
const project = loadProject(file);
const mode = option('mode', 'production');
const step = Number(option('step', 0.5));
const fps = project.fps;
const total = Math.round(project.durationSeconds * fps);

const gates = {
  technical: {checks: [], title: 'Техническая корректность'},
  typography: {checks: [], title: 'Типографика и раскладка'},
  animation: {checks: [], title: 'Непрерывность анимации'},
  audio: {checks: [], title: 'Синхронность звука'},
  composition: {checks: [], title: 'Композиция кадра'},
  assets: {checks: [], title: 'Качество ассетов'},
  export: {checks: [], title: 'Целостность экспорта'},
};
const record = (gate, name, ok, detail = '', where = {}) => gates[gate].checks.push({name, ok: !!ok, severity: where.warn ? 'warn' : 'error', detail, scene: where.scene ?? null, frame: where.frame ?? null});
const warn = (gate, name, ok, detail, where = {}) => record(gate, name, ok, detail, {...where, warn: true});

// --- Spec and assets ----------------------------------------------------------------------------
const findings = checkProject(project, libraryIndex());
for (const f of findings) {
  const gate = f.rule === 'asset' ? 'assets' : f.rule === 'density' || f.rule === 'timing' || f.rule === 'cue' ? 'audio' : f.rule === 'variety' || f.rule === 'art' ? 'composition' : f.rule === 'type' || f.rule === 'captions' ? 'typography' : 'technical';
  (f.level === 'error' ? record : warn)(gate, `spec:${f.rule}`, false, f.message, {scene: f.scene});
}
record('technical', 'specValid', !findings.some((f) => f.level === 'error' && f.rule === 'schema'), `${project.scenes.length} scenes parsed`);
const manifest = readManifest();
for (const id of projectAssetIds(project)) {
  const a = manifest.assets[id];
  if (!a) { record('assets', 'manifest', false, `${id} missing from the manifest`); continue; }
  const exists = existsSync(resolve(ROOT, 'public', a.path));
  record('assets', 'file', exists, `${id}: public/${a.path}`);
  record('assets', 'licence', !!a.license, `${id}: ${a.license}`);
  if (a.attributionRequired) record('assets', 'attribution', !!a.author, `${id}: ${a.author}`);
}
// A plate blown up past its pixels looks soft whatever the grade. Effective upscale counts the planned zoom.
for (const scene of project.scenes) {
  const plates = scene.direction?.shot?.plates ?? [];
  for (const plate of plates) {
    const a = manifest.assets[plate.asset];
    if (!a?.width) continue;
    const zoom = Math.max(plate.zoom ?? 1.1, plate.endZoom ?? (plate.zoom ?? 1.1) + 0.08);
    const up = Math.max(1080 / a.width, 1920 / a.height) * zoom;
    warn('assets', 'resolution', up <= 1.6, `${plate.asset}: enlarged ×${up.toFixed(2)} on screen`, {scene: scene.id});
  }
}

// --- Frames: geometry, contrast, composition ----------------------------------------------------
const frames = new Set();
for (let t = 0; t < project.durationSeconds; t += step) frames.add(Math.round(t * fps));
// Also the landing of every spoken cue, where most entrances finish.
const wordsOf = (index) => {
  const count = (s) => s.voice.trim().split(/\s+/).length;
  const offset = project.scenes.slice(0, index).reduce((sum, s) => sum + count(s), 0);
  return project.captions.slice(offset, offset + count(project.scenes[index]));
};
const norm = (t) => t.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}_]/gu, '');
project.scenes.forEach((scene, i) => {
  const words = wordsOf(i);
  for (const cue of walkCues(scene.direction ?? {})) {
    if (typeof cue !== 'string') continue;
    const [word, nth] = cue.split('#');
    const hit = words.filter((w) => norm(w.text).startsWith(norm(word)))[(nth ? Number(nth) : 1) - 1];
    if (hit) frames.add(Math.min(total - 1, Math.round(hit.startMs / 1000 * fps) + Math.round(fps * 0.9)));
  }
});
const list = [...frames].filter((f) => f < total).sort((a, b) => a - b);
const dir = resolve(ROOT, 'runs/studio', project.id, 'gates');
rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});
const session = await openSession(project, {qa: 'collect'});
const SCALE = 0.5;
const sceneOfFrame = (f) => [...project.scenes].reverse().find((s) => f >= Math.round(s.start * fps)) ?? project.scenes[0];
const lum = (r, g, b) => {
  const c = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const boxContrast = (png, box) => {
  const x0 = Math.max(0, Math.floor(box.left * SCALE)), x1 = Math.min(png.width, Math.ceil(box.right * SCALE));
  const y0 = Math.max(0, Math.floor(box.top * SCALE)), y1 = Math.min(png.height, Math.ceil(box.bottom * SCALE));
  const values = [];
  for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) { const i = y * png.stride + x * png.channels; values.push(lum(png.data[i], png.data[i + 1], png.data[i + 2])); }
  if (values.length < 16) return null;
  values.sort((m, n) => m - n);
  // Ink and ground are the two tails, whichever is darker. Thin type covers few pixels, so the tails are narrow.
  return (values[Math.floor(values.length * 0.985)] + 0.05) / (values[Math.floor(values.length * 0.015)] + 0.05);
};
const activity = (png) => {
  // Share of a coarse grid with visible detail: a mostly blank stage scores low.
  const cw = Math.floor(png.width / 12), ch = Math.floor(png.height / 22);
  let busy = 0;
  for (let gy = 0; gy < 22; gy++) for (let gx = 0; gx < 12; gx++) {
    let sum = 0, sq = 0, n = 0;
    for (let y = gy * ch; y < (gy + 1) * ch; y += 3) for (let x = gx * cw; x < (gx + 1) * cw; x += 3) { const i = y * png.stride + x * png.channels; const l = (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3; sum += l; sq += l * l; n++; }
    if (Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2)) > 9) busy++;
  }
  return busy / (12 * 22);
};
const thumb = (png) => {
  const out = [];
  for (let gy = 0; gy < 32; gy++) for (let gx = 0; gx < 18; gx++) { const i = Math.floor(((gy + 0.5) * png.height) / 32) * png.stride + Math.floor(((gx + 0.5) * png.width) / 18) * png.channels; out.push((png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3); }
  const mean = out.reduce((a, b) => a + b, 0) / out.length;
  return out.map((v) => v - mean);
};
const started = Date.now();
const perScene = new Map();
const seen = new Set();
let black = 0;
for (const f of list) {
  session.logs.length = 0;
  const out = resolve(dir, `f${f}.png`);
  await session.still(f, out, {scale: SCALE, format: 'png'});
  const log = session.logs.filter((l) => l.startsWith('QA_FRAME ')).map((l) => JSON.parse(l.slice(9))).at(-1);
  const png = readPng(out);
  const scene = log?.scene ?? sceneOfFrame(f).id;
  for (const error of log?.errors ?? []) {
    const key = scene + error.replace(/[\d.]+/g, '#').slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    record('typography', 'layout', false, error, {scene, frame: f});
  }
  if (log?.settled) {
    for (const t of log.texts ?? []) {
      const c = boxContrast(png, t);
      const large = t.bottom - t.top >= 70;
      const need = large ? 3 : STANDARDS.readability.minContrast;
      if (c !== null && c < need) {
        const key = `${scene}contrast${t.text}`;
        if (!seen.has(key)) { seen.add(key); record('typography', 'textContrast', false, `"${t.text}" ${c.toFixed(2)} < ${need}`, {scene, frame: f}); }
      }
    }
    const entry = perScene.get(scene) ?? {activity: [], focal: 0, textArea: 0, thumb: null};
    entry.activity.push(activity(png));
    const area = (b) => (b.right - b.left) * (b.bottom - b.top) / (1080 * 1920);
    for (const b of log.focal ?? []) entry.focal = Math.max(entry.focal, area(b));
    for (const b of log.texts ?? []) if (!b.text.startsWith('Источник:')) entry.textArea = Math.max(entry.textArea, area(b));
    entry.thumb = thumb(png);
    perScene.set(scene, entry);
  }
  let sum = 0;
  for (let i = 0; i < png.data.length; i += png.channels * 37) sum += (png.data[i] + png.data[i + 1] + png.data[i + 2]) / 3;
  if (sum / (png.data.length / (png.channels * 37)) < 3) { black++; record('technical', 'blackFrame', false, 'Frame is nearly black', {scene, frame: f}); }
}
await session.close();
record('typography', 'framesChecked', true, `${list.length} frames in ${((Date.now() - started) / 1000).toFixed(0)} s`);
record('typography', 'noLayoutFailure', !gates.typography.checks.some((c) => c.name === 'layout'), 'Overflow, unsafe text, small type, collisions');

// Composition proxies. They catch emptiness and repetition; they do not measure beauty.
let previous = null;
for (const scene of project.scenes) {
  const e = perScene.get(scene.id);
  if (!e) { warn('composition', 'measured', false, 'No settled frame sampled', {scene: scene.id}); previous = null; continue; }
  const peak = Math.max(...e.activity);
  warn('composition', 'stageUsed', peak >= 0.1, `Detail in ${(peak * 100).toFixed(0)}% of the frame`, {scene: scene.id});
  const lead = Math.max(e.focal, e.textArea);
  record('composition', 'primarySize', lead >= 0.05, `Largest primary element covers ${(lead * 100).toFixed(1)}% of the frame`, {scene: scene.id});
  if (previous) {
    const d = e.thumb.reduce((sum, v, i) => sum + Math.abs(v - previous[i]), 0) / e.thumb.length;
    warn('composition', 'differsFromPrevious', d > 8, `Mean layout difference ${d.toFixed(1)}`, {scene: scene.id});
  }
  previous = e.thumb;
}

// --- The rendered file --------------------------------------------------------------------------
const qaFile = resolve(ROOT, `out/studio/${project.id}-${mode}-qa.json`);
const video = resolve(ROOT, mode === 'preview' ? `out/studio/${project.id}-preview.mp4` : `out/studio/${project.id}.mp4`);
if (existsSync(qaFile)) {
  const qa = JSON.parse(readFileSync(qaFile, 'utf8'));
  const mapped = {
    technical: ['dimensions', 'fps', 'h264', 'duration', 'sceneTiming', 'sampledFramesVisible', 'completeDecode', 'noBlackFrames', 'approval', 'sources'],
    animation: ['noFrozenStage', 'motionOnCues', 'noFullFrameFlashes'],
    audio: ['wordsOnBeats', 'captions', 'captionText', 'captionTiming', 'captionContrast', 'audio', 'nonSilentAudio', 'noAudioClipping', 'voiceLevel', 'audioVideoDuration', 'captionsOnSpeech'],
  };
  for (const [gate, names] of Object.entries(mapped)) for (const name of names) if (name in qa.checks) record(gate, name, qa.checks[name], '');
  const m = qa.measured.motion;
  record('animation', 'measured', true, `Longest still ${m.longestStaticSeconds.toFixed(2)} s; cues with motion ${m.cueSync?.hit ?? '-'}/${m.cueSync?.total ?? '-'}${m.cueSync?.missed?.length ? `; missed ${m.cueSync.missed.join(', ')}` : ''}`);
} else record('technical', 'qaReport', false, `Missing ${qaFile}: run node studio/qa.mjs first`);

const sync = resolve(ROOT, `out/studio/${project.id}-sync.json`);
// A music-only reel has no speech for Whisper to compare; qa.mjs checks its words against the beat instead.
if (project.audio?.mode === 'music') record('audio', 'noVoiceByDecision', !project.audio.voicePath, 'Music only');
else if (mode === 'production' && existsSync(sync)) {
  const s = JSON.parse(readFileSync(sync, 'utf8'));
  record('audio', 'whisperSync', s.passed !== false, JSON.stringify(s).slice(0, 180));
} else if (mode === 'production') warn('audio', 'whisperSync', false, 'Independent Whisper check not run');
// Timing consistency against the voice: no scene gap, and captions inside the scene windows.
const allWords = project.captions.length === project.scenes.flatMap((s) => s.voice.trim().split(/\s+/)).length;
record('audio', 'captionCount', allWords, `${project.captions.length} timed words`);

if (existsSync(video)) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', video], {encoding: 'utf8'});
  const probe = JSON.parse(r.stdout);
  const v = probe.streams.find((x) => x.codec_type === 'video');
  const a = probe.streams.find((x) => x.codec_type === 'audio');
  const mbps = Number(probe.format.bit_rate) / 1e6;
  const expected = mode === 'preview' ? [STANDARDS.format.previewWidth, STANDARDS.format.previewHeight] : [STANDARDS.format.width, STANDARDS.format.height];
  record('export', 'dimensions', v.width === expected[0] && v.height === expected[1], `${v.width}x${v.height}`);
  record('export', 'frameRate', v.r_frame_rate === `${fps}/1`, v.r_frame_rate);
  record('export', 'pixelFormat', v.pix_fmt === 'yuv420p', v.pix_fmt);
  record('export', 'colorTags', v.color_space === 'bt709', `space=${v.color_space} primaries=${v.color_primaries} transfer=${v.color_transfer}`);
  record('export', 'audioStream', !!a, a ? `${a.codec_name} ${a.sample_rate} Hz` : 'none');
  record('export', 'bitrate', mbps >= (mode === 'preview' ? 0.4 : 2) && mbps <= 60, `${mbps.toFixed(1)} Mb/s`);
  record('export', 'sizeForUpload', Number(probe.format.size) < 300e6, `${(Number(probe.format.size) / 1e6).toFixed(1)} MB`);
} else record('export', 'file', false, `Missing ${video}`);

// --- Report -------------------------------------------------------------------------------------
const summary = Object.fromEntries(Object.entries(gates).map(([k, g]) => [k, {title: g.title, passed: g.checks.every((c) => c.ok || c.severity === 'warn'), failed: g.checks.filter((c) => !c.ok && c.severity === 'error'), warnings: g.checks.filter((c) => !c.ok && c.severity === 'warn'), checked: g.checks.length}]));
const passed = Object.values(summary).every((g) => g.passed);
const report = {project: project.id, mode, passed, publishReady: passed && gateFor(project).publishReady, machineChecksDoNotJudge: ['Красота кадра', 'Эмоциональное воздействие', 'Интонация', 'Правдивость'], humanReview: 'pending', gates: summary, frameDir: `runs/studio/${project.id}/gates`};
writeFileSync(resolve(ROOT, `out/studio/${project.id}-${mode}-gates.json`), JSON.stringify(report, null, 1) + '\n');
const lines = [`# ${project.id}: ${mode}`, '', `Итог автоматики: **${passed ? 'пройдено' : 'не пройдено'}**. Человек ещё должен посмотреть ролик: автоматика не оценивает красоту, эмоцию и правдивость.`, ''];
for (const g of Object.values(summary)) {
  lines.push(`## ${g.passed ? 'OK' : 'FAIL'} ${g.title} (${g.checked} проверок)`);
  for (const c of g.failed) lines.push(`- FAIL \`${c.name}\`${c.scene ? ` сцена ${c.scene}` : ''}${c.frame !== null ? ` кадр ${c.frame}` : ''}: ${c.detail}`);
  for (const c of g.warnings) lines.push(`- warn \`${c.name}\`${c.scene ? ` сцена ${c.scene}` : ''}${c.frame !== null ? ` кадр ${c.frame}` : ''}: ${c.detail}`);
  lines.push('');
}
writeFileSync(resolve(ROOT, `out/studio/${project.id}-${mode}-gates.md`), lines.join('\n'));
console.log(lines.join('\n'));
process.exit(passed ? 0 : 1);

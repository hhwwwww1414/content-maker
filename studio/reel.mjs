#!/usr/bin/env node
// One entry point for the whole reel. Never publishes; spends ElevenLabs quota only with --voice.
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT as root, STANDARDS, gateFor, limitsFor, loadProject, projectPath, saveProject, scriptHash} from './lib/project.mjs';

const USAGE = `Usage: node studio/reel.mjs <command> <project>
  new <id> --topic "..."        scaffold studio/projects/<id>.json
  status <project>              gates, timing and outputs
  approve <project> --script --facts --by "name"   record a human decision
  run <project> [--voice] [--preview-only]         full cycle; stops at each gate
  storyboard <project>          contact sheet from the latest preview
  scene <project> <sceneId>     re-render one scene only (preview quality)
Exit codes: 2 script invalid, 3 needs approval, 4 needs voice, 5 render or QA failed`;

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const [command, target, extra] = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] === '--topic' || argv[i - 1] === '--by'));
if (!command) { console.log(USAGE); process.exit(0); }

const step = (title) => console.log(`\n── ${title}`);
const exec = (cmd, args, code) => {
  const r = spawnSync(cmd, args, {cwd: root, stdio: 'inherit'});
  if (r.status !== 0) { console.error(`✗ ${cmd} ${args.join(' ')}`); if (code) process.exit(code); return false; }
  return true;
};
const voiceFile = (p) => p.audio?.voicePath && resolve(root, 'public', p.audio.voicePath);

const storyboard = (p) => {
  const video = resolve(root, `out/studio/${p.id}-preview.mp4`);
  if (!existsSync(video)) throw Error('Render a preview first');
  const times = p.scenes.flatMap((s) => [s.start + s.duration * .35, s.start + s.duration * .85]);
  const select = times.map((t) => `eq(n\\,${Math.round(t * p.fps)})`).join('+');
  const dest = `out/studio/${p.id}-storyboard.png`;
  exec('ffmpeg', ['-y', '-v', 'error', '-i', video, '-vf', `select='${select}',scale=270:-1,tile=${p.scenes.length * 2 > 6 ? 6 : p.scenes.length * 2}x${Math.ceil(p.scenes.length * 2 / 6)}:padding=6:color=0x222222`, '-frames:v', '1', '-fps_mode', 'vfr', dest], 5);
  console.log(dest);
};

if (command === 'new') {
  if (!target) throw Error(USAGE);
  const file = resolve(root, 'studio/projects', target + '.json');
  if (existsSync(file)) throw Error('Already exists: ' + file);
  const {fps, width, height} = STANDARDS.format;
  saveProject(file, {
    id: target, topic: option('--topic') ?? target, niche: 'general', language: 'ru',
    status: {factCheck: 'pending', scriptApproval: 'pending', publication: 'draft', production: 'draft'},
    sources: [], title: '', hook: '', centralIdea: '', theme: 'signal', captionStyle: 'plate',
    fps, width, height, durationSeconds: STANDARDS.duration.targetSeconds,
    scenes: [], audio: {voicePath: null, musicPath: null, sfx: [], volume: 1}, captions: [],
  });
  console.log(`studio/projects/${target}.json`);
  process.exit(0);
}

const file = projectPath(target);
const p = loadProject(file);
const gate = gateFor(p);

if (command === 'status') {
  console.log(JSON.stringify({id: p.id, status: p.status, gate, durationSeconds: p.durationSeconds, limits: limitsFor(p), voice: !!(voiceFile(p) && existsSync(voiceFile(p))), timedWords: p.captions?.length ?? 0, preview: existsSync(resolve(root, `out/studio/${p.id}-preview.mp4`)), production: existsSync(resolve(root, `out/studio/${p.id}.mp4`))}, null, 2));
} else if (command === 'approve') {
  const by = option('--by');
  if (!by) throw Error('approve needs --by "<who decided>"');
  if (flag('--script')) { p.status.scriptApproval = 'approved'; p.status.approvedScriptHash = scriptHash(p); }
  if (flag('--facts')) p.status.factCheck = 'reviewed';
  p.status.approval = {by, at: new Date().toISOString().slice(0, 10)};
  saveProject(file, p);
  console.log(JSON.stringify(p.status));
} else if (command === 'storyboard') {
  storyboard(p);
} else if (command === 'scene') {
  const scene = p.scenes.find((s) => s.id === extra);
  if (!scene) throw Error(`Scene ${extra} not in ${p.id}: ${p.scenes.map((s) => s.id).join(', ')}`);
  const a = Math.round(scene.start * p.fps), b = Math.round((scene.start + scene.duration) * p.fps) - 1;
  exec('node', ['studio/render.mjs', file, 'preview', `--frames=${a}-${b}`, `--out=out/studio/${p.id}-scene-${scene.id}.mp4`], 5);
} else if (command === 'run') {
  step('1/8 Проект');
  console.log(`${p.id}: «${p.topic}», ${p.scenes.length} сцен`);

  step('2/8 Проверка сценария');
  exec('python3', ['studio/pipeline.py', 'validate', file, '--stage=script'], 2);

  step('3/8 Согласование');
  if (!gate.mayRender) {
    console.log(p.scenes.map((s) => `  [${s.id}] ${s.voice}`).join('\n'));
    console.log(`\nНужно решение человека: node studio/reel.mjs approve ${target} --script --facts --by "<имя>"`);
    process.exit(3);
  }
  console.log(gate.approved ? 'Одобрено.' : 'Демо-статус: собирается только из готового дубля, не для публикации.');

  step('4/8 Озвучка');
  if (voiceFile(p) && existsSync(voiceFile(p)) && p.captions?.length) {
    console.log(`Готовый дубль, квота не расходуется: ${p.audio.voicePath}`);
  } else if (exec('node', ['studio/voice.mjs', file, '--cache-only'])) {
    console.log('Дубль взят из кэша, квота не расходуется.');
  } else if (flag('--voice') && gate.mayBuyVoice) {
    exec('node', ['studio/voice.mjs', file], 4);
  } else {
    const chars = p.scenes.map((s) => s.voice).join(' ').length;
    console.log(`Нет дубля. Новая озвучка стоит ${chars} символов ElevenLabs: повторите с --voice (только для одобренного сценария).`);
    process.exit(4);
  }

  step('5/8 Тайминги из озвучки');
  exec('python3', ['studio/pipeline.py', 'validate', file], 2);

  step('6/8 Черновой рендер 540×960');
  exec('node', ['studio/render.mjs', file, 'preview'], 5);
  storyboard(loadProject(file));

  step('7/8 Проверка кадров, субтитров и звука');
  exec('node', ['studio/qa.mjs', file, 'preview'], 5);

  if (flag('--preview-only')) { console.log(`\nЧерновик готов: out/studio/${p.id}-preview.mp4`); process.exit(0); }

  step('8/8 Финал 1080×1920');
  exec('node', ['studio/render.mjs', file, 'production'], 5);
  exec('node', ['studio/qa.mjs', file, 'production'], 5);
  const venv = resolve(root, 'runs/studio/audio-qa-venv/bin/python');
  if (existsSync(venv)) {
    console.log('\n── Независимая сверка голоса и субтитров (локальный Whisper)');
    exec(venv, ['-I', 'studio/sync-check.py', file], 5);
  } else console.log('Whisper не установлен: независимая сверка пропущена.');
  const done = loadProject(file);
  mkdirSync(resolve(root, 'out/studio'), {recursive: true});
  writeFileSync(resolve(root, `out/studio/${p.id}-receipt.json`), JSON.stringify({id: p.id, video: `out/studio/${p.id}.mp4`, preview: `out/studio/${p.id}-preview.mp4`, storyboard: `out/studio/${p.id}-storyboard.png`, qa: done.qa, publishReady: gate.publishReady, voice: done.audio.timingMode, published: false}, null, 2) + '\n');
  console.log(`\nГотово: out/studio/${p.id}.mp4. Автопубликации нет. Ручной просмотр обязателен${gate.publishReady ? '' : '; проект в демо-статусе и не готов к публикации'}.`);
} else {
  console.log(USAGE);
  process.exit(1);
}
